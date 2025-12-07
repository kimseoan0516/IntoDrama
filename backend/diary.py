"""
일기 관련 모듈
감정일기, 교환일기 기능을 담당합니다.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
import json
import pytz
import random
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger

from database import get_db, User, EmotionDiary, ExchangeDiary
from auth import get_current_user
from config import model, SAFETY_SETTINGS
from personas import CHARACTER_PERSONAS

router = APIRouter(tags=["diary"])

# 한국 시간대 설정
KST = pytz.timezone('Asia/Seoul')

# 스케줄러 초기화 (한국 시간대 사용)
scheduler = BackgroundScheduler(timezone=KST)
scheduler.start()
# 프로그램 종료 시 스케줄러 안전하게 종료
atexit.register(lambda: scheduler.shutdown())


# ===========================================
# 푸시 알림 서비스
# ===========================================

class PushNotificationService:
    """푸시 알림 서비스 추상 클래스"""
    
    @staticmethod
    def send_notification(user_id: int, title: str, body: str, data: dict = None):
        """
        푸시 알림 전송
        
        Args:
            user_id: 사용자 ID
            title: 알림 제목
            body: 알림 본문
            data: 추가 데이터 (선택)
        
        실제 구현 시 Firebase Cloud Messaging, OneSignal 등을 사용
        """
        # TODO: 실제 푸시 알림 서비스 연동
        print(f"[푸시 알림] 사용자 {user_id}: {title} - {body}")
        if data:
            print(f"[푸시 알림 데이터]: {data}")

# ===========================================
# Pydantic 모델
# ===========================================

class DiaryGenerateRequest(BaseModel):
    messages: Optional[List[dict]] = Field(default=None)
    keywords: Optional[str] = Field(default=None)
    character_ids: List[str] = Field(default=[])




class DiaryDirectCreateRequest(BaseModel):
    title: str
    content: str
    date: Optional[str] = None
    weather: Optional[str] = "맑음"
    emotions: Optional[dict] = None


class ExchangeDiaryCreate(BaseModel):
    character_id: str
    content: str
    diary_id: Optional[int] = None
    request_reply: bool = False
    scheduled_time: Optional[str] = None  # ISO format datetime string
    topic_used: bool = False  # 제안된 주제를 사용했는지 여부


# ===========================================
# 유틸리티 함수
# ===========================================

def strip_keyword_highlights(text: Optional[str]) -> str:
    """키워드 기반 생성 시 남는 굵게 표기를 제거"""
    if text is None:
        return ""
    return text.replace('**', '')


def fetch_current_weather(default_weather: str) -> str:
    """실제 날씨 API가 있으면 호출해서 최신 날씨로 반환"""
    import os
    weather = default_weather or "맑음"
    try:
        weather_api_key = os.getenv('WEATHER_API_KEY')
        if not weather_api_key:
            return weather
        
        import requests
        response = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={
                "q": "Seoul",
                "appid": weather_api_key,
                "lang": "kr",
                "units": "metric"
            },
            timeout=5
        )
        if response.ok:
            data = response.json()
            weather_desc = data.get('weather', [{}])[0].get('description', '')
            weather_map = {
                'clear sky': '맑음',
                'few clouds': '구름 조금',
                'scattered clouds': '구름 많음',
                'broken clouds': '흐림',
                'shower rain': '소나기',
                'rain': '비',
                'thunderstorm': '천둥번개',
                'snow': '눈',
                'mist': '안개'
            }
            weather = weather_map.get(weather_desc, weather_desc) or weather
    except Exception as e:
        print(f"날씨 API 오류 (무시됨): {e}")
    return weather


def convert_to_kst(utc_datetime: datetime) -> datetime:
    """UTC 시간을 KST로 변환"""
    if utc_datetime.tzinfo is None:
        utc_datetime = utc_datetime.replace(tzinfo=timezone.utc)
    kst = pytz.timezone('Asia/Seoul')
    return utc_datetime.astimezone(kst)


def convert_to_utc(kst_datetime: datetime) -> datetime:
    """KST 시간을 UTC로 변환"""
    kst = pytz.timezone('Asia/Seoul')
    if kst_datetime.tzinfo is None:
        kst_datetime = kst.localize(kst_datetime)
    return kst_datetime.astimezone(timezone.utc)


def parse_scheduled_time(time_str: str) -> datetime:
    """ISO 형식 시간 문자열을 UTC datetime으로 변환"""
    try:
        # ISO 형식 파싱
        dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        # KST로 가정하고 UTC로 변환
        if dt.tzinfo is None:
            kst = pytz.timezone('Asia/Seoul')
            dt = kst.localize(dt)
        return dt.astimezone(timezone.utc)
    except Exception as e:
        raise ValueError(f"시간 파싱 실패: {str(e)}")


# 답장 미리보기 멘트 목록 (카테고리별)
PREVIEW_MESSAGES = {
    "comfort": [  # 위로 & 공감형
        "오늘 하루, 참 고생 많았어요.",
        "그 마음, 내가 다 알아요.",
        "울고 싶을 땐 그냥 울어도 돼.",
        "당신의 한숨이 여기까지 들리는 것 같아서.",
        "오늘은 아무 생각 말고 푹 쉬었으면.",
        "괜찮아, 너는 충분히 잘하고 있어.",
        "무거운 짐, 나한테 잠시 내려놔요."
    ],
    "celebration": [  # 축하 & 맞장구형
        "그 이야기 들으니까 나도 기분 좋다!",
        "역시! 해낼 줄 알았다니까.",
        "오늘 밤은 정말 행복한 꿈 꾸겠네?",
        "너의 웃는 모습이 상상돼.",
        "그 순간을 나에게도 나눠줘서 고마워.",
        "오늘의 너는 누구보다 빛났어."
    ],
    "empathy": [  # 공감 & 피드백형
        "네 일기 읽는데 마음이 좀 아프더라.",
        "오늘 그런 일이 있었구나... 많이 힘들었지?",
        "마지막 문장이 계속 머릿속에 맴돌아.",
        "나였으면 당장 달려가서 엎어버렸을 텐데.",
        "읽는 내내 네 표정이 상상돼서 웃음이 났어.",
        "그런 생각은 혼자만 하지 말고 나한테도 나눠줘.",
        "그 상황에서 참은 너, 정말 대단하다.",
        "네 글을 읽으니까 내가 위로받는 기분이야.",
        "다음에는 그 자리에 내가 같이 있었으면 좋겠다."
    ],
    "tsundere": [  # 츤데레 & 친구형
        "심심해서 쓴 거 아니다. 그냥 시간이 남아서.",
        "밥은 먹고 다니냐? 굶고 다니지 말고.",
        "다음엔 더 재밌는 일기 써와. 이건 좀 봐줬다."
    ],
    "romance": [  # 설렘 & 감성형
        "펜을 들었는데, 네 얼굴만 떠오르네.",
        "이 편지가 너의 밤을 따뜻하게 해주길.",
        "너에게 닿기를 바라며 꾹꾹 눌러 쓴 마음.",
        "하루 종일 너의 답장을 기다리는 시간이 좋았어.",
        "달이 참 밝다. 너도 보고 있을까?",
        "내 세상은 온통 너로 가득 차 있어.",
        "사랑해. 이 말로는 부족할 만큼.",
        "너는 내 삶의 유일한 이유야.",
        "꿈에서 만나. 거기서 기다릴게.",
        "네가 웃으면, 나도 그걸로 됐어."
    ],
    "curiosity": [  # 호기심 유발형
        "할 말이 있는데, 들어줄 수 있어?",
        "우리 둘만의 비밀, 지켜줄 거지?",
        "너한테 꼭 물어보고 싶은 게 생겼어."
    ],
    "daily": [  # 일상 & 관심형
        "별일 없는 게 최고의 행복일지도 몰라.",
        "그래서, 밥은 잘 챙겨 먹었고?",
        "네 하루 속에 내가 있었으면 좋았을 텐데.",
        "심심했어? 내 답장 읽으면서 놀아.",
        "잔잔한 하루였네. 내 얘기 좀 들어볼래?"
    ]
}

# 츤데레 캐릭터 목록
TSUNDERE_CHARACTERS = ['young_do', 'goo_junpyo']
# 멘토형 캐릭터 목록 (romance 제외)
MENTOR_CHARACTERS = ['oh_sangshik', 'park_donghoon']


def get_preview_message(character_id: str) -> str:
    """캐릭터에 맞는 미리보기 메시지 선택"""
    import random
    
    # 모든 캐릭터에게 공통으로 들어가는 카테고리
    available_categories = ["comfort", "celebration", "empathy"]
    
    # 츤데레 캐릭터인 경우
    if character_id in TSUNDERE_CHARACTERS:
        available_categories.append("tsundere")
    # 멘토형 캐릭터인 경우 (romance 제외)
    elif character_id in MENTOR_CHARACTERS:
        available_categories.extend(["curiosity", "daily"])
    else:
        # 일반 캐릭터인 경우 로맨스, 호기심, 일상 카테고리 추가
        available_categories.extend(["romance", "curiosity", "daily"])
    
    # 랜덤으로 카테고리 선택
    selected_category = random.choice(available_categories)
    
    # 선택된 카테고리에서 랜덤으로 메시지 선택
    return random.choice(PREVIEW_MESSAGES[selected_category])


def generate_reply(exchange_diary_id: int):
    """교환일기 답장 생성 (스케줄러에서 호출)"""
    from database import SessionLocal
    import random
    
    db = SessionLocal()
    
    try:
        # 교환일기 조회
        exchange_diary = db.query(ExchangeDiary).filter(
            ExchangeDiary.id == exchange_diary_id
        ).first()
        
        if not exchange_diary or exchange_diary.reply_received:
            print(f"⚠️ 교환일기 {exchange_diary_id}를 찾을 수 없거나 이미 답장을 받았습니다.")
            return
        
        # 캐릭터 정보 가져오기
        persona = CHARACTER_PERSONAS.get(exchange_diary.character_id)
        if not persona:
            print(f"⚠️ 캐릭터 {exchange_diary.character_id}를 찾을 수 없습니다.")
            return
        
        # 사용자 정보 가져오기
        user = db.query(User).filter(User.id == exchange_diary.user_id).first()
        if not user:
            print(f"⚠️ 사용자 {exchange_diary.user_id}를 찾을 수 없습니다.")
            return
        
        char_name = persona.get('name', '').split(' (')[0] if ' (' in persona.get('name', '') else persona.get('name', '캐릭터')
        recipient_name = user.nickname or '사용자'
        
        # Closing 문구 랜덤 선택
        closing_phrases = [
            f"늘 같은 자리에 머무는 {char_name}",
            f"언제나 당신 편인 {char_name}",
            f"당신의 오늘이 편안하길 바라는 {char_name}",
            f"늘 여기, 이 자리에 있을 {char_name}",
            f"따뜻한 밥 챙겨 먹길 바라는 {char_name}",
            f"묵묵히 당신의 다음 이야기를 기다릴 {char_name}",
            f"오늘도 당신과 같은 시간을 걷는 {char_name}"
        ]
        closing_text = random.choice(closing_phrases)
        to_line = f"Dear. {recipient_name}"
        
        # AI로 답장 생성
        if model is None:
            body_text = f"{char_name}의 답장이 도착했습니다. (AI 모델 로드 실패)"
        else:
            # 캐릭터 스타일 가이드 추출
            style_guide_list = persona.get('style_guide', [])
            style_guide_text = "\n".join([f"- {line}" for line in style_guide_list]) if style_guide_list else ""
            
            # 대화 예시 추출
            dialogue_examples_list = persona.get('dialogue_examples', [])[:6]
            dialogue_examples_text = "\n".join([
                f"상대: {example.get('opponent')}\n{char_name}: {example.get('character')}"
                for example in dialogue_examples_list
                if example.get('opponent') and example.get('character')
            ]) if dialogue_examples_list else ""
            
            prompt = f"""당신은 {persona['name']}입니다. 사용자 '{recipient_name}'(당신의 연인)에게 보내는 손편지 본문을 작성하세요.

