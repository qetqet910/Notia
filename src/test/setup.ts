import '@testing-library/jest-dom';
import { vi } from 'vitest';

// --- Supabase Global Mock ---
vi.mock('@/services/supabaseClient', () => {
    // Chainable mock for database queries
    const mockQueryChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      // then is needed for async/await behavior on chain
      then: vi.fn((resolve) => resolve({ data: [], error: null })),
    };
  
    return {
      supabase: {
        auth: {
          getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
          getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
          onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
          signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
          signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
        from: vi.fn(() => mockQueryChain),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
          unsubscribe: vi.fn().mockResolvedValue(undefined),
        })),
        functions: {
          invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
        },
      },
    };
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
};

// Mock Notification
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).Notification = class {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn().mockResolvedValue('granted');
  constructor(public title: string, public options?: NotificationOptions) {}
  close() {}
};
