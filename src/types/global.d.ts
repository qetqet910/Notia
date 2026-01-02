/// <reference types="chrome" />

export {};

declare global {
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
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: unknown;
    __ENV__?: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_VAPID_PUBLIC_KEY: string;
    };
  }
}
