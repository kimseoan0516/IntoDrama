"""
프로덕션 데이터베이스에 preview_message 컬럼 추가
"""
from sqlalchemy import create_engine, text, inspect
import os
from pathlib import Path

# .env 파일 로드
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ .env 파일 로드: {env_path}")
except ImportError:
    print("⚠️  python-dotenv가 설치되지 않았습니다. 환경 변수를 직접 사용합니다.")

# 프로덕션 데이터베이스 URL (환경 변수에서 읽기)
DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    print("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.")
    exit(1)

def migrate():
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        # 현재 테이블의 컬럼 목록 가져오기
        columns = [col['name'] for col in inspector.get_columns('exchange_diaries')]
        
        if 'preview_message' not in columns:
            with engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE exchange_diaries 
                    ADD COLUMN IF NOT EXISTS preview_message TEXT
                """))
                conn.commit()
                print("✅ preview_message 컬럼을 성공적으로 추가했습니다.")
        else:
            print("ℹ️  preview_message 컬럼이 이미 존재합니다.")
                
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    migrate()

