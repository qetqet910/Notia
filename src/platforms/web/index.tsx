import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/global.css';

const init = () => {
  // PWA 설치 프롬프트 로직
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

  // 서비스 워커 등록 (Tauri 환경 제외)
  if ('serviceWorker' in navigator && import.meta.env.VITE_IS_TAURI !== 'true') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log(
            'Service Worker registered with scope:',
            registration.scope,
          );
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Failed to find the root element");
  }
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

export default init;