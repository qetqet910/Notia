/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_TAURI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.lottie' {
  const value: string;
  export default value;
}
