import { useCallback, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * 노트 편집 모드의 이탈(라우팅 블로킹)을 관리합니다.
 * 편집 중 저장하지 않은 변경사항이 있는 상태로 페이지를 벗어나려 하면
 * 확인 다이얼로그를 띄우고, 없으면 그대로 진행시킵니다.
 */
export function useEditGuard() {
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const blocker = useBlocker(isEditing);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (hasUnsavedChanges) {
        setIsCancelDialogOpen(true);
      } else {
        blocker.proceed();
      }
    }
  }, [blocker, hasUnsavedChanges]);

  const handleEnterEditMode = useCallback(() => {
    setTimeout(() => setIsEditing(true), 0);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, []);

  const confirmLeaveEdit = useCallback(() => {
    handleCancelEdit();
    blocker.proceed?.();
  }, [handleCancelEdit, blocker]);

  const cancelLeaveEdit = useCallback(() => {
    blocker.reset?.();
  }, [blocker]);

  return {
    isEditing,
    setIsEditing,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isCancelDialogOpen,
    setIsCancelDialogOpen,
    handleEnterEditMode,
    handleCancelEdit,
    confirmLeaveEdit,
    cancelLeaveEdit,
  };
}
