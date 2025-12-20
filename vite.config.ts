import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, rmSync, existsSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Tauri 빌드 후 PWA 파일 삭제 플러그인
function cleanPWAFiles(): Plugin {
  return {
    name: 'clean-pwa-files',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      
      const pwaFiles = [
        'manifest.json',
        'manifest.webmanifest',
        'service-worker.js',
        'sw.js',
        'registerSW.js',
        'workbox-*.js',
      ];
      
      pwaFiles.forEach(file => {
        const filePath = path.join(outDir, file);
        if (existsSync(filePath)) {
          try {
            rmSync(filePath, { force: true });
            console.log(`🗑️  Removed: ${file}`);
          } catch (err) {
            console.warn(`⚠️  Failed to remove ${file}:`, err);
          }
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Tauri 빌드 환경 감지
  const isTauri = 
    mode === 'tauri' ||
    process.env.TAURI_PLATFORM !== undefined ||
    process.env.TAURI_ENV_PLATFORM !== undefined;
  
  console.log('--- Build Configuration ---');
  console.log('Mode:', mode);
  console.log('TAURI_PLATFORM:', process.env.TAURI_PLATFORM);
  console.log('Is Tauri Build:', isTauri);
  console.log('---------------------------');

  const plugins: (Plugin | Plugin[] | false)[] = [react()];
  
  // PWA 플러그인은 웹 빌드에만 추가
  if (!isTauri) {
    plugins.push(
      VitePWA({
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
          start_url: './',
          scope: './',
          display: 'standalone',
          screenshots: [
            {
              src: 'og-image.webp',
              sizes: '1280x640',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Notia in Action',
            },
          ],
          icons: [
            {
              src: 'favicon/pwa-192x192.png',
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
      })
    );
  } else {
    // Tauri 빌드 시 PWA 파일 정리
    plugins.push(cleanPWAFiles());
  }

  return {
    base: './',
    cacheDir: '.vite-cache',
    
    // public 폴더는 항상 사용 (lottie 파일 등을 위해)
    publicDir: 'public',
    
    define: {
      'process.env.APP_VERSION': JSON.stringify(packageJson.version),
      'import.meta.env.VITE_IS_TAURI': JSON.stringify(isTauri ? 'true' : 'false'),
    },
    server: {
      hmr: {
        overlay: false,
      },
      fs: {
        allow: ['.'],
      },
      headers: {
        'Service-Worker-Allowed': '/',
      },
    },
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2015',
      sourcemap: true,
      minify: 'esbuild', // 다시 활성화 (메모리 절약)
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // 기본 청킹 전략 사용
        },
      },
    },
    assetsInclude: ['**/*.lottie'],
  };
});