# 🚀 Notia Desktop Performance Optimization Report

## 1. 개요 (Overview)
Notia 데스크톱 앱(Tauri)의 성능과 리소스 효율성을 극대화하기 위해 핵심 연산 로직을 JavaScript 메인 스레드에서 **Rust 백엔드**로 이관했습니다. 이를 통해 대량의 데이터 처리 시 UI 버벅임을 방지하고, 네이티브 수준의 속도를 확보했습니다.

이 변경 사항은 **Tauri 환경(Desktop)**에서만 활성화되며, 웹 환경(Browser)에서는 기존 JavaScript 로직으로 자동 폴백(Fallback)되어 호환성을 유지합니다.

---

## 2. 주요 변경 사항 (Key Changes)

### 📊 1. 고속 통계 계산 (High-Performance Statistics)
대시보드의 활동 히트맵(잔디) 및 통계 데이터를 계산하는 로직을 최적화했습니다.

*   **기존 (Legacy):** `activityCalculator.worker.ts` (JS Web Worker 사용)
*   **변경 (New):** Rust `calculate_activity` Command
*   **구현 내용:**
    *   `src-tauri/src/lib.rs`에 `HashMap`과 `HashSet`을 활용한 고속 집계 함수 구현.
    *   JS 객체 직렬화 오버헤드를 최소화하고 Rust의 빠른 순회 속도 활용.
    *   `src/stores/dataStore.ts`에서 `isTauri()` 체크를 통해 분기 처리.

### 🔍 2. 하이브리드 고속 검색 (Hybrid Fast Search)
노트 목록 필터링 시 수천 개의 노트를 즉시 검색할 수 있도록 개선했습니다.

*   **기존 (Legacy):** `Array.prototype.filter` (클라이언트 사이드 JS)
*   **변경 (New):** Rust `search_notes` Command
*   **구현 내용:**
    *   제목, 내용, 태그(`#tag`)를 포함한 통합 검색 지원.
    *   **AND 조건** (모든 검색어 포함) 및 **대소문자 무시(Case-insensitive)** 로직 적용.
    *   `src/components/features/dashboard/noteList.tsx`에서 검색어 입력 시 Rust 백엔드 호출.

### 🖼️ 3. 로컬 이미지 최적화 (Local Image Optimization)
에디터에 이미지를 업로드할 때, 서버 전송 전 로컬에서 압축을 수행합니다.

*   **기존 (Legacy):** 원본 이미지(Raw File)를 그대로 Supabase Storage에 업로드.
*   **변경 (New):** Rust `optimize_image` Command
*   **구현 내용:**
    *   **Resizing:** 긴 변 기준 최대 **1920px**로 리사이징 (Lanczos3 필터 사용).
    *   **Compression:** **WebP 포맷**으로 변환하여 용량 대폭 절감 (약 70~80%).
    *   `src/components/features/dashboard/main/editor.tsx`의 `handleImageUpload` 함수 수정.

---

## 3. 기술적 세부 사항 (Technical Details)

### 🛠️ Rust Dependencies (`Cargo.toml`)
최적화 구현을 위해 다음 크레이트들이 추가되었습니다:
*   `chrono`: 날짜/시간 데이터 파싱 및 처리.
*   `image`: 이미지 디코딩, 리사이징, 인코딩.
*   `base64`: 프론트엔드와 바이너리 데이터 교환.
*   `serde`, `serde_json`: 데이터 직렬화.

### ⚠️ 파싱 로직 롤백 (Parser Rollback)
노트 본문 파싱(`parse_note_content`) 기능도 Rust로 이식을 시도했으나, 한글/유니코드 정규식 처리 과정에서 호환성 문제와 복잡성이 발견되어 **안정적인 기존 JavaScript 파서(`src/utils/noteParser.ts`)를 계속 사용**하기로 결정했습니다. 이는 데이터 무결성을 위한 안전한 선택입니다.

---

## 4. 파일 변경 목록 (Changed Files)

| 파일 경로 | 변경 내용 |
|---|---|
| `src-tauri/Cargo.toml` | `chrono`, `image`, `base64` 의존성 추가 |
| `src-tauri/src/lib.rs` | `calculate_activity`, `search_notes`, `optimize_image` 구현 및 등록 |
| `src/stores/dataStore.ts` | 통계 계산 시 Rust 호출 로직 (`invoke`) 추가 |
| `src/components/features/dashboard/noteList.tsx` | 검색 시 Rust 호출 로직 추가 및 디바운싱 적용 |
| `src/components/features/dashboard/main/editor.tsx` | 이미지 업로드 시 최적화 커맨드 호출 추가 |
| `src/utils/noteParser.ts` | 비동기 인터페이스 유지하되 순수 JS 로직으로 복구 |

---

## 5. 향후 계획 (Next Steps)
*   [x] **시스템 알림(System Notifications):** 리마인더 시간에 맞춰 OS 네이티브 알림 발송. (완료)
    *   `tauri-plugin-notification` 적용 및 `useReminderScheduler` 훅 구현.
    *   앱 실행 중 1분 단위로 리마인더 체크 및 OS 알림/브라우저 알림 발송.
    *   정밀도 향상 (초 단위 체크) 및 앱 포커스 여부에 따른 Toast/OS 알림 분기 처리.
*   [x] **오프라인 모드(Offline Mode):** 로컬 DB(SQLite) 또는 파일 시스템 동기화. (완료)
    *   **Local-First Architecture:** `src/services/localDB.ts` 구현.
    *   **Tauri (Desktop):** `@tauri-apps/plugin-sql` (SQLite) 사용.
    *   **Web (Browser):** `IndexedDB` 래퍼 구현으로 플랫폼 호환성 확보.
    *   **Data Store:** `src/stores/dataStore.ts`에서 초기화 시 로컬 데이터 우선 로드 및 낙관적 업데이트(Optimistic UI) + 백그라운드 동기화 구현.
*   [x] **자동 업데이트(Auto Updater):** Tauri Updater 연동. (완료)
    *   `tauri-plugin-updater` 적용 및 GitHub Releases 연동.
    *   **보안:** Ed25519 키 페어 생성 및 서명(Signing) 워크플로우 구축.
    *   **UX:** 앱 시작 시(`App.tsx`) 전역 업데이트 체크 및 알림(AlertDialog) 구현.
    *   **설정:** `SettingsTab`에 수동 업데이트 확인 및 버전 정보 섹션 추가.
    *   **CI/CD:** GitHub Action(`tauri-build.yml`)에 자동 서명 및 릴리즈 업로드 단계 추가.
