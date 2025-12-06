"""
기타 기능 모듈
아키타입 분석, 음악 추천, 심리 리포트, 선물 등을 담당합니다.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
from pydantic import BaseModel
import json
from datetime import datetime, timedelta
from pathlib import Path

from database import get_db, User, ChatHistory, UserGift, CharacterArchetype
from auth import get_current_user, get_current_user_optional
from config import model, SAFETY_SETTINGS
from personas import CHARACTER_PERSONAS
from ai_service import analyze_user_speech_style

router = APIRouter(tags=["features"])

# ===========================================
# 음악 플레이리스트 데이터
# ===========================================

MUSIC_PLAYLIST = [
    {
        "title": "무릎",
        "artist": "아이유",
        "mood": ["우울", "지침", "불면증", "위로"],
        "link": "https://www.youtube.com/watch?v=-WhpXS6Qkww"
    },
    {
        "title": "한숨",
        "artist": "이하이",
        "mood": ["한숨", "걱정", "위로", "눈물"],
        "link": "https://www.youtube.com/watch?v=5iSlCZat_YA"
    },
    {
        "title": "달리기",
        "artist": "옥상달빛",
        "mood": ["응원", "희망", "지침", "퇴근길"],
        "link": "https://www.youtube.com/watch?v=AvdjdER_jkk"
    },
    {
        "title": "스물다섯, 스물하나",
        "artist": "자우림",
        "mood": ["그리움", "청춘", "회상", "아련함"],
        "link": "https://www.youtube.com/watch?v=QY7y1d2_XfA"
    },
    {
        "title": "가리워진 길",
        "artist": "유재하",
        "mood": ["막막함", "불안", "인생", "차분함"],
        "link": "https://www.youtube.com/watch?v=TyMrdF7JjKs"
    },
    {
        "title": "비밀의 화원",
        "artist": "이상은",
        "mood": ["설렘", "신비", "몽글몽글", "행복"],
        "link": "https://www.youtube.com/watch?v=2K_gC_t-q-g"
    },
    {
        "title": "흰수염고래",
        "artist": "YB",
        "mood": ["용기", "도전", "벅참", "응원"],
        "link": "https://www.youtube.com/watch?v=SmTRaSg2fTQ"
    },
    {
        "title": "어른",
        "artist": "Sondia",
        "mood": ["현실", "지침", "고독", "나의아저씨"],
        "link": "https://www.youtube.com/watch?v=9Tvj37ZtBfU"
    },
    {
        "title": "너의 의미",
        "artist": "산울림",
        "mood": ["사랑", "따뜻함", "잔잔함", "고백"],
        "link": "https://www.youtube.com/watch?v=Arf77Z-P5sA"
    }
]

# ===========================================
# Pydantic 모델
# ===========================================

class ArchetypeRequest(BaseModel):
    character_ids: Optional[List[str]] = None


# ===========================================
# 아키타입 분석
# ===========================================

def search_character_info_online(character_name: str) -> str:
    """인터넷에서 캐릭터 정보 검색 (Gemini API 사용)"""
    try:
        # Gemini API를 사용하여 캐릭터 정보 검색 시뮬레이션
        # 실제로는 web search API를 사용하거나, Gemini의 검색 기능을 활용
        prompt = f"'{character_name}' 캐릭터에 대한 상세한 정보를 제공해주세요. 성격, 가치관, 행동 패턴 등을 포함해서."
        
        try:
            response = model.generate_content(prompt)
            return response.text[:1000]  # 최대 1000자
        except:
            return ""
    except:
        return ""

def analyze_archetype_by_keywords(text: str) -> Tuple[float, float]:
    """키워드 기반 성향 분석 (폴백 방법)"""
    text_lower = text.lower()
    
    # 따뜻함 키워드
    warmth_positive = ['따뜻', '포근', '안아', '위로', '사랑', '좋아', '행복', '다정', '부드럽', '친근', '공감', '지지', '보호', '아끼', '소중']
    warmth_negative = ['차갑', '냉정', '거리', '거만', '무뚝뚝', '차분', '냉담', '무관심', '거부', '차단']
    
    # 이상적 키워드
    ideal_keywords = ['꿈', '희망', '이상', '미래', '상상', '낭만', '철학', '추상', '신비', '운명', '기적', '영원']
    # 현실적 키워드
    realism_keywords = ['현실', '실용', '구체', '실제', '일상', '실질', '현재', '과거', '경험', '사실', '논리', '이성']
    
    warmth_count = sum(1 for kw in warmth_positive if kw in text_lower)
    warmth_neg_count = sum(1 for kw in warmth_negative if kw in text_lower)
    ideal_count = sum(1 for kw in ideal_keywords if kw in text_lower)
    realism_count = sum(1 for kw in realism_keywords if kw in text_lower)
    
    # 따뜻함 점수 계산
    total_warmth = warmth_count + warmth_neg_count
    if total_warmth > 0:
        warmth_score = warmth_count / (total_warmth * 2)  # 0~0.5 범위
        warmth_score = warmth_score + (0.5 if warmth_count > warmth_neg_count else 0)  # 0~1 범위로 확장
    else:
        warmth_score = 0.5
    
    # 이상적/현실적 점수 계산
    total_orientation = ideal_count + realism_count
    if total_orientation > 0:
        realism_score = realism_count / total_orientation
    else:
        realism_score = 0.5
    
    return (warmth_score, realism_score)

def analyze_character_archetype_from_persona(char_id: str, persona: dict) -> Tuple[float, float]:
    """
    personas.py의 대사들과 인터넷 검색 정보를 종합하여 캐릭터의 성향 지도 위치를 정교하게 계산
    Returns: (warmth_score, realism_score)
    warmth_score: 0.0 (차가움) ~ 1.0 (따뜻함)
    realism_score: 0.0 (이상적) ~ 1.0 (현실적)
    """
    # 특정 캐릭터의 성향을 수동으로 조정
    if char_id == 'sseuregi':  # 쓰레기
        # 완전 따뜻한 사람 - warmth를 높게 설정
        # 현실적과 이상적이 비슷하지만 약간 이상적이 더 높은 정도
        # realism은 0.3~0.4 정도 (0.0에 가까울수록 이상적)
        return (0.85, 0.35)  # (warmth, realism) - 매우 따뜻하고 이상적
    elif char_id == 'yong_sik':  # 황용식
        # 이상적인 면이 높은 사람
        # warmth는 따뜻한 편, realism은 낮게 (0.0에 가까울수록 이상적)
        return (0.75, 0.2)  # (warmth, realism) - 따뜻하고 이상적
    
    try:
        character_name = persona.get('name', char_id)
        
        # 1. 인터넷에서 캐릭터 정보 검색
        online_info = search_character_info_online(character_name)
        
        # 2. personas.py에서 가져온 대사들 수집
        all_texts = []
        
        # 캐릭터 페르소나 데이터 수집 (description, style_guide, dialogue_examples)
        if persona.get('description'):
            all_texts.append(persona['description'])
        
        if persona.get('style_guide'):
            all_texts.extend(persona['style_guide'])
        
        if persona.get('dialogue_examples'):
            for example in persona['dialogue_examples']:
                if isinstance(example, dict) and example.get('character'):
                    all_texts.append(example['character'])
        
        if not all_texts and not online_info:
            return (0.5, 0.5)  # 기본값
        
        # 모든 대사를 하나의 텍스트로 합치기
        combined_text = "\n".join(all_texts)
        
        # Gemini API를 사용하여 종합 분석
        prompt = f"""다음은 드라마 캐릭터 '{character_name}'에 대한 정보입니다.
