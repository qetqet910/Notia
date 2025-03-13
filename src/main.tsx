import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/theme.css"

declare global {
  interface ImportMeta {
    env: {
      VITE_PLATFORM?: string
    }
  }
}

// 단일 진입점 함수
async function initializeApp() {
  try {
    // 1. 플랫폼 결정
    const platform = import.meta.env.VITE_PLATFORM || "web"
    console.log(`Initializing platform: ${platform}`)

    // 2. 플랫폼별 초기화 모듈 로드 (React 렌더링 없이)
    try {
      const module = await import(`./platforms/${platform}/index.tsx`)
      const initPlatform = module.default
      await initPlatform()
      console.log(`Platform ${platform} initialized successfully`)
    } catch (error) {
      console.error(`Failed to initialize platform ${platform}:`, error)
    }

    // 3. React 앱 렌더링 (한 번만)
    const rootElement = document.getElementById("root")
    if (!rootElement) {
      throw new Error("Root element not found")
    }

    const root = ReactDOM.createRoot(rootElement)
    root.render(<App />)

    console.log("React app rendered successfully")
  } catch (error) {
    console.error("Failed to initialize app:", error)
  }
}

// 앱 초기화 실행
initializeApp()

