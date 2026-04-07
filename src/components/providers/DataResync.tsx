import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { useToast } from '@/hooks/useToast';

/**
 * DataResync 컴포넌트
 * 
 * 창이 다시 포커스되거나(focus) 네트워크가 복구되었을 때(online),
 * 최신 데이터를 서버와 동기화하여 앱의 데이터 신선도를 유지합니다.
 */
export const DataResync = () => {
  const user = useAuthStore((state) => state.user);
  const { initialize, isSyncing } = useDataStore();
  const { toast } = useToast();
  
  const lastSyncRef = useRef<number>(0);
  const prevSyncingRef = useRef<boolean>(false);
  const SYNC_COOLDOWN = 30000; // 30초 이내 중복 동기화 방지

  // 동기화 완료 토스트 알림 로직
  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing) {
      toast({
        title: "서버와 동기화가 완료되었습니다.",
        description: "최신 데이터가 성공적으로 반영되었습니다.",
        duration: 3000,
      });
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, toast]);

  useEffect(() => {
    if (!user?.id) return;

    const handleResync = () => {
      const now = Date.now();
      if (now - lastSyncRef.current < SYNC_COOLDOWN) {
        return;
      }

      console.info(`[DataResync] Triggering data re-initialization (Reason: ${document.visibilityState === 'visible' ? 'Focus' : 'Online'})`);
      lastSyncRef.current = now;
      initialize(user.id).catch((err) => {
        console.error('[DataResync] Failed to resync data:', err);
      });
    };

    // 창 포커스 이벤트 (탭 전환, 앱 다시 열기 등)
    window.addEventListener('focus', handleResync);
    // 네트워크 복구 이벤트
    window.addEventListener('online', handleResync);

    return () => {
      window.removeEventListener('focus', handleResync);
      window.removeEventListener('online', handleResync);
    };
  }, [user?.id, initialize]);

  return null; // UI를 렌더링하지 않음
};
