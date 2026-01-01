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