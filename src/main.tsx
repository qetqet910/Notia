import '@/styles/global.css';

// --- Global Error Handlers (Must be first) ---
// 초기화 단계에서 발생하는 에러를 화면에 표시하기 위한 핸들러입니다.
// 프로덕션 빌드에서 흰 화면만 뜨는 문제를 디버깅하기 위해 필수적입니다.
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global Error Caught:', message, error);
  document.body.innerHTML = `
    <div style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: #7f1d1d; color: #fee2e2;
      padding: 2rem; box-sizing: border-box; font-family: monospace;
      overflow: auto; z-index: 9999;
    ">
      <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
        ⚠️ Critical Error
      </h1>
      <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">${message}</p>
      <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
        <p>Source: ${source}:${lineno}:${colno}</p>
        <pre style="white-space: pre-wrap; margin-top: 0.5rem; font-size: 0.9rem;">${error?.stack || 'No stack trace available'}</pre>
      </div>
      <button onclick="window.location.reload()" style="
        margin-top: 2rem; padding: 0.5rem 1rem;
        background: #fff; color: #7f1d1d; border: none; border-radius: 0.25rem;
        cursor: pointer; font-weight: bold;
      ">
        Reload Application
      </button>
    </div>
  `;
  return true; // 에러 전파 방지
};

window.onunhandledrejection = function (event) {
  console.error('Unhandled Rejection:', event.reason);
  document.body.innerHTML = `
    <div style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: #78350f; color: #fef3c7;
      padding: 2rem; box-sizing: border-box; font-family: monospace;
      overflow: auto; z-index: 9999;
    ">
      <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
        ⚠️ Unhandled Promise Rejection
      </h1>
      <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">${event.reason?.message || event.reason}</p>
      <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
        <pre style="white-space: pre-wrap; margin-top: 0.5rem; font-size: 0.9rem;">${event.reason?.stack || JSON.stringify(event.reason, null, 2)}</pre>
      </div>
       <button onclick="window.location.reload()" style="
        margin-top: 2rem; padding: 0.5rem 1rem;
        background: #fff; color: #78350f; border: none; border-radius: 0.25rem;
        cursor: pointer; font-weight: bold;
      ">
        Reload Application
      </button>
    </div>
  `;
};

/**
 * 서비스 워커를 등록합니다.
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
}

/**
 * 플랫폼별 초기화 모듈을 로드하고 실행합니다.
 * @param platformName 초기화할 플랫폼 이름
 * @returns 초기화 성공 여부
 */
async function initializePlatform(platformName: string): Promise<boolean> {
  try {
    type PlatformModule = {
      default: () => void;
    };

    // 동적 임포트 디버깅을 위한 로그
    console.log(`Attempting to import platform module: ${platformName}`);

    const module = (await import(
      /* @vite-ignore */
      `./platforms/${platformName}/index.tsx`
    )) as PlatformModule;
    
    if (!module || !module.default) {
      throw new Error(`Platform module '${platformName}' loaded but 'default' export is missing.`);
    }

    const initPlatform = module.default;
    initPlatform(); // This function now handles rendering

    console.log(`2️⃣ Platform : ¦¦¦${platformName}¦¦¦ Initialized Successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to initialize platform ${platformName}:`, error);
    throw error; // 상위 호출자에게 에러 전달
  }
}

/**
 * 애플리케이션 초기화를 위한 단일 진입점 함수
 */
async function initializeApp(): Promise<void> {
  try {
    // 서비스 워커 등록 코드를 다시 추가합니다.
    registerServiceWorker();

    // 1. 플랫폼 결정
    const platform = import.meta.env.VITE_PLATFORM || 'web';
    console.log('Current Platform:', platform);

    // 2. 플랫폼별 초기화 모듈 로드 및 실행 (렌더링 포함)
    const platformInitialized = await initializePlatform(platform);

    // 3. 전체 초기화 결과 로깅
    if (platformInitialized) {
      console.log('4️⃣ Application initialized successfully');
    } else {
      console.warn(
        'Application initialized with warnings (platform initialization failed)',
      );
    }
  } catch (error) {
    console.error('Critical error during app initialization:', error);
    // 여기서 발생한 에러는 이미 window.onunhandledrejection 등에서 잡힐 수 있지만,
    // 명시적으로 한 번 더 던져서 확실하게 UI에 표시되도록 합니다.
    throw error; 
  }
}

// 앱 초기화 실행
initializeApp().catch((error) => {
  console.error('Unhandled error in initialization process:', error);
});
