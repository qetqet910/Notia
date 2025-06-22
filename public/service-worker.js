import { supabase } from '@/service/supabaseClient';

// 알림 발송 함수 (utils/notification.ts의 내용과 유사하게 직접 구현)
const sendReminderNotification = (title, body) => {
  if (self.registration && self.Notification.permission === 'granted') {
    self.registration.showNotification(title, {
      body: body,
      icon: 'favicon/favicon.ico', // 아이콘 경로 확인
      badge: 'favicon/favicon.ico', // 배지 아이콘 경로 확인
      tag: 'reminder', // 같은 태그를 가진 알림은 하나만 표시 (업데이트)
      renotify: true, // 새 알림이 도착하면 소리/진동 재생 (tag 사용 시 유용)
    });
  }
};

// 알림 체크 및 발송
const checkAndSendNotifications = async () => {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (sessionError || !userId) {
      console.warn(
        '서비스 워커: 사용자 세션을 가져올 수 없거나 로그인되지 않았습니다.',
      );
      return;
    }

    // 현재 시간보다 과거이고, 아직 전송되지 않은 알림을 가져옴
    const { data: notifications, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('sent', false)
      .lte('scheduled_time', new Date().toISOString());

    if (error) {
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      console.log('서비스 워커: 전송할 알림 없음');
      return;
    }

    console.log('서비스 워커: 발송할 알림:', notifications);

    for (const notification of notifications) {
      sendReminderNotification(notification.title, notification.body);

      // 알림 상태 업데이트 (sent = true)
      await supabase
        .from('scheduled_notifications')
        .update({ sent: true })
        .eq('id', notification.id);
    }
  } catch (error) {
    console.error('서비스 워커: 알림 체크 오류:', error);
  }
};

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('서비스 워커: 설치됨');
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('서비스 워커: 활성화됨');
  event.waitUntil(clients.claim());
  // 활성화 시 즉시 알림 체크 (선택 사항)
  event.waitUntil(checkAndSendNotifications());

  // 주기적인 동기화를 위한 PeriodicSyncManager 등록 (Chrome 등 일부 브라우저 지원)
  // 이 방법이 이상적이지만, 모든 브라우저에서 지원하지 않으므로,
  // Fallback으로 setTimeout/setInterval 또는 알림이 필요한 시점에 클라이언트에서 SW로 메시지 전송 고려
  if ('periodicSync' in self.registration) {
    self.registration.periodicSync
      .register('reminder-check', {
        minInterval: 60 * 1000, // 1분마다 (최소 간격 보장, 정확한 시간은 브라우저 정책에 따름)
      })
      .then(() => {
        console.log('서비스 워커: Periodic Sync 등록됨');
      })
      .catch((error) => {
        console.error('서비스 워커: Periodic Sync 등록 실패', error);
      });
  } else {
    console.warn(
      '서비스 워커: Periodic Sync가 지원되지 않습니다. 다른 주기적 실행 방법을 고려하세요.',
    );
    // 대안: 단순 setInterval (서비스 워커가 활성 상태일 때만 작동)
    // 이 방식은 서비스 워커가 종료되면 멈추므로, 백그라운드 동기화에는 한계가 있습니다.
    // TODO: 실질적인 백그라운드 알림은 서버측 **Cron Job** 또는 Web Push Notifications를 통해 구현하는 것이 더 안정적입니다.
    setInterval(checkAndSendNotifications, 60 * 1000); // 1분마다
  }
});

// fetch 이벤트 리스너 (선택 사항, PWA 캐싱 등에 사용)
self.addEventListener('fetch', (event) => {
  // 캐싱 전략 등 필요한 경우 여기에 추가
});

// push 이벤트 리스너 (Web Push Notifications 사용 시 필요)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('서비스 워커: 푸시 알림 수신:', data);
  const title = data.title || '새 알림';
  const options = {
    body: data.body || '내용 없음',
    icon: data.icon || 'favicon/favicon.ico',
    badge: data.badge || 'favicon/favicon.ico',
    tag: data.tag || 'general-notification',
    data: data.data || {}, // 알림 클릭 시 전달할 추가 데이터
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 이벤트 리스너
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // 알림 닫기
  const urlToOpen =
    'https://scaling-halibut-v5r45rp6xwrfx599-5173.app.github.dev/dashboard'; // TODO: 배포시 URL 변경
  event.waitUntil(clients.openWindow(urlToOpen));
});
