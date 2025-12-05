#!/usr/bin/env python3
"""
프로덕션 데이터베이스에 교환일기 컬럼 추가
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# .env 파일 로드
load_dotenv()

def migrate_production():
    """프로덕션 데이터베이스 마이그레이션"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다")
        return
    
    print(f"📊 데이터베이스 URL: {database_url[:50]}...")
    
    # 엔진 생성
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # 컬럼 존재 여부 확인 (PostgreSQL용)
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'exchange_diaries'
            """))
            
            columns = [row[0] for row in result]
            print(f"현재 컬럼: {columns}")
            
            # next_topic 컬럼 추가
            if 'next_topic' not in columns:
                conn.execute(text("ALTER TABLE exchange_diaries ADD COLUMN next_topic TEXT"))
                conn.commit()
                print("✅ next_topic 컬럼 추가됨")
            else:
                print("ℹ️ next_topic 컬럼이 이미 존재합니다")
            
            # whisper_message 컬럼 추가
            if 'whisper_message' not in columns:
                conn.execute(text("ALTER TABLE exchange_diaries ADD COLUMN whisper_message TEXT"))
                conn.commit()
                print("✅ whisper_message 컬럼 추가됨")
            else:
                print("ℹ️ whisper_message 컬럼이 이미 존재합니다")
            
        print("\n✅ 프로덕션 데이터베이스 마이그레이션 완료")
        
    except Exception as e:
        print(f"❌ 마이그레이션 오류: {e}")
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("=" * 60)
    print("프로덕션 교환일기 테이블 컬럼 추가 마이그레이션")
    print("=" * 60)
    migrate_production()

