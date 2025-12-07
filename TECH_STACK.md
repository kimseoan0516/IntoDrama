# 기술 스택

## 1. 백엔드 (Backend)

### 웹 프레임워크
- **FastAPI** (v0.121.1): 고성능 비동기 웹 프레임워크
- **Uvicorn** (v0.38.0): ASGI 서버

### 데이터베이스
- **SQLAlchemy** (v2.0.36): Python ORM (Object-Relational Mapping)
- **SQLite**: 경량 관계형 데이터베이스 (기본)
- **PostgreSQL**: 프로덕션 환경 지원 (선택사항)

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

### 스케줄링
- **APScheduler** (v3.10.4): 백그라운드 작업 스케줄링
  - 교환일기 답장 예약 발송
  - 한국 시간대(KST) 지원
- **pytz** (v2024.1): 시간대 처리

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
- **html2canvas** (v1.4.1): HTML 요소를 Canvas 이미지로 변환
  - 대화 캡처 기능
  - 명대사 이미지 저장
  - 일기 이미지 저장
  - 리포트 이미지 생성

### 데이터 시각화
- **Recharts** (v3.5.1): React 차트 라이브러리
  - 주간 통계 차트
  - 주간 리캡 시각화
  - 심리 리포트 차트

### 브라우저 API
- **Web Speech API**: 음성 인식 기능
  - 음성으로 메시지 입력
  - 실시간 음성 인식
- **Web Audio API**: 음성 감정 분석
  - 음성 톤 분석
  - 감정 감지 (기쁨, 슬픔, 화남, 중립)
  - 실시간 감정 표시

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
  - 비밀번호 재설정 기능 지원

### 데이터 저장
- **로컬 스토리지**: 클라이언트 측 데이터 저장
  - 인증 토큰
  - 채팅 히스토리 (임시)
  - 사용자 설정
- **SQLite 데이터베이스**: 서버 측 데이터 영구 저장
  - 사용자 정보
  - 채팅 히스토리
  - 캐릭터 기억
  - 감정 일기
  - 교환일기
  - 캐릭터 성향 데이터
  - 저장된 대사

## 5. 주요 기능별 기술

### AI 챗봇
- **Google Gemini AI API** (`gemini-2.5-flash` 모델)
  - 1:1 대화
  - 멀티채팅 (최대 2명의 캐릭터 동시 대화)
  - 토론 모드 (2명의 캐릭터 토론)
  - 캐릭터 페르소나 기반 응답 생성
  - 대화 히스토리 최적화 (토큰 제한 관리)
  - 캐릭터 기억 시스템
  - 감정 분석
  - 심리 리포트 생성
  - 일기 자동 생성

### 실시간 통신
- **HTTP/HTTPS 프로토콜**
- **CORS (Cross-Origin Resource Sharing)**: 개발 및 프로덕션 환경 origin 허용
- **비동기 처리**: async/await 패턴

### 데이터 처리
- **JSON 데이터 형식**: API 요청/응답
- **비동기 처리**: async/await 패턴
- **에러 핸들링**: 재시도 로직 및 예외 처리

### UI/UX 기능
- **실시간 타이핑 효과**: 메시지 스트리밍
- **자동 스크롤**: 새 메시지 수신 시
- **메시지 캡처**: html2canvas를 이용한 대화 스크린샷
- **이미지 저장**: 명대사, 일기, 리포트 이미지 저장
- **반응형 디자인**: 다양한 화면 크기 지원
- **감정 기반 UI 변화**: 실시간 감정 감지에 따른 배경색 및 스타일 변경
- **음성 입력**: Web Speech API를 활용한 음성 메시지 입력
- **음성 감정 분석**: Web Audio API를 활용한 실시간 감정 감지

## 6. 데이터베이스 스키마

### 주요 테이블

#### Users (사용자)
- `id`: 사용자 ID (Primary Key)
- `username`: 사용자명 (Unique)
- `email`: 이메일 (Unique)
- `hashed_password`: 해시된 비밀번호
- `nickname`: 닉네임
- `profile_pic`: 프로필 사진 URL
- `created_at`: 생성 시간

#### ChatHistory (대화 기록)
- `id`: 대화 ID (Primary Key)
- `user_id`: 사용자 ID (Foreign Key)
- `title`: 대화 제목
- `character_ids`: 캐릭터 ID 목록 (JSON)
- `messages`: 메시지 목록 (JSON)
- `is_manual`: 수동 저장 여부 (0: 자동, 1: 수동)
- `is_manual_quote`: 대사 저장으로 인한 저장 여부 (0: 일반, 1: 대사 저장)
- `quote_message_id`: 저장된 대사 메시지 ID
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

#### CharacterMemory (캐릭터 기억)
- `id`: 기억 ID (Primary Key)
- `user_id`: 사용자 ID (Foreign Key)
- `character_id`: 캐릭터 ID
- `memory_type`: 기억 타입 (emotion, event, preference, relationship)
- `content`: 기억 내용
- `context`: 기억의 맥락 (JSON)
- `importance`: 중요도 (1-10)
- `created_at`: 생성 시간
- `last_referenced`: 마지막 참조 시간

