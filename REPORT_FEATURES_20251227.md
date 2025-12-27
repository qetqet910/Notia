# 🚀 Notia 기능 구현 및 성능 최적화 리포트
**날짜:** 2025년 12월 27일
**작성자:** Gemini Agent

## 1. 개요 (Overview)
본 리포트는 Notia 데스크탑 애플리케이션의 성능을 극대화하고, 사용자 경험을 향상시키기 위해 구현된 주요 기능들에 대한 기술적 세부 사항을 다룹니다. Rust 백엔드를 활용한 고속 연산 처리부터 오프라인 지원, 자동 업데이트까지 포괄적인 업그레이드가 수행되었습니다.

---

## 2. 주요 구현 기능 (Key Features)

### ⚡ 1. Rust 기반 고속 연산 (High-Performance Backend)
JavaScript 메인 스레드의 부하를 줄이기 위해 핵심 연산 로직을 Rust로 이관했습니다.

*   **고속 통계 계산 (`calculate_activity`)**
    *   **문제:** 대량의 노트 데이터 처리 시 JS 루프 속도 저하.
    *   **해결:** Rust의 `HashMap`과 `HashSet`을 활용하여 O(N) 복잡도로 데이터 집계.
    *   **성과:** 수천 개의 노트 통계도 지연 없이 즉시 산출.
*   **하이브리드 검색 (`search_notes`)**
    *   **기능:** 제목, 본문, 태그(`#tag`)를 동시에 검색.
    *   **로직:** 대소문자 무시(Case-insensitive) 및 AND 조건 검색 적용.
*   **이미지 최적화 (`optimize_image`)**
    *   **기능:** 업로드 전 로컬에서 이미지 리사이징(Max 1920px) 및 WebP 변환.
    *   **효과:** 서버 스토리지 용량 절약 및 로딩 속도 향상.

### 🔔 2. 크로스 플랫폼 시스템 알림 (System Notifications)
데스크탑과 웹 환경 모두에서 정확한 타이밍에 리마인더 알림을 제공합니다.

*   **통합 유틸리티 (`notification.ts`):** `isTauri()` 체크를 통해 환경에 따라 `tauri-plugin-notification` 또는 브라우저 `Notification` API를 자동 선택.
*   **정밀 스케줄러 (`useReminderScheduler.ts`):**
    *   **정밀도:** 기존 분 단위 체크에서 **초 단위(2초 주기)** 체크로 개선.
    *   **스마트 알림:** 앱이 포커스된 상태면 인앱 Toast 알림, 백그라운드면 OS 시스템 알림 발송.
    *   **안정성:** `useState` 의존성을 제거하고 `useDataStore.getState()`를 사용하여 타이머 리셋 방지.

### 📡 3. 오프라인 모드 (Local-First Offline Mode)
네트워크 연결이 없어도 데이터를 안전하게 저장하고 조회할 수 있습니다.

*   **아키텍처:** **Local-First.** 데이터 읽기/쓰기 시 로컬 DB를 우선적으로 사용하고, 백그라운드에서 서버와 동기화.
*   **저장소 기술:**
    *   **Desktop:** `@tauri-apps/plugin-sql` (SQLite) - 대용량, 고성능.
    *   **Web:** `IndexedDB` - 브라우저 표준 대용량 저장소.
*   **동기화 전략:**
    *   **낙관적 업데이트 (Optimistic UI):** 사용자 액션 즉시 로컬 DB 및 UI 반영 -> 사용자 경험 향상.
    *   **백그라운드 동기화:** 로컬 저장 후 Supabase 전송 시도. 실패 시(오프라인) 에러를 무시하고 로컬 데이터 유지.

### 🔄 4. 자동 업데이트 (Auto Updater)
사용자가 별도 설치 과정 없이 최신 버전을 유지할 수 있도록 지원합니다.

*   **Tauri Updater:** GitHub Releases를 업데이트 서버로 활용.
*   **보안:** Ed25519 알고리즘을 사용한 업데이트 서명(Signing) 체계 구축.
*   **UX:**
    *   앱 시작 시 전역 업데이트 체크 (`App.tsx`).
    *   새 버전 발견 시 `AlertDialog`로 알림 및 "지금 업데이트" 옵션 제공.
    *   설정 탭(`SettingsTab`)에 수동 확인 버튼 및 버전 정보 섹션 추가.

---

## 3. 기술 스택 변경 사항 (Tech Stack Changes)

| 구분 | 추가/변경 패키지 | 용도 |
|---|---|---|
| **Rust** | `tauri-plugin-sql`, `tauri-plugin-updater`, `tauri-plugin-notification`, `image`, `chrono` | 백엔드 기능 확장 |
| **Frontend** | `@tauri-apps/plugin-*` 계열 패키지 | Tauri 기능 제어 |
| **Test** | `vitest`, `@testing-library/*` | 단위 테스트 환경 |

---

## 4. 향후 과제 (Future Work)
*   **오프라인 동기화 큐(Sync Queue):** 오프라인 상태에서 변경된 내용을 큐에 쌓아두었다가, 온라인 전환 시 순차적으로 전송하는 로직 고도화.
*   **충돌 해결(Conflict Resolution):** 로컬과 서버 데이터가 다를 때의 병합 전략 수립.
