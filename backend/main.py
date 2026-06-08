"""
IntoDrama Backend - 메인 애플리케이션
FastAPI 앱 설정 및 라우터 등록
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
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

Base.metadata.create_all(bind=engine)

# ===========================================
# 라우터 등록
# ===========================================

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(diary_router)
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
# 정적 파일 & 아이콘 엔드포인트
# ===========================================

PROJECT_ROOT = Path(__file__).parent.parent
BUILD_DIR = PROJECT_ROOT / "frontend" / "build"
PUBLIC_DIR = PROJECT_ROOT / "frontend" / "public"


@app.get("/favicon.ico")
async def favicon():
    for path in [PROJECT_ROOT / "favicon.ico", PUBLIC_DIR / "favicon.ico"]:
        if path.exists():
            return FileResponse(str(path))
    return Response(status_code=204)


@app.get("/logo192.png")
async def logo192():
    for path in [PUBLIC_DIR / "logo192.png", BUILD_DIR / "logo192.png"]:
        if path.exists():
            resp = FileResponse(str(path), media_type="image/png")
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            return resp
    return Response(status_code=204)


@app.get("/logo512.png")
async def logo512():
    for path in [PUBLIC_DIR / "logo512.png", BUILD_DIR / "logo512.png"]:
        if path.exists():
            resp = FileResponse(str(path), media_type="image/png")
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            return resp
    return Response(status_code=204)


@app.get("/manifest.json")
async def manifest():
    for path in [BUILD_DIR / "manifest.json", PUBLIC_DIR / "manifest.json"]:
        if path.exists():
            return FileResponse(str(path), media_type="application/json")
    return Response(status_code=204)


# ===========================================
# 프론트엔드 정적 파일 서빙 (빌드된 React 앱)
# ===========================================

if BUILD_DIR.exists():
    # /static 경로로 JS/CSS 번들 서빙
    app.mount("/static", StaticFiles(directory=str(BUILD_DIR / "static")), name="static")

    @app.get("/health")
    def health_check():
        return {"status": "healthy"}

    # React Router를 위한 catch-all: 모든 미지정 경로는 index.html 반환
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index = BUILD_DIR / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return Response(status_code=404)
else:
    @app.get("/")
    def read_root():
        return {"message": "IntoDrama API", "version": "1.0.0", "status": "running"}

    @app.get("/health")
    def health_check():
        return {"status": "healthy"}


# ===========================================
# 서버 실행
# ===========================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
