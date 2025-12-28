<br/>
<p align="center">
  <img src="./src/assets/images/Logo.png" alt="Notia Logo" width="120">
</p>

<p align="center">
  <strong>기억의 조각을 태그와 리마인더로 연결하세요.</strong>
  <br>
  마크다운으로 자유롭게 기록하고, 태그로 연동하며 일상 속 중요한 약속까지 알려주는<br>가장 가볍고 빠른 당신의 새로운 생산성 도구입니다.
</p>
<p align="center">
    <a href="https://notia.site"><strong>🔗 서비스 바로가기</strong></a>
</p>
<br/>

<div align="center">

[![Netlify Status](https://api.netlify.com/api/v1/badges/46a1398f-b909-402f-946a-4e54be53e9f2/deploy-status)](https://app.netlify.com/projects/wedontlikeamnesia/deploys)
![](https://img.shields.io/github/last-commit/qetqet910/Notia?style=flat&logo=git&logoColor=white&color=0080ff)
![](https://img.shields.io/github/languages/top/qetqet910/Notia?style=flat&color=0080ff)
![](https://img.shields.io/github/languages/count/qetqet910/Notia?style=flat&color=0080ff)

---
<br/>

![](https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black)
![](https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)
![](https://img.shields.io/badge/tailwindcss-06B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)
![](https://img.shields.io/badge/shadcnui-000000.svg?style=flat&logo=shadcnui&logoColor=white)

![](https://img.shields.io/badge/Supabase-3FCF8E.svg?style=flat&logo=Supabase&logoColor=white)
![](https://img.shields.io/badge/Tauri-24C8D8.svg?style=flat&logo=Tauri&logoColor=white)
![](https://img.shields.io/badge/Rust-000000.svg?style=flat&logo=Rust&logoColor=white)\
![](https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white)
![](https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white)
![](https://img.shields.io/badge/GitHub%20Actions-2088FF.svg?style=flat&logo=GitHub-Actions&logoColor=white)
![](https://img.shields.io/badge/Mermaid-FF3670.svg?style=flat&logo=Mermaid&logoColor=white)

</div>

## ✨ 핵심 기능

- **#태그 기반 노트 정리**: 모든 노트에 `#프로젝트`, `#아이디어` 등 자유로운 태그를 붙여 생각을 체계적으로 분류하고 연결합니다.

- **@간편 리마인더**: 노트 작성 중 `@모레 2시 10분 회의`, `1시간 밥.`처럼 약속을 기록하면, 해당 시간전에 정확히 알려주는 스마트 리마인더입니다.
- **마크다운 지원**: 표준 마크다운 문법과 Mermaid문법을 완벽하게 지원하여, 작성한 콘텐츠를 Obsidian, 블로그 등 다른 플랫폼으로 손쉽게 옮길 수 있습니다.
- **빠른 속도와 접근성**: 군 복무 경험에서 착안하여, 어떤 저사양 환경에서도 빠르고 가볍게 작동하도록 최적화되었습니다. 별도 설치 없이 웹에서 바로 사용 가능합니다.
- **실시간 동기화**: 모든 기기에서 작성한 내용이 한 계정에서 실시간으로 안전하게 동기화됩니다.
- **사용자 맞춤 플랫폼**: 사용자의 환경에 따라, 웹, 웹앱, 데스크탑 앱 등 알맞게 사용하세요.

<br>

## 📖 사용법

Notia의 핵심은 간단한 기호를 사용한 빠른 정리입니다.

- **태그 추가**: 노트 내용 어디에서든 `#` 기호 뒤에 원하는 단어를 입력하세요.

  > `오늘 회의 내용 정리 #업무 #회의록`

- **리마인더 설정**: `@` 기호 뒤에 시간을 쓰고, 마침표(`.`)로 문장을 끝내세요.

  > `내일 오후 3시에 클라이언트 미팅하기.` → `@내일 3시 클라이언트 미팅.`

  > `1시간 10분 뒤 회의 자료 확인하기.` → `@1시간 10분 회의 자료 확인하기.`

<br>

## 🛠️ 기술 스택

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **State Management**: Zustand
- **Backend & DB**: Supabase (PostgreSQL, Auth, Realtime)
- **Desktop App**: Tauri
- **Animation**: Framer Motion
- **Build Tool**: Vite
- **Package Manager**: npm

<br>

## 🧪 Development & Testing

Notia는 안정적인 코드 품질을 유지하기 위해 지속적으로 테스트를 수행합니다.

### Frontend (Web/Tauri UI)
프론트엔드 및 공통 유틸리티 로직은 **Vitest**를 사용하여 테스트합니다.
```bash
# 전체 테스트 실행
npm test

# 특정 파일 테스트
npx vitest src/utils/noteParser.test.ts
```

### Backend (Rust/Tauri)
데스크탑 앱의 핵심 성능 로직 및 시스템 통합 코드는 **Cargo**를 사용하여 테스트합니다.
```bash
# Rust 백엔드 테스트 실행
cd src-tauri
cargo test
```

<br>

#### 잡담

- 개선사항 매우 환영 [Contributing](./CONTRIBUTING.md) 
LICENSE [BSD-2-Clause license](./LICENSE)

<br>

## 🛡️ Security & Signing Policy

Notia는 사용자의 보안과 신뢰를 최우선으로 생각합니다. 본 프로젝트는 [SignPath Foundation](https://signpath.org/)의 지원을 받아 코드 서명을 진행할 예정이며, 다음과 같은 보안 정책을 준수합니다.

- **Automated Builds**: 모든 공식 릴리스 아티팩트는 [GitHub Actions](https://github.com/qetqet910/Notia/actions)를 통해 투명하게 빌드됩니다.
- **Code Signing**: 공식 배포 판은 SignPath Foundation의 인증서를 사용하여 서명됩니다. 이를 통해 사용자는 설치하려는 소프트웨어가 변조되지 않았음을 확인할 수 있습니다.
- **Identity Verification**: 프로젝트 관리자는 모든 소스 코드 변경 및 릴리스 프로세스에 대해 2단계 인증(2FA)을 사용합니다.
- **Vulnerability Reporting**: 보안 취약점을 발견하신 경우 GitHub Issues를 통해 제보해 주시면 신속히 대응하겠습니다.

<br>

## 🔒 Privacy Policy

Notia는 사용자의 개인정보를 최소한으로 수집하며, 다음과 같이 관리합니다.

- **Data Ownership**: 사용자가 작성한 모든 노트와 데이터는 [Supabase](https://supabase.com/)를 통해 안전하게 암호화되어 저장됩니다.
- **Collection**: 서비스 제공을 위해 필요한 이메일 주소(로그인용) 외에 불필요한 개인정보를 수집하지 않습니다.
- **Third-party**: 수집된 데이터는 제3자에게 판매하거나 제공되지 않습니다.
- **Local Storage**: 일부 설정값은 최적의 사용자 경험을 위해 브라우저 또는 앱의 로컬 스토리지에 저장될 수 있습니다.

  