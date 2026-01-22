import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, rmSync, existsSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

/**
 * Tauri 빌드 환경에서 PWA 관련 파일이 생성되거나 캐시되는 것을 방지하기 위한 플러그인
 */
function tauriCleanPlugin(): Plugin {
  return {
    name: 'tauri-clean-plugin',
    apply: 'build',
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
            console.log(`🧹 [Tauri Clean] Removed PWA file: ${file}`);
          } catch (err) {
            console.warn(`⚠️ [Tauri Clean] Failed to remove ${file}:`, err);
          }
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Tauri 빌드 판정 (npm 스크립트 명칭, Vite 모드, TAURI_PLATFORM 등을 모두 고려)
  const isTauri = 
    mode === 'tauri' || 
    process.env.VITE_IS_TAURI === 'true' || 
    process.env.TAURI_PLATFORM !== undefined ||
    (process.env.npm_lifecycle_event && process.env.npm_lifecycle_event.includes('tauri'));
  
  console.log(`
🚀 [Notia Build] Mode: ${mode}, isTauri: ${isTauri}, Script: ${process.env.npm_lifecycle_event}
`);

  if (!env.VITE_VAPID_PUBLIC_KEY) {
    console.warn(`
⚠️ [Notia Build] VITE_VAPID_PUBLIC_KEY is missing! 
   Push notifications will not work. 
   Please set this environment variable in your deployment settings (.env or Netlify/Vercel dashboard).
`);
  }

  const plugins: (Plugin | Plugin[] | false)[] = [react()];
  
  if (isTauri) {
    plugins.push(tauriCleanPlugin());
  } else {
    // 웹 빌드 시에만 PWA 활성화
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline', // 외부 JS 파일 의존성 제거
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Notia',
          short_name: 'Notia',
          theme_color: '#cec',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          icons: [
            { src: 'favicon/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'favicon/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          importScripts: ['push-sw.js']
        }
      })
    );
  }

  return {
    // 개발 모드와 배포 모드 모두 절대 경로('/')를 기본으로 사용합니다.
    // 이는 SPA 라우팅 및 쿼리 파라미터 환경에서 가장 안정적입니다.
    base: '/', 
    cacheDir: '.vite-cache',
    publicDir: 'public',
    
    define: {
      'process.env.APP_VERSION': JSON.stringify(packageJson.version),
      'import.meta.env.VITE_IS_TAURI': JSON.stringify(isTauri ? 'true' : 'false'),
      'import.meta.env.VITE_PLATFORM': JSON.stringify(env.VITE_PLATFORM || ''),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify(env.VITE_VAPID_PUBLIC_KEY),
    },
    
    plugins: [
      ...plugins,
      {
        name: 'html-env-injection',
        transformIndexHtml(html) {
          const envScript = `<script>window.__ENV__ = { VITE_SUPABASE_URL: ${JSON.stringify(env.VITE_SUPABASE_URL)}, VITE_SUPABASE_ANON_KEY: ${JSON.stringify(env.VITE_SUPABASE_ANON_KEY)}, VITE_VAPID_PUBLIC_KEY: ${JSON.stringify(env.VITE_VAPID_PUBLIC_KEY)} };</script>`;
          // Tauri 환경에서는 서비스 워커를 강제로 해제하는 스크립트 주입
          const swKiller = isTauri ? `
            <script>
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  for (let registration of registrations) { registration.unregister(); }
                });
              }
            </script>` : '';
          return html.replace('<head>', `<head>${envScript}${swKiller}`);
        }
      }
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
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    
    server: {
      host: true,
      strictPort: true,
      port: 5173,
    },
    
    build: {
      target: 'es2015',
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        input: { main: path.resolve(__dirname, 'index.html') },
      },
    },
    assetsInclude: ['**/*.lottie'],
  };
});
