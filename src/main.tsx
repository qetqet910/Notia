import '@/styles/global.css';

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

    const module = (await import(
      `./platforms/${platformName}/index.tsx`
    )) as PlatformModule;
    
    const initPlatform = module.default;
    initPlatform(); // This function now handles rendering

    console.log(`2️⃣ Platform : ¦¦¦${platformName}¦¦¦ Initialized Successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to initialize platform ${platformName}:`, error);
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
  }
}

// 앱 초기화 실행
initializeApp().catch((error) => {
  console.error('Unhandled error in initialization process:', error);
});