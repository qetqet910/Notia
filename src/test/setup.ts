import '@testing-library/jest-dom';

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
