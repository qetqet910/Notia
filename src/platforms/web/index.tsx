export default function initWeb() {
  console.log("Web platform initialized")
  // 여기서는 React 렌더링을 하지 않고
  // 웹 플랫폼에 필요한 다른 초기화 작업만 수행

  // 예: 서비스 워커 등록, 플랫폼별 설정 등
  if ("serviceWorker" in navigator) {
    // 서비스 워커 등록 코드
  }

  // 기타 웹 플랫폼 초기화 코드
}