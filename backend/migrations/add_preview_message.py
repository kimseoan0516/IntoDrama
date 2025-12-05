"""
교환일기 테이블에 preview_message 컬럼 추가

실행 방법:
python -m migrations.add_preview_message
"""

import sqlite3
import os

def migrate():
    # 데이터베이스 파일 경로
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    
    # 가능한 데이터베이스 파일 이름들
    possible_db_names = ['drama_chat.db', 'intodrama.db', 'app.db']
    db_path = None
    
    for db_name in possible_db_names:
        temp_path = os.path.join(backend_dir, db_name)
        if os.path.exists(temp_path):
            db_path = temp_path
            print(f"데이터베이스 파일을 찾았습니다: {db_path}")
            break
    
    if not os.path.exists(db_path):
        print(f"데이터베이스 파일을 찾을 수 없습니다: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # preview_message 컬럼이 이미 존재하는지 확인
        cursor.execute("PRAGMA table_info(exchange_diaries)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'preview_message' in columns:
            print("preview_message 컬럼이 이미 존재합니다.")
        else:
            # preview_message 컬럼 추가
            cursor.execute("""
                ALTER TABLE exchange_diaries 
                ADD COLUMN preview_message TEXT
            """)
            conn.commit()
            print("✅ preview_message 컬럼이 성공적으로 추가되었습니다.")
        
    except Exception as e:
        print(f"❌ 마이그레이션 실패: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

