import { useRef, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';

export const useScrollSync = (
  editorRef: React.RefObject<ReactCodeMirrorRef>,
  previewRef: React.RefObject<HTMLDivElement>
) => {
  const isScrollingRef = useRef<'editor' | 'preview' | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditorScroll = useCallback((view: EditorView) => {
    if (isScrollingRef.current === 'preview') return;

    const scrollDOM = view.scrollDOM;
    const percentage =
      scrollDOM.scrollTop / (scrollDOM.scrollHeight - scrollDOM.clientHeight);

    if (previewRef.current) {
      isScrollingRef.current = 'editor';
      previewRef.current.scrollTop =
        percentage *
        (previewRef.current.scrollHeight - previewRef.current.clientHeight);
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = null;
      }, 50);
    }
  }, [previewRef]);

  const handlePreviewScroll = useCallback(() => {
    if (isScrollingRef.current === 'editor' || !editorRef.current?.view || !previewRef.current) return;

    const previewEl = previewRef.current;
    const percentage =
      previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight);

    const view = editorRef.current.view;
    const scrollDOM = view.scrollDOM;
    
    isScrollingRef.current = 'preview';
    requestAnimationFrame(() => {
        scrollDOM.scrollTop =
          percentage * (scrollDOM.scrollHeight - scrollDOM.clientHeight);
    });

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = null;
    }, 50);
  }, [editorRef, previewRef]);

  return { handleEditorScroll, handlePreviewScroll };
};