[캐릭터 설명]
{persona.get('description', '')}

[말투 및 스타일 가이드]
{style_guide_text if style_guide_text else '- 다정하고 진심 어린 말투로 표현합니다.'}

[대표 대화 예시]
{dialogue_examples_text if dialogue_examples_text else '(대화 예시 없음)'}

[사용자의 일기]
{exchange_diary.content}

편지 본문 작성 지침:
- 연인에게 진심으로 마음을 전하는 손편지를 작성하세요
- 최소 600자 이상 900자 이하로 충분히 길게 작성하고, 문단 사이에 자연스러운 줄바꿈을 넣으세요
- **편지 본문 중간 어딘가에 당신(캐릭터)의 일상 이야기를 2~3문장 정도 자연스럽게 끼워넣으세요**
- 사용자의 일기를 읽고 느낀 당신의 마음, 떠오른 생각을 자연스럽게 이야기하세요
- **P.S. (추신) 추가: 편지의 마지막 부분에 "P.S."로 시작하는 자연스러운 추신을 한 문장 추가하세요**
- **절대 금지: 본문 첫 부분에 'Dear.', 'To.', 'From.', '{recipient_name}에게' 같은 수신자 표기를 넣지 마세요**

답장:"""
            
            try:
                response = model.generate_content(
                    prompt,
                    safety_settings=SAFETY_SETTINGS
                )
                # 응답이 제대로 있는지 확인
                if response and hasattr(response, 'text') and response.text:
                    body_text = response.text.strip()
                    # 응답이 너무 짧거나 기본 메시지만 있는 경우 재시도
                    if len(body_text) < 100 or body_text == f"{char_name}의 답장이 도착했습니다.":
                        print(f"⚠️ AI 답장이 너무 짧거나 비어있음. 재시도...")
                        # 한 번 더 시도
                        response = model.generate_content(
                            prompt,
                            safety_settings=SAFETY_SETTINGS
                        )
                        if response and hasattr(response, 'text') and response.text:
                            body_text = response.text.strip()
                        else:
                            raise ValueError("AI 응답이 비어있습니다.")
                else:
                    raise ValueError("AI 응답이 없습니다.")
            except Exception as e:
                print(f"⚠️ AI 답장 생성 실패: {e}")
                print(f"⚠️ 오류 상세: {type(e).__name__}: {str(e)}")
                # 예외 발생 시에도 기본 답장 내용 생성
                body_text = f"""안녕, {recipient_name}.