#### EmotionDiary (감정 일기)
- `id`: 일기 ID (Primary Key)
- `user_id`: 사용자 ID (Foreign Key)
- `diary_date`: 일기 날짜
- `title`: 일기 제목
- `content`: 일기 내용
- `summary`: 요약
- `emotions`: 감정 분석 결과 (JSON)
- `weather`: 날씨 정보
- `created_at`: 생성 시간

#### ExchangeDiary (교환일기)
- `id`: 교환일기 ID (Primary Key)
- `user_id`: 사용자 ID (Foreign Key)
- `character_id`: 캐릭터 ID
- `diary_id`: 원본 일기 ID (Foreign Key, 선택사항)
- `content`: 편지 내용
- `reply_content`: 답장 내용
- `preview_message`: 답장 미리보기 멘트
- `reply_received`: 답장 수신 여부
- `reply_read`: 답장 읽음 여부
- `reacted`: 리액션 여부
- `scheduled_time`: 답장 예약 시간
- `reply_created_at`: 답장 생성 시간
- `next_topic`: AI가 생성한 내일의 일기 주제
- `whisper_message`: 속삭임 메시지
- `topic_used`: 제안된 주제 사용 여부
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

#### CharacterArchetype (캐릭터 성향)
- `id`: 성향 ID (Primary Key)
- `character_id`: 캐릭터 ID (Unique)
- `name`: 캐릭터 이름
- `warmth`: 따뜻함 점수 (0.0-1.0)
- `realism`: 현실성 점수 (0.0-1.0)
- `order_chaos`: 질서/혼돈 점수 (-1.0 ~ 1.0)
- `good_evil`: 선/악 점수 (-1.0 ~ 1.0)
- `updated_at`: 수정 시간

## 7. API 엔드포인트 구조

### 인증 (`/auth`)
- `POST /auth/register`: 회원가입
- `POST /auth/login`: 로그인
- `GET /auth/me`: 현재 사용자 정보 조회
- `PUT /auth/profile`: 프로필 수정 (닉네임, 프로필 사진)
- `POST /auth/password-reset-request`: 비밀번호 재설정 요청
- `POST /auth/password-reset`: 비밀번호 재설정

### 채팅 (`/chat`)
- `POST /chat`: AI 채팅 요청 (1:1, 멀티채팅)
- `POST /chat/save`: 대화 저장
- `GET /chat/histories`: 저장된 대화 목록 조회 (is_manual=1)
- `GET /chat/histories/all`: 전체 대화 목록 조회 (대화 흐름 추적용)
- `DELETE /chat/histories/{chat_id}`: 대화 삭제
- `GET /chat/quotes`: 저장된 대사 목록 조회
- `PUT /chat/quotes/{quote_id}`: 저장된 대사 수정
- `DELETE /chat/quotes/{quote_id}`: 저장된 대사 삭제
- `POST /chat/summarize`: 대화 요약 생성
- `POST /chat/convert-to-novel`: 대화를 소설 형식으로 변환
- `POST /chat/activity-comment`: 활동 코멘트 생성
- `POST /chat/bgm-comment`: BGM 코멘트 생성

### 토론 (`/chat/debate`)
- `POST /chat/debate`: 토론 시작/진행
- `POST /chat/debate/summary`: 토론 요약 생성
- `POST /chat/debate/comments`: 토론 감상평 생성
- `POST /chat/debate/final-statements`: 토론 최종 발언 생성

### 통계 (`/chat/stats`)
- `GET /chat/stats/weekly`: 주간 통계 조회
- `GET /chat/stats/weekly-history`: 주간 대화 히스토리 통계
- `GET /chat/stats/week-detail`: 주간 상세 통계 조회

### 일기 (`/diary`)
- `POST /diary/generate`: AI 일기 생성 (대화 기반 또는 키워드 기반)
- `POST /diary/create`: 일기 저장
- `GET /diary/list`: 일기 목록 조회
- `GET /diary/{diary_id}`: 일기 상세 조회
- `DELETE /diary/{diary_id}`: 일기 삭제

### 교환일기 (`/exchange-diary`)
- `POST /exchange-diary/create`: 교환일기 생성
- `GET /exchange-diary/list`: 교환일기 목록 조회
- `GET /exchange-diary/{diary_id}`: 교환일기 조회
- `GET /exchange-diary/{diary_id}/reply`: 교환일기 답장 조회
- `POST /exchange-diary/{diary_id}/react`: 답장에 반응하기
- `DELETE /exchange-diary/{diary_id}`: 교환일기 삭제
- `GET /exchange-diary/today-topic`: 오늘의 주제 조회

### 기타 기능 (`/features`)
- `GET /archetype/map`: 성향 지도 조회
- `POST /archetype/map`: 성향 지도 업데이트
- `POST /music/recommend`: 음악 추천 (감정 기반)
- `GET /music/playlist`: 음악 플레이리스트 조회
- `POST /music/character-recommend`: 캐릭터 음악 추천
- `POST /psychology/report`: 심리 리포트 생성
- `GET /favicon.ico`: 파비콘

## 8. 배포 환경

