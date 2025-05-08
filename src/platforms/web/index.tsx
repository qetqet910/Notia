export default async function initWeb() {
  // 1. 서비스 워커 등록
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', {
        type: 'module' // 또는 type 속성 제거
      }).catch(error => {
        console.error('서비스 워커 등록 실패:', error);
      });
    });
  }

  // 2. 웹 전용 이벤트 리스너 설정
  window.addEventListener('beforeunload', handleBeforeUnload);

  // 3. 웹 브라우저 호환성 체크
  checkBrowserCompatibility();

  // 4. 웹 플랫폼 분석 설정
  initWebAnalytics();

  // 5. 웹 알림 권한 요청/확인
  checkNotificationPermission();
}

// 페이지 떠날 때 처리
function handleBeforeUnload(event: BeforeUnloadEvent) {
  // 필요시 작업 저장 요청 등
}

// 브라우저 호환성 체크
function checkBrowserCompatibility() {
  const unsupportedFeatures = [];

  // 필요한 API 체크 예시
  if (!window.Intl) unsupportedFeatures.push('Internationalization API');
  if (!('IntersectionObserver' in window))
    unsupportedFeatures.push('IntersectionObserver');

  if (unsupportedFeatures.length > 0) {
    console.warn('Browser compatibility issues:', unsupportedFeatures);
  }
}

// 웹 분석 초기화
function initWebAnalytics() {
  // 웹 전용 분석 도구 초기화
}

// 알림 권한 확인
async function checkNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('➕ Notification Permission:', permission);
  }
}
