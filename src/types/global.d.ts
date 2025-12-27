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
  }
}
