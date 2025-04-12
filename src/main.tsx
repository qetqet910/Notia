import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/theme.css';

/**
 * 플랫폼별 초기화 모듈을 로드하고 실행합니다.
 * @param platformName 초기화할 플랫폼 이름
 * @returns 초기화 성공 여부
 */
async function initializePlatform(platformName: string): Promise<boolean> {
  try {
    const module = await import(`./platforms/${platformName}/index.tsx`);
    const initPlatform = module.default;
    await initPlatform();
    console.log(`🟠 Platform : ¦¦¦${platformName}¦¦¦ Initialized Successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to initialize platform ${platformName}:`, error);
    return false;
  }
}

/**
 * React 앱을 DOM에 렌더링합니다.
 * @returns 렌더링 성공 여부
 */
function renderReactApp(): boolean {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);

    console.log('🟡 React app rendered successfully');
    return true;
  } catch (error) {
    console.error('Failed to render React app:', error);
    return false;
  }
}

/**
 * 애플리케이션 초기화를 위한 단일 진입점 함수
 */
async function initializeApp(): Promise<void> {
  try {
    // 1. 플랫폼 결정
    const platform = import.meta.env.VITE_PLATFORM || 'web';

    // 2. 플랫폼별 초기화 모듈 로드 및 실행
    const platformInitialized = await initializePlatform(platform);

    // 3. React 앱 렌더링 (플랫폼 초기화 성공 여부와 관계없이 시도)
    renderReactApp();

    // 4. 전체 초기화 결과 로깅
    if (platformInitialized) {
      console.log('🟢 Application initialized successfully');
    } else {
      console.warn(
        'Application initialized with warnings (platform initialization failed)',
      );
    }
  } catch (error) {
    console.error('Critical error during app initialization:', error);
  }
}

// 앱 초기화 실행
initializeApp().catch((error) => {
  console.error('Unhandled error in initialization process:', error);
});
