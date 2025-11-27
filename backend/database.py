from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# 환경 변수에서 데이터베이스 URL 읽기 (없으면 기본값 사용)
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./drama_chat.db")

# SQLite인 경우 connect_args 추가, 그 외에는 빈 딕셔너리
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nickname = Column(String, default="사용자")
    profile_pic = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chat_histories = relationship("ChatHistory", back_populates="owner", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = "chat_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="제목 없음")
    character_ids = Column(Text, nullable=False)  # JSON string
    messages = Column(Text, nullable=False)  # JSON string
    is_manual = Column(Integer, default=0)  # 0: 자동 저장, 1: 사용자 직접 저장
    is_manual_quote = Column(Integer, default=0)  # 0: 일반 저장, 1: 대사 저장으로 인한 자동 저장
    quote_message_id = Column(String, nullable=True)  # 저장된 대사 메시지 ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User", back_populates="chat_histories")

class CharacterMemory(Base):
    __tablename__ = "character_memories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    character_id = Column(String, nullable=False, index=True)
    memory_type = Column(String, nullable=False)  # 'emotion', 'event', 'preference', 'relationship'
    content = Column(Text, nullable=False)  # 기억 내용
    context = Column(Text)  # 기억의 맥락 (JSON string)
    importance = Column(Integer, default=5)  # 중요도 1-10
    created_at = Column(DateTime, default=datetime.utcnow)
    last_referenced = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class UserGift(Base):
    __tablename__ = "user_gifts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    character_id = Column(String, nullable=False)
    gift_type = Column(String, nullable=False)  # 'playlist', 'poem', 'letter'
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    trigger_reason = Column(Text)  # 선물을 준 이유
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class EmotionDiary(Base):
    __tablename__ = "emotion_diaries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    diary_date = Column(DateTime, nullable=False, index=True)  # 일기 날짜 (하루 1번 제한용)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # 일기 내용
    summary = Column(Text)  # 요약
    emotions = Column(Text)  # 감정 분석 결과 (JSON string)
    weather = Column(String, default="맑음")  # 날씨 정보
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class CharacterArchetype(Base):
    __tablename__ = "character_archetypes"
    
    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    warmth = Column(String, nullable=False)  # 0.0 ~ 1.0
    realism = Column(String, nullable=False)  # 0.0 ~ 1.0
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# 기존 데이터베이스에 is_manual 컬럼 추가 (마이그레이션)
def migrate_database():
    """기존 데이터베이스에 is_manual 컬럼이 없으면 추가"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        # 테이블이 존재하는지 확인
        if 'chat_histories' not in inspector.get_table_names():
            return
        
        columns = [col['name'] for col in inspector.get_columns('chat_histories')]
        
        if 'is_manual' not in columns:
            with engine.connect() as conn:
                try:
                    conn.execute(text("ALTER TABLE chat_histories ADD COLUMN is_manual INTEGER DEFAULT 0"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: is_manual 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
    except Exception as e:
        print(f"마이그레이션 확인 중 오류 (무시 가능): {e}")

# emotion_diaries 테이블에 weather 컬럼 추가 (마이그레이션)
def migrate_emotion_diaries():
    """기존 데이터베이스에 emotion_diaries.weather 컬럼이 없으면 추가"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        # 테이블이 존재하는지 확인
        if 'emotion_diaries' not in inspector.get_table_names():
            return
        
        columns = [col['name'] for col in inspector.get_columns('emotion_diaries')]
        
        if 'weather' not in columns:
            with engine.connect() as conn:
                try:
                    conn.execute(text("ALTER TABLE emotion_diaries ADD COLUMN weather VARCHAR DEFAULT '맑음'"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: emotion_diaries.weather 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
    except Exception as e:
        print(f"마이그레이션 확인 중 오류 (무시 가능): {e}")

# chat_histories 테이블에 is_manual_quote, quote_message_id 컬럼 추가 (마이그레이션)
def migrate_chat_histories_quote():
    """기존 데이터베이스에 is_manual_quote, quote_message_id 컬럼이 없으면 추가"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        if 'chat_histories' not in inspector.get_table_names():
            return
        
        columns = [col['name'] for col in inspector.get_columns('chat_histories')]
        
        with engine.connect() as conn:
            if 'is_manual_quote' not in columns:
                try:
                    conn.execute(text("ALTER TABLE chat_histories ADD COLUMN is_manual_quote INTEGER DEFAULT 0"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: is_manual_quote 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
            
            if 'quote_message_id' not in columns:
                try:
                    conn.execute(text("ALTER TABLE chat_histories ADD COLUMN quote_message_id VARCHAR"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: quote_message_id 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
    except Exception as e:
        print(f"마이그레이션 확인 중 오류 (무시 가능): {e}")

# 마이그레이션 실행
migrate_database()
migrate_emotion_diaries()
migrate_chat_histories_quote()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

