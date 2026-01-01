// public/service-worker.js

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  // 앱이 열려있어도 알림을 무조건 표시 (사용자 요청: 일관된 알림 경험)
  const showPushNotification = async () => {
    try {
      const data = event.data.json();
      const title = data.title || 'Notia';
      const options = {
        body: data.body,
        icon: '/favicon/android-chrome-192x192.png',
        badge: '/favicon/favicon-16x16.png',
        tag: data.tag || data.id || data.url || 'notia-notification', // 태그를 설정하여 중복 방지
        data: {
          url: data.url || '/',
        },
      };

      await self.registration.showNotification(title, options);
    } catch (e) {
      console.error('Error processing push event:', e);
      const title = '새로운 알림';
      const options = {
        body: '새로운 알림이 도착했습니다.',
        icon: '/favicon/android-chrome-192x192.png',
      };
      await self.registration.showNotification(title, options);
    }
  };

  event.waitUntil(showPushNotification());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const openUrl = async () => {
    let urlToOpen = '/';
    
    if (event.notification.data && event.notification.data.url) {
      try {
        // 들어온 URL이 절대 경로(http...)일 경우, 현재 Origin에 맞게 Path만 추출
        const incomingUrl = new URL(event.notification.data.url, self.location.origin);
        urlToOpen = incomingUrl.pathname + incomingUrl.search;
      } catch (e) {
        // URL 파싱 실패 시, 들어온 문자열이 상대 경로라면 그대로 사용
        urlToOpen = event.notification.data.url;
      }
    }

    // 이미 열린 창이 있는지 확인
    const clientList = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    // 이미 열린 창이 있으면 그 창으로 포커스 및 이동
    for (const client of clientList) {
      if (client.url && 'focus' in client) {
        await client.focus();
        await client.navigate(urlToOpen);
        return;
      }
    }

    // 열린 창이 없으면 새 창 열기 (상대 경로로 열리며 현재 Origin을 따름)
    if (clients.openWindow) {
      await clients.openWindow(urlToOpen);
    }
  };

  event.waitUntil(openUrl());
});
