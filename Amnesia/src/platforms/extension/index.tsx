import { createRoot } from "react-dom/client"
import App from "../../App"

// Chrome API 타입을 사용할 수 있도록 합니다.
/// <reference types="chrome"/>

export default function initExtension() {
  // chrome 객체의 존재 여부를 확인합니다
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, () => {
      const container = document.getElementById("root")
      if (container) {
        const root = createRoot(container)
        root.render(<App />)
      }
    })
  } else {
    console.warn("Chrome API is not available. Running in development mode or non-extension environment.")
    // 개발 환경을 위한 대체 로직
    const container = document.getElementById("root")
    if (container) {
      const root = createRoot(container)
      root.render(<App />)
    }
  }
}

