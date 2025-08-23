// public/service-worker.js
// 가장 단순한 형태의 테스트용 서비스 워커

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'Notia';
    const options = {
      body: data.body,
      icon: '/favicon/android-chrome-192x192.png',
      badge: '/favicon/favicon-16x16.png',
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Error processing push event:', e);
    // 데이터 파싱 실패 시 기본 알림 표시
    const title = '새로운 알림 (테스트 알림)';
    const options = {
      body: '새로운 알림이 도착했습니다. (테스트 알림)',
      icon: '/favicon/android-chrome-192x192.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