[인터넷 검색 정보]
{online_info[:2000] if online_info else "검색 정보 없음"}

[캐릭터 대사들]
{combined_text[:4000] if combined_text else "대사 없음"}

위의 모든 정보를 종합하여 이 캐릭터의 성향을 정확하게 평가해주세요.
인터넷 검색 정보와 대사들을 모두 고려하여, 실제 캐릭터의 성향을 정확하게 반영해주세요.

평가 기준:
1. 따뜻함/차가움 (warmth): 
   - 따뜻함: 공감적, 위로, 사랑 표현, 감정적 지지, 부드러운 말투, 친근함, 다정함, 배려심, 포근함, 안아줌, 보호적
   - 차가움: 냉정함, 거리감, 논리적, 감정 억제, 직설적, 거만함, 무뚝뚝함, 냉담함, 무관심, 거부적
   - 0.0 (매우 차가움, 왼쪽) ~ 1.0 (매우 따뜻함, 오른쪽)
   - 예시: 이민용은 겉으로는 까칠하고 차갑지만 속은 따뜻한 츤데레이므로, 중간 정도(0.4~0.6) 또는 약간 따뜻한 편(0.6~0.7)일 수 있습니다.
   - 예시: 고복수는 거칠어 보이지만 가족에 대한 애정이 깊고 순정적이므로, 따뜻한 편(0.6~0.8)일 수 있습니다.

