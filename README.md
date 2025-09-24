# SignGPT - 수어 인식 및 번역 플랫폼

SignGPT는 실시간 수어 인식과 자연어 처리를 결합한 차세대 수어 번역 플랫폼입니다. MediaPipe Holistic과 OpenVINO 모델을 활용하여 한국 수어(KSL)를 인식하고, AI 채팅 시스템과 통합하여 원활한 소통을 지원합니다.

## 주요 기능

### 🤖 통합 수어 인식 시스템

- **실시간 WebSocket 기반 인식**: signgpt-front 프로젝트의 서버 기반 실시간 인식 시스템 통합
- **OpenVINO 클라이언트 사이드 인식**: 로컬 환경에서 빠른 수어 인식 처리
- **하이브리드 모드**: 네트워크 상태에 따라 최적의 인식 방식 자동 선택

### 💬 AI 채팅 통합

- **수어-텍스트 자동 변환**: 인식된 수어를 채팅 메시지로 자동 변환
- **LLM 기반 자연어 처리**: 인식된 단어들을 자연스러운 문장으로 재구성
- **실시간 응답**: SignGPT Crew 서버와 연동한 즉시 응답

### 🎥 고급 비전 처리

- **MediaPipe Holistic**: 얼굴, 포즈, 양손 랜드마크 동시 추적
- **실시간 카메라 피드**: 웹캠을 통한 실시간 수어 입력
- **시각적 피드백**: 인식 상태와 키포인트 시각화

### 🌐 다국어 지원

- **한국 수어(KSL)** 기본 지원
- **다국어 UI**: i18n을 통한 다국어 인터페이스
- **확장 가능한 언어 모델**: 추가 수어 언어 지원 준비

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **수어 인식**: MediaPipe Holistic, OpenVINO
- **실시간 통신**: WebSocket
- **AI 처리**: SignGPT Crew API
- **상태 관리**: React Context API
- **국제화**: react-i18next

## 시작하기

### 필수 요구사항

- Node.js 18+
- 웹캠 (수어 인식용)
- 최신 웹 브라우저 (Chrome/Edge 권장)

### 설치 및 실행

1. 의존성 설치:

```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

2. 개발 서버 실행:

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

3. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 환경 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# SignGPT API 서버 URL
NEXT_PUBLIC_SIGNGPT_CLIENT_URL=your_signgpt_server_url_here

# WebSocket 서버 URL (선택사항)
NEXT_PUBLIC_WEBSOCKET_URL=your_websocket_server_url_here
```

> **보안 주의사항**: 실제 서버 URL은 `.env.local` 파일에 설정하세요. 이 파일은 Git에 커밋되지 않습니다.

## 사용법

### 1. 채팅 페이지

메인 채팅 페이지에서는 두 가지 UI 모드를 제공합니다:

- **Original**: 기본 채팅 인터페이스 + 통합 수어 인식 패널
- **Enhanced**: 고급 기능이 포함된 향상된 인터페이스

### 2. 수어 인식 사용하기

#### 실시간 수어 인식 세션

1. 채팅 페이지 우측의 "수어 인식" 패널 확인
2. WebSocket 연결 상태 확인 (녹색 점: 연결됨)
3. "수어 인식 시작" 버튼 클릭
4. 카메라 앞에서 얼굴과 양손이 보이도록 수어 동작 수행
5. 2초마다 자동으로 키포인트가 서버로 전송되어 인식 처리
6. 인식된 결과가 자동으로 채팅 메시지로 추가됨

#### 하이브리드 인식 모드

- **WebSocket 연결됨**: 서버 기반 실시간 인식 사용
- **WebSocket 연결 안됨**: 로컬 OpenVINO 모델 사용
- 네트워크 상태에 따라 자동으로 최적의 방식 선택

### 3. 지원하는 수어 단어

현재 한국 수어 기본 단어들을 지원합니다:

- 안녕하세요
- 서울
- 부산
- 거리
- 무엇
- 너

### 4. AI 채팅 기능

- 수어로 인식된 텍스트는 자동으로 채팅 입력으로 변환
- SignGPT AI가 자연스러운 한국어로 응답
- 응답은 다시 수어로 변환되어 시각적으로 표시 가능

## 프로젝트 구조

```
src/
├── app/                     # Next.js App Router
├── components/
│   ├── layout/             # 레이아웃 컴포넌트
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── ChatPage.tsx    # 메인 채팅 페이지 (통합 수어 인식)
│   │   └── EnhancedChatPage.tsx
│   ├── pose/               # 수어 인식 관련 컴포넌트
│   │   ├── EnhancedHandTracker.tsx  # 통합 핸드 트래커
│   │   └── PoseViewer.tsx
│   ├── translate/          # 번역 관련 컴포넌트
│   └── ui/                 # UI 컴포넌트
├── services/
│   ├── IntegratedSignRecognitionService.ts  # 통합 수어 인식 서비스
│   ├── WebSocketSignRecognitionService.ts   # WebSocket 기반 인식
│   ├── OpenVinoSignRecognitionService.ts    # OpenVINO 기반 인식
│   └── SignRecognitionService.ts            # 기존 인식 서비스
├── contexts/               # React Context
└── locales/               # 다국어 지원
```

## 통합된 기능들

### signgpt-front 프로젝트 통합

이 프로젝트는 signgpt-front의 실시간 WebSocket 기반 수어 인식 시스템을 성공적으로 통합했습니다:

1. **실시간 키포인트 수집**: MediaPipe Holistic을 사용한 정확한 손동작 추적
2. **WebSocket 통신**: 서버와의 실시간 데이터 교환
3. **자동 인식 세션**: 2초 간격으로 자동 키포인트 수집 및 인식
4. **세션 관리**: 시작/종료가 명확한 인식 세션 관리
5. **인식 히스토리**: 세션 중 인식된 모든 결과 추적

### 기존 시스템과의 호환성

- 기존 OpenVINO 기반 인식 시스템 유지
- LLM 기반 자연어 처리 기능 보존
- 채팅 시스템과의 완벽한 통합
- 수어-텍스트 번역 기능 지속 지원

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
