import { useState, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EditorView } from '@codemirror/view';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { isTauri } from '@/utils/isTauri';
import { invoke } from '@tauri-apps/api/core';
import { insertImageMarkdown } from '@/components/features/dashboard/toolbar/editorCommands';

export const useImageUpload = (editorRef?: React.RefObject<unknown>) => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(
    async (file: File): Promise<string | null> => {
      // ... (기존 로직)
      if (!user) {
        toast({
          title: '오류',
          description: '이미지를 업로드하려면 로그인이 필요합니다.',
          variant: 'destructive',
        });
        return null;
      }
      if (file.size > 1024 * 1024 * 10) {
        toast({
          title: '오류',
          description: '이미지 파일 크기는 10MB를 초과할 수 없습니다.',
          variant: 'destructive',
        });
        return null;
      }

      setIsUploading(true);
      
      let fileToUpload: File | Blob = file;
      let fileExt = file.name.split('.').pop();

      // Optimize if in Tauri
      if (isTauri()) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Strip prefix
            };
            reader.readAsDataURL(file);
          });

          const base64Data = await base64Promise;
          const optimizedBase64 = await invoke<string>('optimize_image', {
            imageDataBase64: base64Data,
          });

          // Convert back to Blob
          const byteCharacters = atob(optimizedBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          fileToUpload = new Blob([byteArray], { type: 'image/webp' });
          fileExt = 'webp';
        } catch (error) {
          console.error('Rust image optimization failed:', error);
          // Fallback to original file
        }
      }

      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `note-images/${user.id}/${fileName}`;

      try {
        const { error } = await supabase.storage
          .from('note-images')
          .upload(filePath, fileToUpload);

        if (error) {
          throw error;
        }

        const { data } = supabase.storage
          .from('note-images')
          .getPublicUrl(filePath);

        return data.publicUrl;
      } catch (error) {
        console.error('Image upload error:', error);
        toast({
          title: '업로드 실패',
          description: '이미지 업로드 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user, toast],
  );

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const view = editorRef?.current?.view;
    if (!file || !view) return;
    
    // ... validation ...
    if (!file.type.startsWith('image/')) return;
    
    const url = await handleImageUpload(file);
    if (url) {
        insertImageMarkdown(view, url);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleImageUpload, editorRef]);

  const imageUploadExtension = useMemo(() => {
    return EditorView.domEventHandlers({
      drop(event, view) {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
          const imageFile = files[0];
          const uniqueId = uuidv4();
          const placeholder = `![Uploading ${imageFile.name} ${uniqueId}...]()`;
          const pos = view.posAtCoords({
            x: event.clientX,
            y: event.clientY,
          });
          if (pos === null) return;

          view.dispatch({
            changes: { from: pos, insert: placeholder },
          });

          handleImageUpload(imageFile).then((url) => {
            const doc = view.state.doc.toString();
            const placeholderPos = doc.indexOf(placeholder);
            if (placeholderPos === -1) return;

            if (url) {
              const markdownImage = `![${imageFile.name}](${url})`;
              view.dispatch({
                changes: {
                  from: placeholderPos,
                  to: placeholderPos + placeholder.length,
                  insert: markdownImage,
                },
              });
            } else {
              view.dispatch({
                changes: {
                  from: placeholderPos,
                  to: placeholderPos + placeholder.length,
                  insert: '',
                },
              });
            }
          });
        }
      },
      paste(event, view) {
        const files = event.clipboardData?.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
          event.preventDefault();
          const imageFile = files[0];
          const uniqueId = uuidv4();
          const placeholder = `![Pasting image ${uniqueId}...]()`;
          const pos = view.state.selection.main.head;

          view.dispatch({
            changes: { from: pos, insert: placeholder },
          });

          handleImageUpload(imageFile).then((url) => {
            const doc = view.state.doc.toString();
            const placeholderPos = doc.indexOf(placeholder);
            if (placeholderPos === -1) return;

            if (url) {
              const markdownImage = `![${imageFile.name}](${url})`;
              view.dispatch({
                changes: {
                  from: placeholderPos,
                  to: placeholderPos + placeholder.length,
                  insert: markdownImage,
                },
              });
            } else {
              view.dispatch({
                changes: {
                  from: placeholderPos,
                  to: placeholderPos + placeholder.length,
                  insert: '',
                },
              });
            }
          });
        }
      },
    });
  }, [handleImageUpload]);

  return { isUploading, handleImageUpload, imageUploadExtension, fileInputRef, openFileSelector, handleFileChange };
};

