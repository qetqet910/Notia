var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, rmSync, existsSync } from 'fs';
var packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
// Tauri 빌드 후 PWA 파일 삭제 플러그인
function cleanPWAFiles() {
    return {
        name: 'clean-pwa-files',
        closeBundle: function () {
            var outDir = path.resolve(__dirname, 'dist');
            var pwaFiles = [
                'manifest.json',
                'manifest.webmanifest',
                'service-worker.js',
                'sw.js',
                'registerSW.js',
                'workbox-*.js',
            ];
            pwaFiles.forEach(function (file) {
                var filePath = path.join(outDir, file);
                if (existsSync(filePath)) {
                    try {
                        rmSync(filePath, { force: true });
                        console.log("\uD83D\uDDD1\uFE0F  Removed: ".concat(file));
                    }
                    catch (err) {
                        console.warn("\u26A0\uFE0F  Failed to remove ".concat(file, ":"), err);
                    }
                }
            });
        }
    };
}
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // 현재 모드에 맞는 환경 변수 로드 (우선순위: .env.tauri > .env)
    // loadEnv는 내부적으로 dotenv를 사용하여 .env 파일을 로드합니다.
    var env = loadEnv(mode, process.cwd(), '');
    // Tauri 빌드 환경 감지
    var isTauri = mode === 'tauri' ||
        process.env.TAURI_PLATFORM !== undefined ||
        process.env.TAURI_ENV_PLATFORM !== undefined;
    console.log('--- Build Configuration ---');
    console.log('Mode:', mode);
    console.log('TAURI_PLATFORM:', process.env.TAURI_PLATFORM);
    console.log('Is Tauri Build:', isTauri);
    // 디버깅: 키 존재 여부만 로그 (값은 숨김)
    console.log('VITE_SUPABASE_URL Exists:', !!env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY Exists:', !!env.VITE_SUPABASE_ANON_KEY);
    console.log('---------------------------');
    var plugins = [react()];
    // PWA 플러그인은 웹 빌드에만 추가
    if (!isTauri) {
        plugins.push(VitePWA({
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
                description: '마크다운으로 자유롭게 기록하고, 태그 하나로 생각을 정리하며, 일상 속 중요한 약속까지 관리하세요. 당신의 생산성을 위한 가장 가볍고 빠른 도구입니다.',
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
        }));
    }
    else {
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
            // 환경 변수 명시적 주입 (누락 방지)
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
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
        plugins: __spreadArray(__spreadArray([], plugins, true), [
            {
                name: 'html-env-injection',
                transformIndexHtml: function (html) {
                    var envScript = "\n            <script>\n              window.__ENV__ = {\n                VITE_SUPABASE_URL: ".concat(JSON.stringify(env.VITE_SUPABASE_URL), ",\n                VITE_SUPABASE_ANON_KEY: ").concat(JSON.stringify(env.VITE_SUPABASE_ANON_KEY), "\n              };\n            </script>\n          ");
                    return html.replace('<head>', "<head>".concat(envScript));
                }
            }
        ], false),
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