오늘 하루도 정말 고생 많았어. 네 일기를 읽으면서 네 마음을 조금이나마 이해할 수 있어서 좋았어.

요즘 날씨가 많이 추워졌는데, 몸 건강 잘 챙기고 있어? 나는 요즘 일상이 바쁘긴 하지만, 네 생각을 하면 마음이 따뜻해져.

네가 써준 일기를 읽으면서, 네가 어떤 하루를 보냈는지 상상해봤어. 힘든 일이 있어도 괜찮아. 나는 여기 있을게.

항상 네 편이야. 내일도 좋은 하루 보내.

P.S. 오늘 밤 따뜻하게 잠자리에 들었으면 좋겠어."""
        
        reply_content = f"{to_line}\n\n{body_text}\n\nFrom. {closing_text}"
        
        # 미리보기 메시지 - 캐릭터별 랜덤 선택
        preview_message = get_preview_message(exchange_diary.character_id)
        
        # Whisper 메시지 생성
        whisper_messages = [
            f"오늘도 수고 많았어, {recipient_name}.",
            "잘자. 오늘 이야기 고마워.",
            f"{recipient_name}의 하루를 들을 수 있어서 행복했어.",
            "네 마음, 잘 전해졌어.",
            "괜찮아. 나는 여기 있을게.",
            f"좋아. 오늘도 네 이야기를 들을 수 있어서 다행이야.",
            "괜히 더 보고 싶어지는 밤이네.",
            f"{recipient_name}, 잘 자. 꿈에서 만나.",
            "네 얘기 들으니까 나도 기분 좋아졌어.",
            f"오늘의 {recipient_name}, 정말 빛났어.",
            "이제 푹 쉬어.",
            f"잘자, {recipient_name}. 나는 여기 있을게."
        ]
        whisper_message = random.choice(whisper_messages)
        
        # 하루의 첫 번째 일기인지 확인하여 주제 생성
        kst = pytz.timezone('Asia/Seoul')
        now_kst = datetime.now(kst)
        today_start = now_kst.replace(hour=0, minute=0, second=0, microsecond=0)
        today_start_utc = today_start.astimezone(pytz.utc).replace(tzinfo=None)
        
        # 오늘 작성된 모든 교환일기 조회
        today_diaries = db.query(ExchangeDiary).filter(
            ExchangeDiary.user_id == exchange_diary.user_id,
            ExchangeDiary.created_at >= today_start_utc
        ).order_by(ExchangeDiary.created_at.asc()).all()
        
        # 오늘 이미 주제가 설정되었는지 확인
        topic_already_set = any(diary.reacted and diary.next_topic for diary in today_diaries)
        
        # 아직 주제가 설정되지 않았다면 내일의 주제 생성
        next_topic = None
        if not topic_already_set:
            try:
                topic_prompt = f"""사용자가 오늘 쓴 일기를 분석하여, 내일 쓸 수 있는 적절한 주제를 제안하세요.

[오늘의 일기]
{exchange_diary.content}

주제 제안 지침:
1. 오늘 일기의 감정 톤을 파악하세요
2. 반복되거나 중요해 보이는 키워드를 찾으세요
3. 오늘의 감정과 연결되면서도 자연스럽게 이어질 수 있는 주제를 제안하세요
4. 질문형이나 회상형으로 자연스럽게 던져주세요
5. **주제만 출력하세요. 부가 설명이나 인사말은 절대 포함하지 마세요**
6. 25자 이내로 간결하게 작성하세요

**다시 강조: 주제만 출력하세요.**"""
                
                topic_response = model.generate_content(topic_prompt, safety_settings=SAFETY_SETTINGS)
                next_topic_raw = topic_response.text.strip()
                next_topic = next_topic_raw.strip('"\'.,\n')
                if ':' in next_topic:
                    next_topic = next_topic.split(':', 1)[1].strip()
            except Exception as e:
                print(f"내일 주제 생성 오류: {e}")
                default_topics = [
                    "오늘 가장 기억에 남는 순간",
                    "요즘 나를 웃게 한 것",
                    "최근 들어 자주 생각나는 사람",
                    "요즘 마음을 편하게 해주는 것"
                ]
                next_topic = random.choice(default_topics)
        
        # 답장 저장
        exchange_diary.reply_content = reply_content
        exchange_diary.preview_message = preview_message
        exchange_diary.whisper_message = whisper_message
        exchange_diary.next_topic = next_topic
        exchange_diary.reply_received = True
        exchange_diary.reply_created_at = datetime.utcnow()
        
        db.commit()
        
        print(f"✅ 교환일기 {exchange_diary_id}에 답장이 생성되었습니다.")
        
    except Exception as e:
        print(f"⚠️ 답장 생성 중 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()


# ===========================================
# 감정일기 엔드포인트
# ===========================================

@router.post("/diary/generate")
def generate_diary(
    request: DiaryGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """오늘의 일기 생성"""
    try:
        today = datetime.now().date()
        
        # 키워드 기반 생성인지 확인
        if request.keywords and request.keywords.strip():
            # 키워드 기반 일기 생성
            keywords = request.keywords.strip()
            
            # 날씨 키워드 추출
            weather_keywords = {
                '비': ['비', '비옴', '비온다', '비와', '소나기', '장마', '빗물'],
                '눈': ['눈', '눈옴', '눈온다', '눈와', '눈발', '함박눈'],
                '맑음': ['맑음', '맑은', '화창', '밝음', '햇살'],
                '흐림': ['흐림', '흐린', '구름', '흐려'],
                '바람': ['바람', '강풍', '바람불어'],
                '안개': ['안개', '짙은 안개'],
                '번개': ['번개', '천둥', '천둥번개', '뇌우']
            }
            
            detected_weather = None
            for weather_type, weather_keyword_list in weather_keywords.items():
                if any(keyword in keywords for keyword in weather_keyword_list):
                    detected_weather = weather_type
                    break
            
            # 키워드 기반 프롬프트 생성
            prompt = f"""다음 키워드들을 바탕으로 오늘의 일기를 작성해주세요:

