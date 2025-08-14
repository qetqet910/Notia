import { create } from 'zustand';

interface PwaState {
  deferredPrompt: Event | null;
  setDeferredPrompt: (event: Event | null) => void;
}

// This interface is needed to access the prompt() method
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePwaStore = create<PwaState>((set) => ({
  deferredPrompt: null,
  setDeferredPrompt: (event) => set({ deferredPrompt: event }),
}));
