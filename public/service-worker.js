// public/service-worker.js
// 가장 단순한 형태의 테스트용 서비스 워커

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received.');

  const title = '테스트 알림';
  const options = {
    body: '이 알림이 보이면 기본 기능은 정상입니다.',
    icon: '/favicon/android-chrome-192x192.png',
  };

  try {
    event.waitUntil(self.registration.showNotification(title, options));
    console.log('Service Worker: showNotification called successfully.');
  } catch (e) {
    console.error('Service Worker: Error calling showNotification:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
});

console.log('Service Worker: Loaded and ready.');
