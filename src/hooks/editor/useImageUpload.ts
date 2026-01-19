import { useCallback, useMemo, useRef, useTransition } from 'react';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { v4 as uuidv4 } from 'uuid';
import { uploadImageToSupabase } from '@/utils/imageUpload';
import { useAuthStore } from '@/stores/authStore';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@/utils/isTauri';
import { useToast } from '@/hooks/useToast';

// --- Decoration Logic (Visual Widget) ---

interface UploadParams { id: string; pos: number | null }
const uploadEffect = StateEffect.define<UploadParams>();

class UploadingWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 2px 8px;
      margin: 0 4px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      color: #64748b;
      font-size: 12px;
      font-family: monospace;
      user-select: none;
    `;
    
    span.innerHTML = `
      <svg style="animation: spin 1s linear infinite; width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none">
        <circle style="opacity: 0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path style="opacity: 0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Uploading...</span>
      <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
    `;
    return span;
  }
}

export const uploadState = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(uploadEffect)) {
        if (e.value.pos !== null) {
            const widget = Decoration.widget({ widget: new UploadingWidget(), side: 1 });
            decorations = decorations.update({ add: [widget.range(e.value.pos)] });
        } else {
            decorations = decorations.update({ filter: () => false }); 
        }
      }
    }
    return decorations;
  },
  provide: f => EditorView.decorations.from(f)
});

// --- Hook Logic ---

export const useImageUpload = (editorRef?: React.RefObject<ReactCodeMirrorRef | null>) => {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
      if (!user) {
        toast({
          title: '오류',
          description: '이미지를 업로드하려면 로그인이 필요합니다.',
        });
        return null;
      }

      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        toast({
          description: '이미지 파일 크기는 10MB를 초과할 수 없습니다.',
        });
        return null;
      }

      try {
        let fileToUpload = file;

        if (isTauri()) {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string;
                // result is "data:image/png;base64,..."
                const base64 = result.split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            const base64 = await base64Promise;
            // Tauri command signature: optimize_image(image_data_base64: String) -> Result<String, String>
            // Note: command argument names in Rust are snake_case, but Tauri invokes use camelCase?
            // Usually Tauri handles conversion, but best to be safe. 
            // The Rust definition: fn optimize_image(image_data_base64: String)
            // In invoke: { imageDataBase64: base64 } or { image_data_base64: base64 }?
            // Tauri v2 usually expects camelCase keys matching snake_case args.
            const optimizedBase64 = await invoke<string>('optimize_image', {
              imageDataBase64: base64,
            });

            const byteCharacters = atob(optimizedBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/webp' });
            
            // Create a new File object
            fileToUpload = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
        }

        const url = await uploadImageToSupabase(fileToUpload, user.id);
        
        if (!url) {
             throw new Error('Upload failed');
        }
        return url;

      } catch (error) {
        console.error('Upload Error:', error);
        toast({
          title: '업로드 실패',
          description: (error as Error).message || '이미지 업로드 중 오류가 발생했습니다.',
        });
        return null;
      }
  }, [user, toast]);

  const processUpload = useCallback((file: File, view: EditorView, pos: number) => {
      // If not logged in, just trigger the check/toast without showing widget
      if (!user) {
          handleImageUpload(file);
          return;
      }

      const uploadId = uuidv4();

      // 1. Show Visual Widget
      view.dispatch({
          effects: uploadEffect.of({ id: uploadId, pos })
      });

      startTransition(async () => {
          const url = await handleImageUpload(file);
          
          if (url) {
            const markdownImage = `\n![${file.name}](${url})\n`;
            
            // 2. Insert Image & Remove Widget
            view.dispatch({
              changes: { from: pos, insert: markdownImage },
              effects: uploadEffect.of({ id: uploadId, pos: null })
            });
          } else {
             // Just remove widget
             view.dispatch({ effects: uploadEffect.of({ id: uploadId, pos: null }) });
          }
      });
  }, [handleImageUpload, user]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const view = editorRef?.current?.view;
    if (!file || !view) return;
    
    // Insert at current cursor
    processUpload(file, view, view.state.selection.main.to);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processUpload, editorRef]);

  const imageUploadExtension = useMemo(() => [
    uploadState,
    EditorView.domEventHandlers({
      dragover(event) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; },
      drop(event, view) {
        const files = event.dataTransfer?.files;
        if (files?.[0]?.type.startsWith('image/')) {
          event.preventDefault();
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos !== null) processUpload(files[0], view, pos);
        }
      },
      paste(event, view) {
        const files = event.clipboardData?.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
          event.preventDefault();
          const pos = view.state.selection.main.head;
          processUpload(files[0], view, pos);
        }
      },
    })
  ], [processUpload]);

  return { isUploading: isPending, handleFileChange, imageUploadExtension, fileInputRef, openFileSelector, handleImageUpload };
};