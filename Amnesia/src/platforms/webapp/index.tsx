import { createRoot } from "react-dom/client"
import App from "../../App"

export default function initWebApp() {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("root")
    if (container) {
      const root = createRoot(container)
      root.render(<App />)
    }
  })
}

