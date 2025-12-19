"""
설정 및 상수 관리 모듈
API 키, 환경 설정, 전역 상수 등을 관리합니다.
"""

import os
from pathlib import Path
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# .env 파일 로드 (있는 경우)
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f".env 파일을 로드했습니다: {env_path}")
except ImportError:
    pass  # python-dotenv가 설치되지 않은 경우 무시

# 인증 설정
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30일

# CORS 설정
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://intodrama.vercel.app",  # Vercel 배포 주소
    "https://seoan0516-intodrama.hf.space",  # Hugging Face Spaces 배포 주소
]

# 배포 환경을 위한 정규식 패턴
VERCEL_REGEX = r"https://.*\.vercel\.app"
HF_SPACE_REGEX = r"https://.*\.hf\.space"
ORIGIN_REGEX = f"({VERCEL_REGEX}|{HF_SPACE_REGEX})"

# Export (다른 모듈에서 사용)
__all__ = [
    'SECRET_KEY', 'ALGORITHM', 'ACCESS_TOKEN_EXPIRE_MINUTES',
    'CORS_ORIGINS', 'ORIGIN_REGEX',
    'model', 'SAFETY_SETTINGS', 'CHARACTER_YEARS',
    'MAX_HISTORY_MESSAGES', 'MAX_LINES_PER_BUBBLE'
]

# API 키 설정
# 환경 변수에서 API 키 가져오기 (우선순위: 환경 변수 > .env 파일)
API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")

# Gemini AI 모델 초기화
model = None
if not API_KEY:
    print("⚠️ 경고: GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다.")
    print("⚠️ AI 응답 기능을 사용하려면 API 키를 설정해주세요.")
    print("⚠️ 설정 방법:")
    print("   1. .env 파일 생성: backend/.env 파일에 'GOOGLE_API_KEY=your-api-key' 추가")
    print("   2. 환경 변수 설정: $env:GOOGLE_API_KEY='your-api-key' (PowerShell)")
    print("   3. 또는: export GOOGLE_API_KEY='your-api-key' (Bash)")
else:
    try:
        API_KEY = API_KEY.strip()
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        print(">>> ✅ Google Gemini AI 모델(gemini-2.5-flash)이 성공적으로 로드되었습니다.")
        print(f">>> API 키 확인: {API_KEY[:10]}...{API_KEY[-4:] if len(API_KEY) > 14 else '***'}")
    except Exception as e:
        print(f"!!! 모델 로드 실패: {e}")
        print(f"!!! API 키 형식을 확인해주세요. (현재 길이: {len(API_KEY) if API_KEY else 0})")
        model = None

# 상수 정의
WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

# 캐릭터별 특정 년도 매핑
CHARACTER_YEARS = {
    'sseuregi': 1994,  # 응답하라 1994
    'eugene_choi': 1905,  # 미스터 션샤인 - 유진 초이
    'goo_dongmae': 1905,  # 미스터 션샤인 - 구동매
}

# 대화 히스토리 최적화 설정
MAX_HISTORY_MESSAGES = 30  # 최근 30개 메시지만 전송

# 메시지 분할 설정
MAX_LINES_PER_BUBBLE = 4  # 한 버블에 들어갈 최대 줄 수
