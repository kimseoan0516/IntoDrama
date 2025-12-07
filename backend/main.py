"""
IntoDrama Backend - 메인 애플리케이션
FastAPI 앱 설정 및 라우터 등록
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pathlib import Path

from config import CORS_ORIGINS, ORIGIN_REGEX
from database import Base, engine

# 라우터 import
from auth import router as auth_router
from chat import router as chat_router
from diary import router as diary_router
from features import router as features_router

# ===========================================
# FastAPI 앱 생성
# ===========================================

app = FastAPI(
    title="IntoDrama API",
    description="드라마 캐릭터와 대화하는 AI 챗봇 서비스",
    version="1.0.0"
)

# ===========================================
# CORS 설정
# ===========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================
# 데이터베이스 테이블 생성
# ===========================================

# 앱 시작 시 테이블 생성
Base.metadata.create_all(bind=engine)

# ===========================================
# 라우터 등록
# ===========================================

# 인증 라우터
app.include_router(auth_router)

# 채팅 라우터
app.include_router(chat_router)

# 일기 라우터
app.include_router(diary_router)

# 기타 기능 라우터
app.include_router(features_router)

# ===========================================
# 서버 시작 이벤트
# ===========================================

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 캐릭터 성향 데이터 초기화"""
    from database import get_db
    from features import initialize_archetype_cache
    
    db = next(get_db())
    try:
        initialize_archetype_cache(db)
    finally:
        db.close()

# ===========================================
# 루트 엔드포인트
# ===========================================

@app.get("/")
def read_root():
    """API 루트 엔드포인트"""
    return {
        "message": "IntoDrama API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}


@app.get("/favicon.ico")
async def favicon():
    """프로젝트 root 디렉토리의 favicon.ico 파일을 반환합니다."""
    # 프로젝트 root 디렉토리 경로 (backend/main.py의 상위 디렉토리)
    project_root = Path(__file__).parent.parent
    favicon_path = project_root / "favicon.ico"
    
    if favicon_path.exists() and favicon_path.is_file():
        return FileResponse(str(favicon_path))
    
    # favicon.ico가 없으면 204 No Content 반환 (브라우저 오류 방지)
    return Response(status_code=204)


# ===========================================
# 서버 실행
# ===========================================

if __name__ == "__main__":
    # host="0.0.0.0"으로 설정하여 모든 네트워크 인터페이스에서 접근 가능하도록 함
    # 모바일 기기에서 접근하려면 이 설정이 필요합니다
    uvicorn.run(app, host="0.0.0.0", port=8000)