2. 이상적/현실적 (realism):
   - 이상적: 꿈, 희망, 이상, 낭만적, 철학적, 추상적, 미래 지향적, 운명론적, 신비주의, 기적 기대, 영원 추구
   - 현실적: 실용적, 구체적, 일상적, 현실 인식, 실질적, 과거/현재 지향적, 논리적, 이성적, 사실 기반, 경험 중시
   - 0.0 (매우 이상적, 위쪽) ~ 1.0 (매우 현실적, 아래쪽)
   - 예시: 이민용은 현실적이고 실용적인 교사이므로, 현실적인 편(0.6~0.8)일 수 있습니다.
   - 예시: 고복수는 뇌종양 시한부 판정을 받았지만 삶에 대한 의지가 강하고, 사랑에 있어서는 순수하고 이상적인 면이 있으므로, 중간 정도(0.4~0.6) 또는 약간 이상적인 편(0.3~0.5)일 수 있습니다.

중요: 인터넷 검색 정보와 대사들을 모두 종합하여, 실제 캐릭터의 성향을 정확하게 평가해주세요.
대사만으로는 부족할 수 있으니, 검색 정보를 반드시 참고하여 정확도를 높여주세요.

다음 형식으로만 응답해주세요 (다른 설명 없이):
warmth: [0.0~1.0 사이의 숫자]
realism: [0.0~1.0 사이의 숫자]

