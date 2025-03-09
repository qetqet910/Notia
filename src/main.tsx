import React from "react"
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

const platform = import.meta.env.VITE_PLATFORM || "web"

import(`./platforms/${platform}/index.tsx`).then((module) => {
  const initPlatform = module.default
  initPlatform()
})

// 기본 렌더링 (웹 플랫폼용)
if (platform === "web") {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

