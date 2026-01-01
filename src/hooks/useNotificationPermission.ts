import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { requestPermission as requestUnifiedPermission, checkPermission } from '@/utils/notification';

// VAPID 공개 키 (환경 변수에서 가져옴)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * URL-safe base64 문자열을 Uint8Array로 변환합니다.
 * @param base64String
 * @returns
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { session } = useAuthStore();

  useEffect(() => {
    // 컴포넌트 마운트 시 현재 권한 상태를 확인
    const checkAndSubscribe = async () => {
      const status = await checkPermission();
      setPermission(status);
      if (status === 'granted') {
        // 이미 권한이 허용되어 있다면, DB와 구독 정보를 동기화합니다.
        await subscribeUserToPush();
      }
    };
    checkAndSubscribe();
  }, []);

  /**
   * 서비스 워커를 통해 푸시 구독을 생성하고 서버에 저장합니다.
   */
  const subscribeUserToPush = async () => {
    if (!('serviceWorker' in navigator) || !session?.user.id) {
      console.error('Service Worker or user session is not available.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        console.log('User is already subscribed.');
        await saveSubscription(existingSubscription);
        return;
      }

      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key is not defined.');
      }
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await saveSubscription(newSubscription);
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
    }
  };

  /**
   * 구독 정보를 Supabase DB에 저장 (upsert)
   * @param subscription PushSubscription 객체
   */
  const saveSubscription = async (subscription: PushSubscription) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user.id) return;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: currentSession.user.id,
          subscription_details: subscription.toJSON(),
          endpoint: subscription.endpoint,
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Failed to save subscription:', error);
    } else {
      console.log('Subscription saved successfully.');
    }
  };

  const requestPermission = async () => {
    const result = await requestUnifiedPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeUserToPush();
    }

    return result;
  };

  return { permission, requestPermission };
};