예시:
warmth: 0.75
realism: 0.35
"""
        
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # 결과 파싱
        warmth_score = 0.5
        realism_score = 0.5
        
        for line in result_text.split('\n'):
            line = line.strip()
            if line.startswith('warmth:'):
                try:
                    warmth_score = float(line.split(':')[1].strip())
                    warmth_score = max(0.0, min(1.0, warmth_score))  # 0~1 범위로 제한
                except:
                    pass
            elif line.startswith('realism:'):
                try:
                    realism_score = float(line.split(':')[1].strip())
                    realism_score = max(0.0, min(1.0, realism_score))  # 0~1 범위로 제한
                except:
                    pass
        
        return (warmth_score, realism_score)
        
    except Exception as e:
        print(f"Gemini API 분석 실패 ({char_id}): {e}")
        # API 실패 시 키워드 기반 분석으로 폴백
        fallback_text = online_info + "\n" + combined_text if online_info else combined_text
        if fallback_text:
            return analyze_archetype_by_keywords(fallback_text)
        return (0.5, 0.5)


# 캐릭터 성향 데이터 캐시 (메모리)
_character_archetype_cache = None

def initialize_archetype_cache(db: Session):
    """서버 시작 시 모든 캐릭터의 성향을 미리 계산하여 캐시"""
    global _character_archetype_cache
    
    if _character_archetype_cache is not None:
        return _character_archetype_cache
    
    print("[성향 지도] 캐릭터 성향 데이터 초기화 중...")
    archetype_data = []
    
    for char_id, persona in CHARACTER_PERSONAS.items():
        # 특정 캐릭터는 하드코딩된 값 사용 (우선순위)
        if char_id == 'sseuregi':  # 쓰레기
            warmth_score, realism_score = 0.85, 0.35  # 매우 따뜻하고 이상적
        elif char_id == 'yong_sik':  # 황용식
            warmth_score, realism_score = 0.75, 0.2
        elif char_id == 'kim_tan':  # 김탄
            warmth_score, realism_score = 0.75, 0.15  # 매우 따뜻하고 매우 이상적 (왼쪽 위쪽)
        else:
            # DB에서 먼저 확인
            cached = db.query(CharacterArchetype).filter(CharacterArchetype.character_id == char_id).first()
            
            if cached:
                # DB에 있으면 사용
                archetype_data.append({
                    "character_id": char_id,
                    "name": cached.name,
                    "warmth": float(cached.warmth),
                    "realism": float(cached.realism)
                })
                continue
            else:
                # DB에 없으면 계산하고 저장
                warmth_score, realism_score = analyze_character_archetype_from_persona(char_id, persona)
        
        # 특정 캐릭터는 하드코딩된 값으로 DB 업데이트
        if char_id in ['sseuregi', 'yong_sik', 'kim_tan']:
            # DB에 저장 또는 업데이트
            existing = db.query(CharacterArchetype).filter(CharacterArchetype.character_id == char_id).first()
            if existing:
                existing.warmth = str(warmth_score)
                existing.realism = str(realism_score)
            else:
                archetype = CharacterArchetype(
                    character_id=char_id,
                    name=persona.get('name', char_id),
                    warmth=str(warmth_score),
                    realism=str(realism_score)
                )
                db.add(archetype)
        elif char_id not in ['sseuregi', 'yong_sik']:
            # DB에 저장
            archetype = CharacterArchetype(
                character_id=char_id,
                name=persona.get('name', char_id),
                warmth=str(warmth_score),
                realism=str(realism_score)
            )
            db.add(archetype)
            
        archetype_data.append({
            "character_id": char_id,
            "name": persona.get('name', char_id),
            "warmth": round(warmth_score, 2),
            "realism": round(realism_score, 2)
        })
    
    try:
        db.commit()
    except:
        db.rollback()
    
    _character_archetype_cache = archetype_data
    print(f"[성향 지도] {len(archetype_data)}개 캐릭터 성향 데이터 초기화 완료")
    return archetype_data

@router.get("/archetype/map")
@router.post("/archetype/map")
def get_archetype_map(
    request: ArchetypeRequest = None,
    character_ids: Optional[str] = None,  # GET 요청용 쿼리 파라미터
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """캐릭터 성향 지도 조회 (미리 계산된 데이터 사용)"""
    try:
        user_id = current_user.id if current_user else None
        
        # 캐시 초기화 (없으면)
        if _character_archetype_cache is None:
            initialize_archetype_cache(db)
        
        # 요청된 캐릭터 ID 목록 (없으면 모든 캐릭터)
        if character_ids:
            # GET 요청: 쿼리 파라미터에서 파싱
            try:
                requested_char_ids = json.loads(character_ids)
            except:
                requested_char_ids = list(CHARACTER_PERSONAS.keys())
        elif request and request.character_ids:
            # POST 요청: body에서 가져옴
            requested_char_ids = request.character_ids
        else:
            requested_char_ids = list(CHARACTER_PERSONAS.keys())
        
        # 캐시에서 필터링
        archetype_data = [
            char.copy() for char in _character_archetype_cache 
            if char["character_id"] in requested_char_ids
        ]
        
        # 요청된 캐릭터 중 캐시에 없는 것이 있으면 계산
        cached_char_ids = [c["character_id"] for c in archetype_data]
        missing_char_ids = [cid for cid in requested_char_ids if cid not in cached_char_ids]
        
        for char_id in missing_char_ids:
            persona = CHARACTER_PERSONAS.get(char_id)
            if not persona:
                continue
            
            # 계산
            warmth_score, realism_score = analyze_character_archetype_from_persona(char_id, persona)
            
            # DB에 저장
            archetype = CharacterArchetype(
                character_id=char_id,
                name=persona.get('name', char_id),
                warmth=str(warmth_score),
                realism=str(realism_score)
            )
            db.add(archetype)
            
            char_data = {
                "character_id": char_id,
                "name": persona.get('name', char_id),
                "warmth": round(warmth_score, 2),
                "realism": round(realism_score, 2)
            }
            archetype_data.append(char_data)
            # 캐시에도 추가
            if _character_archetype_cache is not None:
                _character_archetype_cache.append(char_data)
        
        try:
            db.commit()
        except:
            db.rollback()
        
        # 사용자와의 대화 기록이 있으면 약간 보정 (20% 가중치) - 실시간 보정만
        for char_data in archetype_data:
            char_id = char_data["character_id"]
            if user_id:
                recent_chats = db.query(ChatHistory).filter(
                    ChatHistory.user_id == user_id
                ).order_by(ChatHistory.created_at.desc()).limit(30).all()
                
                warmth_keywords = ['따뜻', '포근', '안아', '위로', '사랑', '좋아', '행복']
                realism_keywords = ['현실', '실용', '구체', '실제', '일상']
                ideal_keywords = ['이상', '꿈', '희망', '미래', '상상']
                
                warmth_count = 0
                realism_count = 0
                ideal_count = 0
                total_count = 0
                
                for chat in recent_chats:
                    try:
                        messages = json.loads(chat.messages) if isinstance(chat.messages, str) else chat.messages
                        for msg in messages:
                            if isinstance(msg, dict) and msg.get('character_id') == char_id:
                                text = msg.get('text', '').lower()
                                total_count += 1
                                if any(k in text for k in warmth_keywords):
                                    warmth_count += 1
                                if any(k in text for k in realism_keywords):
                                    realism_count += 1
                                if any(k in text for k in ideal_keywords):
                                    ideal_count += 1
                    except:
                        continue
                
                if total_count > 10:  # 충분한 데이터가 있을 때만 보정
                    chat_warmth = min(1.0, warmth_count / max(1, total_count / 3))
                    if realism_count > ideal_count:
                        chat_realism = 0.7
                    elif ideal_count > realism_count:
                        chat_realism = 0.3
                    else:
                        chat_realism = 0.5
                    
                    # 80% 기본 성향 + 20% 대화 기록
                    char_data["warmth"] = round(char_data["warmth"] * 0.8 + chat_warmth * 0.2, 2)
                    char_data["realism"] = round(char_data["realism"] * 0.8 + chat_realism * 0.2, 2)
        
        # 반환 형식 변환 (warmth, realism을 x, y로 매핑)
        characters = []
        for char_data in archetype_data:
            characters.append({
                "id": char_data["character_id"],
                "name": char_data["name"],
                "x": char_data["warmth"],  # 0.0 (차가움) ~ 1.0 (따뜻함)
                "y": char_data["realism"],  # 0.0 (이상적) ~ 1.0 (현실적)
                "image": CHARACTER_PERSONAS.get(char_data["character_id"], {}).get('image', ''),
                "description": CHARACTER_PERSONAS.get(char_data["character_id"], {}).get('description', '')[:100] + '...'
            })
        
        return {
            "characters": characters if characters else []
        }
        
    except Exception as e:
        print(f"성향 지도 조회 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# 음악 추천
# ===========================================

@router.post("/music/recommend")
def recommend_music(request: dict):
    """감정이나 기분에 따라 음악 추천"""
    try:
        moods = request.get('moods', [])  # 요청된 감정/기분 리스트
        
        if not moods or len(moods) == 0:
            # 감정이 없으면 전체 플레이리스트 반환
            return {"songs": MUSIC_PLAYLIST}
        
        # 요청된 감정과 매칭되는 음악 찾기
        recommended_songs = []
        for song in MUSIC_PLAYLIST:
            song_moods = [m.lower() for m in song.get('mood', [])]
            requested_moods = [m.lower() for m in moods]
            
            # 하나라도 매칭되면 추천
            if any(mood in song_moods for mood in requested_moods):
                recommended_songs.append(song)
        
        # 매칭되는 음악이 없으면 전체 플레이리스트 반환
        if len(recommended_songs) == 0:
            recommended_songs = MUSIC_PLAYLIST
        
        return {"songs": recommended_songs}
    except Exception as e:
        print(f"음악 추천 오류: {e}")
        return {"songs": MUSIC_PLAYLIST}  # 오류 시 전체 플레이리스트 반환


@router.get("/music/playlist")
def get_music_playlist():
    """전체 음악 플레이리스트 반환"""
    return {"songs": MUSIC_PLAYLIST}


def analyze_user_mood_from_chat(user_id: int, db: Session) -> List[str]:
    """사용자의 최근 대화 기록을 분석하여 기분/감정을 추출"""
    try:
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        histories = db.query(ChatHistory).filter(
            ChatHistory.user_id == user_id,
            ChatHistory.is_manual == 1,
            ChatHistory.updated_at >= week_ago
        ).order_by(ChatHistory.updated_at.desc()).limit(10).all()
        
        if not histories:
            return []
        
        # 모든 사용자 메시지 수집
        all_user_texts = []
        for history in histories:
            try:
                messages = json.loads(history.messages) if isinstance(history.messages, str) else history.messages
                if not messages or not isinstance(messages, list):
                    continue
                
                for msg in messages:
                    if msg.get('sender') == 'user' and msg.get('text'):
                        all_user_texts.append(msg.get('text', '').lower())
            except Exception:
                continue
        
        if not all_user_texts:
            return []
        
        combined_text = ' '.join(all_user_texts)
        
        # 감정 키워드 매핑
        mood_keywords = {
            '우울': ['우울', '슬퍼', '울어', '눈물', '힘들', '지침', '피곤', '무기력'],
            '위로': ['위로', '힘내', '괜찮', '안심', '걱정', '고민'],
            '불면증': ['불면', '잠못', '잠안', '밤새', '수면'],
            '한숨': ['한숨', '답답', '답답해', '답답함'],
            '걱정': ['걱정', '걱정돼', '걱정되', '불안', '불안해'],
            '응원': ['응원', '힘내', '화이팅', '파이팅', '할수있', '할 수 있'],
            '희망': ['희망', '기대', '기대돼', '기대되', '좋아질', '좋아질거'],
            '그리움': ['그리워', '그리움', '보고싶', '보고 싶', '사랑', '좋아'],
            '청춘': ['청춘', '젊음', '추억', '회상', '옛날'],
            '막막함': ['막막', '막막해', '막막함', '불안', '걱정'],
            '설렘': ['설레', '설렘', '떨려', '두근', '두근거려'],
            '행복': ['행복', '기쁘', '좋아', '즐거', '신나'],
            '용기': ['용기', '도전', '시도', '해볼', '도전해'],
            '현실': ['현실', '현실적', '어른', '성숙', '이해'],
            '고독': ['고독', '외로', '혼자', '외로워'],
            '사랑': ['사랑', '좋아', '좋아해', '사랑해', '따뜻']
        }
        
        mood_scores = {}
        for mood, keywords in mood_keywords.items():
            score = sum(1 for keyword in keywords if keyword in combined_text)
            if score > 0:
                mood_scores[mood] = score
        
        if not mood_scores:
            return []
        
        sorted_moods = sorted(mood_scores.items(), key=lambda x: x[1], reverse=True)
        return [mood for mood, score in sorted_moods[:3]]
    
    except Exception as e:
        print(f"사용자 기분 분석 오류: {e}")
        return []


@router.post("/music/character-recommend")
def get_character_music_recommendation(
    request: dict,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """사용자와 가장 대화를 많이 한 캐릭터가 사용자의 기분에 맞춰 음악을 추천"""
    try:
        import random
        
        request_moods = request.get('moods', [])
        
        # 사용자와 가장 대화를 많이 한 캐릭터 찾기
        user_id = current_user.id if current_user else None
        if not user_id:
            # 로그인하지 않은 경우 랜덤 음악 반환
            recommended_song = random.choice(MUSIC_PLAYLIST)
            return {
                "song": recommended_song,
                "character_id": None,
                "character_name": None,
                "comment": None
            }
        
        # 사용자의 기분 분석 (요청된 감정이 없으면)
        detected_moods = []
        if not request_moods or len(request_moods) == 0:
            detected_moods = analyze_user_mood_from_chat(user_id, db)
        
        moods_to_use = request_moods if request_moods else detected_moods
        
        # 모든 캐릭터와의 대화 수 계산
        histories = db.query(ChatHistory).filter(
            ChatHistory.user_id == user_id,
            ChatHistory.is_manual == 1
        ).all()
        
        character_message_counts = {}
        
        for history in histories:
            try:
                history_character_ids = json.loads(history.character_ids) if isinstance(history.character_ids, str) else history.character_ids
                messages = json.loads(history.messages) if isinstance(history.messages, str) else history.messages
                
                if not history_character_ids or not isinstance(history_character_ids, list):
                    continue
                
                message_count = len(messages) if messages and isinstance(messages, list) else 0
                
                for char_id in history_character_ids:
                    if char_id not in character_message_counts:
                        character_message_counts[char_id] = 0
                    character_message_counts[char_id] += message_count
            except Exception:
                continue
        
        if not character_message_counts:
            recommended_song = random.choice(MUSIC_PLAYLIST)
            return {
                "song": recommended_song,
                "character_id": None,
                "character_name": None,
                "comment": None
            }
        
        most_chatted_char_id = max(character_message_counts.items(), key=lambda x: x[1])[0]
        persona = CHARACTER_PERSONAS.get(most_chatted_char_id)
        
        if not persona:
            recommended_song = random.choice(MUSIC_PLAYLIST)
            return {
                "song": recommended_song,
                "character_id": None,
                "character_name": None,
                "comment": None
            }
        
        # 감정에 맞는 음악 선택
        if moods_to_use and len(moods_to_use) > 0:
            matching_songs = []
            for song in MUSIC_PLAYLIST:
                song_moods = [m.lower() for m in song.get('mood', [])]
                requested_moods = [m.lower() for m in moods_to_use]
                if any(mood in song_moods for mood in requested_moods):
                    matching_songs.append(song)
            
            if matching_songs:
                recommended_song = random.choice(matching_songs)
            else:
                recommended_song = random.choice(MUSIC_PLAYLIST)
        else:
            recommended_song = random.choice(MUSIC_PLAYLIST)
        
        character_name = persona['name'].split(' (')[0] if ' (' in persona['name'] else persona['name']
        
        # 캐릭터의 추천 코멘트 생성 (간단한 버전)
        comment = f"이 노래 괜찮은 거 같더라. 한번 들어봐."
        
        if model:
            try:
                user_nickname = current_user.nickname if current_user else "너"
                style_guide = "\n".join([f"- {line}" for line in persona.get('style_guide', [])])
                
                prompt = f"""{character_name}가 사용자({user_nickname})에게 음악을 추천합니다.
