# 기술 스택

## 1. 백엔드 (Backend)

### 웹 프레임워크
- **FastAPI** (v0.121.1): 고성능 비동기 웹 프레임워크
- **Uvicorn** (v0.38.0): ASGI 서버

### 데이터베이스
- **SQLAlchemy** (v2.0.36): Python ORM (Object-Relational Mapping)
- **SQLite**: 경량 관계형 데이터베이스

### 인증 및 보안
- **python-jose[cryptography]** (v3.3.0): JWT 토큰 생성 및 검증
- **passlib[bcrypt]** (v1.7.4): 비밀번호 해싱
- **bcrypt**: 비밀번호 암호화 알고리즘

### 데이터 검증
- **Pydantic** (v2.12.4): 데이터 검증 및 설정 관리
- **email-validator** (v2.3.0): 이메일 주소 검증

### AI/머신러닝
- **google-generativeai** (v0.8.5): Google Gemini AI API 클라이언트
  - 모델: `gemini-2.5-flash`
  - 재시도 로직: `tenacity` 라이브러리 활용

### 유틸리티
- **tenacity** (v9.1.2): 재시도 로직 구현 (API 호출 실패 시 자동 재시도)
- **python-dotenv** (v1.0.0): 환경 변수 관리 (.env 파일 지원)
- **python-multipart** (v0.0.12): 파일 업로드 처리

### 개발 언어
- **Python** 3.12

## 2. 프론트엔드 (Frontend)

### 핵심 프레임워크
- **React** (v19.2.0): 사용자 인터페이스 구축을 위한 JavaScript 라이브러리
- **React DOM** (v19.2.0): React를 DOM에 렌더링
- **react-scripts** (v5.0.1): Create React App 빌드 도구

### UI/이미지 처리
- **html2canvas** (v1.4.1): HTML 요소를 Canvas 이미지로 변환 (대화 캡처 기능)

### 테스팅
- **@testing-library/react** (v16.3.0): React 컴포넌트 테스팅
- **@testing-library/jest-dom** (v6.9.1): Jest DOM 매처
- **@testing-library/user-event** (v13.5.0): 사용자 이벤트 시뮬레이션
- **@testing-library/dom** (v10.4.1): DOM 테스팅 유틸리티

### 성능 모니터링
- **web-vitals** (v2.1.4): 웹 성능 지표 측정

### 개발 언어
- **JavaScript (ES6+)**
- **JSX**: React 컴포넌트 작성
- **CSS3**: 스타일링

## 3. 개발 환경 및 도구

### 빌드 도구
- **Create React App (CRA)**: React 프로젝트 초기 설정 및 빌드
- **npm**: Node.js 패키지 관리자

### 코드 품질
- **ESLint**: JavaScript/React 코드 린팅

### 스크립트
- **PowerShell**: Windows 환경 스크립트 실행
  - `start_all.ps1`: 백엔드/프론트엔드 동시 실행

## 4. 아키텍처

### 아키텍처 패턴
- **풀스택 애플리케이션**: 백엔드와 프론트엔드 분리 구조
- **RESTful API**: REST 원칙을 따르는 API 설계
- **SPA (Single Page Application)**: 단일 페이지 애플리케이션

### 인증 방식
- **JWT (JSON Web Token)**: 토큰 기반 인증
  - 토큰 만료 시간: 30일
  - HTTP Bearer 토큰 방식

### 데이터 저장
- **로컬 스토리지**: 클라이언트 측 데이터 저장 (인증 토큰, 채팅 히스토리 등)
- **SQLite 데이터베이스**: 서버 측 데이터 영구 저장
  - 사용자 정보
  - 채팅 히스토리
  - 캐릭터 기억
  - 감정 일기
  - 선물 기록
  - 캐릭터 성향 데이터

## 5. 주요 기능별 기술

### AI 챗봇
- **Google Gemini AI API** (`gemini-2.5-flash` 모델)
  - 1:1 대화
  - 멀티채팅 (여러 캐릭터 동시 대화)
  - 토론 모드 (2명의 캐릭터 토론)
  - 캐릭터 페르소나 기반 응답 생성
  - 대화 히스토리 최적화 (토큰 제한 관리)

### 실시간 통신
- **HTTP/HTTPS 프로토콜**
- **CORS (Cross-Origin Resource Sharing)**: 개발 환경에서 모든 origin 허용
- **비동기 처리**: async/await 패턴

### 데이터 처리
- **JSON 데이터 형식**: API 요청/응답
- **비동기 처리**: async/await 패턴
- **에러 핸들링**: 재시도 로직 및 예외 처리

### UI/UX 기능
- **실시간 타이핑 효과**: 메시지 스트리밍
- **자동 스크롤**: 새 메시지 수신 시
- **메시지 캡처**: html2canvas를 이용한 대화 스크린샷
- **반응형 디자인**: 다양한 화면 크기 지원

## 6. 데이터베이스 스키마