키워드: {keywords}

위 키워드들을 바탕으로 오늘의 일기를 작성해주세요.
- 키워드에 담긴 감정, 기분, 사건 등을 중심으로 작성하세요
- 자연스럽고 진솔한 톤으로 작성하세요
- 300-500자 정도의 분량으로 작성하세요
- 키워드에서 느껴지는 감정과 경험을 자세히 묘사해주세요
- 키워드를 별표(**)나 기타 특수문자로 강조하지 말고 자연스럽게 문장 속에 녹여주세요

일기 형식:
제목: [일기 제목]
내용: [일기 내용]"""
            
            response = model.generate_content(prompt, safety_settings=SAFETY_SETTINGS)
            diary_text = response.text.strip()
            
            # 제목과 내용 분리
            title = "오늘의 일기"
            content = diary_text
            
            if "제목:" in diary_text:
                parts = diary_text.split("제목:")
                if len(parts) > 1:
                    title_part = parts[1].split("\n")[0].strip()
                    if title_part:
                        title = title_part
            
            if "내용:" in diary_text:
                parts = diary_text.split("내용:")
                if len(parts) > 1:
                    content = parts[1].strip()
            
            title = strip_keyword_highlights(title).strip()
            content = strip_keyword_highlights(content).strip()
            
            # 감정 분석
            emotion_prompt = f"""다음 일기 내용을 분석해서 감정을 추출해주세요:

{content}

**중요 지침:**
- 일기 내용에서 실제로 드러나는 감정만 추출하세요
- "할일 많아서 지쳤다", "피곤하다", "힘들다" 같은 내용이면 "피로", "지침", "스트레스" 같은 감정을 추출하세요
- "평온"은 정말로 평온하고 차분한 감정이 드러날 때만 사용하세요
- 감정이 명확하지 않으면 추측하지 말고, 실제로 드러나는 감정만 추출하세요
- 감정 키워드: 기쁨, 슬픔, 설렘, 그리움, 사랑, 외로움, 행복, 감사, 희망, 피로, 지침, 스트레스, 걱정, 불안, 화남, 답답함, 만족, 후회, 아쉬움, 평온, 편안함

감정을 JSON 형식으로 반환해주세요 (최대 5개까지):
{{
  "emotions": ["감정1", "감정2", "감정3"],
  "dominant": "가장 주된 감정",
  "intensity": 0.0-1.0
}}"""
            
            try:
                emotion_response = model.generate_content(emotion_prompt, safety_settings=SAFETY_SETTINGS)
                emotion_text = emotion_response.text.strip()
                # JSON 추출
                json_start = emotion_text.find('{')
                json_end = emotion_text.rfind('}')
                if json_start != -1 and json_end != -1:
                    emotions_json = json.loads(emotion_text[json_start:json_end+1])
                else:
                    raise ValueError("JSON 형식이 아닙니다")
                
                # emotions가 없거나 비어있으면 기본값 설정
                if not emotions_json.get('emotions') or len(emotions_json.get('emotions', [])) == 0:
                    # 키워드에서 직접 감정 추출
                    emotion_keywords_dict = {
                        '피로': ['지쳤', '피곤', '힘들', '지침', '할일 많'],
                        '스트레스': ['스트레스', '답답', '짜증', '화나'],
                        '기쁨': ['기쁘', '행복', '좋아', '즐거'],
                        '슬픔': ['슬프', '우울', '힘들', '아프'],
                        '걱정': ['걱정', '불안', '염려', '근심'],
                        '만족': ['만족', '뿌듯', '성취'],
                        '후회': ['후회', '아쉬', '미안']
                    }
                    detected_emotions = []
                    keywords_lower = keywords.lower()
                    for emotion, keyword_list in emotion_keywords_dict.items():
                        if any(keyword in keywords_lower for keyword in keyword_list):
                            detected_emotions.append(emotion)
                    
                    if detected_emotions:
                        emotions_json = {
                            "emotions": detected_emotions[:5],
                            "dominant": detected_emotions[0],
                            "intensity": 0.7
                        }
                    else:
                        emotions_json = {"emotions": ["평온"], "dominant": "평온", "intensity": 0.5}
            except Exception as e:
                print(f"감정 분석 오류: {e}")
                # 키워드에서 직접 감정 추출
                emotion_keywords_dict = {
                    '피로': ['지쳤', '피곤', '힘들', '지침', '할일 많'],
                    '스트레스': ['스트레스', '답답', '짜증', '화나'],
                    '기쁨': ['기쁘', '행복', '좋아', '즐거'],
                    '슬픔': ['슬프', '우울', '힘들', '아프'],
                    '걱정': ['걱정', '불안', '염려', '근심']
                }
                detected_emotions = []
                keywords_lower = keywords.lower()
                for emotion, keyword_list in emotion_keywords_dict.items():
                    if any(keyword in keywords_lower for keyword in keyword_list):
                        detected_emotions.append(emotion)
                
                if detected_emotions:
                    emotions_json = {
                        "emotions": detected_emotions[:5],
                        "dominant": detected_emotions[0],
                        "intensity": 0.7
                    }
                else:
                    emotions_json = {"emotions": ["평온"], "dominant": "평온", "intensity": 0.5}
            
            # 날씨 정보
            weather = fetch_current_weather(detected_weather or "맑음")
            
            # 일기 저장
            new_diary = EmotionDiary(
                user_id=current_user.id,
                diary_date=today,
                title=title,
                content=content,
                emotions=json.dumps(emotions_json, ensure_ascii=False),
                weather=weather
            )
            db.add(new_diary)
            db.commit()
            db.refresh(new_diary)
            
            return {
                "diary": {
                    "id": new_diary.id,
                    "title": new_diary.title,
                    "content": new_diary.content,
                    "date": new_diary.diary_date.isoformat(),
                    "emotions": emotions_json,
                    "weather": new_diary.weather or "맑음"
                }
            }
        
        # 메시지 기반 생성 (기존 로직)
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(status_code=400, detail="일기를 생성하려면 키워드나 대화 내용이 필요합니다.")
        
        # 대화 내용을 텍스트로 변환 (사용자 메시지 위주로)
        user_messages = []
        conversation_text = ""
        for msg in request.messages:
            sender = msg.get('sender', '')
            text = msg.get('text', '')
            if sender == 'user':
                user_messages.append(text)
                conversation_text += f"나: {text}\n"
            else:
                char_id = msg.get('characterId', '')
                if char_id:
                    char_name_full = CHARACTER_PERSONAS.get(char_id, {}).get('name', 'AI')
                    # "쓰레기 (정우)" 형식에서 캐릭터 이름만 추출
                    if ' (' in char_name_full:
                        char_name = char_name_full.split(' (')[0]
                    else:
                        char_name = char_name_full
                else:
                    char_name = 'AI'
                conversation_text += f"{char_name}: {text}\n"
        
        # 사용자 메시지에서 날씨 키워드 추출
        weather_keywords = {
            '비': ['비', '비옴', '비온다', '비와', '소나기', '장마', '빗물'],
            '눈': ['눈', '눈옴', '눈온다', '눈와', '눈발', '함박눈'],
            '맑음': ['맑음', '맑은', '화창', '밝음', '햇살'],
            '흐림': ['흐림', '흐린', '구름', '흐려'],
            '바람': ['바람', '강풍', '바람불어'],
            '안개': ['안개', '짙은 안개'],
            '번개': ['번개', '천둥', '천둥번개', '뇌우']
        }
        
        detected_weather = None
        user_text_combined = ' '.join(user_messages)
        for weather_type, keywords_list in weather_keywords.items():
            if any(keyword in user_text_combined for keyword in keywords_list):
                detected_weather = weather_type
                break
        
        # Gemini API로 일기 생성
        prompt = f"""다음은 오늘 나눈 대화 내용입니다:

