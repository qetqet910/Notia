import { useRef, useCallback, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';

export const useScrollSync = (
  editorRef: React.RefObject<ReactCodeMirrorRef>,
  previewRef: React.RefObject<HTMLDivElement>
) => {
  const isScrollingRef = useRef<'editor' | 'preview' | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const clearScrollTimeout = () => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  };

  // Preview -> Editor 동기화
  const handlePreviewScroll = useCallback(() => {
    if (isScrollingRef.current === 'editor' || !editorRef.current?.view || !previewRef.current) return;

    const previewEl = previewRef.current;
    const previewScrollableHeight = previewEl.scrollHeight - previewEl.clientHeight;
    if (previewScrollableHeight <= 0) return;

    const percentage = previewEl.scrollTop / previewScrollableHeight;
    const view = editorRef.current.view;
    const scrollDOM = view.scrollDOM;
    const scrollableHeight = scrollDOM.scrollHeight - scrollDOM.clientHeight;
    
    isScrollingRef.current = 'preview';
    scrollDOM.scrollTop = percentage * scrollableHeight;

    clearScrollTimeout();
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = null;
    }, 150);
  }, [editorRef, previewRef]);

  // Editor -> Preview 동기화 로직
  const syncEditorToPreview = useCallback((view: EditorView) => {
    if (isScrollingRef.current === 'preview' || !previewRef.current) return;

    const scrollDOM = view.scrollDOM;
    const scrollableHeight = scrollDOM.scrollHeight - scrollDOM.clientHeight;
    if (scrollableHeight <= 0) return;

    const percentage = scrollDOM.scrollTop / scrollableHeight;
    const previewEl = previewRef.current;
    const previewScrollableHeight = previewEl.scrollHeight - previewEl.clientHeight;

    isScrollingRef.current = 'editor';
    previewEl.scrollTop = percentage * previewScrollableHeight;

    clearScrollTimeout();
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = null;
    }, 100);
  }, [previewRef]);

  // Editor의 scrollDOM에 직접 리스너 추가 (Native Scroll Event)
  // onUpdate보다 반응성이 좋고 확실하게 동작함
  useEffect(() => {
    // 100ms마다 view가 준비되었는지 확인하고 리스너 부착 (Ref의 한계 극복)
    const checkViewInterval = setInterval(() => {
        const view = editorRef.current?.view;
        if (view) {
            const scrollDOM = view.scrollDOM;
            const handleScroll = () => requestAnimationFrame(() => syncEditorToPreview(view));
            
            scrollDOM.addEventListener('scroll', handleScroll, { passive: true });
            
            // 리스너 부착 성공 시 인터벌 종료 및 클린업 등록
            clearInterval(checkViewInterval);
        }
    }, 100);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(checkViewInterval);
  }, [syncEditorToPreview]); 

  // CodeMirror onUpdate용 핸들러 (레이아웃 변경 대응 - 보조 수단)
  const handleEditorScroll = useCallback((view: EditorView) => {
    syncEditorToPreview(view);
  }, [syncEditorToPreview]);

  return { handleEditorScroll, handlePreviewScroll };
};
