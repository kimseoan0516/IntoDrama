from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# 환경 변수에서 데이터베이스 URL 읽기 (없으면 기본값 사용)
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./drama_chat.db")

# SQLite 연결 설정
connect_args = {}
engine_kwargs = {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # PostgreSQL 연결 풀 설정
    engine_kwargs = {
        "pool_pre_ping": True,  # 연결이 살아있는지 확인 (만료된 연결 자동 재연결)
        "pool_recycle": 3600,   # 1시간마다 연결 재사용
        "pool_size": 5,         # 연결 풀 크기
        "max_overflow": 10,
    }
    # SSL 설정 (필요한 경우)
    # connect_args["sslmode"] = "require"  # 필요시 주석 해제

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    **engine_kwargs
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
    warmth = Column(String, nullable=True)  # 0.0 ~ 1.0 (선택적)
    realism = Column(String, nullable=True)  # 0.0 ~ 1.0 (선택적)
    order_chaos = Column(String, nullable=True)  # -1.0 (혼돈) ~ 1.0 (질서)
    good_evil = Column(String, nullable=True)  # -1.0 (악) ~ 1.0 (선)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ExchangeDiary(Base):
    __tablename__ = "exchange_diaries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    character_id = Column(String, nullable=False, index=True)
    diary_id = Column(Integer, ForeignKey("emotion_diaries.id"), nullable=True)  # 연결된 일기 ID
    content = Column(Text, nullable=False)  # 일기 내용
    reply_content = Column(Text, nullable=True)  # 캐릭터의 답장 내용
    preview_message = Column(Text, nullable=True)  # 답장 미리보기 멘트
    reply_received = Column(Boolean, default=False)  # 답장 수신 여부
    reply_read = Column(Boolean, default=False)  # 답장 읽음 여부
    reacted = Column(Boolean, default=False)  # 리액션 여부
    scheduled_time = Column(DateTime, nullable=True)  # 답장 예약 시간
    reply_created_at = Column(DateTime, nullable=True)  # 답장 생성 시간
    next_topic = Column(Text, nullable=True)  # AI가 생성한 내일의 일기 주제
    whisper_message = Column(Text, nullable=True)  # 잘 받았어요 버튼 클릭 시 표시될 속삭임 메시지
    topic_used = Column(Integer, default=0)  # 제안된 주제를 사용했는지 여부 (0: False, 1: True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User")
    diary = relationship("EmotionDiary")

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# is_manual 컬럼 마이그레이션
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

# emotion_diaries 테이블 weather 컬럼 마이그레이션
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

# chat_histories 테이블 컬럼 마이그레이션
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

# exchange_diaries 테이블 마이그레이션
def migrate_exchange_diaries():
    """기존 데이터베이스에 exchange_diaries 테이블이 없으면 생성하고 필요한 컬럼 추가"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        if 'exchange_diaries' not in inspector.get_table_names():
            # 테이블이 없으면 Base.metadata.create_all에서 생성됨
            return
        
        columns = [col['name'] for col in inspector.get_columns('exchange_diaries')]
        
        with engine.connect() as conn:
            if 'scheduled_time' not in columns:
                try:
                    conn.execute(text("ALTER TABLE exchange_diaries ADD COLUMN scheduled_time TIMESTAMP"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: exchange_diaries.scheduled_time 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
            
            if 'preview_message' not in columns:
                try:
                    conn.execute(text("ALTER TABLE exchange_diaries ADD COLUMN preview_message TEXT"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: exchange_diaries.preview_message 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
            
            if 'reply_created_at' not in columns:
                try:
                    conn.execute(text("ALTER TABLE exchange_diaries ADD COLUMN reply_created_at TIMESTAMP"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: exchange_diaries.reply_created_at 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
            
            if 'topic_used' not in columns:
                try:
                    conn.execute(text("ALTER TABLE exchange_diaries ADD COLUMN topic_used INTEGER DEFAULT 0"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: exchange_diaries.topic_used 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
            
            # 기존 답장 데이터에 대한 preview_message와 reply_created_at 업데이트
            try:
                # PostgreSQL과 SQLite 모두 호환되는 쿼리
                # preview_message가 없는 답장들에 대해 첫 50자로 설정
                conn.execute(text("""
                    UPDATE exchange_diaries 
                    SET preview_message = CASE 
                        WHEN length(reply_content) > 50 THEN substring(reply_content, 1, 50) || '...'
                        ELSE reply_content
                    END
                    WHERE reply_received = TRUE AND (preview_message IS NULL OR preview_message = '')
                """))
                
                # reply_created_at가 없는 답장들에 대해 updated_at 또는 created_at으로 설정
                conn.execute(text("""
                    UPDATE exchange_diaries 
                    SET reply_created_at = COALESCE(updated_at, created_at)
                    WHERE reply_received = TRUE AND reply_created_at IS NULL
                """))
                
                conn.commit()
                print("기존 교환일기 답장 데이터 마이그레이션 완료")
            except Exception as e:
                print(f"기존 데이터 마이그레이션 오류 (무시 가능): {e}")
                
    except Exception as e:
        print(f"마이그레이션 확인 중 오류 (무시 가능): {e}")

# character_archetypes 테이블 컬럼 마이그레이션
def migrate_character_archetypes():
    """기존 데이터베이스에 character_archetypes.order_chaos, good_evil 컬럼이 없으면 추가"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        # 테이블이 존재하는지 확인
        if 'character_archetypes' not in inspector.get_table_names():
            return
        
        columns = [col['name'] for col in inspector.get_columns('character_archetypes')]
        
        with engine.connect() as conn:
            if 'order_chaos' not in columns:
                try:
                    conn.execute(text("ALTER TABLE character_archetypes ADD COLUMN order_chaos VARCHAR"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: character_archetypes.order_chaos 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
            
            if 'good_evil' not in columns:
                try:
                    conn.execute(text("ALTER TABLE character_archetypes ADD COLUMN good_evil VARCHAR"))
                    conn.commit()
                    print("데이터베이스 마이그레이션 완료: character_archetypes.good_evil 컬럼 추가됨")
                except Exception as e:
                    print(f"마이그레이션 오류 (이미 존재할 수 있음): {e}")
    except Exception as e:
        print(f"마이그레이션 확인 중 오류 (무시 가능): {e}")

# 마이그레이션 실행
migrate_database()
migrate_emotion_diaries()
migrate_chat_histories_quote()
migrate_exchange_diaries()
migrate_character_archetypes()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

