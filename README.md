# OhMyHotel Sales CRM

Global Sales & Marketing CRM for OhMyHotel — Sales channel management, Activity tracking, Critical 6 daily tasks, and auto-generated Weekly Sales Brief.

**Live**: https://bstars00-rgb.github.io/Sales-CRM/

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8 + TailwindCSS 4
- **Routing**: react-router 7 (HashRouter — GitHub Pages 호환)
- **Charts**: Recharts
- **Icons**: lucide-react
- **Toast**: Sonner

## Core Features

- **Critical 6**: HubSpot 스타일 일일 최우선 6개 작업 등록
- **Activity Timeline**: 채널별 모든 접점(이메일/콜/미팅/계약) 시간순
- **Daily Briefing**: 퇴근 전 자동 집계 + 5일치 → Weekly Sales Brief 자동 생성
- **KPI Cascade**: 전사 → 권역 → 채널 → 팀원 → 월별 5단계 자동 배분
- **Pipeline 5단계**: Contact → NDA → InDev → Testing → Live + SLA 모니터링
- **Ctrip / China 의존도**: ≤35% / ≤65% CEO OKR 자동 추적
- **다국어**: KR / EN / VI
- **다크/라이트 테마**

## 로컬 개발

```bash
npm install
npm run dev
```

## 빌드 (로컬 검증)

```bash
npm run build
npm run preview
```

## GitHub Pages 자동 배포

`main` 브랜치에 push 시 GitHub Actions가 자동으로 빌드 + 배포합니다.

**배포 흐름**: push → `.github/workflows/deploy.yml` → npm ci → npm run build → upload-pages-artifact → deploy-pages

### GitHub 저장소 초기 설정 (1회)

1. GitHub 저장소 생성: https://github.com/bstars00-rgb/Sales-CRM
2. Settings → Pages → Source: **GitHub Actions** 선택
3. 로컬에서 git init + remote 추가:

```bash
cd prototypes/sales-dashboard
git init
git add .
git commit -m "Initial commit: Sales CRM prototype"
git branch -M main
git remote add origin https://github.com/bstars00-rgb/Sales-CRM.git
git push -u origin main
```

push 후 GitHub Actions 탭에서 deploy 진행 상황 확인.

## 수동 배포 (gh-pages CLI 방식, 옵션)

GitHub Actions 대신 로컬에서 수동 배포하려면:

```bash
npm install   # gh-pages, cross-env devDependency 설치
npm run deploy
```

→ `gh-pages` 브랜치에 dist 업로드. Settings → Pages → Source: **Deploy from a branch** → `gh-pages` / `/(root)` 선택.

## 디렉토리 구조

```
src/
├── App.tsx              # HashRouter + Routes
├── pages/               # 11개 페이지 (Daily Briefing, Overview, Performance, CRM, ...)
├── components/
│   ├── layout/          # MainLayout, Sidebar, Header
│   ├── ui/              # 공통 UI 컴포넌트
│   ├── crm/             # ChannelCard, ClientDetailModal
│   ├── daily-briefing/  # Critical6 입력
│   ├── overview/        # KPI 카드, 차트
│   └── performance/     # KPI Cascade
├── contexts/            # AuthContext, FilterContext
├── hooks/
├── i18n/                # KR/EN/VI 번역
├── lib/
├── mocks/               # 30+ 채널 시드 데이터
├── services/            # API 클라이언트
├── types/               # TypeScript 타입 정의
└── utils/
```

## 배포 설정 핵심 파일

- `vite.config.ts` — `base: '/Sales-CRM/'` (production)
- `.github/workflows/deploy.yml` — 자동 배포 워크플로우
- `public/.nojekyll` — Jekyll 처리 비활성 (필수)
- `public/404.html` — SPA fallback (HashRouter 안전장치)

## 스펙 문서

전체 기능 스펙은 상위 디렉토리 참조:
- `../../docs/specs/sales-crm/ko/sales-crm-spec.md` (한국어)
- `../../docs/specs/sales-crm/en/` (English)
- `../../docs/specs/sales-crm/vi/` (Tiếng Việt)
