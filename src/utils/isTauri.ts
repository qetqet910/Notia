export const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    // @ts-ignore
    typeof window.__TAURI_INTERNALS__ !== 'undefined'
  );
};

export const isWebapp = () => {
  return import.meta.env.VITE_PLATFORM === 'webapp';
};

/**
 * 앱 전용 모드 여부 (데스크탑 앱 또는 웹앱 빌드)
 * 이 모드에서는 랜딩 페이지를 건너뛰고 바로 로그인 화면을 보여줍니다.
 */
export const isAppMode = () => {
  return isTauri() || isWebapp();
};
