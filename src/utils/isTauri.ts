export const isTauri = () => {
  // 1. 빌드 타임 주입 변수 확인
  if (import.meta.env.VITE_IS_TAURI === 'true') return true;
  
  // 2. 런타임 전역 객체 확인 (window.__TAURI_INTERNALS__ 또는 window.__TAURI__)
  if (typeof window !== 'undefined' && 
      (window.__TAURI_INTERNALS__ || window.__TAURI__)) {
    return true;
  }
  
  return false;
};

export const isWebapp = () => {
  return import.meta.env.VITE_PLATFORM === 'webapp';
};

export const isAppMode = () => {
  return isTauri() || isWebapp();
};