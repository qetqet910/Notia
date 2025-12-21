export const isTauri = () => {
  return (
    import.meta.env.VITE_IS_TAURI === 'true' ||
    // @ts-ignore
    typeof window.__TAURI_INTERNALS__ !== 'undefined'
  );
};