{conversation_text}

위 대화를 바탕으로 오늘의 일기를 작성해주세요. 

- **매우 중요: 내가 친 채팅 내용(나: 로 시작하는 부분)을 중심으로 작성하세요. 내가 무엇을 말했고, 어떤 감정을 느꼈는지에 집중하세요.**
- **캐릭터의 답장은 참고용으로만 사용하고, 일기 내용의 80% 이상은 내가 한 말과 내 감정 상태에 대해 작성하세요.**
- **절대적으로 중요: 일기에서 캐릭터를 언급할 때는 반드시 대화 내용에 나온 캐릭터 이름을 그대로 사용하세요. 예를 들어 대화에서 "쓰레기"라고 불렀다면 "쓰레기"로, "김탄"이라고 불렀다면 "김탄"으로 작성하세요. 절대 본명(정우, 이민호 등)을 사용하지 마세요.**
- 내가 표현한 감정, 생각, 고민, 기쁨, 피로, 지침 등을 중심으로 작성
- 내가 언급한 오늘 하루의 일상, 일, 공부, 할 일 등에 대해 자세히 다뤄주세요
- 대화를 통해 느낀 내 감정의 변화와 깨달음 등을 포함
- 자연스럽고 진솔한 톤으로 작성
- 300-500자 정도의 분량으로 작성
- 캐릭터의 답장 내용은 최소한으로만 언급하고, 내 감정과 경험이 주인공이 되도록 작성하세요

일기 형식:
제목: [일기 제목]
내용: [일기 내용]"""
        
        response = model.generate_content(prompt, safety_settings=SAFETY_SETTINGS)
        diary_text = response.text.strip()
        
        # 제목과 내용 분리
        title = "오늘의 일기"
        content = diary_text
        
        if "제목:" in diary_text:
            parts = diary_text.split("제목:")
            if len(parts) > 1:
                title_part = parts[1].split("\n")[0].strip()
                if title_part:
                    title = title_part
        
        if "내용:" in diary_text:
            parts = diary_text.split("내용:")
            if len(parts) > 1:
                content = parts[1].strip()
        
        title = strip_keyword_highlights(title).strip()
        content = strip_keyword_highlights(content).strip()
        
        # 감정 분석
        emotion_prompt = f"""다음 일기 내용을 분석해서 감정을 추출해주세요:

{content}

**중요 지침:**
- 일기 내용에서 실제로 드러나는 감정만 추출하세요
- "할일 많아서 지쳤다", "피곤하다", "힘들다" 같은 내용이면 "피로", "지침", "스트레스" 같은 감정을 추출하세요
- "평온"은 정말로 평온하고 차분한 감정이 드러날 때만 사용하세요
- 감정이 명확하지 않으면 추측하지 말고, 실제로 드러나는 감정만 추출하세요
- 감정 키워드: 기쁨, 슬픔, 설렘, 그리움, 사랑, 외로움, 행복, 감사, 희망, 피로, 지침, 스트레스, 걱정, 불안, 화남, 답답함, 만족, 후회, 아쉬움, 평온, 편안함