### 주요 테이블
- **User**: 사용자 정보 (이메일, 닉네임, 프로필 사진 등)
- **ChatHistory**: 채팅 히스토리 (대화 내용, 캐릭터 ID, 저장 시간 등)
- **CharacterMemory**: 캐릭터 기억 시스템 (캐릭터가 사용자에 대해 기억하는 정보)
- **UserGift**: 사용자가 캐릭터에게 준 선물 기록
- **CharacterArchetype**: 캐릭터 성향 데이터
- **EmotionDiary**: 감정 일기 (날짜, 날씨, 내용 등)

## 7. API 엔드포인트 구조

### 인증
- `POST /auth/register`: 회원가입
- `POST /auth/login`: 로그인
- `GET /auth/me`: 현재 사용자 정보 조회
- `PUT /auth/profile`: 프로필 수정

### 채팅
- `POST /chat`: AI 채팅 요청
- `POST /chat/save`: 대화 저장
- `GET /chat/histories`: 저장된 대화 목록 조회
- `GET /chat/histories/all`: 전체 대화 목록 조회 (대화 흐름 추적용)
- `DELETE /chat/histories/{chat_id}`: 대화 삭제
- `GET /chat/quotes`: 저장된 대사 목록 조회
- `POST /chat/summarize`: 대화 요약 생성
- `POST /chat/convert-to-novel`: 대화를 소설 형식으로 변환

### 토론
- `POST /chat/debate`: 토론 시작
- `POST /chat/debate/summary`: 토론 요약 생성
- `POST /chat/debate/comments`: 토론 감상평 생성

### 통계
- `GET /chat/stats/weekly`: 주간 통계 조회
- `GET /chat/stats/weekly-history`: 주간 대화 히스토리 통계

### 일기
- `POST /diary/generate`: AI 일기 생성
- `POST /diary/create`: 일기 저장
- `GET /diary/list`: 일기 목록 조회
- `GET /diary/{diary_id}`: 일기 상세 조회
- `DELETE /diary/{diary_id}`: 일기 삭제

### 기타
- `GET /gifts/check`: 선물 확인
- `GET /archetype/map`: 성향 지도 조회

## 8. 배포 환경

### 서버
- **개발 환경**: localhost (127.0.0.1)
- **백엔드 포트**: 8000
- **프론트엔드 포트**: 3000

### 운영 체제
- **Windows 10/11**

### 환경 변수
- **백엔드**:
  - `GOOGLE_API_KEY`: Google Gemini API 키 (필수)
  - `SECRET_KEY`: JWT 토큰 암호화 키 (기본값: "your-secret-key-change-in-production")
  - `WEATHER_API_KEY`: OpenWeatherMap API 키 (선택, 일기 날씨 기능용)
- **프론트엔드**:
  - `REACT_APP_API_URL`: 백엔드 API 주소 (기본값: http://localhost:8000)

## 9. 주요 컴포넌트 구조

### 프론트엔드 컴포넌트
- **App.js**: 메인 애플리케이션 컴포넌트
- **CharacterSelectScreen.js**: 캐릭터 선택 화면
- **ScreenComponents.js**: 
  - `MyPageScreen`: 마이페이지
  - `HistoryScreen`: 대화 보관함
  - `StatsScreen`: 대화 통계
  - `ReportScreen`: 심리 리포트
- **ModalComponents.js**:
  - `GiftModal`: 선물 모달
  - `ArchetypeMapModal`: 성향 지도 모달
  - `DiaryModal`: 일기 모달
  - `AuthModal`: 인증 모달
- **WeeklyRecapScreen.js**: 주간 리캡 화면
- **DebateModal.js**: 토론 모달
- **CommonComponents.js**: 공통 컴포넌트 (TypingText, SettingsScreen, TemplateScreen)

### 백엔드 모듈
- **main.py**: FastAPI 애플리케이션 메인 파일
- **database.py**: 데이터베이스 모델 및 세션 관리
- **personas.py**: 캐릭터 페르소나 데이터

## 10. 특수 기능 구현

### 한국어 조사 처리
- **koreanJosa.js**: 받침 유무에 따른 조사 자동 선택 ('와/과', '이/가', '을/를' 등)

### 캐릭터 기억 시스템
- 캐릭터가 사용자와의 대화를 기억하고 다음 대화에 반영
- 데이터베이스에 저장되어 영구적으로 유지

### 대화 히스토리 최적화
- 토큰 제한을 고려한 대화 히스토리 압축
- 최근 대화 우선 유지

### 토론 모드
- 2명의 캐릭터가 주제에 대해 토론
- 사용자 개입 가능
- 토론 요약 및 감상평 생성

---

## 요약

본 프로젝트는 **Python FastAPI**를 백엔드로, **React 19**를 프론트엔드로 사용하는 풀스택 웹 애플리케이션입니다. Google Gemini AI를 활용한 대화형 챗봇 기능을 제공하며, JWT 기반 인증과 SQLite 데이터베이스를 통한 사용자 데이터 관리를 구현했습니다. 드라마 캐릭터와의 1:1 대화, 멀티채팅, 토론 모드, 감정 일기, 캐릭터 선물 시스템, 성향 지도 등 다양한 기능을 제공합니다.
