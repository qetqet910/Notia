import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';

export function initWeb(): void {
  // PWA install prompt handling
  let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function showInstallPrompt() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredInstallPrompt = null;
    }
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Failed to find the root element');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

export async function initWebapp(): Promise<void> {
  // 1) app state
  initAppState();

  // 2) offline detection
  setupOfflineDetection();

  // 3) update checks
  checkForUpdates();

  // 4) install prompt
  handleInstallPrompt();

  // 5) initial data
  await preloadAppData();
}

function initAppState() {
  // PWA-only state hooks
  window.addEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    console.log('App is now visible');
    // work when tab becomes visible
  } else {
    console.log('App is now hidden');
    // work when tab is hidden
  }
}

function setupOfflineDetection() {
  window.addEventListener('online', () => {
    console.log('App is online');
    // online recovery
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    // offline mode
  });
}

function checkForUpdates() {
  // PWA update checks
}

function handleInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // install prompt handling
    e.preventDefault();
    window.deferredInstallPrompt = e as BeforeInstallPromptEvent;
    console.log('Install prompt available');
  });
}

async function preloadAppData() {
  try {
    // Load IndexedDB/Cache Storage for offline support
    return true;
  } catch (error) {
    console.error('Failed to preload app data:', error);
    return false;
  }
}

export async function initExtension(): Promise<void> {
  // 1) pick extension API
  const browserAPI =
    typeof chrome !== 'undefined'
      ? chrome
      : typeof window !== 'undefined' && window.browser
      ? window.browser
      : null;

  if (!browserAPI) {
    throw new Error('Browser extension API is unavailable');
  }

  // 2) message listeners
  setupExtensionMessageListeners(browserAPI);

  // 3) permissions
  checkExtensionPermissions(browserAPI);

  // 4) storage init
  await initExtensionStorage(browserAPI);

  // 5) context menus
  setupContextMenus(browserAPI);
}

function setupExtensionMessageListeners(api: typeof chrome) {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received extension message:', message);
    // message handling
    sendResponse({ status: 'received' });
  });
}

function checkExtensionPermissions(api: typeof chrome) {
  api.permissions.getAll((permissions) => {
    console.log('Extension permissions:', permissions);
  });
}

async function initExtensionStorage(api: typeof chrome): Promise<void> {
  return new Promise((resolve) => {
    api.storage.local.get('settings', (result) => {
      if (!result.settings) {
        // default settings
        api.storage.local.set({
          settings: { theme: 'light', notifications: true },
        });
      }
      resolve();
    });
  });
}

function setupContextMenus(api: typeof chrome) {
  api.contextMenus.create({
    id: 'myExtensionAction',
    title: 'Run extension action',
    contexts: ['selection'],
  });
}
