#### 오늘/내일 할 것들

```ruby
Login Logic Complete O
OAuth 로그인 성능이슈 해결 O
AuthCallback Error / 성능이슈 해결 O
이메일 없이 회원가입 로직 수정 O

IP 회원가입 제한 걸기 O
로딩 UI들 정상화 Toast Message 재정비, 최적화 O
Social Login할 때 로딩 설정하기 O

Darkmode, Light, System Mode, Classic Dark 개발 O
플젝 파일구조 정리 O - types부터 이어서 하기 O

package.json 버전 문제 해결 X, bot 삭제 O
Supabase 수정 및 개선 O
사용자별 개인 노트 연결 및 생성, 삭제, 저장 O

인기태그 디스플레이 O
본래의 의미 강화 O - 페이지 통합 O (노트에 Reminder 기능 추가)
Editor, NoteList 한 페이지로 통합 O
@내일 3시 띄어쓰기 하면 안 됌 해결하기 O

index.ts 파일 타입으로 통합, 일단 Editor 호환성을 위해 EditorReminder Interface 생성 O
editor regex 바꾸고 reminder crawling 실패중 해결 O
오늘/내일탭 통합 지난 탭 추가 O
@2025-12-25 1시 시간 없으면 제대로 안 들어감 O
리마인더 UX 추가 1시는 PM 1시 O

완료된 리마인더 삭제 구현 O (노트에서도 리마인더, 구문 삭제 구현, 노트 다시 저장시 완료 리마인더 삭제 해결) *수정과 삭제, original_text 추가에 문제가 있음 삭제가 된다 안 된다는 그 다음 문제 = (수정, 삭제) 행동 반복 후 DB 데이터 증식 + Original_text allowd Null 에러 발생* O - 거의 키 로그인 만큼의 개빡이였다 - textarea를 md로 바꾸니까 고장남 씨ㅡ빨 O

@내일 1시 - 오전 1시로 들어감 0붙이지 않는 이상 오후로 판정 등등의 오류 개선 O
리마인더에도 카드 클릭시 노트로 돌아가기 O
최근 리마인더에 내일, 모레 따로 구분하기 O
에디터 리마인더 카드 가로 스크롤로 shadow, fadein, transition O

Dashboard.tsx의 setSelectedNote가 실시간 반영의 메인 왜그럴까

리마인더 완료 후 똑같은 내용의 노트 수정 시 다시 원상태로 돌아감, 리마인더 @1시간 이라면 수정할 때 기준 1시간으로 바뀜 - 이게 수정할 때도 다 지우고 수정하는 방식이라 그게 아니라 따로 처리를 해야할듯 - 성능 개선과 로직개선 필요 O
에디터에서 리마인더 지우는 경우 삭제 로직 필요 O
삭제할 때 ~~도 같이 삭제 O

현재는 리마인더 내용/이름 변경 - 다른 리마인더로 인식, text로 uuid라서 - 문제될 경우 바꾸는 걸로

에디터 마크다운 도입 O
에디터 코드 하이라이터 도입 O
태그 클릭 이벤트 구현 O
usePlan 관한 것 삭제 O

캘린더 페이지 구현 O
타임라인 페이지 구현 O
마이페이지 O
설정페이지 구현 O
도움말 페이지 구현 O
단축키 구현, 추가 단축키 구현 및 최적화 O

도움말 페이지에 있는 부가 기능들 구현 O
설정, 마이페이지 기능 구현 O
캘린더 타임라인 완전 기능구현 O
콘솔 에러 해결 O
리마인더 오늘 기준 말고 시간 기준으로 넘기기 O
타임라인 CreateAt이 reminderTime으로 바뀐듯 + 기능추가 O
폰트 적용하기 O
뱃지, 잔디 추가하기 O

리마인더 기능 구현 - Local 환경에서 ServiceWorker 확인 - AI실 노트북 로컬에서 테스트, Gemini - Supabase Cron 추가

myPage Todo 구현 - userProfile Table 관련 구현중 - 원래 방식 userProfile import로 개선하기 - O
이거 하려고 Login, Create Table부터 다 바꾸는 중 O
Auth 계정이면 프로필 설정 불가 추가 O
MYpage anon 이메일 display 작업중 O
MyPage 최적화, 리팩토링, 컴포넌트 분리 - 1440줄은 힘들다 O
파일 전송 메인 에러 - Supabase Global Header application/json 으로 되어있었다 매우 조심할것 - 프사 완벽 구현 O

실시간 반영 구현 - Supabase Realtime Subscriptions 사용중 useNotes.ts 훅 폐지 dataStore에서 중앙집중 관리 구현중 - 기존 구조 유지, 각 구조의 용이성을 살린 상태로 구현 O
useNotes.ts, dataStore.ts 구현, 각 컴포넌트에 적용하기
Note type에서 create_at, createAt 중복 존재 해결하기
타임라인 시간대별로 리마인더로 바꾸기
코드 리팩토링 후 리뷰시간 갖기

---

Supabase Realtime Subscriptions Func팀 스페이스에 활용
팀스페이스 생성, 접근 레벨 설정
웹앱, 모바일 환경 구현
```