추천할 음악: {recommended_song['title']} - {recommended_song['artist']}

{character_name}의 말투로 한 문장 코멘트를 작성하세요:
{style_guide}

코멘트:"""
                
                response = model.generate_content(prompt, safety_settings=SAFETY_SETTINGS)
                comment = response.text.strip()
                comment = comment.replace(f"{character_name}:", "").replace('"', '').replace("'", "").strip()
                
                if not comment:
                    comment = "이 노래 괜찮은 거 같더라. 한번 들어봐."
            except Exception as e:
                print(f"코멘트 생성 실패: {e}")
        
        return {
            "song": recommended_song,
            "character_id": most_chatted_char_id,
            "character_name": character_name,
            "comment": comment,
            "detected_moods": detected_moods if not request_moods else []
        }
        
    except Exception as e:
        print(f"캐릭터 음악 추천 오류: {e}")
        import random
        recommended_song = random.choice(MUSIC_PLAYLIST)
        return {
            "song": recommended_song,
            "character_id": None,
            "character_name": None,
            "comment": None,
            "detected_moods": []
        }


# ===========================================
# 심리 리포트
# ===========================================

@router.post("/psychology/report")
def generate_psychology_report(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """심리 리포트 생성"""
    try:
        # 요청에서 messages를 받아 현재 채팅방의 메시지 사용
        messages = request.get('messages', [])
        
        if not messages:
            raise HTTPException(status_code=400, detail="분석할 메시지가 없습니다.")
        
        # 사용자 메시지 추출 (현재 채팅방의 메시지만 분석)
        user_messages = []
        for msg in messages:
            if isinstance(msg, dict) and msg.get('sender') == 'user':
                text = msg.get('text', '')
                # 시스템 메시지나 특수 메시지는 제외
                if text and not text.startswith('💭'):
                    user_messages.append(text)
        
        if not user_messages:
            raise HTTPException(status_code=404, detail="분석할 사용자 메시지가 없습니다.")
        
        # 말투 분석
        chat_history_for_analysis = [{"role": "user", "parts": [{"text": msg}]} for msg in user_messages]
        speech_style = analyze_user_speech_style(chat_history_for_analysis)
        
        # 감정 키워드 분석 - 중요 지침 반영
        emotion_keywords = {
            'romance': ['사랑', '좋아', '설레', '두근', '행복', '기쁨', '떨려', '심쿵', '설렘'],
            'comfort': ['힘들', '슬퍼', '위로', '괜찮', '걱정', '불안', '외로워', '울적', '지침'],
            'conflict': ['화나', '짜증', '답답', '싫어', '미워', '스트레스', '피곤', '짜증나']
        }
        
        keyword_counts = {}
        emotion_scores = {'romance': 0, 'comfort': 0, 'conflict': 0}
        
        all_text = ' '.join(user_messages)
        
        for emotion, keywords in emotion_keywords.items():
            for keyword in keywords:
                count = all_text.count(keyword)
                if count > 0:
                    keyword_counts[keyword] = keyword_counts.get(keyword, 0) + count
                    emotion_scores[emotion] += count
        
        # 주요 감정 결정
        dominant_mood = max(emotion_scores.items(), key=lambda x: x[1])[0] if max(emotion_scores.values()) > 0 else 'neutral'
        
        # 상위 키워드
        sorted_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # 리포트 생성
        report = {
            'date': datetime.utcnow().isoformat(),
            'dominantMood': dominant_mood,
            'emotionScores': {
                'romance': round(emotion_scores['romance'] / max(len(user_messages), 1) * 100, 1),
                'comfort': round(emotion_scores['comfort'] / max(len(user_messages), 1) * 100, 1),
                'conflict': round(emotion_scores['conflict'] / max(len(user_messages), 1) * 100, 1)
            },
            'keywords': [{'word': word, 'count': count} for word, count in sorted_keywords],
            'totalMessages': len(user_messages),
            'speechStyle': speech_style
        }
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"심리 리포트 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"리포트 생성 중 오류가 발생했습니다: {str(e)}")


# ===========================================
# 선물 체크
# ===========================================

@router.get("/gifts/check")
def check_gifts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """선물 확인"""
    try:
        # 사용자의 선물 조회
        gifts = db.query(UserGift).filter(
            UserGift.user_id == current_user.id,
            UserGift.opened == False
        ).all()
        
        result = []
        for gift in gifts:
            result.append({
                "id": gift.id,
                "gift_type": gift.gift_type,
                "character_id": gift.character_id,
                "message": gift.message,
                "created_at": gift.created_at.isoformat() + 'Z' if gift.created_at else None
            })
        
        return {"gifts": result}
        
    except Exception as e:
        print(f"선물 확인 오류: {e}")
        raise HTTPException(status_code=500, detail=f"선물 확인 중 오류가 발생했습니다: {str(e)}")


# ===========================================
# 기타
# ===========================================

@router.get("/favicon.ico")
async def favicon():
    """파비콘"""
    # 프로젝트 root 디렉토리 경로
    project_root = Path(__file__).parent.parent
    favicon_path = project_root / "favicon.ico"
    
    if favicon_path.exists() and favicon_path.is_file():
        return FileResponse(str(favicon_path))
    
    # favicon.ico가 없으면 204 No Content 반환
    from fastapi.responses import Response
    return Response(status_code=204)

