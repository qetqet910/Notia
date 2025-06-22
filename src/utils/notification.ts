export const sendReminderNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: 'favicon/favicon.ico',
      badge: 'favicon/favicon.ico',
      tag: 'reminder',
    });

    notification.onclick = () => {
      window.open(
        'https://scaling-halibut-v5r45rp6xwrfx599-5173.app.github.dev/dashboard', // TODO: 배포시 URL 변경
        '_blank',
      );
      window.focus(); // 브라우저 창 포커스
      notification.close();
    };

    // 10초 후 자동 닫기
    setTimeout(() => notification.close(), 10000);
  }
};