### 서버
- **개발 환경**: localhost (127.0.0.1)
- **백엔드 포트**: 8000
- **프론트엔드 포트**: 3000
- **프로덕션 환경**: Hugging Face Spaces 지원

### 운영 체제
- **Windows 10/11** (개발 환경)
- **Linux** (프로덕션 환경)

### 환경 변수
- **백엔드**:
  - `GOOGLE_API_KEY`: Google Gemini API 키 (필수)
  - `SECRET_KEY`: JWT 토큰 암호화 키 (기본값: "your-secret-key-change-in-production")
  - `WEATHER_API_KEY`: OpenWeatherMap API 키 (선택, 일기 날씨 기능용)
  - `DATABASE_URL`: 데이터베이스 URL (기본값: sqlite:///./drama_chat.db)
- **프론트엔드**:
  - `REACT_APP_API_URL`: 백엔드 API 주소 (기본값: http://localhost:8000)

## 9. 주요 컴포넌트 구조

### 프론트엔드 컴포넌트
- **App.js**: 메인 애플리케이션 컴포넌트
- **CharacterSelectScreen.js**: 캐릭터 선택 화면
- **ScreenComponents.js**: 
  - `HistoryScreen`: 대화 보관함
  - `StatsScreen`: 대화 통계
  - `ReportScreen`: 심리 리포트
- **MyPageScreen.js**: 마이페이지 (프로필 설정)
- **ModalComponents.js**:
  - `DiaryModal`: 일기 모달
  - `ArchetypeMapModal`: 성향 지도 모달
  - `AuthModal`: 인증 모달
- **ExchangeDiaryScreen.js**: 교환일기 화면
- **WeeklyRecapScreen.js**: 주간 리캡 화면
- **WeeklyDetailScreen.js**: 주간 상세 화면
- **DebateModal.js**: 토론 모달
- **ReportComponents.js**: 리포트 관련 컴포넌트
- **CommonComponents.js**: 공통 컴포넌트
  - `TypingText`: 타이핑 효과 컴포넌트
  - `SettingsScreen`: 설정 화면
  - `TemplateScreen`: 템플릿 화면

### 백엔드 모듈
- **main.py**: FastAPI 애플리케이션 메인 파일
- **database.py**: 데이터베이스 모델 및 세션 관리
- **config.py**: 설정 파일 (API 키, CORS 등)
- **personas.py**: 캐릭터 페르소나 데이터
- **auth.py**: 인증 라우터
- **chat.py**: 채팅 라우터
- **diary.py**: 일기 라우터
- **features.py**: 기타 기능 라우터
- **ai_service.py**: AI 서비스 모듈

## 10. 특수 기능 구현

### 한국어 조사 처리
- **koreanJosa.js**: 받침 유무에 따른 조사 자동 선택 ('와/과', '이/가', '을/를', '은/는' 등)

### 캐릭터 기억 시스템
- 캐릭터가 사용자와의 대화를 기억하고 다음 대화에 반영
- 데이터베이스에 저장되어 영구적으로 유지
- 중요도 기반 기억 관리
- 기억 타입별 분류 (감정, 이벤트, 선호도, 관계)

### 대화 히스토리 최적화
- 토큰 제한을 고려한 대화 히스토리 압축
- 최근 대화 우선 유지
- 중요한 기억 우선 참조

### 토론 모드
- 2명의 캐릭터가 주제에 대해 토론
- 사용자 개입 가능 (라운드 3 이상)
- 토론 요약 및 감상평 생성
- 토론 히스토리는 페르소나에 영향 없음

### 교환일기 시스템
- 일기 작성 후 캐릭터에게 보내기
- AI가 캐릭터 페르소나에 맞게 답장 생성
- 답장 예약 발송 기능
- 오늘의 주제 제안

### 심리 리포트
- AI 기반 대화 내용 분석
- 감정 상태 분석 (로맨스, 위로, 갈등 점수)
- 키워드 및 말투 분석
- 리포트 이미지 생성

### 음악 추천
- 감정 기반 음악 추천
- 캐릭터 음악 추천
- 다양한 감정별 플레이리스트

### 성향 지도
- AI 기반 캐릭터 성향 분석
- 2D 좌표계 시각화
- 사용자 대화 기록 기반 실시간 보정

---

## 요약

본 프로젝트는 **Python FastAPI**를 백엔드로, **React 19**를 프론트엔드로 사용하는 풀스택 웹 애플리케이션입니다. Google Gemini AI를 활용한 대화형 챗봇 기능을 제공하며, JWT 기반 인증과 SQLite 데이터베이스를 통한 사용자 데이터 관리를 구현했습니다. 

드라마 캐릭터와의 1:1 대화, 멀티채팅, 토론 모드, 감정 일기, 교환일기, 캐릭터 성향 지도, 심리 리포트, 음악 추천, 주간 통계 및 리캡 등 다양한 기능을 제공합니다. 

주요 기술적 특징으로는 실시간 타이핑 효과, 음성 입력 및 감정 분석, 감정 기반 UI 변화, 이미지 저장 기능, APScheduler를 활용한 예약 작업 등이 있습니다.
