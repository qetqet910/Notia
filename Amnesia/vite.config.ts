import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  base: "/Amnesia/", // GitHub Pages 배포 URL에 맞게 수정
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "icon16.png",
        "icon48.png",
        "icon128.png",
        "icon-192.png",
        "icon-512.png",
        "apple-touch-icon.png",
        "masked-icon.svg",
      ],
      manifest: {
        name: "Amnesia",
        short_name: "Note",
        description: "깨끗한 완결, 하루하루 성실하게.",
        theme_color: "#333333",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "./", // 상대 경로로 변경
        scope: "./", // 스코프 추가
        icons: [
          {
            src: "./icon-192.png", // 상대 경로로 변경
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "./icon-512.png", // 상대 경로로 변경
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
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
})

