/// <reference types="chrome" />

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface Window {
  deferredInstallPrompt: BeforeInstallPromptEvent | null;
  browser?: typeof chrome;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PLATFORM: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}