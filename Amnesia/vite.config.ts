import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks: {
          web: ["./src/platforms/web"],
          webapp: ["./src/platforms/webapp"],
          extension: ["./src/platforms/extension"],
        },
      },
    },
  },
});
