export const sendReminderNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '@/assets/favicon.ico',
      badge: '@/assets/favicon.ico',
      tag: 'reminder',
    });

    notification.onclick = () => {
      window.focus(); // 브라우저 창 포커스
      notification.close();
    };

    // 10초 후 자동 닫기
    setTimeout(() => notification.close(), 10000);
  }
};
