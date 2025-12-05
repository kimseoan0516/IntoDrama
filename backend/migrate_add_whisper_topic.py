"""
데이터베이스 마이그레이션 스크립트: ExchangeDiary 테이블에 whisper_message, next_topic 컬럼 추가
"""
import sqlite3
import os
from pathlib import Path

# 데이터베이스 파일 경로
DB_PATH = Path(__file__).parent / "database.db"

def migrate():
    """마이그레이션 실행"""
    if not DB_PATH.exists():
        print(f"❌ 데이터베이스 파일을 찾을 수 없습니다: {DB_PATH}")
        return
    
    print(f"📦 데이터베이스 연결 중: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 1. whisper_message 컬럼 추가
        print("➕ whisper_message 컬럼 추가 중...")
        try:
            cursor.execute("ALTER TABLE exchange_diaries ADD COLUMN whisper_message TEXT")
            print("✅ whisper_message 컬럼 추가 완료")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("⚠️  whisper_message 컬럼이 이미 존재합니다.")
            else:
                raise
        
        # 2. next_topic 컬럼 추가
        print("➕ next_topic 컬럼 추가 중...")
        try:
            cursor.execute("ALTER TABLE exchange_diaries ADD COLUMN next_topic TEXT")
            print("✅ next_topic 컬럼 추가 완료")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("⚠️  next_topic 컬럼이 이미 존재합니다.")
            else:
                raise
        
        # 변경사항 커밋
        conn.commit()
        print("✅ 마이그레이션 완료!")
        
    except Exception as e:
        print(f"❌ 마이그레이션 실패: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 데이터베이스 마이그레이션 시작")
    print("=" * 50)
    migrate()
    print("=" * 50)
    print("✨ 마이그레이션 작업 완료")

