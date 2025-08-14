// public/service-worker.js

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  const data = event.data.json();
  const title = data.title || 'Notia';
  const options = {
    body: data.body,
    icon: '/favicon/android-chrome-192x192.png', // 알림 아이콘
    badge: '/favicon/favicon-16x16.png', // 작은 뱃지 아이콘 (Android에서 주로 사용)
    data: {
      url: data.url || '/', // 알림 클릭 시 이동할 URL
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});