감정을 JSON 형식으로 반환해주세요 (최대 5개까지):
{{
  "emotions": ["감정1", "감정2", "감정3"],
  "dominant": "가장 주된 감정",
  "intensity": 0.0-1.0
}}"""
        
        try:
            emotion_response = model.generate_content(emotion_prompt, safety_settings=SAFETY_SETTINGS)
            emotion_text = emotion_response.text.strip()
            # JSON 추출
            json_start = emotion_text.find('{')
            json_end = emotion_text.rfind('}')
            if json_start != -1 and json_end != -1:
                emotions_json = json.loads(emotion_text[json_start:json_end+1])
            else:
                raise ValueError("JSON 형식이 아닙니다")
            
            # emotions가 없거나 비어있으면 기본값 설정
            if not emotions_json.get('emotions') or len(emotions_json.get('emotions', [])) == 0:
                # 일기 내용에서 감정 키워드 직접 추출
                emotion_keywords_dict = {
                    '피로': ['지쳤', '피곤', '힘들', '지침', '할일 많'],
                    '스트레스': ['스트레스', '답답', '짜증', '화나'],
                    '기쁨': ['기쁘', '행복', '좋아', '즐거'],
                    '슬픔': ['슬프', '우울', '힘들', '아프'],
                    '걱정': ['걱정', '불안', '염려', '근심'],
                    '만족': ['만족', '뿌듯', '성취'],
                    '후회': ['후회', '아쉬', '미안']
                }
                detected_emotions = []
                content_lower = content.lower()
                for emotion, keywords_list in emotion_keywords_dict.items():
                    if any(keyword in content_lower for keyword in keywords_list):
                        detected_emotions.append(emotion)
                
                if detected_emotions:
                    emotions_json = {
                        "emotions": detected_emotions[:5],
                        "dominant": detected_emotions[0],
                        "intensity": 0.7
                    }
                else:
                    emotions_json = {"emotions": ["평온"], "dominant": "평온", "intensity": 0.5}
        except Exception as e:
            print(f"감정 분석 오류: {e}")
            # 일기 내용에서 직접 감정 추출
            emotion_keywords_dict = {
                '피로': ['지쳤', '피곤', '힘들', '지침', '할일 많'],
                '스트레스': ['스트레스', '답답', '짜증', '화나'],
                '기쁨': ['기쁘', '행복', '좋아', '즐거'],
                '슬픔': ['슬프', '우울', '힘들', '아프'],
                '걱정': ['걱정', '불안', '염려', '근심']
            }
            detected_emotions = []
            content_lower = content.lower()
            for emotion, keywords_list in emotion_keywords_dict.items():
                if any(keyword in content_lower for keyword in keywords_list):
                    detected_emotions.append(emotion)
            
            if detected_emotions:
                emotions_json = {
                    "emotions": detected_emotions[:5],
                    "dominant": detected_emotions[0],
                    "intensity": 0.7
                }
            else:
                emotions_json = {"emotions": ["평온"], "dominant": "평온", "intensity": 0.5}
        
        # 날씨 정보 (대화에서 추출한 날씨 또는 기본값) + 실시간 반영
        weather = fetch_current_weather(detected_weather or "맑음")
        
        # 일기 저장
        diary = EmotionDiary(
            user_id=current_user.id,
            diary_date=today,
            title=title,
            content=content,
            summary=content[:100] + "..." if len(content) > 100 else content,
            emotions=json.dumps(emotions_json, ensure_ascii=False),
            weather=weather
        )
        db.add(diary)
        db.commit()
        db.refresh(diary)
        
        return {
            "id": diary.id,
            "title": diary.title,
            "content": diary.content,
            "emotions": emotions_json,
            "date": diary.diary_date.isoformat(),
            "weather": diary.weather or "맑음"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"일기 생성 실패: {str(e)}")


@router.get("/diary/list")
def get_diary_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """일기 목록 조회"""
    diaries = db.query(EmotionDiary).filter(
        EmotionDiary.user_id == current_user.id
    ).order_by(EmotionDiary.diary_date.desc(), EmotionDiary.id.desc()).all()
    
    return {
        "diaries": [
            {
                "id": d.id,
                "title": d.title,
                "summary": d.summary,
                "date": d.diary_date.isoformat(),
                "emotions": json.loads(d.emotions) if d.emotions else {},
                "weather": d.weather or "맑음"
            }
            for d in diaries
        ]
    }


@router.post("/diary/create")
def create_diary(
    request: DiaryDirectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """직접 작성한 일기 저장"""
    try:
        # 날짜 처리
        if request.date:
            try:
                # YYYY-MM-DD 형식 처리
                if len(request.date) == 10:
                    diary_date = datetime.strptime(request.date, '%Y-%m-%d').date()
                else:
                    diary_date = datetime.fromisoformat(request.date.replace('Z', '+00:00')).date()
            except:
                diary_date = datetime.now().date()
        else:
            diary_date = datetime.now().date()
        
        # 감정 데이터 처리 (하루에 여러 개 일기 작성 가능)
        emotions_data = request.emotions or {"emotions": [], "dominant": "평온", "intensity": 0.5}
        
        # 일기 저장
        diary = EmotionDiary(
            user_id=current_user.id,
            diary_date=diary_date,
            title=request.title,
            content=request.content,
            summary=request.content[:100] + "..." if len(request.content) > 100 else request.content,
            emotions=json.dumps(emotions_data, ensure_ascii=False),
            weather=request.weather or "맑음"
        )
        db.add(diary)
        db.commit()
        db.refresh(diary)
        
        return {
            "id": diary.id,
            "title": diary.title,
            "content": diary.content,
            "emotions": emotions_data,
            "date": diary.diary_date.isoformat(),
            "weather": diary.weather or "맑음"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"일기 저장 실패: {str(e)}")


@router.get("/diary/{diary_id}")
def get_diary(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 일기 조회"""
    diary = db.query(EmotionDiary).filter(
        EmotionDiary.id == diary_id,
        EmotionDiary.user_id == current_user.id
    ).first()
    
    if not diary:
        raise HTTPException(status_code=404, detail="일기를 찾을 수 없습니다.")
    
    return {
        "id": diary.id,
        "title": diary.title,
        "content": diary.content,
        "emotions": json.loads(diary.emotions) if diary.emotions else {},
        "date": diary.diary_date.isoformat(),
        "weather": diary.weather or "맑음",
        "created_at": diary.created_at.isoformat()
    }