====================================================================<br/>

Personal Growth Diary 다마고치(썸원, 듀오링고 새) 키우미<br/>
Remote Obsidian note idea<br/>
google form or naver form 같은 기능 확장으로 추가 <br/>

====================================================================<br/>

FIX: - 버그 수정 시<br/>
FEAT: - 새로운 기능 추가 시<br/>
CHORE: - 유지보수 및 설정 변경 시<br/>
DOCS: - 문서 변경 시<br/>
STYLE: - 코드 스타일 수정 시 (로직 변경 없음)<br/>
REFACTOR: - 리팩토링 (기능 변경 없이 코드 구조 개선)<br/>
TEST: - 테스트 추가 또는 수정 시<br/>
PERF - 성능 개선<br/>
DESIGN - 디자인 변경<br/>

====================================================================<br/><br/>

assets: 정적 리소스를 저장
이미지, 아이콘, 애니메이션 등 미디어 파일<br/>

components: UI 요소들을 저장
features: 비즈니스 로직을 포함한 특정 기능 컴포넌트
ui: 재사용 가능한 순수 UI 컴포넌트 (stateless)

config: 환경 설정 관련 파일
API 엔드포인트, 환경 변수, 상수 등

hooks: 커스텀 React 훅
재사용 가능한 상태 로직과 사이드 이펙트

layouts: 페이지 레이아웃 컴포넌트
헤더, 푸터, 사이드바, 네비게이션 바 등

pages: 라우트에 매핑되는 페이지 컴포넌트
각 URL 경로에 해당하는 최상위 컴포넌트

services: 외부 서비스와의 통신 로직
API 호출, 데이터 가공, 인증 서비스 등

stores: 상태 관리 로직
Zustand, Redux, Context API 등의 상태 저장소

styles: 전역 스타일 및 테마 관련 파일
글로벌 CSS, 테마 변수, 믹스인 등

types: 타입스크립트 타입 정의
인터페이스, 타입, 열거형 등

utils: 유틸리티 함수
날짜 포맷팅, 문자열 처리, 수학 함수 등

public: 정적 파일
서비스 워커, 매니페스트, 파비콘, 아이콘 등
<br/><br/>

```js
전체적인 구조 패턴
이 구조는 주로 **기능 중심 아키텍처(Feature-oriented Architecture)**로 구성되어 있으며, 이는 대규모 프로젝트에서 기능별로 코드를 분리하여 유지보수성을 높이는 데 효과적입니다. 또한 아토믹 디자인 시스템(Atomic Design System) 원칙을 UI 컴포넌트에 적용하고 있는 것으로 보입니다.
이러한 구조는 확장성이 좋고, 새로운 개발자가 프로젝트에 쉽게 적응할 수 있으며, 기능별로 분리되어 있어 코드의 응집도를 높이고 결합도를 낮추는 데 도움이 됩니다.
```
