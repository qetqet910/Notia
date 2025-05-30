import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  cacheDir: '.vite-cache',
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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icon16.png',
        'icon48.png',
        'icon128.png',
        'apple-touch-icon.png',
        'masked-icon.svg',
      ],
      manifest: {
        name: 'Amnesia',
        short_name: 'Note',
        description: '까먹지 않게, 하루하루 성실하게.',
        theme_color: '#333333',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@platforms': path.resolve(__dirname, './src/platforms'),
    },
  },
  build: {
    minify: false,
    sourcemap: false,
    // 코드 압축(난독화) 비활성화 → 빌드 속도 증가 / 배포 과정에선 당연히 true로 바꿀 것
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        manualChunks: {
          web: ['./src/platforms/web'],
          webapp: ['./src/platforms/webapp'],
          extension: ['./src/platforms/extension'],
        },
      },
    },
  },
  assetsInclude: ['**/*.lottie'],
});