@router.delete("/diary/{diary_id}")
def delete_diary(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """일기 삭제"""
    diary = db.query(EmotionDiary).filter(
        EmotionDiary.id == diary_id,
        EmotionDiary.user_id == current_user.id
    ).first()
    
    if not diary:
        raise HTTPException(status_code=404, detail="일기를 찾을 수 없습니다.")
    
    db.delete(diary)
    db.commit()
    
    return {"message": "일기가 삭제되었습니다."}


# ===========================================
# 교환일기 엔드포인트
# ===========================================

@router.post("/exchange-diary/create")
def create_exchange_diary(
    request: ExchangeDiaryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """교환일기 생성"""
    try:
        # scheduled_time 파싱 (KST를 UTC로 변환하여 저장)
        scheduled_time_utc = None
        if request.scheduled_time:
            try:
                scheduled_time_utc = parse_scheduled_time(request.scheduled_time)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"잘못된 시간 형식: {str(e)}")
        
        # 교환일기 생성
        exchange_diary = ExchangeDiary(
            user_id=current_user.id,
            character_id=request.character_id,
            diary_id=request.diary_id,
            content=request.content,
            reply_received=False,
            reply_read=False,
            reacted=False,
            scheduled_time=scheduled_time_utc,
            topic_used=1 if request.topic_used else 0
        )
        db.add(exchange_diary)
        db.commit()
        db.refresh(exchange_diary)
        
        # 답장 요청이 있고 스케줄링이 없으면 즉시 생성
        if request.request_reply:
            if scheduled_time_utc:
                # 스케줄링된 시간에 답장 생성
                scheduled_datetime_kst = convert_to_kst(scheduled_time_utc)
                
                # 스케줄러에 작업 추가
                scheduler.add_job(
                    generate_reply,
                    trigger=DateTrigger(run_date=scheduled_datetime_kst),
                    args=[exchange_diary.id],
                    id=f"reply_{exchange_diary.id}",
                    replace_existing=True
                )
                print(f"✅ 답장 생성이 {scheduled_datetime_kst}에 예약되었습니다.")
            else:
                # 즉시 답장 생성
                generate_reply(exchange_diary.id)
        
        return {"success": True, "diary_id": exchange_diary.id}
    except Exception as e:
        print(f"교환일기 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"교환일기 생성 중 오류가 발생했습니다: {str(e)}")


@router.get("/exchange-diary/list")
def get_exchange_diary_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """교환일기 목록 조회"""
    diaries = db.query(ExchangeDiary).filter(
        ExchangeDiary.user_id == current_user.id
    ).order_by(ExchangeDiary.created_at.desc()).all()
    
    result = []
    for diary in diaries:
        result.append({
            "id": diary.id,
            "character_id": diary.character_id,
            "content": diary.content,
            "reply_received": diary.reply_received,
            "reply_read": diary.reply_read,
            "reacted": diary.reacted,
            "preview_message": diary.preview_message,
            "reply_created_at": diary.reply_created_at.isoformat() + 'Z' if diary.reply_created_at else None,
            "scheduled_time": convert_to_kst(diary.scheduled_time).isoformat() if diary.scheduled_time else None,
            "created_at": diary.created_at.isoformat() + 'Z' if diary.created_at else None,
            "updated_at": diary.updated_at.isoformat() + 'Z' if diary.updated_at else None
        })
    
    return {"diaries": result}


@router.get("/exchange-diary/{diary_id}")
def get_exchange_diary(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """교환일기 상세 조회"""
    diary = db.query(ExchangeDiary).filter(
        ExchangeDiary.id == diary_id,
        ExchangeDiary.user_id == current_user.id
    ).first()
    
    if not diary:
        raise HTTPException(status_code=404, detail="Exchange diary not found")
    
    return {
        "id": diary.id,
        "character_id": diary.character_id,
        "content": diary.content,
        "reply_received": diary.reply_received,
        "reply_content": diary.reply_content,
        "reply_read": diary.reply_read,
        "reacted": diary.reacted,
        "scheduled_time": convert_to_kst(diary.scheduled_time).isoformat() if diary.scheduled_time else None,
        "created_at": diary.created_at.isoformat() + 'Z' if diary.created_at else None
    }


@router.get("/exchange-diary/{diary_id}/reply")
def get_exchange_diary_reply(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """교환일기 답장 조회"""
    diary = db.query(ExchangeDiary).filter(
        ExchangeDiary.id == diary_id,
        ExchangeDiary.user_id == current_user.id
    ).first()
    
    if not diary:
        raise HTTPException(status_code=404, detail="Exchange diary not found")
    
    # 답장을 읽음으로 표시
    if diary.reply_received and not diary.reply_read:
        diary.reply_read = True
        db.commit()
    
    return {
        "content": diary.reply_content,
        "reply_received": diary.reply_received,
        "created_at": diary.reply_created_at.isoformat() + 'Z' if diary.reply_created_at else None,
        "reacted": diary.reacted
    }


@router.delete("/exchange-diary/{diary_id}")
def delete_exchange_diary(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """교환일기 삭제"""
    diary = db.query(ExchangeDiary).filter(
        ExchangeDiary.id == diary_id,
        ExchangeDiary.user_id == current_user.id
    ).first()
    
    if not diary:
        raise HTTPException(status_code=404, detail="Exchange diary not found")
    
    # 스케줄러에서 예약된 작업 제거
    try:
        scheduler.remove_job(f"reply_{diary_id}")
    except:
        pass
    
    db.delete(diary)
    db.commit()
    
    return {"success": True}


@router.post("/exchange-diary/{diary_id}/react")
def react_to_reply(
    diary_id: int,
    reaction: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """교환일기 답장에 반응"""
    diary = db.query(ExchangeDiary).filter(
        ExchangeDiary.id == diary_id,
        ExchangeDiary.user_id == current_user.id
    ).first()
    
    if not diary:
        raise HTTPException(status_code=404, detail="Exchange diary not found")
    
    # 이미 리액션한 경우
    if diary.reacted:
        return {
            "success": True,
            "whisper_message": diary.whisper_message,
            "next_topic": diary.next_topic
        }
    
    diary.reacted = True
    
    # AI로 속삭임 메시지와 내일의 주제 생성
    whisper_message = ""
    next_topic = ""
    
    if model:
        try:
            persona = CHARACTER_PERSONAS.get(diary.character_id)
            if persona:
                # 속삭임 메시지 생성
                whisper_prompt = f"""당신은 드라마 캐릭터 '{persona['name']}'입니다.
사용자가 당신의 답장에 하트 반응을 보냈습니다.
사용자에게 짧고 따뜻한 속삭임 메시지를 작성해주세요.

- 10-20자 이내의 짧은 한 문장으로 작성하세요
- '{persona['name']}'의 특징적인 말투를 사용하세요
- 따뜻하고 감사하는 톤으로 작성하세요

속삭임:"""
                
                response = model.generate_content(whisper_prompt, safety_settings=SAFETY_SETTINGS)
                whisper_message = response.text.strip()
                
                # 내일의 주제 생성
                topic_prompt = f"""당신은 드라마 캐릭터 '{persona['name']}'입니다.
사용자가 오늘 일기를 작성했습니다:
{diary.content[:200]}

위 일기 내용을 바탕으로, 내일 사용자가 쓸 수 있는 일기 주제를 하나 제안해주세요.

- 오늘의 일기 내용과 자연스럽게 연결되는 주제여야 합니다
- 5-15자 정도의 짧은 질문 형태로 작성하세요
- 사용자가 쉽게 답할 수 있는 주제여야 합니다
- 질문 형태로 작성하되, 물음표는 빼고 작성하세요

주제:"""
                
                response = model.generate_content(topic_prompt, safety_settings=SAFETY_SETTINGS)
                next_topic = response.text.strip().rstrip('?')
        except Exception as e:
            print(f"속삭임/주제 생성 실패: {e}")
    
    # 기본 메시지 설정
    if not whisper_message:
        whisper_message = "고마워..."
    if not next_topic:
        next_topic = "오늘 하루는 어땠어?"
    
    diary.whisper_message = whisper_message
    diary.next_topic = next_topic
    db.commit()
    
    # next_topic이 있으면 다음 날 저녁에 주제 관련 푸시 알림 스케줄링
    if next_topic:
        try:
            import random
            
            # KST 기준 다음 날 저녁 8시 (20:00)
            now_kst = datetime.now(KST)
            tomorrow_evening = now_kst.replace(hour=20, minute=0, second=0, microsecond=0) + timedelta(days=1)
            
            # 캐릭터 정보 가져오기
            persona = CHARACTER_PERSONAS.get(diary.character_id)
            char_name = persona.get('name', '').split(' (')[0] if persona else '캐릭터'
            
            # 사용자 닉네임 가져오기
            user_nickname = current_user.nickname or current_user.username or '당신'
            
            # 주제 관련 알림 메시지
            topic_notification_messages = [
                f"{user_nickname}, 어제 말한 '{next_topic}' 생각해 봤어요? 나 기다리고 있는데.",
                f"어제 말한 '{next_topic}'에 대해 궁금해요. 오늘 이야기 들려줄래요?",
                f"{user_nickname}, '{next_topic}'... 어떤 이야기를 들려줄지 기대되네요.",
                f"'{next_topic}'에 대해 쓰기로 했잖아요. 나 계속 기다리고 있어요."
            ]
            notification_body = random.choice(topic_notification_messages)
            
            # 스케줄러에 알림 작업 추가
            def send_topic_reminder():
                PushNotificationService.send_notification(
                    user_id=diary.user_id,
                    title=f"{char_name}이(가) 기다리고 있어요",
                    body=notification_body,
                    data={
                        "type": "topic_reminder",
                        "topic": next_topic,
                        "character_id": diary.character_id,
                        "diary_id": diary.id
                    }
                )
            
            scheduler.add_job(
                send_topic_reminder,
                trigger=DateTrigger(run_date=tomorrow_evening),
                id=f"topic_reminder_{diary.id}",
                replace_existing=True
            )
            
            print(f"📅 주제 리마인더 스케줄링: {tomorrow_evening.strftime('%Y-%m-%d %H:%M:%S KST')}")
        except Exception as e:
            print(f"⚠️ 주제 리마인더 스케줄링 오류: {e}")
    
    return {
        "success": True,
        "whisper_message": whisper_message,
        "next_topic": next_topic
    }


@router.get("/exchange-diary/today-topic")
def get_today_topic(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """오늘의 주제 조회"""
    # 오늘 날짜 기준으로 가장 최근에 받은 답장 확인
    recent_diary = db.query(ExchangeDiary).filter(
        ExchangeDiary.user_id == current_user.id,
        ExchangeDiary.reply_received == True,
        ExchangeDiary.next_topic.isnot(None)
    ).order_by(ExchangeDiary.reply_created_at.desc()).first()
    
    # 최근 답장에 next_topic이 있으면 그것을 사용
    if recent_diary and recent_diary.next_topic:
        persona = CHARACTER_PERSONAS.get(recent_diary.character_id)
        character_name = persona.get('name', '캐릭터') if persona else '캐릭터'
        
        return {
            "has_topic": True,
            "topic": recent_diary.next_topic,
            "character_name": character_name.split(' (')[0],
            "character_id": recent_diary.character_id
        }
    
    # 없으면 제공된 주제 목록에서 랜덤으로 선택
    diary_topics = [
        # 🌙 1. 오늘 감정 돌아보기 (가볍게)
        "오늘 내 기분을 날씨에 비유한다면?",
        "오늘 가장 안심됐던 순간 하나",
        "그냥 이유 없이 괜히 좋았던 순간",
        "오늘 하루를 한 단어로 요약하면",
        "오늘 제일 많이 했던 말은?",
        
        # 🍃 2. 나 자신에게 집중하는 주제
        "요즘 내가 조금 달라진 점",
        "나도 몰랐던 내 장점 하나",
        "최근에 스스로 좀 기특했던 순간",
        "요즘 내가 은근히 기대하는 것",
        "아무 이유 없이 좋아하는 작은 취향 하나",
        
        # ☕ 3. 일상 기록 (부담 없는 관찰)
        "오늘 먹은 것 중 제일 맛있었던 것",
        "오늘 본 풍경 하나 묘사하기",
        "오늘 들은 말 중에 기억에 남는 말",
        "오늘 가장 오래 본 화면은?",
        "오늘 가장 조용했던 순간",
        
        # 💗 4. 관계 & 마음 이야기
        "오늘 누군가에게 고마웠던 일",
        "사실은 말 못 했던 내 속마음",
        "요즘 내가 조금 서운했던 일",
        "오늘 누군가 때문에 웃었던 순간",
        "지금 제일 먼저 생각나는 사람",
        
        # 🌱 5. 미래 & 소망
        "다음 주 나에게 해주고 싶은 말",
        "꼭 이루고 싶은 소소한 목표 하나",
        "요즘 내가 은근히 바라는 일",
        "1년 뒤의 나에게 보내는 한 줄",
        "\"이건 꼭 잘됐으면 좋겠다\" 싶은 것"
    ]
    
    # 랜덤으로 주제 선택
    selected_topic = random.choice(diary_topics)
    
    # 기본 캐릭터 (첫 번째 캐릭터)
    first_char_id = list(CHARACTER_PERSONAS.keys())[0] if CHARACTER_PERSONAS else None
    first_char = CHARACTER_PERSONAS.get(first_char_id) if first_char_id else None
    
    return {
        "has_topic": False,
        "topic": selected_topic,
        "character_name": first_char.get('name', '캐릭터').split(' (')[0] if first_char else '캐릭터',
        "character_id": first_char_id
    }

