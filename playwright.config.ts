import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    // Vite dev 서버는 지연 로딩 청크를 온디맨드로 컴파일하므로, 병렬 콜드 로드에서
    // 최초 렌더가 5초를 넘을 수 있다. 넉넉히 잡아 플레이크를 방지한다.
    timeout: 15_000,
  },
  fullyParallel: true,
  // 단일 Vite dev 서버가 지연 로딩 청크를 온디맨드로 컴파일하므로, 여러 워커가
  // 동시에 요청하면 컴파일이 밀려 플레이크가 생긴다. 현재 스위트는 작아
  // (수 초 단위) 병렬화 이득보다 결정성이 더 중요하므로 직렬로 고정한다.
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'local-anon-key',
      VITE_VAPID_PUBLIC_KEY: 'local-vapid-key',
      VITE_E2E_BYPASS_AUTH: '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
