#!/usr/bin/env python3
"""
교환일기 테이블에 next_topic과 whisper_message 컬럼 추가
"""
import sqlite3
import os

def migrate_local():
    """로컬 데이터베이스 마이그레이션"""
    db_path = 'drama_chat.db'
    
    if not os.path.exists(db_path):
        print(f"❌ 데이터베이스 파일이 존재하지 않습니다: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 컬럼 존재 여부 확인
        cursor.execute("PRAGMA table_info(exchange_diaries)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print(f"현재 컬럼: {column_names}")
        
        # next_topic 컬럼 추가
        if 'next_topic' not in column_names:
            cursor.execute("ALTER TABLE exchange_diaries ADD COLUMN next_topic TEXT")
            print("✅ next_topic 컬럼 추가됨")
        else:
            print("ℹ️ next_topic 컬럼이 이미 존재합니다")
        
        # whisper_message 컬럼 추가
        if 'whisper_message' not in column_names:
            cursor.execute("ALTER TABLE exchange_diaries ADD COLUMN whisper_message TEXT")
            print("✅ whisper_message 컬럼 추가됨")
        else:
            print("ℹ️ whisper_message 컬럼이 이미 존재합니다")
        
        conn.commit()
        print("\n✅ 로컬 데이터베이스 마이그레이션 완료")
        
    except Exception as e:
        print(f"❌ 마이그레이션 오류: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("교환일기 테이블 컬럼 추가 마이그레이션")
    print("=" * 60)
    migrate_local()

