import { useCallback, useMemo, useRef, useTransition } from 'react';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { v4 as uuidv4 } from 'uuid';
import { uploadImageToSupabase } from '@/utils/imageUpload';
import { useAuthStore } from '@/stores/authStore';

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
            // Remove decorations (filter out) - simplistic approach clears all for demo
            decorations = decorations.update({ filter: () => false }); 
        }
      }
    }
    return decorations;
  },
  provide: f => EditorView.decorations.from(f)
});

// --- Hook Logic ---

export const useImageUpload = (editorRef?: React.RefObject<any>) => {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processUpload = useCallback((file: File, view: EditorView, pos: number) => {
      if (!user) return;
      const uploadId = uuidv4();

      // 1. Show Visual Widget (No text change yet)
      view.dispatch({
          effects: uploadEffect.of({ id: uploadId, pos })
      });

      startTransition(async () => {
          const url = await uploadImageToSupabase(file, user.id);
          
          if (url) {
            const markdownImage = `
![${file.name}](${url})
`;
            
            // 2. Insert Image & Remove Widget
            view.dispatch({
              changes: { from: pos, insert: markdownImage },
              effects: uploadEffect.of({ id: uploadId, pos: null })
            });
          } else {
             view.dispatch({ effects: uploadEffect.of({ id: uploadId, pos: null }) });
          }
      });
  }, [user]);

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
    })
  ], [processUpload]);

  return { isUploading: isPending, handleFileChange, imageUploadExtension, fileInputRef, openFileSelector };
};