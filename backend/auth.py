"""
인증 관련 모듈
회원가입, 로그인, 프로필 관리, 비밀번호 재설정 등을 담당합니다.
JWT 토큰 생성 및 검증, 비밀번호 해싱 유틸리티도 포함합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

from database import get_db, User
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])

# 인증 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ===========================================
# 비밀번호 및 토큰 유틸리티 함수
# ===========================================

def verify_password(plain_password, hashed_password):
    """비밀번호 검증 (bcrypt 직접 사용, 72바이트 제한 처리)"""
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    try:
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except:
        # fallback to passlib
        return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """비밀번호 해싱 (bcrypt 직접 사용, 72바이트 제한 처리)"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    # bcrypt로 직접 해싱
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """현재 로그인한 사용자 가져오기 (필수)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)), db: Session = Depends(get_db)):
    """로그인한 경우 User를 반환하고, 로그인하지 않은 경우 None을 반환"""
    if credentials is None:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    try:
        user = db.query(User).filter(User.username == username).first()
        return user
    except Exception as e:
        # 데이터베이스 연결 오류 등 예외 발생 시 None 반환
        print(f"데이터베이스 쿼리 오류: {e}")
        return None


# ===========================================
# Pydantic 모델 정의
# ===========================================

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


# ===========================================
# 인증 엔드포인트
# ===========================================

@router.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    # 중복 확인
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 비밀번호 길이 검증
    password_bytes = user_data.password.encode('utf-8')
    if len(password_bytes) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes)")
    
    # 사용자 생성
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        nickname=user_data.nickname or "사용자"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 토큰 생성
    access_token = create_access_token(data={"sub": db_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "nickname": db_user.nickname,
            "profile_pic": db_user.profile_pic or ""
        }
    }


@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "nickname": user.nickname,
            "profile_pic": user.profile_pic or ""
        }
    }


@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "nickname": current_user.nickname,
        "profile_pic": current_user.profile_pic or ""
    }


@router.put("/profile")
def update_profile(profile_data: UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """프로필 업데이트"""
    if profile_data.nickname is not None:
        current_user.nickname = profile_data.nickname
    if profile_data.profile_pic is not None:
        current_user.profile_pic = profile_data.profile_pic
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "nickname": current_user.nickname,
        "profile_pic": current_user.profile_pic or ""
    }


@router.post("/password-reset-request")
def request_password_reset(reset_request: PasswordResetRequest, db: Session = Depends(get_db)):
    """비밀번호 재설정 요청 - 이메일로 사용자 확인"""
    user = db.query(User).filter(User.email == reset_request.email).first()
    if not user:
        # 보안을 위해 사용자가 존재하지 않아도 성공 메시지 반환
        return {"message": "이메일이 등록되어 있다면 비밀번호 재설정 링크를 보냈습니다."}
    
    # 실제 구현에서는 여기서 이메일을 보내야 하지만, 
    # 현재는 간단하게 사용자 확인만 하고 바로 재설정 가능하도록 함
    return {
        "message": "이메일 확인 완료",
        "email": user.email
    }


@router.post("/password-reset")
def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """비밀번호 재설정"""
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 이메일로 등록된 사용자를 찾을 수 없습니다."
        )
    
    # 새 비밀번호 해싱
    user.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()
    
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}

