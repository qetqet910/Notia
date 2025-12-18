import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isTauri = process.env.VITE_IS_TAURI === 'true';

export default defineConfig({
  base: './',
  cacheDir: '.vite-cache',
  define: {
    'process.env.APP_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_IS_TAURI': JSON.stringify(process.env.VITE_IS_TAURI),
  },
  server: {
    hmr: {
      overlay: false,
    },
    fs: {
      allow: ['.'],
    },
    headers: {
      // 서비스 워커에 올바른 MIME 타입 설정
      'Service-Worker-Allowed': '/',
    },
  },
  plugins: [
    react(),
    !isTauri && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icon16x16.png',
        'icon32x32.png',
        'apple-touch-icon.png',
        'android-chrome-192x192',
        'android-chrome-512x512',
      ],
      manifest: {
        name: 'Notia',
        short_name: 'Notia',
        description:
          '마크다운으로 자유롭게 기록하고, 태그 하나로 생각을 정리하며, 일상 속 중요한 약속까지 관리하세요. 당신의 생산성을 위한 가장 가볍고 빠른 도구입니다.',
        theme_color: '#cec',
        start_url: './', // 상대 경로에 맞춰 수정
        scope: './',      // 상대 경로에 맞춰 수정
        display: 'standalone',
        screenshots: [
          {
            src: 'og-image.webp', // 상대 경로로 수정
            sizes: '1280x640',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Notia in Action',
          },
        ],
        icons: [
          {
            src: 'favicon/pwa-192x192.png', // 상대 경로로 수정
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'favicon/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'favicon/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks 제거: Vite 기본 분할 전략 사용
      },
    },
  },
  assetsInclude: ['**/*.lottie'],
});