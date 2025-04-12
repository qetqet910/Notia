export default async function initExtension() {
  // 1. 확장 프로그램 API 접근
  const browserAPI =
    typeof chrome !== 'undefined'
      ? chrome
      : typeof browser !== 'undefined'
      ? browser
      : null;

  // 2. 확장 프로그램 메시지 리스너 설정
  setupExtensionMessageListeners(browserAPI);

  // 3. 확장 프로그램 권한 확인
  checkExtensionPermissions(browserAPI);

  // 4. 확장 프로그램 스토리지 초기화
  await initExtensionStorage(browserAPI);

  // 5. 확장 프로그램 컨텍스트 메뉴 설정
  setupContextMenus(browserAPI);
}

// 확장 프로그램 메시지 처리
function setupExtensionMessageListeners(api) {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received extension message:', message);
    // 메시지 처리 로직
    sendResponse({ status: 'received' });
  });
}

// 확장 프로그램 권한 확인
function checkExtensionPermissions(api) {
  api.permissions.getAll((permissions) => {
    console.log('Extension permissions:', permissions);
  });
}

// 확장 프로그램 스토리지 초기화
async function initExtensionStorage(api): Promise<void> {
  return new Promise((resolve) => {
    api.storage.local.get('settings', (result) => {
      if (!result.settings) {
        // 기본 설정 저장
        api.storage.local.set({
          settings: { theme: 'light', notifications: true },
        });
      }
      resolve();
    });
  });
}

// 컨텍스트 메뉴 설정
function setupContextMenus(api) {
  api.contextMenus.create({
    id: 'myExtensionAction',
    title: '확장 프로그램 작업 실행',
    contexts: ['selection'],
  });
}
