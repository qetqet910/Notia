export default async function initWeb() {
  console.log('1️⃣ initWeb Executed');
  // TODO: 배포환경 서비스워커 테스트 - 리마인더 유지 기능

  // if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  //   const registerSW = () => {
  //     navigator.serviceWorker
  //       .register('/service-worker.js', {
  //         type: 'module',
  //         scope: './',
  //       })
  //       // .then((registration) => {
  //       //   console.log('✅ Service Worker 등록 완료:', registration.scope);
  //       // })
  //       // .catch((error) => {
  //       //   console.log('❌ Service Worker 등록 실패:', error);
  //       // });
  //   };

  //   if (document.readyState === 'complete') {
  //     // 이미 로드된 상태면 바로 등록
  //     registerSW();
  //   } else {
  //     // 아니라면 load 이벤트 기다리기
  //     window.addEventListener('load', registerSW);
  //   }
  // }

  window.addEventListener('beforeunload', handleBeforeUnload);
  checkBrowserCompatibility();
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
// function initWebAnalytics() {
//   // 웹 전용 분석 도구 초기화
// }
