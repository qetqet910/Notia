import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { useToast } from '@/hooks/useToast';

/**
 * DataResync 컴포넌트
 *
 * 창이 다시 포커스되거나(focus) 네트워크가 복구되었을 때(online),
 * Supabase에서 최신 데이터를 직접 가져와 로컬 상태와 병합합니다.
 * initialize()의 초기화 가드를 우회하기 위해 resync()를 사용합니다.
 */
export const DataResync = () => {
  const user = useAuthStore((state) => state.user);
  const { resync, isSyncing, lastSyncSuccess } = useDataStore();
  const { toast } = useToast();

  const lastSyncRef = useRef<number>(0);
  const prevSyncingRef = useRef<boolean>(false);
  const SYNC_COOLDOWN = 30000;

  // 동기화 완료 토스트 알림: Supabase에서 실제로 데이터를 성공적으로 가져왔을 때만 표시
  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing) {
      if (lastSyncSuccess === true) {
        toast({
          title: '서버와 동기화가 완료되었습니다.',
          description: '최신 데이터가 성공적으로 반영되었습니다.',
          duration: 3000,
        });
      }
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, lastSyncSuccess, toast]);

  useEffect(() => {
    if (!user?.id) return;

    const handleResync = () => {
      const now = Date.now();
      if (now - lastSyncRef.current < SYNC_COOLDOWN) {
        return;
      }

      console.info(
        `[DataResync] Triggering resync (Reason: ${document.visibilityState === 'visible' ? 'Focus' : 'Online'})`,
      );
      lastSyncRef.current = now;
      resync(user.id).catch((err) => {
        console.error('[DataResync] Failed to resync data:', err);
      });
    };

    window.addEventListener('focus', handleResync);
    window.addEventListener('online', handleResync);

    return () => {
      window.removeEventListener('focus', handleResync);
      window.removeEventListener('online', handleResync);
    };
  }, [user?.id, resync]);

  return null;
};
