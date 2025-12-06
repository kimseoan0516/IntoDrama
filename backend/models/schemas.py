"""
Pydantic 스키마 모델들
"""
from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import List, Optional


# 채팅 관련 모델
class ChatHistoryItem(BaseModel):
    id: float
    sender: str
    text: str
    characterId: Optional[str] = None


class ChatRequest(BaseModel):
    character_ids: List[str]
    user_nickname: str
    chat_history: List[ChatHistoryItem]
    settings: Optional[dict] = None
    current_chat_id: Optional[int] = None  # 현재 대화 세션 ID (선택적)


# 인증 관련 모델
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    nickname: Optional[str] = "사용자"
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 4:
            raise ValueError('비밀번호는 최소 4자 이상이어야 합니다.')
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            raise ValueError('비밀번호가 너무 깁니다. (최대 72바이트, 약 24자)')
        return v
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('사용자명은 최소 3자 이상이어야 합니다.')
        if len(v) > 20:
            raise ValueError('사용자명은 최대 20자까지 가능합니다.')
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 4:
            raise ValueError('비밀번호는 최소 4자 이상이어야 합니다.')
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            raise ValueError('비밀번호가 너무 깁니다. (최대 72바이트, 약 24자)')
        return v


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    nickname: str
    profile_pic: str


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    profile_pic: Optional[str] = None


# 토론 관련 모델
class DebateRequest(BaseModel):
    topic: str
    character_ids: List[str]
    user_nickname: str
    settings: Optional[dict] = None
    user_opinion: Optional[str] = None
    stance: Optional[str] = None  # 'agree', 'disagree', 'neutral'


# 일기 관련 모델
class DiaryGenerateRequest(BaseModel):
    content: str
    title: Optional[str] = None
    weather: Optional[str] = "맑음"


class DiaryCreateRequest(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    emotions: Optional[dict] = None
    weather: Optional[str] = "맑음"
    diary_date: str  # ISO 형식 날짜


# 교환일기 관련 모델
class ExchangeDiaryCreate(BaseModel):
    character_id: str
    content: str
    scheduled_time: Optional[str] = None  # '14:00', '21:00' 등
    topic_used: Optional[int] = 0  # 제안된 주제를 사용했는지 여부


# 원형 분석 관련 모델
class ArchetypeRequest(BaseModel):
    character_id: Optional[str] = None

