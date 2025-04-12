declare module '*.png' {
  const value: string;
  export default value;
}

declare const chrome: any;
declare const browser: any;

interface Window {
  deferredInstallPrompt: any;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PLATFORM: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
