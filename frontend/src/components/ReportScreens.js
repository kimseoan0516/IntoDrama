import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { psychologyReports } from '../utils/storage';
import html2canvas from 'html2canvas';
import { 
    PersonaCard, 
    TendencySlider, 
    KeywordSection, 
    InterpretationCard, 
    ActivityBottomSheet, 
    ReportDetailModal,
    formatMonthYear
} from './ReportComponents';
import { characterData } from '../constants/characterData';

const detectRomanceLevel = (text) => {
    if (!text) return 0;
    
    // 취향을 묻는 패턴 감지 (로맨스가 아닌 경우)
    const preferencePatterns = [
        /어떤\s+\w+\s*(좋아|조아|선호|취향)/,
        /무엇(을|를)\s*(좋아|조아|선호)/,
        /뭐\s*(좋아|조아|선호)/,
        /\w+\s*(좋아|조아|선호|취향)\s*(해|해요|하세요|하나|하니|하냐)/,
        /\w+\s*(종류|맛|스타일|타입)\s*(좋아|조아|선호)/,
        /(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미|취향|선호)\s*(좋아|조아|선호)/,
        /(좋아|조아|선호)\s*(하는|하는)\s*(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미)/,
        /(어떤|무엇|뭐)\s*(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미)/
    ];
    
    // 취향을 묻는 패턴이 있으면 로맨스 점수 0 반환
    const isPreferenceQuestion = preferencePatterns.some(pattern => pattern.test(text));
    if (isPreferenceQuestion) {
        return 0;
    }
    
    // 강한 로맨스 키워드 (가중치 높음)
    const strongKeywords = ['사랑해', '사랑', '설레', '설렘', '두근', '너무좋아', '완전좋아'];
    const normalKeywords = ['좋아해', '좋아', '보고 싶', '보고싶', '너 생각', '그리워', '좋아한다', '마음', '심장', '떨려', '행복', '기쁨', '웃음', '미소'];
    
    let score = 0;
    
    // 강한 키워드 체크 (가중치: 1.0)
    strongKeywords.forEach(k => {
        if (text.includes(k)) score += 1.0;
    });
    
    // 일반 키워드 체크 (가중치: 0.7)
    normalKeywords.forEach(k => {
        if (text.includes(k)) score += 0.7;
    });
    
    // 말줄임표와 이모지 체크 (가중치: 0.5)
    if (text.endsWith('...') || text.endsWith('…')) score += 0.5;
    
    // 로맨스 이모지 체크 (가중치: 0.8)
    const romanceEmojiCount = (text.match(/[❤💕💖💗💘💝😍🥰😘]/g) || []).length;
    score += romanceEmojiCount * 0.8;
    
    // 복합 표현 보너스
    if (/(너무|정말|진짜|완전|엄청).{0,3}(좋아|사랑|행복|설레)/.test(text)) {
        score += 0.8;
    }
    
    return Math.min(score, 1);
};

const detectComfortLevel = (text) => {
    if (!text) return 0;
    
    // 위로를 필요로 하는 강한 키워드 (가중치 높음)
    const strongNeedComfortKeywords = ['힘들어', '외로워', '슬퍼', '아파', '우울', '지쳐', '괴로워', '고통'];
    
    // 위로를 주는 키워드
    const givingComfortKeywords = ['괜찮아', '힘내', '위로', '안아', '따뜻', '포근', '편안', '안심'];
    
    // 위로가 필요한 일반 키워드
    const needComfortKeywords = ['걱정', '아픔', '아프', '울어', '피곤', '힘들', '지침', '외로움', '슬픔', '불안'];
    
    let score = 0;
    
    // 강한 위로 필요 키워드 체크 (가중치: 1.0)
    strongNeedComfortKeywords.forEach(k => {
        if (text.includes(k)) score += 1.0;
    });
    
    // 위로를 주는 키워드 체크 (가중치: 0.7)
    givingComfortKeywords.forEach(k => {
        if (text.includes(k)) score += 0.7;
    });
    
    // 일반 위로 필요 키워드 체크 (가중치: 0.7)
    needComfortKeywords.forEach(k => {
        if (text.includes(k)) score += 0.7;
    });
    
    // 슬픔 이모지 체크 (가중치: 0.8)
    const sadEmojiCount = (text.match(/[😢😭😔😞😟😕🙁☹️😣😖😫😩💔]/g) || []).length;
    score += sadEmojiCount * 0.8;
    
    // 복합 표현 보너스
    if (/(너무|정말|진짜|완전|엄청).{0,3}(힘들|외로|슬퍼|아파|우울)/.test(text)) {
        score += 0.8;
    }
    
    return Math.min(score, 1);
};

const detectConflictLevel = (text) => {
    if (!text) return 0;
    
    // 강한 갈등 키워드 (가중치 높음) - "짜증"은 제외 (별도 처리)
    const strongConflictKeywords = ['화나', '분노', '미워', '화', '최악', '못참겠', '싫어'];
    
    // 일반 갈등 키워드
    const conflictKeywords = ['이해 못해', '실망', '아쉬워', '서운', '섭섭', '억울', '원망', '답답', '불만', '후회'];
    
    // "지친다"와 함께 갈등으로 판단할 키워드 - "짜증" 제외
    const conflictWithTired = ['화나', '싫어', '미워', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망', '답답'];
    
    let score = 0;
    const hasTired = text.includes('지치') || text.includes('피곤') || text.includes('힘들');
    
    // "짜증"은 실제로 화를 내거나 짜증을 내는 표현일 때만 갈등으로 판단
    // "짜증나", "짜증난다", "짜증나서", "짜증내", "짜증낸다", "짜증나는" 같은 동사 형태
    // 또는 상대를 향한 화난 표현과 함께 있을 때
    const hasActualAnnoyance = /짜증(나|내|낸|나는|났|날)/.test(text) || 
                                /(너|당신|네|니|그쪽).{0,5}(때문|탓|잘못|화나|짜증)/.test(text);
    
    if (hasActualAnnoyance) {
        score += 1.0; // 실제 짜증 표현이 있을 때만 갈등 점수 추가
    }
    
    // 강한 갈등 키워드 체크 (가중치: 1.0)
    strongConflictKeywords.forEach(k => {
        if (text.includes(k)) {
            score += 1.0;
        }
    });
    
    // 일반 갈등 키워드 체크 (가중치: 0.7)
    conflictKeywords.forEach(k => {
        if (text.includes(k)) {
            score += 0.7;
        }
    });
    
    // "지친다" + 화나고 섭섭한 키워드가 함께 있을 때만 갈등 점수 추가
    if (hasTired) {
        const hasConflictWithTired = conflictWithTired.some(k => text.includes(k));
        if (hasConflictWithTired) {
            score += 0.6;
        }
        // "지친다" + 실제 짜증 표현이 함께 있을 때도 갈등으로 판단
        if (hasActualAnnoyance) {
            score += 0.6;
        }
    }
    
    // "답답"은 "지친다"와 함께 있을 때만 갈등으로 판단
    if (text.includes('답답')) {
        if (hasTired) {
            score += 0.6;
        }
    }
    
    // 화난 이모지 체크 (가중치: 0.8)
    const angryEmojiCount = (text.match(/[😤😠😡💢]/g) || []).length;
    score += angryEmojiCount * 0.8;
    
    // 복합 표현 보너스 (짜증은 실제 표현일 때만)
    if (hasActualAnnoyance && /(너무|정말|진짜|완전|엄청).{0,3}(짜증)/.test(text)) {
        score += 0.8;
    }
    if (/(너무|정말|진짜|완전|엄청).{0,3}(화|싫|미워|답답)/.test(text)) {
        score += 0.8;
    }
    
    return Math.min(score, 1);
};

// 백엔드 리포트를 프론트엔드 형식으로 변환
const convertBackendReportToFrontendFormat = (backendReport, messages, userProfile) => {
    if (!backendReport) return null;
    
    const { dominantMood, emotionScores, keywords, moodTimeline, messageTimeline, totalMessages, date } = backendReport;
    
    // 프론트엔드 형식으로 변환
    const report = {
        date: date || new Date().toISOString(),
        dominantMood: dominantMood || 'neutral',
        stats: {
            romanceScore: emotionScores?.romance || 0,
            comfortScore: emotionScores?.comfort || 0,
            conflictScore: emotionScores?.conflict || 0
        },
        keywords: keywords || [],
        moodTimeline: moodTimeline || {},
        messageTimeline: messageTimeline || [],
        totalMessages: totalMessages || 0
    };
    
    // 추가 필드 생성 (기존 generateReport와 호환되도록)
    const avgRomanceScore = report.stats.romanceScore;
    const avgComfortScore = report.stats.comfortScore;
    const avgConflictScore = report.stats.conflictScore;
    
    // 에피소드 요약
    let episodeSummary = '';
    if (dominantMood === 'romance') {
        episodeSummary = '로맨틱한 감정이 주를 이루는 대화였습니다.';
    } else if (dominantMood === 'comfort') {
        episodeSummary = '위로와 안정을 찾는 대화였습니다.';
    } else if (dominantMood === 'conflict') {
        episodeSummary = '갈등과 긴장감이 느껴지는 대화였습니다.';
    } else {
        episodeSummary = '평온하고 중립적인 대화였습니다.';
    }
    
    // 다음 장면 제안
    let nextSceneSuggestion = '';
    if (dominantMood === 'romance') {
        nextSceneSuggestion = '더 깊은 감정의 교류를 나누는 장면';
    } else if (dominantMood === 'comfort') {
        nextSceneSuggestion = '서로를 더 잘 이해하고 공감하는 장면';
    } else if (dominantMood === 'conflict') {
        nextSceneSuggestion = '갈등을 해소하고 화해하는 장면';
    } else {
        nextSceneSuggestion = '더 깊은 이야기를 나누는 장면';
    }
    
    // 심리 분석
    const analysis = `최근 대화에서 ${dominantMood === 'romance' ? '따뜻한 감정과 교감' : dominantMood === 'comfort' ? '위로와 안정을 찾으려는 마음' : dominantMood === 'conflict' ? '갈등과 복잡한 감정' : '다양한 감정'}이 많이 느껴졌어요. 많이 힘드셨죠?`;
    
    // 심리적 포지션
    const position = `지금은 ${dominantMood === 'romance' ? '따뜻한 감정을 나누고 싶은 순간' : dominantMood === 'comfort' ? '위로와 공감이 필요한 때' : dominantMood === 'conflict' ? '마음의 짐을 내려놓아도 좋은 때' : '조용히 쉬어도 좋은 하루'}입니다.`;
    
    // 전문가 해석
    const interpretation = `최근 대화를 보니 ${dominantMood === 'romance' ? '따뜻한 감정을 나누려는 마음이 많이 느껴졌어요. 지금 이 순간의 감정을 소중히 여기시고, 당신의 마음을 알아주고 싶어요.' : dominantMood === 'comfort' ? '위로와 안정을 찾으려는 마음이 많이 느껴졌어요. 외로움이나 그리움이 느껴지는 하루였나요? 당신의 마음을 알아주고 싶어요.' : dominantMood === 'conflict' ? '갈등과 복잡한 감정이 많이 느껴졌어요. 많이 힘드셨죠? 지금은 무리하지 말고 잠시 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.' : '평온하지만 어딘가 지친 마음이 느껴졌어요. 지금은 조용히 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.'}`;
    
    // 심리적 문제 진단
    const psychologicalIssues = [];
    if (avgConflictScore > 30) {
        psychologicalIssues.push({
            title: '갈등 관리 필요',
            severity: avgConflictScore > 50 ? '높음' : '중간',
            description: '대화에서 갈등 감정이 자주 나타나고 있습니다.'
        });
    }
    if (avgComfortScore > 40) {
        psychologicalIssues.push({
            title: '위로 필요',
            severity: '중간',
            description: '위로와 안정을 찾는 감정이 강하게 나타나고 있습니다.'
        });
    }
    
    // 심리 분석 기반 맞춤 추천 활동 생성 (더 다양하게)
    const suggestions = [];
    
    // 1. 휴식 관련 추천 (dominantMood와 점수에 따라 다양하게)
    if (dominantMood === 'conflict' || avgConflictScore > 30) {
        const restVariants = [
            {
                activity: '충분한 휴식 취하기',
                icon: '😴',
                description: '따뜻한 차 한 잔과 함께 30분 동안 핸드폰을 멀리해 보세요. 깊게 숨을 들이쉬고 내쉬는 호흡 운동을 10회 반복하면 마음이 한결 편안해집니다.',
                why: '충분한 휴식은 정신 건강의 기초입니다. 피로가 쌓이면 감정 조절 능력이 떨어지고, 스트레스에 더 취약해집니다.',
                practiceGuide: '오늘 밤 11시 전에 잠자리에 들고, 내일 아침 일어나서 창문을 열고 깊게 숨을 3번 들이쉬어 보세요.'
            },
            {
                activity: '명상과 마음챙김',
                icon: '🧘',
                description: '조용한 공간에서 10분간 눈을 감고 깊게 호흡하세요. 생각이 떠오르면 그냥 지켜보고 흘려보내세요. 마음이 차분해질 거예요.',
                why: '명상은 스트레스를 줄이고 마음의 평온을 찾는 데 도움이 됩니다. 정기적으로 실천하면 감정 조절 능력이 향상됩니다.',
                practiceGuide: '매일 아침 일어나서 5분씩 명상하는 습관을 만들어 보세요.'
            },
            {
                activity: '자연 속에서 휴식',
                icon: '🌳',
                description: '공원이나 산책로를 천천히 걸으며 자연의 소리를 들어보세요. 나무를 보며 깊게 숨을 쉬면 마음이 한결 가벼워집니다.',
                why: '자연과의 접촉은 스트레스를 줄이고 심리적 안정감을 높여줍니다.',
                practiceGuide: '이번 주말에 가까운 공원이나 숲길을 30분 이상 걸어보세요.'
            }
        ];
        suggestions.push(restVariants[Math.floor(Math.random() * restVariants.length)]);
    } else if (dominantMood === 'romance' || avgRomanceScore > 30) {
        const restVariants = [
            {
                activity: '충분한 휴식 취하기',
                icon: '😴',
                description: '부드러운 음악을 들으며 따뜻한 물로 샤워하고, 좋아하는 향초를 켜고 편안한 자세로 20분간 눈을 감아 보세요.',
                why: '충분한 휴식은 정신 건강의 기초입니다. 피로가 쌓이면 감정 조절 능력이 떨어지고, 스트레스에 더 취약해집니다.',
                practiceGuide: '오늘 밤 잠들기 전에 감사한 일 3가지를 떠올려 보세요.'
            },
            {
                activity: '감정을 기록하는 시간',
                icon: '📝',
                description: '지금 느끼는 따뜻한 감정을 일기나 메모에 기록해보세요. 감정을 글로 표현하면 더 깊이 이해할 수 있어요.',
                why: '감정을 기록하는 것은 자기 이해를 높이고 감정을 정리하는 데 도움이 됩니다.',
                practiceGuide: '매일 저녁 하루 동안 느꼈던 감정을 3줄로 기록해보세요.'
            }
        ];
        suggestions.push(restVariants[Math.floor(Math.random() * restVariants.length)]);
    } else {
        const restVariants = [
            {
                activity: '충분한 휴식 취하기',
                icon: '😴',
                description: '하루 중 최소 7-8시간의 수면을 취하고, 스트레스를 줄이는 활동을 해보세요. 오후 3시에 15분간 눈을 감고 휴식을 취하는 것도 좋습니다.',
                why: '충분한 휴식은 정신 건강의 기초입니다. 피로가 쌓이면 감정 조절 능력이 떨어지고, 스트레스에 더 취약해집니다.',
                practiceGuide: '내일 아침 일어나서 물 한 잔을 천천히 마시며 하루를 시작해 보세요.'
            },
            {
                activity: '조용한 독서 시간',
                icon: '📖',
                description: '좋아하는 책을 펼쳐 조용히 읽어보세요. 책 속 이야기에 빠져들면 일상의 스트레스에서 잠시 벗어날 수 있어요.',
                why: '독서는 마음을 차분하게 하고 새로운 관점을 얻는 데 도움이 됩니다.',
                practiceGuide: '이번 주에 하루 30분씩 책을 읽는 시간을 가져보세요.'
            }
        ];
        suggestions.push(restVariants[Math.floor(Math.random() * restVariants.length)]);
    }
    
    // 2. 대화 관련 추천
    if (dominantMood === 'comfort' || avgComfortScore > 30) {
        const talkVariants = [
            {
                activity: '신뢰하는 사람과 대화하기',
                icon: '💬',
                description: '가족이나 친한 친구에게 오늘 하루 있었던 일을 편하게 이야기해 보세요. "오늘 이런 일이 있었어"로 시작하면 됩니다.',
                why: '감정을 언어로 표현하는 것만으로도 심리적 부담이 줄어듭니다. 타인의 관점을 듣는 것은 새로운 해결책을 찾는 데 도움이 됩니다.',
                practiceGuide: '이번 주말에 좋아하는 사람과 카페에서 1시간 정도 대화를 나눠 보세요.'
            },
            {
                activity: '감정을 나누는 시간',
                icon: '💭',
                description: '가까운 사람에게 지금 느끼는 감정을 솔직하게 이야기해보세요. "지금 이런 기분이야"라고 말하는 것만으로도 마음이 가벼워질 수 있어요.',
                why: '감정을 공유하면 외로움을 줄이고 공감을 받을 수 있습니다.',
                practiceGuide: '오늘 저녁에 한 명에게라도 오늘 하루를 간단히 공유해보세요.'
            }
        ];
        suggestions.push(talkVariants[Math.floor(Math.random() * talkVariants.length)]);
    } else {
        const talkVariants = [
            {
                activity: '신뢰하는 사람과 대화하기',
                icon: '💬',
                description: '가족, 친구, 또는 전문 상담사와 자신의 감정과 고민을 솔직하게 나눠보세요. 메시지로 먼저 연락을 취하는 것도 좋은 시작입니다.',
                why: '감정을 언어로 표현하는 것만으로도 심리적 부담이 줄어듭니다. 타인의 관점을 듣는 것은 새로운 해결책을 찾는 데 도움이 됩니다.',
                practiceGuide: '오늘 저녁에 한 명에게라도 오늘 하루를 간단히 공유해보세요.'
            },
            {
                activity: '온라인 커뮤니티 참여',
                icon: '🌐',
                description: '관심 있는 주제의 온라인 커뮤니티에 참여하거나 비슷한 관심사를 가진 사람들과 대화를 나눠보세요.',
                why: '비슷한 경험을 가진 사람들과의 교류는 위로와 공감을 얻는 데 도움이 됩니다.',
                practiceGuide: '이번 주에 새로운 커뮤니티에 가입해보거나 기존 커뮤니티에 글을 올려보세요.'
            }
        ];
        suggestions.push(talkVariants[Math.floor(Math.random() * talkVariants.length)]);
    }
    
    // 3. 취미 활동 추천
    if (dominantMood === 'romance' || avgRomanceScore > 30) {
        const hobbyVariants = [
            {
                activity: '취미 활동 즐기기',
                icon: '🎨',
                description: '좋아하는 음악을 들으며 그림을 그리거나, 감동적인 영화를 보며 감정을 느껴보세요. 예술 활동은 감정을 표현하는 좋은 방법입니다.',
                why: '취미 활동은 일상의 스트레스에서 벗어나 긍정적인 감정을 경험하게 해줍니다. 성취감과 만족감을 느끼는 것은 자존감 향상에 도움이 됩니다.',
                practiceGuide: '이번 주말에 미술관이나 전시회를 방문해보세요.'
            },
            {
                activity: '음악 감상과 감정 느끼기',
                icon: '🎵',
                description: '마음에 드는 음악을 들으며 감정을 충분히 느껴보세요. 가사를 따라 부르거나 몸을 흔들어보는 것도 좋아요.',
                why: '음악은 감정을 표현하고 정화하는 데 도움이 됩니다.',
                practiceGuide: '오늘 저녁에 좋아하는 플레이리스트를 만들고 30분간 감상해보세요.'
            }
        ];
        suggestions.push(hobbyVariants[Math.floor(Math.random() * hobbyVariants.length)]);
    } else if (dominantMood === 'conflict' || avgConflictScore > 30) {
        const hobbyVariants = [
            {
                activity: '취미 활동 즐기기',
                icon: '🏃',
                description: '가벼운 산책이나 요가, 스트레칭 같은 신체 활동을 해보세요. 몸을 움직이면 마음도 함께 가벼워집니다.',
                why: '취미 활동은 일상의 스트레스에서 벗어나 긍정적인 감정을 경험하게 해줍니다. 성취감과 만족감을 느끼는 것은 자존감 향상에 도움이 됩니다.',
                practiceGuide: '내일 아침에 집 근처를 20분 정도 걸어보세요.'
            },
            {
                activity: '운동으로 스트레스 해소',
                icon: '💪',
                description: '가벼운 운동이나 스트레칭을 통해 몸의 긴장을 풀어보세요. 땀을 흘리면 마음도 함께 가벼워집니다.',
                why: '운동은 스트레스 호르몬을 줄이고 엔돌핀을 분비시켜 기분을 좋게 만듭니다.',
                practiceGuide: '이번 주에 주 3회, 30분씩 가벼운 운동을 해보세요.'
            }
        ];
        suggestions.push(hobbyVariants[Math.floor(Math.random() * hobbyVariants.length)]);
    } else {
        const hobbyVariants = [
            {
                activity: '취미 활동 즐기기',
                icon: '📖',
                description: '자신이 즐기는 활동(독서, 운동, 음악 감상, 그림 그리기 등)에 시간을 투자해보세요. 하루 30분만이라도 자신만의 시간을 가져보세요.',
                why: '취미 활동은 일상의 스트레스에서 벗어나 긍정적인 감정을 경험하게 해줍니다. 성취감과 만족감을 느끼는 것은 자존감 향상에 도움이 됩니다.',
                practiceGuide: '이번 주에 새로운 취미를 하나 시작해보세요.'
            },
            {
                activity: '창작 활동하기',
                icon: '✍️',
                description: '일기, 시, 소설, 그림 등 자신만의 창작 활동을 해보세요. 표현하는 과정에서 마음이 정리될 거예요.',
                why: '창작 활동은 감정을 표현하고 정리하는 데 도움이 됩니다.',
                practiceGuide: '이번 주에 작은 작품 하나를 완성해보세요.'
            }
        ];
        suggestions.push(hobbyVariants[Math.floor(Math.random() * hobbyVariants.length)]);
    }
    
    return {
        ...report,
        episodeSummary,
        nextSceneSuggestion,
        analysis,
        position,
        interpretation,
        psychologicalIssues,
        suggestions
    };
};

// 심리 리포트 생성 (클라이언트 사이드 폴백용)
const generateReport = (messages, userProfile) => {
    if (!messages || messages.length === 0) {
        return null;
    }

    const userMessages = messages.filter(msg => msg.sender === 'user');
    if (userMessages.length === 0) {
        return null;
    }

    // 감정 분석
    let totalRomanceScore = 0;
    let totalComfortScore = 0;
    let totalConflictScore = 0;
    // eslint-disable-next-line no-unused-vars
    const emotions = [];
    const keywords = {};
    const messageTimeline = [];

    userMessages.forEach((msg, index) => {
        const text = msg.text || '';
        const romanceScore = detectRomanceLevel(text);
        const comfortScore = detectComfortLevel(text);
        const conflictScore = detectConflictLevel(text);
        
        totalRomanceScore += romanceScore;
        totalComfortScore += comfortScore;
        totalConflictScore += conflictScore;

        // 메시지별 감정 분석
        let dominantEmotion = 'neutral';
        let intensity = 0;
        if (romanceScore > comfortScore && romanceScore > conflictScore) {
            dominantEmotion = 'romance';
            intensity = romanceScore;
        } else if (comfortScore > conflictScore) {
            dominantEmotion = 'comfort';
            intensity = comfortScore;
        } else if (conflictScore > 0) {
            dominantEmotion = 'conflict';
            intensity = conflictScore;
        }

        messageTimeline.push({
            text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            emotion: dominantEmotion,
            intensity: intensity,
            isImportant: intensity > 0.6,
            importantNote: intensity > 0.6 ? `${dominantEmotion === 'romance' ? '로맨스' : dominantEmotion === 'comfort' ? '위로' : '갈등'} 감정이 강하게 나타남` : null
        });

        // 키워드 추출
        const stopWords = [
            '그리고', '그런데', '그래서', '하지만', '그렇지만', '그런', '이런', '저런', '어떤', '어떻게', '어떠니', 
            '그냥', '정말', '진짜', '너무', '많이', '조금', '좀', '잘', '더', '다시', '또', '그때', '지금', '오늘', '어제', '내일',
            '아주', '매우', '완전', '엄청', '정말로', '진짜로', '그래도', '그러나', '그런가', '이런가', '저런가',
            '있어', '없어', '보여', '보고', '보니', '보면', '보는', '보자', '보고서', '보니까', '보는데',
            '하는', '하는데', '하니까', '하지만', '해서', '하고', '하면', '하자', '하니', '하네', '하나',
            '되는', '되는데', '되니까', '되어서', '되고', '되면', '되니', '되네',
            '생각', '생각이', '생각해', '생각하', '생각하는', '생각하면', '생각하니', '생각하는데',
            '말하는', '말하는데', '말하', '말해', '말하면', '말하니',
            '느껴', '느끼', '느끼는', '느끼는데', '느끼면', '느끼니',
            '알아', '알고', '알았', '알았어', '알았는데', '알았으니',
            '모르', '모르는', '모르는데', '모르겠', '모르겠어', '모르겠는데',
            '괜찮', '괜찮아', '괜찮은', '괜찮은데', '괜찮으니',
            '좋아', '좋은', '좋은데', '좋으니', '좋아서',
            '싫어', '싫은', '싫은데', '싫으니', '싫어서',
            '기분', '기분이', '기분은', '기분인데', '기분이야',
            '마음', '마음이', '마음은', '마음인데', '마음이야',
            '에서', '에게', '에게서', '으로', '로', '의', '을', '를', '이', '가', '은', '는', '와', '과', '도', '만', '까지', '부터',
            '같아', '같은', '같은데', '같으니', '같아서',
            '처럼', '만큼', '보다', '부터', '까지',
            '여기', '저기', '거기', '어디', '언제', '누구', '무엇', '뭐', '왜', '어떻게', '어떤',
            '할일이', '많아서', '있는데', '없는데', '있으니', '없으니', '있어서', '없어서',
            '그래', '그래요', '그렇구나', '그렇군', '그렇네', '그렇다',
            '이야', '이야기', '이야기를', '이야기는', '이야기야',
            '화나', '화났', '화났어', '화났는데', '화났으니'
        ];
        
        // 한글 단어 추출 (2글자 이상)
        const words = (text.match(/[가-힣]{2,}/g) || []).filter(w => {
            if (stopWords.includes(w)) return false;
            // 조사 제거 후 재확인
            const cleanWord = w.replace(/[이가을를은는와과도만까지부터에서에게]$/, '');
            if (cleanWord.length < 2 || stopWords.includes(cleanWord)) return false;
            return true;
        });
        
        words.forEach(word => {
            // 조사 제거
            const cleanWord = word.replace(/[이가을를은는와과도만까지부터에서에게]$/, '');
            if (cleanWord.length >= 2 && !stopWords.includes(cleanWord)) {
                keywords[cleanWord] = (keywords[cleanWord] || 0) + 1;
            }
        });
    });

    const avgRomanceScore = (totalRomanceScore / userMessages.length) * 100;
    const avgComfortScore = (totalComfortScore / userMessages.length) * 100;
    const avgConflictScore = (totalConflictScore / userMessages.length) * 100;

    // 주요 감정 결정
    let dominantMood = 'neutral';
    if (avgRomanceScore > avgComfortScore && avgRomanceScore > avgConflictScore && avgRomanceScore > 20) {
        dominantMood = 'romance';
    } else if (avgComfortScore > avgConflictScore && avgComfortScore > 20) {
        dominantMood = 'comfort';
    } else if (avgConflictScore > 20) {
        dominantMood = 'conflict';
    }

    // 시간대별 감정 변화
    const third = Math.floor(userMessages.length / 3);
    const earlyMessages = userMessages.slice(0, third);
    const midMessages = userMessages.slice(third, third * 2);
    const lateMessages = userMessages.slice(third * 2);

    const getMoodForMessages = (msgs) => {
        let romance = 0, comfort = 0, conflict = 0;
        msgs.forEach(msg => {
            romance += detectRomanceLevel(msg.text || '');
            comfort += detectComfortLevel(msg.text || '');
            conflict += detectConflictLevel(msg.text || '');
        });
        const avg = msgs.length > 0 ? msgs.length : 1;
        romance = (romance / avg) * 100;
        comfort = (comfort / avg) * 100;
        conflict = (conflict / avg) * 100;
        
        if (romance > comfort && romance > conflict && romance > 20) return 'romance';
        if (comfort > conflict && comfort > 20) return 'comfort';
        if (conflict > 20) return 'conflict';
        return 'neutral';
    };

    const moodTimeline = {
        early: getMoodForMessages(earlyMessages),
        mid: getMoodForMessages(midMessages),
        late: getMoodForMessages(lateMessages)
    };

    // 키워드 정렬
    const sortedKeywords = Object.entries(keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

    // 에피소드 번호 (저장된 리포트 수 + 1)
    const savedReports = psychologyReports.load();
    const episode = savedReports.length + 1;
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 에피소드 요약 생성
    let episodeSummary = '';
    if (dominantMood === 'romance') {
        episodeSummary = '로맨틱한 감정이 주를 이루는 대화였습니다.';
    } else if (dominantMood === 'comfort') {
        episodeSummary = '위로와 안정을 찾는 대화였습니다.';
    } else if (dominantMood === 'conflict') {
        episodeSummary = '갈등과 긴장감이 느껴지는 대화였습니다.';
    } else {
        episodeSummary = '평온하고 중립적인 대화였습니다.';
    }

    // 다음 장면 제안
    let nextSceneSuggestion = '';
    if (dominantMood === 'romance') {
        nextSceneSuggestion = '더 깊은 감정의 교류를 나누는 장면';
    } else if (dominantMood === 'comfort') {
        nextSceneSuggestion = '서로를 더 잘 이해하고 공감하는 장면';
    } else if (dominantMood === 'conflict') {
        nextSceneSuggestion = '갈등을 해소하고 화해하는 장면';
    } else {
        nextSceneSuggestion = '더 깊은 이야기를 나누는 장면';
    }

    // 심리 분석 (위로 톤으로 변경)
    const analysis = `최근 대화에서 ${dominantMood === 'romance' ? '따뜻한 감정과 교감' : dominantMood === 'comfort' ? '위로와 안정을 찾으려는 마음' : dominantMood === 'conflict' ? '갈등과 복잡한 감정' : '다양한 감정'}이 많이 느껴졌어요. 많이 힘드셨죠?`;

    // 심리적 포지션 (위로 톤으로 변경)
    const position = `지금은 ${dominantMood === 'romance' ? '따뜻한 감정을 나누고 싶은 순간' : dominantMood === 'comfort' ? '위로와 공감이 필요한 때' : dominantMood === 'conflict' ? '마음의 짐을 내려놓아도 좋은 때' : '조용히 쉬어도 좋은 하루'}입니다.`;

    // 전문가 해석 (위로 톤으로 변경)
    const interpretation = `최근 대화를 보니 ${dominantMood === 'romance' ? '따뜻한 감정을 나누려는 마음이 많이 느껴졌어요. 지금 이 순간의 감정을 소중히 여기시고, 당신의 마음을 알아주고 싶어요.' : dominantMood === 'comfort' ? '위로와 안정을 찾으려는 마음이 많이 느껴졌어요. 외로움이나 그리움이 느껴지는 하루였나요? 당신의 마음을 알아주고 싶어요.' : dominantMood === 'conflict' ? '갈등과 복잡한 감정이 많이 느껴졌어요. 많이 힘드셨죠? 지금은 무리하지 말고 잠시 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.' : '평온하지만 어딘가 지친 마음이 느껴졌어요. 지금은 조용히 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.'}`;

    // 심리적 문제 진단
    const psychologicalIssues = [];
    if (avgConflictScore > 30) {
        psychologicalIssues.push({
            title: '갈등 관리 필요',
            severity: avgConflictScore > 50 ? '높음' : '중간',
            description: '대화에서 갈등 감정이 자주 나타나고 있습니다.'
        });
    }
    if (avgComfortScore > 40) {
        psychologicalIssues.push({
            title: '위로 필요',
            severity: '중간',
            description: '위로와 안정을 찾는 감정이 강하게 나타나고 있습니다.'
        });
    }

    // 심리적 원인 분석
    const issueReasons = psychologicalIssues.map(issue => ({
        issue: issue.title,
        reason: `이 문제는 ${issue.description}`
    }));

    // 치료 활동 추천
    const therapeuticActivities = [];
    if (dominantMood === 'conflict') {
        therapeuticActivities.push({
            activity: '명상 및 호흡 운동',
            description: '갈등 상황에서 마음을 진정시키는 활동',
            why: '명상은 스트레스를 줄이고 감정을 조절하는 데 도움이 됩니다.'
        });
    }
    if (dominantMood === 'comfort') {
        therapeuticActivities.push({
            activity: '일기 쓰기',
            description: '감정을 글로 표현하는 활동',
            why: '일기 쓰기는 감정을 정리하고 자기 이해를 높이는 데 도움이 됩니다.'
        });
    }

    // 심리 분석 기반 맞춤 추천 활동 생성
    const suggestions = [];
    
    // 1. 휴식 관련 추천 (항상 포함, dominantMood에 따라 구체화)
    if (dominantMood === 'conflict' || avgConflictScore > 20) {
        suggestions.push({
            activity: '충분한 휴식 취하기',
            icon: '😴',
            description: '따뜻한 차 한 잔과 함께 30분 동안 핸드폰을 멀리해 보세요. 깊게 숨을 들이쉬고 내쉬는 호흡 운동을 10회 반복하면 마음이 한결 편안해집니다.',
            why: '충분한 휴식은 정신 건강의 기초입니다. 피로가 쌓이면 감정 조절 능력이 떨어지고, 스트레스에 더 취약해집니다.',
            practiceGuide: '오늘 밤 11시 전에 잠자리에 들고, 내일 아침 일어나서 창문을 열고 깊게 숨을 3번 들이쉬어 보세요.'
        });
    } else if (dominantMood === 'romance' || avgRomanceScore > 20) {
        suggestions.push({
            activity: '충분한 휴식 취하기',
            icon: '😴',
            description: '부드러운 음악을 들으며 따뜻한 물로 샤워하고, 좋아하는 향초를 켜고 편안한 자세로 20분간 눈을 감아 보세요.',
            why: '충분한 휴식은 정신 건강의 기초입니다. 피로가 쌓이면 감정 조절 능력이 떨어지고, 스트레스에 더 취약해집니다.',
            practiceGuide: '오늘 밤 잠들기 전에 감사한 일 3가지를 떠올려 보세요.'
        });
    } else {
        suggestions.push({
            activity: '충분한 휴식 취하기',
            icon: '😴',
            description: '하루 중 최소 7-8시간의 수면을 취하고, 스트레스를 줄이는 활동을 해보세요. 오후 3시에 15분간 눈을 감고 휴식을 취하는 것도 좋습니다.',
            why: '충분한 휴식은 정신 건강의 기초입니다. 피로가 쌓이면 감정 조절 능력이 떨어지고, 스트레스에 더 취약해집니다.',
            practiceGuide: '내일 아침 일어나서 물 한 잔을 천천히 마시며 하루를 시작해 보세요.'
        });
    }
    
    // 2. 대화 관련 추천 (comfort나 conflict가 높을 때 강조)
    if (dominantMood === 'comfort' || avgComfortScore > 20) {
        suggestions.push({
            activity: '신뢰하는 사람과 대화하기',
            icon: '💬',
            description: '가족이나 친한 친구에게 오늘 하루 있었던 일을 편하게 이야기해 보세요. "오늘 이런 일이 있었어"로 시작하면 됩니다.',
            why: '감정을 언어로 표현하는 것만으로도 심리적 부담이 줄어듭니다. 타인의 관점을 듣는 것은 새로운 해결책을 찾는 데 도움이 됩니다.',
            practiceGuide: '이번 주말에 좋아하는 사람과 카페에서 1시간 정도 대화를 나눠 보세요.'
        });
    } else {
        suggestions.push({
            activity: '신뢰하는 사람과 대화하기',
            icon: '💬',
            description: '가족, 친구, 또는 전문 상담사와 자신의 감정과 고민을 솔직하게 나눠보세요. 메시지로 먼저 연락을 취하는 것도 좋은 시작입니다.',
            why: '감정을 언어로 표현하는 것만으로도 심리적 부담이 줄어듭니다. 타인의 관점을 듣는 것은 새로운 해결책을 찾는 데 도움이 됩니다.',
            practiceGuide: '오늘 저녁에 한 명에게라도 오늘 하루를 간단히 공유해 보세요.'
        });
    }
    
    // 3. 취미 활동 추천 (키워드 기반으로 맞춤화)
    if (dominantMood === 'romance' || avgRomanceScore > 20) {
        suggestions.push({
            activity: '취미 활동 즐기기',
            icon: '🎨',
            description: '좋아하는 음악을 들으며 그림을 그리거나, 감동적인 영화를 보며 감정을 느껴보세요. 예술 활동은 감정을 표현하는 좋은 방법입니다.',
            why: '취미 활동은 일상의 스트레스에서 벗어나 긍정적인 감정을 경험하게 해줍니다. 성취감과 만족감을 느끼는 것은 자존감 향상에 도움이 됩니다.',
            practiceGuide: '이번 주말에 미술관이나 전시회를 방문해 보세요.'
        });
    } else if (dominantMood === 'conflict' || avgConflictScore > 20) {
        suggestions.push({
            activity: '취미 활동 즐기기',
            icon: '🏃',
            description: '가벼운 산책이나 요가, 스트레칭 같은 신체 활동을 해보세요. 몸을 움직이면 마음도 함께 가벼워집니다.',
            why: '취미 활동은 일상의 스트레스에서 벗어나 긍정적인 감정을 경험하게 해줍니다. 성취감과 만족감을 느끼는 것은 자존감 향상에 도움이 됩니다.',
            practiceGuide: '내일 아침에 집 근처를 20분 정도 걸어 보세요.'
        });
    } else {
        suggestions.push({
            activity: '취미 활동 즐기기',
            icon: '📖',
            description: '자신이 즐기는 활동(독서, 운동, 음악 감상, 그림 그리기 등)에 시간을 투자해보세요. 하루 30분만이라도 자신만의 시간을 가져보세요.',
            why: '취미 활동은 일상의 스트레스에서 벗어나 긍정적인 감정을 경험하게 해줍니다. 성취감과 만족감을 느끼는 것은 자존감 향상에 도움이 됩니다.',
            practiceGuide: '이번 주에 새로운 취미를 하나 시작해 보세요.'
        });
    }

    return {
        id: reportId,
        episode,
        date: new Date(),
        stats: {
            romanceScore: Math.round(avgRomanceScore),
            comfortScore: Math.round(avgComfortScore),
            conflictScore: Math.round(avgConflictScore),
            dominantMood
        },
        dominantEmotion: dominantMood,
        episodeSummary,
        nextSceneSuggestion,
        messageTimeline,
        moodTimeline,
        keywords: sortedKeywords,
        analysis,
        position,
        interpretation,
        psychologicalIssues,
        issueReasons,
        therapeuticActivities,
        suggestions,
        imageUrl: null, // 이미지 URL 저장용
        bgmRecommendation: generateBGMRecommendation(dominantMood, avgRomanceScore, avgComfortScore, avgConflictScore) // BGM 추천
    };
};

// BGM 추천 생성 함수
const generateBGMRecommendation = (dominantMood, romanceScore, comfortScore, conflictScore) => {
    // 실제 드라마 OST 데이터베이스 (감정 상태별 추천)
    const bgmDatabase = {
        romance: [
            {
            title: '너의 모든 순간',
            artist: '성시경',
            drama: '별에서 온 그대',
            youtubeUrl: 'https://www.youtube.com/results?search_query=성시경+너의+모든+순간+별에서+온+그대',
            comment: '모든 시간이 멈춘 듯, 사랑에 빠진 설렘을 완벽하게 표현한 곡입니다.'
            },
            {
            title: 'Say Yes',
            artist: '로꼬, 펀치',
            drama: '달의 연인 - 보보경심 려',
            youtubeUrl: 'https://www.youtube.com/results?search_query=로꼬+펀치+Say+Yes+달의+연인',
            comment: '사랑스러운 랩과 보컬의 조화! 핑크빛 기류가 흐르는 달콤한 듀엣곡입니다.'
            },
            {
            title: 'Be With You',
            artist: '악뮤',
            drama: '달의 연인 - 보보경심 려',
            youtubeUrl: 'https://www.youtube.com/results?search_query=악뮤+Be+With+You+달의+연인',
            comment: '악뮤 특유의 순수하고 맑은 감성으로 풋풋한 사랑의 마음을 노래합니다.'
            },
            {
            title: '알듯 말듯해',
            artist: '서은광, 임현식, 육성재',
            drama: '쌈, 마이웨이',
            youtubeUrl: 'https://www.youtube.com/results?search_query=서은광+임현식+육성재+알듯+말듯해+쌈+마이웨이',
            comment: '친구인 듯 연인인 듯, 썸 타는 남녀의 미묘하고 간질간질한 마음을 표현했습니다.'
            },
            {
            title: '그대라는 시',
            artist: '태연',
            drama: '호텔 델루나',
            youtubeUrl: 'https://www.youtube.com/results?search_query=태연+그대라는+시+호텔+델루나',
            comment: '잔잔한 피아노와 섬세한 음색이 어우러져 아련하고 시적인 로맨스를 완성합니다.'
            },
            {
            title: '사랑이 뭔데',
            artist: '서현진, 유승우',
            drama: '또 오해영',
            youtubeUrl: 'https://www.youtube.com/results?search_query=서현진+유승우+사랑이+뭔데+또+오해영',
            comment: '봄바람처럼 살랑이는 멜로디, 사랑에 빠져 어쩔 줄 모르는 귀여운 마음이 담겨있어요.'
            },
            {
            title: 'Beautiful',
            artist: 'Crush',
            drama: '도깨비',
            youtubeUrl: 'https://www.youtube.com/results?search_query=Crush+Beautiful+도깨비',
            comment: '아름다운 피아노 선율과 함께 운명적인 사랑을 느껴보세요.'
            },
            {
            title: '사랑인가 봐',
            artist: '멜로망스',
            drama: '사내맞선',
            youtubeUrl: 'https://www.youtube.com/results?search_query=멜로망스+사랑인가봐+사내맞선',
            comment: '달달하고 기분 좋은 로맨스의 시작, 설레는 마음을 숨기지 마세요.'
            },
            {
            title: '흔들리는 꽃들 속에서 네 샴푸향이 느껴진거야',
            artist: '장범준',
            drama: '멜로가 체질',
            youtubeUrl: 'https://www.youtube.com/results?search_query=장범준+흔들리는+꽃들+속에서+멜로가+체질',
            comment: '봄바람처럼 살랑거리는 사랑의 감정을 가볍게 즐겨보세요.'
            },
            {
            title: 'All For You',
            artist: '서인국, 정은지',
            drama: '응답하라 1997',
            youtubeUrl: 'https://www.youtube.com/results?search_query=서인국+정은지+All+For+You+응답하라+1997',
            comment: '풋풋한 첫사랑과 친구에서 연인이 되는 설렘을 담은 달콤한 듀엣곡입니다.'
            },
            {
            title: 'My Destiny',
            artist: '린',
            drama: '별에서 온 그대',
            youtubeUrl: 'https://www.youtube.com/results?search_query=린+My+Destiny+별에서+온+그대',
            comment: '다시 올 수 없는 운명 같은 만남, 깊어가는 사랑의 감정을 노래합니다.'
            },
            {
            title: 'Stay With Me',
            artist: '찬열, 펀치',
            drama: '도깨비',
            youtubeUrl: 'https://www.youtube.com/results?search_query=찬열+펀치+Stay+With+Me+도깨비',
            comment: '몽환적인 도입부만 들어도 심장이 뛰는, 운명적인 로맨스의 대표곡입니다.'
            },
            {
            title: '말해! 뭐해?',
            artist: '케이윌',
            drama: '태양의 후예',
            youtubeUrl: 'https://www.youtube.com/results?search_query=케이윌+말해+뭐해+태양의+후예',
            comment: '밀당은 그만! 휘파람 소리와 함께 경쾌하게 터지는 직진 로맨스입니다.'
            },
            {
            title: 'ALWAYS',
            artist: '윤미래',
            drama: '태양의 후예',
            youtubeUrl: 'https://www.youtube.com/results?search_query=윤미래+ALWAYS+태양의+후예',
            comment: '언제나 곁에 있겠다는 약속, 운명적인 사랑을 호소력 짙은 목소리로 담았습니다.'
            },
            {
            title: 'Everytime',
            artist: '첸, 펀치',
            drama: '태양의 후예',
            youtubeUrl: 'https://www.youtube.com/results?search_query=첸+펀치+Everytime+태양의+후예',
            comment: '들을 때마다 기분이 좋아지는, 상큼하고 달콤한 로맨스 OST입니다.'
          }
        ],
        comfort: [
            {
            title: '걱정말아요 그대',
            artist: '이적',
            drama: '응답하라 1988',
            youtubeUrl: 'https://www.youtube.com/results?search_query=이적+걱정말아요+그대+응답하라+1988',
            comment: '지나간 것은 지나간 대로. 지친 당신의 등을 토닥여주는 따뜻한 위로곡입니다.'
            },
            {
            title: '어쩌면 나',
            artist: '로이킴',
            drama: '또 오해영',
            youtubeUrl: 'https://www.youtube.com/results?search_query=로이킴+어쩌면+나+또+오해영',
            comment: '사랑 때문에 복잡해진 마음을 부드러운 목소리로 차분하게 다독여주는 곡입니다.'
            },
            {
            title: '그때 그 아인',
            artist: '김필',
            drama: '이태원 클라쓰',
            youtubeUrl: 'https://www.youtube.com/results?search_query=김필+그때+그+아인+이태원+클라쓰',
            comment: '거친 세상 속에서 고군분투하는 청춘에게 건네는 따뜻하고 묵직한 위로입니다.'
            },
            {
            title: '소녀',
            artist: '오혁',
            drama: '응답하라 1988',
            youtubeUrl: 'https://www.youtube.com/results?search_query=오혁+소녀+응답하라+1988',
            comment: '담담한 목소리로 지나간 시절의 향수와 따뜻한 위로를 전해줍니다.'
            },
            {
            title: '너에게',
            artist: '성시경',
            drama: '응답하라 1994',
            youtubeUrl: 'https://www.youtube.com/results?search_query=성시경+너에게+응답하라+1994',
            comment: '부드러운 목소리가 당신의 하루를 감싸 안아주는 평온한 힐링곡입니다.'
            },
            {
            title: '수고했어, 오늘도',
            artist: '옥상달빛',
            drama: '술꾼도시여자들 (삽입곡)', 
            youtubeUrl: 'https://www.youtube.com/results?search_query=옥상달빛+수고했어+오늘도',
            comment: '누구도 내 맘을 몰라주는 것 같은 날, 이 노래가 당신을 응원합니다.'
            },
            {
            title: '어른',
            artist: 'Sondia',
            drama: '나의 아저씨',
            youtubeUrl: 'https://www.youtube.com/results?search_query=Sondia+어른+나의+아저씨',
            comment: '삶의 무게를 버티는 모든 이들에게 바치는, 담담하지만 깊은 울림이 있는 노래입니다.'
            },
            {
            title: '혼자라고 생각말기',
            artist: '김보경',
            drama: '학교 2013',
            youtubeUrl: 'https://www.youtube.com/results?search_query=김보경+혼자라고+생각말기+학교+2013',
            comment: '힘들 때 혼자라고 느껴진다면, 이 노래가 당신의 손을 잡아줄 거예요.'
            },
            {
            title: '마음을 드려요',
            artist: '아이유',
            drama: '사랑의 불시착',
            youtubeUrl: 'https://www.youtube.com/results?search_query=아이유+마음을+드려요+사랑의+불시착',
            comment: '차분한 목소리로 전하는 진심 어린 마음이 힐링을 선사합니다.'
            }
        ],
        conflict: [
            {
            title: '만약에',
            artist: '태연',
            drama: '쾌도 홍길동',
            youtubeUrl: 'https://www.youtube.com/results?search_query=태연+만약에+쾌도+홍길동',
            comment: '짝사랑의 아픔과 다가가지 못하는 안타까운 마음을 표현하기에 제격입니다.'
            },
            {
            title: '너를 위해',
            artist: '첸, 백현, 시우민',
            drama: '달의 연인 - 보보경심 려',
            youtubeUrl: 'https://www.youtube.com/results?search_query=첸+백현+시우민+너를+위해+달의+연인',
            comment: '다른 공간, 다른 시간에 있어도 놓을 수 없는 슬픈 사랑의 맹세입니다.'
            },
            {
            title: '꿈처럼',
            artist: '벤',
            drama: '또 오해영',
            youtubeUrl: 'https://www.youtube.com/results?search_query=벤+꿈처럼+또+오해영',
            comment: '깨고 나면 사라질까 두려운 행복, 눈물 섞인 목소리가 감정의 깊이를 더합니다.'
            },
            {
            title: 'Done For Me',
            artist: '펀치',
            drama: '호텔 델루나',
            youtubeUrl: 'https://www.youtube.com/results?search_query=펀치+Done+For+Me+호텔+델루나',
            comment: '쓸쓸한 피아노 선율 위로 흐르는 이별의 아픔과 지울 수 없는 기억을 노래합니다.'
            },
            {
            title: 'I Miss You',
            artist: '소유',
            drama: '도깨비',
            youtubeUrl: 'https://www.youtube.com/results?search_query=소유+I+Miss+You+도깨비',
            comment: '그리움에 사무치는 밤, 닿을 수 없는 인연을 향한 애절한 목소리가 가슴을 울립니다.'
            },
            {
            title: '첫눈처럼 너에게 가겠다',
            artist: '에일리',
            drama: '도깨비',
            youtubeUrl: 'https://www.youtube.com/results?search_query=에일리+첫눈처럼+너에게+가겠다+도깨비',
            comment: '폭발적인 가창력으로 비극적인 사랑과 절절한 그리움을 토해내는 곡입니다.'
            },
            {
            title: '환청',
            artist: '장재인 (feat. 나쑈)',
            drama: '킬미, 힐미',
            youtubeUrl: 'https://www.youtube.com/results?search_query=장재인+환청+킬미힐미',
            comment: '내면의 혼란과 자아의 분열, 얽히고설킨 심리적 갈등을 강렬하게 표현했습니다.'
            },
            {
            title: '길',
            artist: '김윤아',
            drama: '시그널',
            youtubeUrl: 'https://www.youtube.com/results?search_query=김윤아+길+시그널',
            comment: '끝이 보이지 않는 미제 사건의 쓸쓸함과 차가운 현실 속의 고독을 담았습니다.'
            },
            {
            title: '너였다면',
            artist: '정승환',
            drama: '또 오해영',
            youtubeUrl: 'https://www.youtube.com/results?search_query=정승환+너였다면+또+오해영',
            comment: '짝사랑의 답답함과 상대방을 향한 원망 섞인 슬픔을 토로하는 노래입니다.'
            },
            {
            title: '낙인',
            artist: '임재범',
            drama: '추노',
            youtubeUrl: 'https://www.youtube.com/results?search_query=임재범+낙인+추노',
            comment: '가슴을 데인 듯한 고통과 쫓고 쫓기는 운명의 처절함이 느껴지는 곡입니다.'
            },
            {
            title: '기도',
            artist: '정일영',
            drama: '가을동화',
            youtubeUrl: 'https://www.youtube.com/results?search_query=정일영+기도+가을동화',
            comment: '이뤄질 수 없는 운명 앞에서 신에게 호소하는 듯한 절규가 담긴 명곡입니다.'
            }
        ],
        neutral: [
            {
            title: '시작',
            artist: '가호',
            drama: '이태원 클라쓰',
            youtubeUrl: 'https://www.youtube.com/results?search_query=가호+시작+이태원+클라쓰',
            comment: '새로운 시작을 위한 에너지가 필요할 때, 힘차게 달려나가세요.'
            },
            {
            title: '굿모닝',
            artist: '케이시',
            drama: '쌈, 마이웨이',
            youtubeUrl: 'https://www.youtube.com/results?search_query=케이시+굿모닝+쌈+마이웨이',
            comment: '상쾌한 아침 햇살 같은 노래! 기분 좋은 하루를 시작하고 싶을 때 들어보세요.'
            },
            {
            title: '돌덩이',
            artist: '하현우',
            drama: '이태원 클라쓰',
            youtubeUrl: 'https://www.youtube.com/results?search_query=하현우+돌덩이+이태원+클라쓰',
            comment: '어떤 시련에도 굴하지 않는 단단한 다짐. 나를 뜨겁게 만드는 강렬한 록 사운드입니다.'
            },
            {
            title: '직진',
            artist: '더베인',
            drama: '이태원 클라쓰',
            youtubeUrl: 'https://www.youtube.com/results?search_query=더베인+직진+이태원+클라쓰',
            comment: '뒤돌아보지 말고 앞만 보고 질주하라! 드라이브나 운동할 때 최고의 에너지를 줍니다.'
            },
            {
            title: 'Running',
            artist: '가호',
            drama: '스타트업',
            youtubeUrl: 'https://www.youtube.com/results?search_query=가호+Running+스타트업',
            comment: '답답한 마음을 뻥 뚫어주는 청량한 사운드! 드라이브할 때 추천합니다.'
            },
            {
            title: 'Dream High',
            artist: '택연, 우영, 수지, 김수현, JOO',
            drama: '드림하이',
            youtubeUrl: 'https://www.youtube.com/results?search_query=드림하이+OST+Dream+High',
            comment: '꿈을 향해 도전하는 열정! 무기력한 오후에 활력을 불어넣어 줍니다.'
            },
            {
            title: '아로하',
            artist: '조정석',
            drama: '슬기로운 의사생활',
            youtubeUrl: 'https://www.youtube.com/results?search_query=조정석+아로하+슬기로운+의사생활',
            comment: '기분 좋은 평범한 일상, 소소한 행복을 느끼고 싶을 때 딱이에요.'
            },
            {
            title: '로맨틱 선데이',
            artist: '카더가든',
            drama: '갯마을 차차차',
            youtubeUrl: 'https://www.youtube.com/results?search_query=카더가든+로맨틱+선데이+갯마을+차차차',
            comment: '나른하고 평화로운 주말 오후 같은 편안함을 즐겨보세요.'
            },
        ]
    };
    
    // 감정 상태에 따라 BGM 선택
    let selectedBGM;
    if (dominantMood === 'romance' || romanceScore > 20) {
        const bgms = bgmDatabase.romance;
        selectedBGM = bgms[Math.floor(Math.random() * bgms.length)];
    } else if (dominantMood === 'comfort' || comfortScore > 20) {
        const bgms = bgmDatabase.comfort;
        selectedBGM = bgms[Math.floor(Math.random() * bgms.length)];
    } else if (dominantMood === 'conflict' || conflictScore > 20) {
        const bgms = bgmDatabase.conflict;
        selectedBGM = bgms[Math.floor(Math.random() * bgms.length)];
    } else {
        const bgms = bgmDatabase.neutral;
        selectedBGM = bgms[Math.floor(Math.random() * bgms.length)];
    }
    
    return selectedBGM;
};

// 리포트 이미지 저장용 별도 컴포넌트 (현재 UI 스타일 적용)
const ReportImageComponent = ({ report, userProfile, persona, tendencyData, messages }) => {
    if (!report) return null;
    
    // 감정 타입 분석을 위한 함수 (ReportScreens의 analyzeEmotion과 동일한 로직)
    const analyzeEmotionForGradient = (dominantEmotion, keywords, stats) => {
        const keywordText = keywords && keywords.length > 0 
            ? keywords.map(k => (k.word || k).toLowerCase()).join(' ')
            : '';
        
        const romanceScore = stats?.romanceScore || 0;
        const comfortScore = stats?.comfortScore || 0;
        const conflictScore = stats?.conflictScore || 0;
        
        const strongJoyKeywords = ['행복', '기쁨', '즐거움', '설렘', '두근', '사랑해', '좋아해', '웃음', '미소', '설레', '심쿵'];
        const joyKeywords = ['좋아', '기쁘', '즐거', '행복해', '좋아한다', '행복함'];
        const strongSadKeywords = ['우울', '슬픔', '울적', '우울함', '슬퍼', '절망', '비관'];
        const lonelinessKeywords = ['외로움', '외로워', '그리움', '그리워', '허전', '공허'];
        const painKeywords = ['아픔', '아파', '고통', '괴로워', '괴로움'];
        const calmKeywords = ['평온', '안정', '차분', '평화', '위로', '안심', '편안', '여유', '평온함'];
        const strongAngerKeywords = ['화남', '분노', '화나', '미워', '싫어', '최악'];
        const stressKeywords = ['답답', '스트레스'];
        const tiredKeywords = ['힘들', '힘듦', '피곤', '지침', '지쳐', '피로', '지치'];
        
        let emotionScores = {
            joy: 0, sad: 0, calm: 0, anger: 0, tired: 0, lonely: 0
        };
        
        const hasActualAnnoyance = /짜증(나|내|낸|나는|났|날)/.test(keywordText) || 
                                    /(너|당신|네|니|그쪽).{0,5}(때문|탓|잘못|화나|짜증)/.test(keywordText);
        
        if (hasActualAnnoyance) emotionScores.anger += 3;
        
        let tiredCount = 0;
        tiredKeywords.forEach(k => {
            if (keywordText.includes(k)) {
                emotionScores.tired += 3;
                tiredCount++;
            }
        });
        
        strongJoyKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.joy += 3;
        });
        joyKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.joy += 1;
        });
        strongSadKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.sad += 3;
        });
        lonelinessKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.lonely += 2;
        });
        painKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.sad += 2;
        });
        calmKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.calm += 2;
        });
        strongAngerKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.anger += 3;
        });
        stressKeywords.forEach(k => {
            if (keywordText.includes(k)) emotionScores.anger += 2;
        });
        
        if (tiredCount >= 2) emotionScores.tired += 5;
        if (romanceScore > 30) emotionScores.joy += 2;
        if (comfortScore > 30 && emotionScores.sad < 3) emotionScores.calm += 2;
        if (conflictScore > 30 && tiredCount < 2) emotionScores.anger += 2;
        
        if (dominantEmotion === 'romance') emotionScores.joy += 3;
        if (dominantEmotion === 'comfort') {
            if (emotionScores.lonely > 0) emotionScores.lonely += 2;
            else emotionScores.calm += 2;
        }
        if (dominantEmotion === 'conflict' && tiredCount < 2) emotionScores.anger += 3;
        
        const maxScore = Math.max(...Object.values(emotionScores));
        if (maxScore === 0) return 'calm';
        
        if (tiredCount >= 2 && emotionScores.tired > 0) return 'tired';
        if (emotionScores.joy === maxScore) return 'joy';
        if (emotionScores.lonely === maxScore) return 'lonely';
        if (emotionScores.sad === maxScore) return 'sad';
        if (emotionScores.tired === maxScore || (emotionScores.tired > 0 && emotionScores.tired >= emotionScores.anger)) return 'tired';
        if (emotionScores.anger === maxScore) return 'anger';
        if (emotionScores.calm === maxScore) return 'calm';
        return 'calm';
    };
    
    // 그라데이션 생성 함수
    const generateGradientForReport = (emotionType, reportId, episode, dominantMood) => {
        const moodColors = {
            romance: {
                base: ['#FCE4EC', '#F8BBD0', '#F48FB1', '#F5B0C7', '#F9C5D1', '#F3A5B5'],
                accent: ['#F8BBD0', '#F48FB1', '#F5B0C7', '#F9C5D1', '#FCE4EC', '#F3A5B5']
            },
            comfort: {
                base: ['#E1F5FE', '#B3E5FC', '#BBDEFB', '#C5E1F5', '#D1E7F0', '#B2DFDB'],
                accent: ['#B3E5FC', '#BBDEFB', '#C5E1F5', '#D1E7F0', '#B2DFDB', '#A7E8E0']
            },
            conflict: {
                base: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FFAB91'],
                accent: ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FFAB91', '#FF8A65']
            },
            neutral: {
                base: ['#E8F5E9', '#C8E6C9', '#DCEDC8', '#F1F8E9', '#FFF9C4', '#FFFDE7'],
                accent: ['#C8E6C9', '#DCEDC8', '#F1F8E9', '#FFF9C4', '#FFFDE7', '#FFF8E1']
            }
        };
        
        const emotionColors = {
            joy: {
                base: ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEB3B', '#FFE082'],
                accent: ['#FFF9C4', '#FFF59D', '#FFF176', '#FFEB3B', '#FFE082', '#FFD54F']
            },
            sad: {
                base: ['#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#81D4FA', '#90CAF9'],
                accent: ['#B3E5FC', '#81D4FA', '#4FC3F7', '#90CAF9', '#64B5F6', '#42A5F5']
            },
            calm: {
                base: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#AED581'],
                accent: ['#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#AED581', '#9CCC65']
            },
            anger: {
                base: ['#FFF3E0', '#FFE0B2', '#FFCCBC', '#FFAB91', '#FF8A65', '#FFB74D'],
                accent: ['#FFE0B2', '#FFCCBC', '#FFAB91', '#FF8A65', '#FFB74D', '#FFA726']
            },
            tired: {
                base: ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107'],
                accent: ['#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300']
            },
            lonely: {
                base: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#CE93D8'],
                accent: ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#CE93D8', '#BA68C8']
            }
        };
        
        let colors;
        if (dominantMood && moodColors[dominantMood]) {
            colors = moodColors[dominantMood];
        } else {
            colors = emotionColors[emotionType] || emotionColors.calm;
        }
        
        const seedValue = reportId || episode || Math.floor(Date.now() / 1000);
        const seed = Math.abs(seedValue);
        const hash = (str) => {
            let hash = 0;
            const strVal = String(str);
            for (let i = 0; i < strVal.length; i++) {
                const char = strVal.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash);
        };
        const seedHash = hash(seed);
        let counter = 0;
        const random = (max) => {
            counter++;
            return (seedHash * counter * 17 + counter * 23) % max;
        };
        
        const numColors = 2 + (seedHash % 2);
        const selectedColors = [];
        const baseIndex = random(colors.base.length);
        selectedColors.push(colors.base[baseIndex]);
        for (let i = 1; i < numColors; i++) {
            const accentIndex = random(colors.accent.length);
            selectedColors.push(colors.accent[accentIndex]);
        }
        
        const angle = seedHash % 360;
        const stop1 = 30 + (seedHash % 40);
        const useRadial = (seedHash % 2) === 0;
        
        if (useRadial && selectedColors.length >= 2) {
            const positionX = 30 + (seedHash % 40);
            const positionY = 30 + ((seedHash * 7) % 40);
            if (selectedColors.length === 3) {
                return `radial-gradient(circle at ${positionX}% ${positionY}%, ${selectedColors[0]} 0%, ${selectedColors[1]} ${stop1}%, ${selectedColors[2]} 100%)`;
            } else {
                return `radial-gradient(circle at ${positionX}% ${positionY}%, ${selectedColors[0]} 0%, ${selectedColors[1]} 100%)`;
            }
        } else {
            if (selectedColors.length === 2) {
                return `linear-gradient(${angle}deg, ${selectedColors[0]} 0%, ${selectedColors[1]} 100%)`;
            } else {
                return `linear-gradient(${angle}deg, ${selectedColors[0]} 0%, ${selectedColors[1]} ${stop1}%, ${selectedColors[2]} 100%)`;
            }
        }
    };
    
    // 감정 요약 데이터 (이모지 대신 텍스트와 점수)
    const getEmotionSummary = () => {
        const { stats } = report;
        const { romanceScore, comfortScore, conflictScore } = stats;
        
        const emotions = [
            { score: romanceScore, name: '로맨스', color: '#E91E63' },
            { score: comfortScore, name: '위로', color: '#4CAF50' },
            { score: conflictScore, name: '갈등', color: '#FF9800' }
        ];
        
        // 점수 순으로 정렬하고 상위 3개 선택
        return emotions.sort((a, b) => b.score - a.score).slice(0, 3);
    };
    
    // 날짜 포맷팅
    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };
    
    const emotionSummary = getEmotionSummary();
    const recommendationActivities = report?.suggestions?.slice(0, 3) || [];
    
    // 감정 타입 분석 및 그라데이션 생성
    const emotionType = analyzeEmotionForGradient(
        report.dominantEmotion || report.stats?.dominantMood,
        report.keywords,
        report.stats
    );
    const dominantMood = report.dominantEmotion || report.stats?.dominantMood || null;
    const uniqueId = report.id || report.episode || (report.date ? new Date(report.date).getTime() : Date.now());
    const gradientBg = generateGradientForReport(emotionType, uniqueId, report.episode, dominantMood);
    
    return (
        <div data-report-content="true" style={{
            width: '600px',
            minHeight: '900px',
            background: gradientBg,
            backgroundImage: gradientBg,
            padding: '40px 50px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
            color: '#5D4037',
            boxSizing: 'border-box',
            position: 'relative',
            border: '1px solid #E8E0DB',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
            {/* 헤더 */}
            <div style={{
                marginBottom: '40px',
                paddingBottom: '24px',
                borderBottom: '1.5px solid #E8E0DB'
            }}>
                <div style={{
                    fontSize: '11px',
                    color: '#8D6E63',
                    marginBottom: '8px',
                    letterSpacing: '2px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    Weekly Mind Report
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#A1887F',
                    letterSpacing: '0.5px',
                    fontWeight: '400',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    {formatDate(report.date)}
                </div>
            </div>
            
            {/* 1. 마음 상태 진단 */}
            <div style={{
                background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F1EB 100%)',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid #E8E0DB',
                marginBottom: '32px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '12px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    1. 마음 상태 진단
                </div>
                <h2 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#5D4037',
                    margin: '0 0 16px 0',
                    lineHeight: '1.3',
                    letterSpacing: '-0.5px',
                    fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                    textAlign: 'left',
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-line'
                }}>
                    {persona?.title || '마음 상태 진단'}
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: '#5D4037',
                    margin: 0,
                    lineHeight: '1.6',
                    textAlign: 'left',
                    fontWeight: '400',
                    fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                    wordBreak: 'keep-all'
                }}>
                    {persona?.summary || '이번 주 대화를 분석한 결과입니다.'}
                </p>
            </div>
            
            {/* 2. 이번 주 감정 요약 */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid #E8E0DB',
                marginBottom: '32px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '20px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    2. 이번 주 감정 요약
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {emotionSummary.map((emotion, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '70px',
                                fontSize: '12px',
                                color: '#5D4037',
                                fontWeight: '600',
                                fontFamily: '"Noto Sans KR", sans-serif',
                                textAlign: 'left'
                            }}>
                                {emotion.name}
                            </div>
                            <div style={{
                                flex: 1,
                                height: '8px',
                                backgroundColor: '#F5F1EB',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: `${emotion.score}%`,
                                    height: '100%',
                                    backgroundColor: emotion.color,
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                            <div style={{
                                width: '45px',
                                fontSize: '12px',
                                color: '#5D4037',
                                fontWeight: '600',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                textAlign: 'right'
                            }}>
                                {Math.round(emotion.score)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* 3. 맞춤 처방 */}
            {recommendationActivities.length > 0 && (
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1.5px solid #E8E0DB',
                    marginBottom: '32px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                    <div style={{
                        fontSize: '8px',
                        color: '#A1887F',
                        marginBottom: '16px',
                        letterSpacing: '1.5px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}>
                        3. 맞춤 처방
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {recommendationActivities.map((activity, idx) => {
                            const activityData = typeof activity === 'string' ? { activity, description: '', icon: '✨' } : activity;
                            return (
                                <div key={idx} style={{
                                    background: '#FAF8F5',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    border: '1px solid #E8E0DB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        fontSize: '1.4rem',
                                        flexShrink: 0
                                    }}>
                                        {activityData.icon || '✨'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#5D4037',
                                            marginBottom: '4px',
                                            fontFamily: '"Noto Sans KR", sans-serif'
                                        }}>
                                            {activityData.activity}
                                        </div>
                                        {activityData.description && (
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#8D6E63',
                                                lineHeight: '1.4',
                                                fontFamily: '"Noto Sans KR", sans-serif'
                                            }}>
                                                {activityData.description.substring(0, 80)}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* 4. 추천 BGM */}
            {report?.bgmRecommendation && (
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1.5px solid #E8E0DB',
                    marginBottom: '32px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                    <div style={{
                        fontSize: '8px',
                        color: '#A1887F',
                        marginBottom: '16px',
                        letterSpacing: '1.5px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}>
                        4. 추천 BGM
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F5F1EB 0%, #E8E0DB 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            flexShrink: 0
                        }}>
                            🎵
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: '#5D4037',
                                marginBottom: '4px',
                                fontFamily: '"Noto Sans KR", sans-serif'
                            }}>
                                {report.bgmRecommendation.title}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#8D6E63',
                                marginBottom: '2px',
                                fontFamily: '"Noto Sans KR", sans-serif'
                            }}>
                                {report.bgmRecommendation.artist}
                            </div>
                            {report.bgmRecommendation.drama && (
                                <div style={{
                                    fontSize: '11px',
                                    color: '#A1887F',
                                    fontFamily: '"Noto Sans KR", sans-serif'
                                }}>
                                    {report.bgmRecommendation.drama}
                                </div>
                            )}
                        </div>
                    </div>
                    {report.bgmRecommendation.comment && (
                        <div style={{
                            marginTop: '14px',
                            paddingTop: '14px',
                            borderTop: '1px solid #E8E0DB'
                        }}>
                            <p style={{
                                fontSize: '12px',
                                color: '#5D4037',
                                margin: 0,
                                lineHeight: '1.6',
                                fontFamily: '"Noto Sans KR", sans-serif'
                            }}>
                                {report.bgmRecommendation.comment}
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            {/* 5. From. 마음기록 상담사 */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid #E8E0DB',
                marginBottom: '32px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '16px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    5. 마음기록 상담사
                </div>
                <p style={{
                    fontSize: '14px',
                    color: '#5D4037',
                    margin: 0,
                    lineHeight: '1.7',
                    fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: '400',
                    textAlign: 'left',
                    wordBreak: 'keep-all',
                    marginBottom: '20px'
                }}>
                    {report.interpretation || persona?.summary || '최근 대화를 보니 다양한 감정이 섞여 있었어요. 많이 힘드셨죠? 지금 이 순간, 당신의 마음을 알아주고 싶어요. 무리하지 말고 잠시 쉬어도 괜찮아요. 당신은 충분히 소중한 사람입니다.'}
                </p>
                <div style={{
                    textAlign: 'right',
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid #E8E0DB'
                }}>
                    <div style={{
                        fontSize: '12px',
                        color: '#8D6E63',
                        fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: '400'
                    }}>
                        From. 마음기록 상담사
                    </div>
                </div>
            </div>
            
            {/* 푸터 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '24px',
                borderTop: '1px solid #E8E0DB',
                marginTop: 'auto'
            }}>
                <div style={{
                    fontSize: '10px',
                    color: '#A1887F',
                    letterSpacing: '0.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    {formatDate(report.date)}
                </div>
                <div style={{
                    fontSize: '10px',
                    color: '#A1887F',
                    letterSpacing: '0.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    IntoDrama에서 발행됨
                </div>
            </div>
        </div>
    );
};

// 심리 리포트 화면
export const ReportScreen = ({ onClose, messages, userProfile }) => {
    const [report, setReport] = useState(null);
    const [previousReports, setPreviousReports] = useState([]);
    const reportRef = useRef(null);
    const reportImageRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportDetail, setShowReportDetail] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [bgmComment, setBgmComment] = useState('');
    const [loadingBgmComment, setLoadingBgmComment] = useState(false);
    const [loading, setLoading] = useState(true);
    const bgmCommentFetchedRef = useRef(false); // 코멘트가 이미 생성되었는지 추적
    const bgmCommentInfoRef = useRef(null); // 코멘트를 가져올 때 사용한 노래 정보와 캐릭터 정보 저장
    const savedBgmRecommendationRef = useRef(null); // 처음 생성된 노래를 저장 (튕기지 않도록 고정)
    const messagesLengthRef = useRef(0); // messages 길이 추적
    const hasUserMessages = Array.isArray(messages) && messages.some(msg => {
        if (!msg || msg.sender !== 'user') return false;
        return typeof msg.text === 'string' && msg.text.trim().length > 0;
    });
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // BGM 코멘트 가져오기 (가장 많이 대화한 캐릭터가 생성) - 노래 정보와 일치하도록 수정
    useEffect(() => {
        const fetchBgmComment = async () => {
            if (!report || !report.bgmRecommendation || !messages || messages.length === 0) {
                return;
            }

            // 현재 노래 정보
            const currentBgmTitle = report.bgmRecommendation.title;
            const currentBgmArtist = report.bgmRecommendation.artist;

            // messages에서 가장 많이 대화한 캐릭터 찾기
            const characterCounts = {};
            messages.forEach(msg => {
                const charId = msg.characterId || msg.character_id;
                if (charId && msg.sender === 'ai') {
                    characterCounts[charId] = (characterCounts[charId] || 0) + 1;
                }
            });

            const topCharacterId = Object.keys(characterCounts).sort((a, b) => characterCounts[b] - characterCounts[a])[0];
            
            // 저장된 코멘트 정보와 현재 노래 정보 비교
            const savedInfo = bgmCommentInfoRef.current;
            const isSameBgm = savedInfo && 
                savedInfo.bgmTitle === currentBgmTitle && 
                savedInfo.bgmArtist === currentBgmArtist &&
                savedInfo.characterId === topCharacterId;

            // 이미 같은 노래에 대한 코멘트가 있고, 캐릭터도 같으면 스킵
            if (bgmCommentFetchedRef.current && isSameBgm) {
                return;
            }

            // 노래나 캐릭터가 바뀌었으면 코멘트 초기화
            if (savedInfo && !isSameBgm) {
                setBgmComment('');
                bgmCommentFetchedRef.current = false;
            }
            
            if (!topCharacterId) {
                setBgmComment(`${userProfile?.nickname || '사용자'}님, 이 노래를 한번 들어보세요.`);
                bgmCommentInfoRef.current = {
                    bgmTitle: currentBgmTitle,
                    bgmArtist: currentBgmArtist,
                    characterId: null
                };
                bgmCommentFetchedRef.current = true; // 생성 완료 표시
                return;
            }

            setLoadingBgmComment(true);
            bgmCommentFetchedRef.current = true; // 생성 시작 표시 (중복 방지)
            try {
                const { api } = await import('../utils/api');
                const response = await api.getBgmComment({
                    character_id: topCharacterId,
                    bgm_title: currentBgmTitle,
                    bgm_artist: currentBgmArtist,
                    user_nickname: userProfile?.nickname || '사용자'
                });
                setBgmComment(response.comment || `${userProfile?.nickname || '사용자'}님, 이 노래를 한번 들어보세요.`);
                // 코멘트 정보 저장
                bgmCommentInfoRef.current = {
                    bgmTitle: currentBgmTitle,
                    bgmArtist: currentBgmArtist,
                    characterId: topCharacterId
                };
            } catch (error) {
                console.error('BGM 코멘트 생성 오류:', error);
                setBgmComment(`${userProfile?.nickname || '사용자'}님, 이 노래를 한번 들어보세요.`);
                bgmCommentInfoRef.current = {
                    bgmTitle: currentBgmTitle,
                    bgmArtist: currentBgmArtist,
                    characterId: topCharacterId
                };
            } finally {
                setLoadingBgmComment(false);
            }
        };

        fetchBgmComment();
    }, [report, messages, userProfile]);

    useEffect(() => {
        // 백엔드 API를 사용하여 리포트 생성
        const fetchReport = async () => {
            setLoading(true);
            
            if (!hasUserMessages) {
                setReport(null);
                setLoading(false);
                setBgmComment(''); // 코멘트 초기화
                bgmCommentFetchedRef.current = false; // 리포트가 없으면 ref 초기화
                bgmCommentInfoRef.current = null; // 코멘트 정보 초기화
                savedBgmRecommendationRef.current = null; // 노래 정보 초기화
                messagesLengthRef.current = 0; // messages 길이 초기화
                return;
            }
            
            try {
                const { api } = await import('../utils/api');
                const backendReport = await api.generatePsychologyReport({ messages });
                
                // 백엔드 응답을 프론트엔드 형식으로 변환
                const convertedReport = convertBackendReportToFrontendFormat(backendReport, messages, userProfile);
                
                // messages 길이가 크게 줄어들었으면 새로운 대화 세션으로 간주하고 노래 초기화
                const currentMessagesLength = messages ? messages.length : 0;
                const isNewSession = currentMessagesLength < messagesLengthRef.current * 0.5;
                
                // 노래 고정: 저장된 노래가 있고 새로운 세션이 아니면 기존 노래 사용
                let bgmRecommendation = null;
                if (savedBgmRecommendationRef.current && !isNewSession) {
                    bgmRecommendation = savedBgmRecommendationRef.current;
                } else {
                    // 새로운 노래 생성
                    bgmRecommendation = convertedReport.bgmRecommendation || generateBGMRecommendation(
                        convertedReport.dominantMood || convertedReport.stats?.dominantMood || 'neutral',
                        convertedReport.stats?.romanceScore || 0,
                        convertedReport.stats?.comfortScore || 0,
                        convertedReport.stats?.conflictScore || 0
                    );
                    savedBgmRecommendationRef.current = bgmRecommendation; // 노래 저장
                }
                
                messagesLengthRef.current = currentMessagesLength; // messages 길이 업데이트
                
                const enrichedReport = convertedReport ? {
                    ...convertedReport,
                    bgmRecommendation: bgmRecommendation
                } : null;
                setReport(enrichedReport);
                
                // 새로운 세션이면 코멘트 초기화, 아니면 유지
                if (isNewSession) {
                    setBgmComment(''); // 새로운 리포트가 생성되면 코멘트 초기화
                    bgmCommentFetchedRef.current = false; // 새로운 리포트가 생성되면 ref 초기화하여 코멘트 재생성 가능
                    bgmCommentInfoRef.current = null; // 코멘트 정보 초기화
                }
            } catch (error) {
                console.error('리포트 생성 오류:', error);
                // 백엔드 실패 시 클라이언트 사이드 생성으로 폴백
                const currentMessagesLength = messages ? messages.length : 0;
                const isNewSession = currentMessagesLength < messagesLengthRef.current * 0.5;
                
                // 노래 고정: 저장된 노래가 있고 새로운 세션이 아니면 기존 노래 사용
                let bgmRecommendation = null;
                if (savedBgmRecommendationRef.current && !isNewSession) {
                    bgmRecommendation = savedBgmRecommendationRef.current;
                }
                
                const newReport = generateReport(messages, userProfile);
                
                // 노래가 없으면 새로 생성한 리포트의 노래 사용
                if (!bgmRecommendation) {
                    bgmRecommendation = newReport.bgmRecommendation;
                    savedBgmRecommendationRef.current = bgmRecommendation; // 노래 저장
                }
                
                messagesLengthRef.current = currentMessagesLength;
                
                const reportWithFixedBgm = {
                    ...newReport,
                    bgmRecommendation: bgmRecommendation
                };
                setReport(reportWithFixedBgm);
                
                // 새로운 세션이면 코멘트 초기화
                if (isNewSession) {
                    setBgmComment(''); // 새로운 리포트가 생성되면 코멘트 초기화
                    bgmCommentFetchedRef.current = false; // 새로운 리포트가 생성되면 ref 초기화
                    bgmCommentInfoRef.current = null; // 코멘트 정보 초기화
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchReport();

        // 저장된 리포트 목록 불러오기 및 에피소드 번호 자동 부여
        const savedReports = psychologyReports.load();
        
        // 날짜별로 그룹화
        const reportsByDate = {};
        savedReports.forEach(report => {
            if (report.date) {
                const date = report.date instanceof Date ? report.date : new Date(report.date);
                const dateStr = date.toLocaleDateString('ko-KR');
                if (!reportsByDate[dateStr]) {
                    reportsByDate[dateStr] = [];
                }
                reportsByDate[dateStr].push(report);
            }
        });
        
        // 같은 날짜에 2개 이상의 리포트가 있는 경우 에피소드 번호 부여
        let hasChanges = false;
        Object.keys(reportsByDate).forEach(dateStr => {
            const reportsOnDate = reportsByDate[dateStr];
            if (reportsOnDate.length > 1) {
                // 날짜순으로 정렬 (같은 날짜이지만 시간이 다를 수 있음)
                reportsOnDate.sort((a, b) => {
                    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                    return dateA - dateB;
                });
                
                // 에피소드 번호 부여
                reportsOnDate.forEach((report, index) => {
                    const expectedEpisode = index + 1;
                    if (report.episodeNumber !== expectedEpisode) {
                        report.episodeNumber = expectedEpisode;
                        hasChanges = true;
                    }
                });
            }
        });
        
        // 변경사항이 있으면 저장
        if (hasChanges) {
            psychologyReports.save(savedReports);
        }
        
        setPreviousReports(savedReports);
    }, [messages, userProfile, hasUserMessages]);
    
    // BGM 코멘트 가져오기 - 중복 제거 (위의 useEffect와 동일한 기능이므로 제거)

    // 정서적 상태 진단 및 위로 메시지 생성 함수
    const generatePersona = (report) => {
        if (!report) return { 
            title: '지금은 마음의 짐을 잠시 내려놓을 때', 
            summary: '최근 대화에서 다양한 감정이 섞여 있었어요. 많이 힘드셨죠? 지금 이 순간, 당신의 마음을 알아주고 싶어요.', 
            tags: ['#휴식필요', '#마음_챙김', '#따뜻한_위로'] 
        };
        
        const { stats, dominantMood } = report;
        const { romanceScore, comfortScore, conflictScore } = stats;
        
        // 정서적 상태 진단 및 위로 메시지
        let persona = { title: '', summary: '', tags: [] };
        
        // 감정 점수에 따라 더 세밀하게 분류
        const totalScore = romanceScore + comfortScore + conflictScore;
        const romanceRatio = totalScore > 0 ? romanceScore / totalScore : 0;
        const comfortRatio = totalScore > 0 ? comfortScore / totalScore : 0;
        const conflictRatio = totalScore > 0 ? conflictScore / totalScore : 0;
        
        if (conflictScore > 50) {
            // 갈등이 매우 높은 경우
            const variants = [
                {
                    title: '지금은 마음의 짐을 잠시 내려놓을 때',
                    summary: '최근 대화에서 갈등과 복잡한 감정이 많이 느껴졌어요. 많이 힘드셨죠? 지금은 무리하지 말고 잠시 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#휴식필요', '#스트레스_관리', '#마음_챙김']
                },
                {
                    title: '마음이 복잡한 하루',
                    summary: '최근 대화를 보니 마음이 복잡하고 혼란스러운 감정이 느껴졌어요. 이런 감정도 당연한 거예요. 지금은 조금만 천천히, 자신을 다독여주세요.',
                    tags: ['#감정_정리', '#자기_이해', '#마음_챙김']
                },
                {
                    title: '지친 마음에 위로를',
                    summary: '최근 대화에서 스트레스와 피로감이 많이 느껴졌어요. 당신은 충분히 노력하고 있어요. 지금은 잠시 멈춰서 자신을 돌봐도 괜찮아요.',
                    tags: ['#자기_돌봄', '#휴식필요', '#위로']
                },
                {
                    title: '답답한 마음을 풀어내는 시간',
                    summary: '최근 대화를 보니 답답하고 억울한 감정이 많이 느껴졌어요. 이런 감정을 느끼는 것 자체가 당신이 살아있다는 증거예요. 지금은 조금만 쉬어도 괜찮아요.',
                    tags: ['#감정_인정', '#자기_이해', '#휴식필요']
                },
                {
                    title: '혼란스러운 마음, 잠시 멈춤',
                    summary: '최근 대화에서 혼란과 갈등이 많이 느껴졌어요. 모든 것이 한 번에 해결되지 않아도 괜찮아요. 지금은 조금만 천천히, 자신에게 친절하게 대해주세요.',
                    tags: ['#자기_친절', '#마음_챙김', '#휴식필요']
                },
                {
                    title: '무거운 마음을 내려놓는 순간',
                    summary: '최근 대화를 보니 마음이 무겁고 힘든 감정이 느껴졌어요. 당신은 혼자가 아니에요. 지금은 조금만 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#위로', '#자기_돌봄', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (conflictScore > 30) {
            // 갈등이 중간 정도인 경우
            const variants = [
                {
                    title: '조금은 복잡한 마음',
                    summary: '최근 대화에서 약간의 갈등과 복잡한 감정이 느껴졌어요. 하지만 괜찮아요. 이런 감정도 성장의 과정이에요. 자신을 너무 탓하지 마세요.',
                    tags: ['#성장', '#자기_이해', '#마음_챙김']
                },
                {
                    title: '마음이 무거운 하루',
                    summary: '최근 대화를 보니 마음이 무겁고 답답한 감정이 느껴졌어요. 지금은 조금만 쉬어도 괜찮아요. 당신의 감정을 인정하고 받아들이는 것부터 시작해보세요.',
                    tags: ['#감정_인정', '#휴식필요', '#따뜻한_위로']
                },
                {
                    title: '약간의 불안, 하지만 괜찮아요',
                    summary: '최근 대화에서 약간의 불안과 걱정이 느껴졌어요. 하지만 괜찮아요. 이런 감정을 느끼는 것도 당연한 거예요. 지금은 조금만 천천히, 자신을 돌봐주세요.',
                    tags: ['#자기_돌봄', '#마음_챙김', '#안정']
                },
                {
                    title: '혼란스러운 감정, 잠시 멈춤',
                    summary: '최근 대화를 보니 약간의 혼란과 복잡한 감정이 느껴졌어요. 모든 것이 명확하지 않아도 괜찮아요. 지금은 조금만 쉬어도 괜찮아요.',
                    tags: ['#휴식필요', '#자기_이해', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (comfortScore > 50) {
            // 위로가 매우 높은 경우
            const variants = [
                {
                    title: '누군가의 온기가 그리운 날',
                    summary: '최근 대화에서 위로와 안정을 찾으려는 마음이 많이 느껴졌어요. 외로움이나 그리움이 느껴지는 하루였나요? 당신의 마음을 알아주고 싶어요.',
                    tags: ['#따뜻한_위로', '#공감_필요', '#마음_나누기']
                },
                {
                    title: '따뜻한 포옹이 필요한 순간',
                    summary: '최근 대화를 보니 따뜻한 위로와 공감을 원하는 마음이 많이 느껴졌어요. 혼자 감당하기 어려운 마음이 있나요? 당신은 혼자가 아니에요.',
                    tags: ['#공감', '#위로', '#연결']
                },
                {
                    title: '마음의 안식처를 찾는 하루',
                    summary: '최근 대화에서 평온과 안정을 찾으려는 마음이 많이 느껴졌어요. 지금 이 순간, 당신의 마음에 따뜻한 위로를 전하고 싶어요.',
                    tags: ['#안정', '#위로', '#마음_챙김']
                },
                {
                    title: '외로움이 느껴지는 하루',
                    summary: '최근 대화를 보니 외로움과 그리움이 많이 느껴졌어요. 혼자라는 느낌이 드는 하루였나요? 당신은 혼자가 아니에요. 지금 이 순간, 당신의 마음을 알아주고 싶어요.',
                    tags: ['#외로움', '#위로', '#연결']
                },
                {
                    title: '따뜻한 말 한마디가 그리운 날',
                    summary: '최근 대화에서 따뜻한 말과 공감을 원하는 마음이 많이 느껴졌어요. 지금은 조금만 쉬어도 괜찮아요. 당신의 마음에 따뜻함을 전하고 싶어요.',
                    tags: ['#따뜻함', '#공감', '#위로']
                },
                {
                    title: '마음이 허전한 하루',
                    summary: '최근 대화를 보니 마음이 허전하고 공허한 감정이 느껴졌어요. 이런 감정도 당연한 거예요. 지금은 조금만 천천히, 자신을 돌봐주세요.',
                    tags: ['#자기_돌봄', '#위로', '#마음_챙김']
                },
                {
                    title: '안아주고 싶은 마음',
                    summary: '최근 대화에서 따뜻한 포옹과 위로를 원하는 마음이 많이 느껴졌어요. 지금 이 순간, 당신의 마음을 감싸주고 싶어요.',
                    tags: ['#포옹', '#위로', '#따뜻함']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (comfortScore > 30) {
            // 위로가 중간 정도인 경우
            const variants = [
                {
                    title: '조용한 위로가 필요한 하루',
                    summary: '최근 대화에서 약간의 외로움과 그리움이 느껴졌어요. 지금은 조용히 자신을 돌보고, 작은 위로를 찾아보세요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#자기_돌봄', '#위로', '#마음_챙김']
                },
                {
                    title: '따뜻한 마음이 그리운 날',
                    summary: '최근 대화를 보니 따뜻한 교감과 공감을 원하는 마음이 느껴졌어요. 지금 이 순간, 당신의 마음에 따뜻함을 전하고 싶어요.',
                    tags: ['#따뜻함', '#공감', '#연결']
                },
                {
                    title: '작은 위로가 필요한 순간',
                    summary: '최근 대화에서 약간의 외로움과 그리움이 느껴졌어요. 작은 위로라도 괜찮아요. 지금은 조금만 천천히, 자신을 돌봐주세요.',
                    tags: ['#위로', '#자기_돌봄', '#마음_챙김']
                },
                {
                    title: '공감이 필요한 하루',
                    summary: '최근 대화를 보니 공감과 이해를 원하는 마음이 느껴졌어요. 당신의 마음을 알아주고 싶어요. 지금은 조금만 쉬어도 괜찮아요.',
                    tags: ['#공감', '#이해', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (romanceScore > 50) {
            // 로맨스가 매우 높은 경우
            const variants = [
                {
                    title: '따뜻한 감정이 흐르는 순간',
                    summary: '최근 대화에서 따뜻한 감정과 교감을 나누려는 마음이 많이 느껴졌어요. 지금 이 순간의 감정을 소중히 여기고, 당신의 마음을 알아주고 싶어요.',
                    tags: ['#감정_인정', '#따뜻한_교감', '#마음_챙김']
                },
                {
                    title: '사랑이 피어나는 하루',
                    summary: '최근 대화를 보니 따뜻하고 부드러운 감정이 많이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 지금 이 순간을 충분히 즐기고 느껴보세요.',
                    tags: ['#사랑', '#감정_인정', '#소중함']
                },
                {
                    title: '마음이 설레는 순간',
                    summary: '최근 대화에서 설렘과 기대감이 많이 느껴졌어요. 이런 감정은 삶을 더 풍요롭게 만들어요. 지금 이 순간의 감정을 소중히 여기세요.',
                    tags: ['#설렘', '#기대', '#감정_인정']
                },
                {
                    title: '따뜻한 마음이 뛰는 하루',
                    summary: '최근 대화를 보니 따뜻하고 설레는 감정이 많이 느껴졌어요. 이런 감정은 정말 아름다운 거예요. 지금 이 순간을 충분히 즐기고 느껴보세요.',
                    tags: ['#설렘', '#감정_인정', '#아름다움']
                },
                {
                    title: '사랑의 감정이 흐르는 순간',
                    summary: '최근 대화에서 사랑과 따뜻함이 많이 느껴졌어요. 이런 감정은 당신의 마음을 더 풍요롭게 만들어요. 지금 이 순간의 감정을 소중히 여기세요.',
                    tags: ['#사랑', '#따뜻함', '#감정_인정']
                },
                {
                    title: '마음이 두근거리는 하루',
                    summary: '최근 대화를 보니 두근거림과 설렘이 많이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 지금 이 순간을 충분히 즐겨보세요.',
                    tags: ['#설렘', '#두근거림', '#소중함']
                },
                {
                    title: '따뜻한 교감이 흐르는 순간',
                    summary: '최근 대화에서 따뜻한 교감과 감정이 많이 느껴졌어요. 이런 감정은 삶을 더 아름답게 만들어요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#교감', '#따뜻함', '#아름다움']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (romanceScore > 30) {
            // 로맨스가 중간 정도인 경우
            const variants = [
                {
                    title: '따뜻한 감정의 하루',
                    summary: '최근 대화에서 따뜻하고 긍정적인 감정이 느껴졌어요. 이런 감정은 당신의 마음을 더 풍요롭게 만들어요. 지금 이 순간을 즐겨보세요.',
                    tags: ['#긍정', '#감정_인정', '#마음_챙김']
                },
                {
                    title: '마음이 따뜻해지는 순간',
                    summary: '최근 대화를 보니 따뜻한 교감과 감정이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#따뜻함', '#교감', '#소중함']
                },
                {
                    title: '부드러운 감정이 흐르는 하루',
                    summary: '최근 대화에서 부드럽고 따뜻한 감정이 느껴졌어요. 이런 감정은 당신의 마음을 더 아름답게 만들어요. 지금 이 순간을 소중히 여기세요.',
                    tags: ['#따뜻함', '#감정_인정', '#아름다움']
                },
                {
                    title: '긍정적인 감정이 느껴지는 순간',
                    summary: '최근 대화를 보니 긍정적이고 따뜻한 감정이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#긍정', '#따뜻함', '#소중함']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else {
            // 평온하지만 피로감이 있는 경우
            const variants = [
                {
                    title: '조용히 쉬어도 좋은 하루',
                    summary: '최근 대화에서 평온하지만 어딘가 지친 마음이 느껴졌어요. 지금은 조용히 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#휴식필요', '#마음_챙김', '#따뜻한_위로']
                },
                {
                    title: '평온한 하루, 조용한 마음',
                    summary: '최근 대화를 보니 평온하지만 약간의 피로감이 느껴졌어요. 지금은 무리하지 말고 자신을 돌보는 시간을 가져보세요. 작은 휴식도 충분히 의미 있어요.',
                    tags: ['#자기_돌봄', '#휴식', '#마음_챙김']
                },
                {
                    title: '여유롭게 쉬어가는 하루',
                    summary: '최근 대화에서 평온하고 안정적인 감정이 느껴졌어요. 지금은 조금만 천천히, 자신을 돌보는 시간을 가져보세요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#안정', '#자기_돌봄', '#마음_챙김']
                },
                {
                    title: '조용한 하루, 작은 휴식',
                    summary: '최근 대화를 보니 평온하지만 약간의 지침이 느껴졌어요. 지금은 조금만 쉬어도 괜찮아요. 작은 휴식도 충분히 의미 있어요.',
                    tags: ['#휴식', '#마음_챙김', '#자기_돌봄']
                },
                {
                    title: '평온한 마음, 작은 여유',
                    summary: '최근 대화에서 평온하고 안정적인 감정이 느껴졌어요. 지금은 조금만 천천히, 자신을 돌보는 시간을 가져보세요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#안정', '#여유', '#마음_챙김']
                },
                {
                    title: '조용한 하루, 따뜻한 마음',
                    summary: '최근 대화를 보니 평온하고 따뜻한 감정이 느껴졌어요. 지금은 조금만 천천히, 자신을 돌보는 시간을 가져보세요. 작은 휴식도 충분히 의미 있어요.',
                    tags: ['#따뜻함', '#휴식', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        }
        
        return persona;
    };

    // 마음 컨디션 데이터 생성
    const generateTendencyData = (report) => {
        if (!report) return [];
        
        const { stats, keywords } = report;
        const { romanceScore, comfortScore, conflictScore } = stats;
        
        // 힘듦/스트레스 관련 키워드 확인
        const tiredStressKeywords = ['힘들', '스트레스', '피곤', '지치', '지침', '힘듦', '피로', '지쳐', '답답', '스트레스받'];
        let tiredStressCount = 0;
        let totalKeywordCount = 0;
        
        if (keywords && Array.isArray(keywords) && keywords.length > 0) {
            keywords.forEach(kw => {
                const word = (typeof kw === 'string' ? kw : kw.word || '').toLowerCase();
                const count = typeof kw === 'object' && kw.count ? kw.count : 1;
                totalKeywordCount += count;
                
                // 힘듦/스트레스 키워드가 포함되어 있는지 확인
                const hasTiredStressKeyword = tiredStressKeywords.some(keyword => word.includes(keyword));
                if (hasTiredStressKeyword) {
                    tiredStressCount += count;
                }
            });
        }
        
        // 힘듦/스트레스 키워드 비율 계산
        const tiredStressRatio = totalKeywordCount > 0 ? tiredStressCount / totalKeywordCount : 0;
        
        // 감정 점수가 백엔드에서 말투 분석을 반영한 값이므로 그대로 사용
        // 스트레스 지수 (갈등 점수가 높을수록 스트레스 높음)
        // 힘듦/스트레스 키워드가 많을수록 스트레스 지수 증가
        // conflictScore는 0-100 범위이므로 그대로 사용하되, 힘듦/스트레스 키워드 비율에 따라 추가 가중치 적용
        let stressLevel = Math.min(100, Math.max(0, conflictScore));
        // 힘듦/스트레스 키워드 비율에 따라 추가 스트레스 점수 부여 (최대 40점까지)
        const additionalStressFromKeywords = Math.min(40, tiredStressRatio * 100);
        stressLevel = Math.min(100, stressLevel + additionalStressFromKeywords);
        const stressPosition = stressLevel; // 0% = 편안함, 100% = 위험
        
        // 사회적 배터리 (위로 점수와 로맨스 점수 기반, 높을수록 배터리 충전됨)
        // 힘듦/스트레스 키워드가 많을수록 배터리 감소
        // 두 점수의 평균을 사용하여 더 정확하게 반영
        let avgPositiveScore = (comfortScore + romanceScore) / 2;
        // 힘듦/스트레스 키워드 비율에 따라 배터리 감소 (최대 40점까지 감소)
        const batteryDrainFromKeywords = Math.min(40, tiredStressRatio * 100);
        avgPositiveScore = Math.max(0, avgPositiveScore - batteryDrainFromKeywords);
        const socialBattery = Math.min(100, Math.max(0, avgPositiveScore));
        const batteryPosition = socialBattery; // 0% = 방전, 100% = 완충
        
        // 자존감/확신 (갈등이 낮고 위로가 높을수록 단단함)
        // comfortScore가 높고 conflictScore가 낮을수록 높은 자존감
        // 더 민감하게 반영하기 위해 가중치 조정
        const confidenceBase = comfortScore - (conflictScore * 0.8); // 갈등 점수에 더 큰 가중치
        const confidenceLevel = Math.min(100, Math.max(0, confidenceBase + 50));
        const confidencePosition = confidenceLevel; // 0% = 흔들림, 100% = 단단함
        
        return [
            {
                left: { icon: '😌', text: '편안함' },
                right: { icon: '🤯', text: '위험' },
                position: stressPosition,
                value: stressLevel,
                label: '스트레스 지수'
            },
            {
                left: { icon: '🪫', text: '방전' },
                right: { icon: '🔋', text: '완충' },
                position: batteryPosition,
                value: socialBattery,
                label: '사회적 배터리'
            },
            {
                left: { icon: '🍃', text: '흔들림' },
                right: { icon: '🌳', text: '단단함' },
                position: confidencePosition,
                value: confidenceLevel,
                label: '자존감/확신'
            }
        ];
    };

    const handleSaveReport = async () => {
        if (!report || !reportImageRef.current) {
            alert('리포트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        setIsSaving(true);
        
        try {
            // 리포트 이미지 컴포넌트가 제대로 렌더링되었는지 확인
            const element = reportImageRef.current;
            if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
                alert('리포트 이미지를 준비하는 중입니다. 잠시 후 다시 시도해주세요.');
                setIsSaving(false);
                return;
            }
            
            // 약간의 지연을 주어 렌더링이 완료되도록 함
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 리포트 이미지 컴포넌트를 이미지로 캡처
            const canvas = await html2canvas(element, {
                backgroundColor: null, // 그라데이션 배경을 제대로 캡처하기 위해 null로 설정
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
                width: element.scrollWidth,
                height: element.scrollHeight,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    // 클론된 문서에서도 스타일이 제대로 적용되도록 함
                    const clonedElement = clonedDoc.querySelector('[data-report-image]');
                    if (clonedElement) {
                        clonedElement.style.visibility = 'visible';
                        clonedElement.style.display = 'block';
                    }
                    // 리포트 콘텐츠의 그라데이션 배경이 제대로 표시되도록
                    const clonedReportContent = clonedDoc.querySelector('[data-report-content="true"]');
                    if (clonedReportContent) {
                        // 그라데이션 스타일이 제대로 복사되도록 함
                        clonedReportContent.style.background = element.querySelector('[data-report-content="true"]')?.style.background || '';
                        clonedReportContent.style.backgroundImage = element.querySelector('[data-report-content="true"]')?.style.backgroundImage || '';
                    }
                }
            });

            // Canvas를 Blob으로 변환
            canvas.toBlob((blob) => {
                const imageUrl = URL.createObjectURL(blob);
                
                const savedReports = psychologyReports.load();
                const reportDate = report.date instanceof Date ? report.date : new Date(report.date);
                const dateStr = reportDate.toLocaleDateString('ko-KR');
                
                // 같은 날짜의 리포트들 찾기
                const reportsOnSameDate = savedReports.filter(r => {
                    const rDate = r.date instanceof Date ? r.date : new Date(r.date);
                    return rDate.toLocaleDateString('ko-KR') === dateStr;
                });
                
                // 에피소드 번호 결정
                let episodeNumber = null;
                if (reportsOnSameDate.length > 0) {
                    // 이미 같은 날짜에 리포트가 있으면 새로운 에피소드 번호 부여
                    episodeNumber = reportsOnSameDate.length + 1;
                    
                    // 기존 리포트들에 에피소드 번호 부여 (없는 경우)
                    reportsOnSameDate.forEach((r, idx) => {
                        if (!r.episodeNumber) {
                            r.episodeNumber = idx + 1;
                        }
                    });
                }
                
                // 파일명 생성
                const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
                const filename = episodeNumber 
                    ? `마음케어리포트_${dateStr}_ep${episodeNumber}_${timestamp}.png`
                    : `마음케어리포트_${dateStr}_${timestamp}.png`;
                
                // 실제 파일 다운로드
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // 리포트에 이미지 URL, 에피소드 번호, persona 정보 추가
                const reportWithImage = {
                    ...report,
                    imageUrl: imageUrl,
                    episodeNumber: episodeNumber,
                    persona: persona // persona 정보 (tags 포함) 저장
                };
                
                savedReports.push(reportWithImage);
                psychologyReports.save(savedReports);
        
                const message = episodeNumber 
                    ? `${dateStr} ep.${episodeNumber} 리포트가 저장되었습니다.`
                    : `${dateStr} 리포트가 저장되었습니다.`;
                alert(message);
        
                // 리포트 목록 새로고침
                const updatedReports = psychologyReports.load();
                setPreviousReports(updatedReports);
                setIsSaving(false);
            }, 'image/png', 1.0);
        } catch (error) {
            console.error('리포트 저장 실패:', error);
            alert('리포트 저장 중 오류가 발생했습니다.');
            setIsSaving(false);
        }
    };
    
    const handleDeleteReport = (reportId) => {
        if (!window.confirm('이 리포트를 삭제하시겠습니까?')) {
            return;
        }
        
        const savedReports = psychologyReports.load();
        const filteredReports = savedReports.filter(r => r.id !== reportId);
        
        // 날짜별로 그룹화하여 에피소드 번호 재정렬
        const reportsByDate = {};
        filteredReports.forEach(report => {
            if (report.date) {
                const date = report.date instanceof Date ? report.date : new Date(report.date);
                const dateStr = date.toLocaleDateString('ko-KR');
                if (!reportsByDate[dateStr]) {
                    reportsByDate[dateStr] = [];
                }
                reportsByDate[dateStr].push(report);
            }
        });
        
        // 같은 날짜의 리포트들에 에피소드 번호 재부여
        Object.keys(reportsByDate).forEach(dateStr => {
            const reportsOnDate = reportsByDate[dateStr];
            if (reportsOnDate.length > 1) {
                // 날짜순으로 정렬
                reportsOnDate.sort((a, b) => {
                    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                    return dateA - dateB;
                });
                
                // 에피소드 번호 재부여
                reportsOnDate.forEach((report, index) => {
                    report.episodeNumber = index + 1;
                });
            } else if (reportsOnDate.length === 1) {
                // 1개만 남은 경우 에피소드 번호 제거
                delete reportsOnDate[0].episodeNumber;
            }
        });
        
        psychologyReports.save(filteredReports);
        setPreviousReports(filteredReports);
    };
    
    const handleViewReport = (savedReport) => {
        setSelectedReport(savedReport);
        setShowReportDetail(true);
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    };

    // 추천 활동 데이터 준비
    const recommendationActivities = report?.suggestions?.slice(0, 3) || [];

    // 사용자 메시지가 없을 때
    if (!hasUserMessages) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '24px',
                    width: '90%',
                    maxWidth: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '24px' 
                    }}>
                        <h2 style={{ 
                            color: '#4A3B32', 
                            margin: 0, 
                            fontSize: '1.2rem', 
                            fontWeight: '700' 
                        }}>
                            심리 리포트
                        </h2>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div style={{
                        padding: '32px 16px',
                        textAlign: 'center'
                    }}>
                        <p style={{ 
                            color: '#8D6E63', 
                            lineHeight: '1.7', 
                            margin: 0,
                            fontSize: '0.95rem'
                        }}>
                            분석할 메시지가 없습니다.
                            <br />
                            캐릭터와 대화를 나눈 뒤 다시 시도해주세요.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // 로딩 중일 때 로딩 화면 표시
    if (loading) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '24px',
                    maxWidth: '360px',
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '24px' 
                    }}>
                        <h2 style={{ 
                            color: '#4A3B32', 
                            margin: 0, 
                            fontSize: '1.2rem', 
                            fontWeight: '700' 
                        }}>
                            심리 리포트
                        </h2>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '24px',
                        padding: '32px 16px'
                    }}>
                        <div className="weekly-detail-spinner" style={{
                            width: '56px',
                            height: '56px',
                            border: '4px solid #D7CCC8',
                            borderTop: '4px solid #6B4E3D',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }}></div>
                        <p style={{ 
                            textAlign: 'center',
                            color: '#8D6E63',
                            fontSize: '0.95rem',
                            margin: 0,
                            lineHeight: '1.7'
                        }}>
                            잠시만 기다려 주세요...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 로딩이 끝났는데 리포트가 없을 때 (데이터 부족 혹은 오류)
    if (!report) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '24px',
                    maxWidth: '360px',
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '24px' 
                    }}>
                        <h2 style={{ 
                            color: '#4A3B32', 
                            margin: 0, 
                            fontSize: '1.2rem', 
                            fontWeight: '700' 
                        }}>
                            심리 리포트
                        </h2>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div style={{
                        padding: '32px 16px',
                        textAlign: 'center'
                    }}>
                        {hasUserMessages ? (
                            <p style={{ 
                                color: '#8D6E63', 
                                lineHeight: '1.7',
                                margin: 0,
                                fontSize: '0.95rem'
                            }}>
                                리포트를 생성하지 못했습니다.
                                <br />
                                잠시 후 다시 시도해주세요.
                            </p>
                        ) : (
                            <p style={{ 
                                color: '#8D6E63', 
                                lineHeight: '1.7',
                                margin: 0,
                                fontSize: '0.95rem'
                            }}>
                                분석할 메시지가 없습니다.
                                <br />
                                캐릭터와 대화를 나눈 뒤 다시 시도해주세요.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const persona = generatePersona(report);
    const tendencyData = generateTendencyData(report);
    
    return (
        <>
            {/* 리포트 이미지 저장용 숨겨진 컴포넌트 */}
            <div style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                visibility: 'hidden',
                pointerEvents: 'none'
            }} ref={reportImageRef} data-report-image="true">
                {report && (
                    <ReportImageComponent 
                        report={report}
                        userProfile={userProfile}
                        persona={persona}
                        tendencyData={tendencyData}
                        messages={messages}
                    />
                )}
            </div>
            
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '0',
                    maxWidth: '420px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }} ref={reportRef}>
                {/* 헤더 */}
                            <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderBottom: '1px solid #E8E0DB',
                                display: 'flex',
                                alignItems: 'center',
                    position: 'relative',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)'
                }}>
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                            <path d="M17 18l-8-6 8-6"/>
                        </svg>
                    </button>
                    <h2 style={{
                        color: '#4A3B32',
                                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        width: '100%',
                        textAlign: 'center'
                                    }}>
                        심리 리포트
                    </h2>
                        </div>
                        
                {/* 스크롤 가능한 콘텐츠 */}
                        <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '20px',
                            display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                        }}>
                    {/* Hero 페르소나 카드 */}
                    <PersonaCard persona={persona} date={report.date} />

                    {/* 성향 분석 슬라이더 */}
                    <TendencySlider tendencyData={tendencyData} />

                    {/* 심층 분석 카드 */}
                    <div>
                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#4A3B32',
                            margin: '0 0 16px 0'
                        }}>
                            상세 분석
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* 자주 쓰는 감정 언어 */}
                            <KeywordSection keywords={report.keywords} />
                        </div>
                    </div>

                    {/* AI 맞춤 추천 활동 */}
                    {recommendationActivities.length > 0 && (
                        <div>
                            <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#4A3B32',
                            margin: '0 0 16px 0',
                            textAlign: 'left'
                        }}>
                            {userProfile?.nickname || '사용자'}님을 위한 맞춤 처방
                        </h4>
                            <p style={{
                                fontSize: '0.82rem',
                                color: '#8D6E63',
                                margin: '-8px 0 16px 0',
                                lineHeight: '1.6'
                            }}>
                                최근 대화를 분석해 상담사가 골라 본 마음 케어 루틴이에요. 지금 마음에 와 닿는 활동을 하나 골라 실행해 보세요.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {recommendationActivities.map((activity, idx) => {
                                    const activityData = typeof activity === 'string' ? { activity, description: '', why: '', icon: '✨', practiceGuide: '' } : activity;
                                    return (
                                        <div key={idx} style={{
                                            background: '#FFFFFF',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                                            border: '1px solid #E8E0DB',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
                                        }}
                                        >
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '50%',
                                                background: '#F5F1EB',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.8rem',
                                                flexShrink: 0
                                            }}>
                                                {activityData.icon || '✨'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h6 style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: '700',
                                                    color: '#4A3B32',
                                                    margin: '0 0 4px 0'
                                                }}>
                                                    {activityData.activity}
                                                </h6>
                                                {activityData.description && (
                                                    <p style={{
                                                        fontSize: '0.8rem',
                                                        color: '#8D6E63',
                                                        margin: 0,
                                                        lineHeight: '1.4'
                                                    }}>
                                                        {activityData.description.substring(0, 60)}...
                                                    </p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedActivity(activityData);
                                                    setShowBottomSheet(true);
                                                }}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: '#F5F1EB',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    flexShrink: 0,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#E8E0DB';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#F5F1EB';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                                
                                {/* AI BGM 추천 카드 - 맞춤 처방 섹션 안에 추가 */}
                                {report?.bgmRecommendation && (() => {
                        // 저장된 캐릭터 정보가 있으면 사용, 없으면 계산
                        let topCharacterId = null;
                        if (bgmCommentInfoRef.current && bgmCommentInfoRef.current.characterId) {
                            topCharacterId = bgmCommentInfoRef.current.characterId;
                        } else {
                            // messages에서 가장 많이 대화한 캐릭터 찾기
                            const characterCounts = {};
                            if (messages && Array.isArray(messages)) {
                                messages.forEach(msg => {
                                    const charId = msg.characterId || msg.character_id;
                                    if (charId && msg.sender === 'ai') {
                                        characterCounts[charId] = (characterCounts[charId] || 0) + 1;
                                    }
                                });
                            }
                            topCharacterId = Object.keys(characterCounts).sort((a, b) => characterCounts[b] - characterCounts[a])[0];
                        }
                        
                        const topCharacter = topCharacterId ? characterData[topCharacterId] : null;
                        const charName = topCharacter?.name?.split(' (')[0] || '친구';
                        
                        // 앨범 커버 색상 (랜덤 파스텔톤)
                        const albumColors = [
                            'linear-gradient(135deg, #FFE5F1 0%, #FFF0F5 100%)',
                            'linear-gradient(135deg, #E3F2FD 0%, #E8F4FD 100%)',
                            'linear-gradient(135deg, #F3E5F5 0%, #F8F0FA 100%)',
                            'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)',
                            'linear-gradient(135deg, #FFF4E6 0%, #FFF9F0 100%)'
                        ];
                        const albumBg = albumColors[Math.floor(Math.random() * albumColors.length)];
                        
                        return (
                            <div
                                onClick={() => {
                                    if (report.bgmRecommendation.youtubeUrl) {
                                        window.open(report.bgmRecommendation.youtubeUrl, '_blank');
                                    }
                                }}
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: '20px',
                                    padding: '20px',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                                    border: '1px solid #E8E0DB',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                                }}
                            >
                                {/* 배경 블러 효과 */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: albumBg,
                                    opacity: 0.3,
                                    zIndex: 0
                                }} />
                                
                                {/* 헤더 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '16px',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>🎵</span>
                                    <h4 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: '#8D6E63',
                                        margin: 0
                                    }}>
                                        {charName}의 추천 BGM
                                    </h4>
                                </div>
                                
                                {/* 뮤직 플레이어 레이아웃 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    {/* 앨범 커버 */}
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '12px',
                                        background: albumBg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        border: '2px solid #FFFFFF'
                                    }}>
                                        🎵
                                    </div>
                                    
                                    {/* 곡 정보 */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '1rem',
                                            fontWeight: '700',
                                            color: '#4A3B32',
                                            marginBottom: '4px',
                                            lineHeight: '1.3'
                                        }}>
                                            {report.bgmRecommendation.title}
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#8D6E63',
                                            marginBottom: '8px'
                                        }}>
                                            {report.bgmRecommendation.artist}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#A1887F',
                                            opacity: 0.8
                                        }}>
                                            {report.bgmRecommendation.drama}
                                        </div>
                                    </div>
                                    
                                    {/* 재생 버튼 */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        paddingLeft: '12px',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(141, 110, 99, 0.3)',
                                        cursor: 'pointer'
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* 곡 설명 코멘트 */}
                                {report.bgmRecommendation.comment && (
                                    <div style={{
                                        marginTop: '18px',
                                        paddingLeft: '4px',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        <p style={{
                                            fontSize: '0.87rem',
                                            color: '#5D4037',
                                            margin: 0,
                                            lineHeight: '1.6',
                                            fontWeight: '400',
                                            letterSpacing: '-0.01em',
                                            opacity: 0.85
                                        }}>
                                            <span style={{
                                                fontSize: '1.1rem',
                                                marginRight: '6px',
                                                color: '#8D6E63',
                                                opacity: 0.6,
                                                verticalAlign: 'top',
                                                lineHeight: '1'
                                            }}>❝</span>
                                            {report.bgmRecommendation.comment}
                                            <span style={{
                                                fontSize: '1.1rem',
                                                marginLeft: '6px',
                                                color: '#8D6E63',
                                                opacity: 0.6,
                                                verticalAlign: 'top',
                                                lineHeight: '1'
                                            }}>❞</span>
                                        </p>
                                    </div>
                                )}
                                
                                {/* 캐릭터 코멘트 - 말풍선 스타일 */}
                                {topCharacter && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start',
                                        marginTop: '16px',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        {/* 캐릭터 아바타 - 박스 밖으로 */}
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            border: '3px solid #FFFFFF',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                                            flexShrink: 0
                                        }}>
                                            <img 
                                                src={topCharacter.image || '/default-character.png'}
                                                alt={charName}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                    e.target.src = '/default-character.png';
                                                }}
                                            />
                                        </div>
                                        
                                        {/* 말풍선 */}
                                        <div style={{
                                            flex: 1,
                                            position: 'relative'
                                        }}>
                                            {/* 캐릭터 이름 라벨 */}
                                            <div style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                color: '#8D6E63',
                                                marginBottom: '4px',
                                                marginLeft: '4px'
                                            }}>
                                                {charName}
                                            </div>
                                            
                                            {/* 말풍선 박스 */}
                                            <div style={{
                                                position: 'relative',
                                                padding: '12px 14px',
                                                background: '#FFFFFF',
                                                borderRadius: '12px',
                                                border: '2px solid #E8E0DB',
                                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
                                            }}>
                                                {/* 말풍선 꼬리 */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-8px',
                                                    top: '14px',
                                                    width: '0',
                                                    height: '0',
                                                    borderStyle: 'solid',
                                                    borderWidth: '6px 8px 6px 0',
                                                    borderColor: 'transparent #E8E0DB transparent transparent'
                                                }} />
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-5px',
                                                    top: '16px',
                                                    width: '0',
                                                    height: '0',
                                                    borderStyle: 'solid',
                                                    borderWidth: '4px 6px 4px 0',
                                                    borderColor: 'transparent #FFFFFF transparent transparent'
                                                }} />
                                                
                                                {/* 말풍선 내용 - 최소 높이 설정으로 레이아웃 시프트 방지 */}
                                                <div style={{
                                                    minHeight: '40px',
                                                    transition: 'opacity 0.3s ease-in-out',
                                                    opacity: loadingBgmComment ? 1 : 1
                                                }}>
                                                    {loadingBgmComment ? (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '6px'
                                                        }}>
                                                            {/* 스켈레톤 라인 1 */}
                                                            <div style={{
                                                                height: '10px',
                                                                background: 'linear-gradient(90deg, #E8E0DB 25%, #F5F1EB 50%, #E8E0DB 75%)',
                                                                backgroundSize: '200% 100%',
                                                                borderRadius: '5px',
                                                                animation: 'skeleton-loading 1.5s ease-in-out infinite',
                                                                width: '100%'
                                                            }} />
                                                            {/* 스켈레톤 라인 2 */}
                                                            <div style={{
                                                                height: '10px',
                                                                background: 'linear-gradient(90deg, #E8E0DB 25%, #F5F1EB 50%, #E8E0DB 75%)',
                                                                backgroundSize: '200% 100%',
                                                                borderRadius: '5px',
                                                                animation: 'skeleton-loading 1.5s ease-in-out infinite',
                                                                animationDelay: '0.1s',
                                                                width: '80%'
                                                            }} />
                                                            
                                                            <style>
                                                                {`
                                                                    @keyframes skeleton-loading {
                                                                        0% {
                                                                            background-position: 200% 0;
                                                                        }
                                                                        100% {
                                                                            background-position: -200% 0;
                                                                        }
                                                                    }
                                                                `}
                                                            </style>
                                                        </div>
                                                    ) : bgmComment ? (
                                                        <p style={{
                                                            fontSize: '0.85rem',
                                                            color: '#3E2723',
                                                            margin: 0,
                                                            lineHeight: '1.5',
                                                            transition: 'opacity 0.3s ease-in-out'
                                                        }}>
                                                            {bgmComment}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                            </div>
                        </div>
                    )}

                    {/* 마무리 편지 카드 (상담사 레터) */}
                    {report && (
                        <div style={{
                            background: '#EFEBE9',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #D7CCC8',
                            position: 'relative'
                        }}>
                            <div style={{
                                fontSize: '1.5rem',
                                marginBottom: '16px'
                            }}>
                                ✉️
                            </div>
                            <h5 style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#4A3B32',
                            margin: '0 0 12px 0'
                        }}>
                            {userProfile?.nickname || '사용자'}님께
                        </h5>
                            <p style={{
                                fontSize: '0.9rem',
                                color: '#5D4037',
                                margin: 0,
                                lineHeight: '1.7',
                                marginBottom: '20px'
                            }}>
                                {report.interpretation || '최근 대화를 보니 다양한 감정이 섞여 있었어요. 많이 힘드셨죠? 지금 이 순간, 당신의 마음을 알아주고 싶어요. 무리하지 말고 잠시 쉬어도 괜찮아요. 당신은 충분히 소중한 사람입니다.'}
                            </p>
                            <div style={{
                                textAlign: 'right',
                                marginTop: '20px',
                                paddingTop: '16px',
                                borderTop: '1px solid #D7CCC8'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
                                    fontStyle: 'italic',
                                    opacity: 0.85
                                }}>
                                    From. 마음 기록 상담사
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#A1887F',
                                    marginTop: '4px'
                                }}>
                                    당신의 마음을 함께 듣는 상담사가 전해요
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 리포트 저장 버튼 */}
                                <button 
                        onClick={handleSaveReport}
                        disabled={isSaving}
                                    style={{
                                        width: '100%',
                            padding: '16px 24px',
                            background: isSaving 
                                ? '#D7CCC8' 
                                : 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                        color: '#FFFFFF',
                                        border: 'none',
                            borderRadius: '16px',
                                        fontSize: '0.95rem',
                            fontWeight: '700',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                            boxShadow: isSaving 
                                ? 'none' 
                                : '0 4px 12px rgba(141, 110, 99, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                            if (!isSaving) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(141, 110, 99, 0.4)';
                            }
                                    }}
                                    onMouseLeave={(e) => {
                            if (!isSaving) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(141, 110, 99, 0.3)';
                            }
                                    }}
                                >
                        {isSaving ? (
                            <>
                                <span>💾</span>
                                <span>저장 중...</span>
                            </>
                        ) : (
                            <>
                                <span>📸</span>
                                <span>리포트 이미지로 저장</span>
                            </>
                        )}
                        </button>

                    {/* 저장된 리포트 목록 */}
                    {previousReports.length > 0 && (
                        <div style={{
                            paddingTop: '16px',
                            borderTop: '2px solid #E8E0DB',
                            marginTop: '0px'
                        }}>
                            <h4 style={{ 
                                fontSize: '1rem',
                                fontWeight: '700', 
                                color: '#4A3B32',
                                margin: '0 0 10px 0'
                            }}>
                                지난 리포트 모아보기
                            </h4>
                            <div 
                                className="slider-container"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: '12px',
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    paddingBottom: '8px',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none', /* Firefox: 스크롤바 숨김 */
                                    msOverflowStyle: 'none', /* IE/Edge: 스크롤바 숨김 */
                                    marginLeft: '-20px', /* 왼쪽 여백 제거 */
                                    paddingLeft: '20px' /* 스크롤 패딩으로 첫 카드가 잘리지 않도록 */
                                    /* Chrome/Safari는 CSS에서 처리됨 */
                                }}
                            >
                                {previousReports.slice().reverse().map((savedReport) => {
                                    // 감정 분석 함수: keywords와 dominantEmotion을 기반으로 감정 분류
                                    const analyzeEmotion = (dominantEmotion, keywords, stats) => {
                                        // keywords에서 감정 키워드 추출
                                        const keywordText = keywords && keywords.length > 0 
                                            ? keywords.map(k => (k.word || k).toLowerCase()).join(' ')
                                            : '';
                                        
                                        // 점수 기반 분석 (더 정확한 감정 파악)
                                        const romanceScore = stats?.romanceScore || 0;
                                        const comfortScore = stats?.comfortScore || 0;
                                        const conflictScore = stats?.conflictScore || 0;
                                        
                                        // 강한 기쁨/행복 키워드 (로맨스 포함)
                                        const strongJoyKeywords = ['행복', '기쁨', '즐거움', '설렘', '두근', '사랑해', '좋아해', '웃음', '미소', '설레', '심쿵'];
                                        // 일반 기쁨 키워드
                                        const joyKeywords = ['좋아', '기쁘', '즐거', '행복해', '좋아한다', '행복함'];
                                        
                                        // 우울 관련 키워드 (힘들다만으로는 우울로 판단하지 않음)
                                        const strongSadKeywords = ['우울', '슬픔', '울적', '우울함', '슬퍼', '절망', '비관'];
                                        // 외로움/그리움 관련
                                        const lonelinessKeywords = ['외로움', '외로워', '그리움', '그리워', '허전', '공허'];
                                        // 아픔/고통 관련
                                        const painKeywords = ['아픔', '아파', '고통', '괴로워', '괴로움'];
                                        
                                        // 평온/안정 관련
                                        const calmKeywords = ['평온', '안정', '차분', '평화', '위로', '안심', '편안', '여유', '평온함'];
                                        
                                        // 화남/갈등 관련 - "짜증"은 제외 (별도 처리)
                                        const strongAngerKeywords = ['화남', '분노', '화나', '미워', '싫어', '최악'];
                                        // 답답함/스트레스 관련 - "짜증", "피곤", "지치" 제외 (힘듦과 구분)
                                        const stressKeywords = ['답답', '스트레스'];
                                        
                                        // 힘듦/피로 관련 (우울이 아닌 다른 감정으로 분류 가능)
                                        // 이 키워드들은 tired 감정으로 우선 분류되어야 함
                                        const tiredKeywords = ['힘들', '힘듦', '피곤', '지침', '지쳐', '피로', '지치'];
                                        
                                        // 키워드 매칭 및 가중치 계산
                                        let emotionScores = {
                                            joy: 0,
                                            sad: 0,
                                            calm: 0,
                                            anger: 0,
                                            tired: 0,
                                            lonely: 0
                                        };
                                        
                                        // "짜증"은 실제로 화를 내거나 짜증을 내는 표현일 때만 화남으로 판단
                                        // "짜증나", "짜증난다", "짜증나서", "짜증내", "짜증낸다" 같은 동사 형태
                                        const hasActualAnnoyance = /짜증(나|내|낸|나는|났|날)/.test(keywordText) || 
                                                                    /(너|당신|네|니|그쪽).{0,5}(때문|탓|잘못|화나|짜증)/.test(keywordText);
                                        
                                        if (hasActualAnnoyance) {
                                            emotionScores.anger += 3; // 실제 짜증 표현이 있을 때만 화남 점수 추가
                                        }
                                        
                                        // 힘듦/피로 키워드를 먼저 체크 (가중치 높게) - 다른 강한 감정보다 우선
                                        let tiredCount = 0;
                                        tiredKeywords.forEach(k => {
                                            if (keywordText.includes(k)) {
                                                emotionScores.tired += 3; // 가중치를 3으로 높임
                                                tiredCount++;
                                            }
                                        });
                                        
                                        // 강한 기쁨 키워드 (가중치 3)
                                        strongJoyKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.joy += 3;
                                        });
                                        
                                        // 일반 기쁨 키워드 (가중치 1)
                                        joyKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.joy += 1;
                                        });
                                        
                                        // 강한 우울 키워드 (가중치 3)
                                        strongSadKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.sad += 3;
                                        });
                                        
                                        // 외로움 키워드 (가중치 2)
                                        lonelinessKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.lonely += 2;
                                        });
                                        
                                        // 아픔 키워드 (가중치 2)
                                        painKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.sad += 2;
                                        });
                                        
                                        // 평온 키워드 (가중치 2)
                                        calmKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.calm += 2;
                                        });
                                        
                                        // 강한 화남 키워드 (가중치 3)
                                        strongAngerKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.anger += 3;
                                        });
                                        
                                        // 스트레스 키워드 (가중치 2) - "답답", "스트레스"만 (피곤, 지치는 제외)
                                        stressKeywords.forEach(k => {
                                            if (keywordText.includes(k)) emotionScores.anger += 2;
                                        });
                                        
                                        // 점수 기반 보정 (stats가 있는 경우)
                                        // 단, 힘듦 키워드가 많이 나왔다면 tired가 우선
                                        if (tiredCount >= 2) {
                                            // 힘듦 키워드가 2개 이상이면 tired 우선
                                            emotionScores.tired += 5;
                                        }
                                        
                                        if (romanceScore > 30) emotionScores.joy += 2;
                                        if (comfortScore > 30 && emotionScores.sad < 3) emotionScores.calm += 2;
                                        // conflictScore가 높아도 힘듦 키워드가 많으면 tired 우선
                                        if (conflictScore > 30 && tiredCount < 2) {
                                            emotionScores.anger += 2;
                                        }
                                        
                                        // dominantEmotion 기반 보정
                                        if (dominantEmotion === 'romance') emotionScores.joy += 3;
                                        if (dominantEmotion === 'comfort') {
                                            // comfort는 상황에 따라 calm 또는 lonely
                                            if (emotionScores.lonely > 0) emotionScores.lonely += 2;
                                            else emotionScores.calm += 2;
                                        }
                                        // conflict지만 힘듦 키워드가 많으면 tired가 더 우선
                                        if (dominantEmotion === 'conflict' && tiredCount < 2) {
                                            emotionScores.anger += 3;
                                        }
                                        
                                        // 최종 감정 결정 (가장 높은 점수)
                                        const maxScore = Math.max(...Object.values(emotionScores));
                                        
                                        if (maxScore === 0) return 'calm'; // 기본값
                                        
                                        // 점수가 같은 경우 우선순위 적용
                                        // 힘듦 키워드가 많으면 tired를 최우선으로
                                        if (tiredCount >= 2 && emotionScores.tired > 0) {
                                            return 'tired';
                                        }
                                        
                                        if (emotionScores.joy === maxScore) return 'joy';
                                        if (emotionScores.lonely === maxScore) return 'lonely';
                                        if (emotionScores.sad === maxScore) return 'sad';
                                        // tired가 점수가 있으면 anger보다 우선
                                        if (emotionScores.tired === maxScore || (emotionScores.tired > 0 && emotionScores.tired >= emotionScores.anger)) {
                                            return 'tired';
                                        }
                                        if (emotionScores.anger === maxScore) return 'anger';
                                        if (emotionScores.calm === maxScore) return 'calm';
                                        
                                        return 'calm'; // 기본값
                                    };
                                    
                                    // dominantMood별 컬러 팔레트 (낮은 채도 - 파스텔 톤)
                                    const moodColors = {
                                        romance: {
                                            base: ['#FCE4EC', '#F8BBD0', '#F48FB1', '#F5B0C7', '#F9C5D1', '#F3A5B5'], // 부드러운 핑크/로즈
                                            accent: ['#F8BBD0', '#F48FB1', '#F5B0C7', '#F9C5D1', '#FCE4EC', '#F3A5B5']
                                        },
                                        comfort: {
                                            base: ['#E1F5FE', '#B3E5FC', '#BBDEFB', '#C5E1F5', '#D1E7F0', '#B2DFDB'], // 부드러운 파스텔 블루/민트
                                            accent: ['#B3E5FC', '#BBDEFB', '#C5E1F5', '#D1E7F0', '#B2DFDB', '#A7E8E0']
                                        },
                                        conflict: {
                                            base: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FFAB91'], // 부드러운 오렌지/코랄
                                            accent: ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FFAB91', '#FF8A65']
                                        },
                                        neutral: {
                                            base: ['#E8F5E9', '#C8E6C9', '#DCEDC8', '#F1F8E9', '#FFF9C4', '#FFFDE7'], // 부드러운 초록/노랑
                                            accent: ['#C8E6C9', '#DCEDC8', '#F1F8E9', '#FFF9C4', '#FFFDE7', '#FFF8E1']
                                        }
                                    };
                                    
                                    // 감정별 컬러 팔레트 (낮은 채도 - 파스텔 톤)
                                    const emotionColors = {
                                        joy: {
                                            base: ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEB3B', '#FFE082'], // 부드러운 노랑/골드
                                            accent: ['#FFF9C4', '#FFF59D', '#FFF176', '#FFEB3B', '#FFE082', '#FFD54F']
                                        },
                                        sad: {
                                            base: ['#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#81D4FA', '#90CAF9'], // 부드러운 블루/스카이
                                            accent: ['#B3E5FC', '#81D4FA', '#4FC3F7', '#90CAF9', '#64B5F6', '#42A5F5']
                                        },
                                        calm: {
                                            base: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#AED581'], // 부드러운 초록/민트
                                            accent: ['#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#AED581', '#9CCC65']
                                        },
                                        anger: {
                                            base: ['#FFF3E0', '#FFE0B2', '#FFCCBC', '#FFAB91', '#FF8A65', '#FFB74D'], // 부드러운 오렌지/레드
                                            accent: ['#FFE0B2', '#FFCCBC', '#FFAB91', '#FF8A65', '#FFB74D', '#FFA726']
                                        },
                                        tired: {
                                            base: ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107'], // 부드러운 옐로우/앰버
                                            accent: ['#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300']
                                        },
                                        lonely: {
                                            base: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#CE93D8'], // 부드러운 라벤더/퍼플
                                            accent: ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#CE93D8', '#BA68C8']
                                        }
                                    };
                                    
                                    // 랜덤 그라데이션 생성 함수 (dominantMood 우선 사용)
                                    const generateGradient = (emotionType, reportId, episode, dominantMood) => {
                                        // dominantMood가 있으면 그것을 우선 사용
                                        let colors;
                                        if (dominantMood && moodColors[dominantMood]) {
                                            colors = moodColors[dominantMood];
                                        } else {
                                            // 없으면 기존 감정 분석 결과 사용
                                            colors = emotionColors[emotionType] || emotionColors.calm;
                                        }
                                        
                                        // 고유한 시드 생성 (reportId, episode, 또는 날짜 사용)
                                        const seedValue = reportId || episode || Math.floor(Date.now() / 1000);
                                        const seed = Math.abs(seedValue);
                                        
                                        // 간단한 해시 함수로 시드 생성
                                        const hash = (str) => {
                                            let hash = 0;
                                            const strVal = String(str);
                                            for (let i = 0; i < strVal.length; i++) {
                                                const char = strVal.charCodeAt(i);
                                                hash = ((hash << 5) - hash) + char;
                                                hash = hash & hash; // Convert to 32bit integer
                                            }
                                            return Math.abs(hash);
                                        };
                                        
                                        const seedHash = hash(seed);
                                        
                                        // 시드 기반 랜덤 함수
                                        let counter = 0;
                                        const random = (max) => {
                                            counter++;
                                            const value = (seedHash * counter * 17 + counter * 23) % max;
                                            return value;
                                        };
                                        
                                        // 색상 선택 (2-3개)
                                        const numColors = 2 + (seedHash % 2); // 2 또는 3
                                        const selectedColors = [];
                                        
                                        // base 색상에서 1개 선택
                                        const baseIndex = random(colors.base.length);
                                        selectedColors.push(colors.base[baseIndex]);
                                        
                                        // accent 색상에서 나머지 선택
                                        for (let i = 1; i < numColors; i++) {
                                            const accentIndex = random(colors.accent.length);
                                            selectedColors.push(colors.accent[accentIndex]);
                                        }
                                        
                                        // 각도 생성 (0-360도)
                                        const angle = seedHash % 360;
                                        
                                        // 색상 비율 (30-70% 사이)
                                        const stop1 = 30 + (seedHash % 40);
                                        
                                        // 그라데이션 타입 결정 (linear 또는 radial)
                                        const useRadial = (seedHash % 2) === 0;
                                        
                                        if (useRadial && selectedColors.length >= 2) {
                                            // radial-gradient: 원형 그라데이션
                                            const positionX = 30 + (seedHash % 40);
                                            const positionY = 30 + ((seedHash * 7) % 40);
                                            if (selectedColors.length === 3) {
                                                return `radial-gradient(circle at ${positionX}% ${positionY}%, ${selectedColors[0]} 0%, ${selectedColors[1]} ${stop1}%, ${selectedColors[2]} 100%)`;
                                            } else {
                                                return `radial-gradient(circle at ${positionX}% ${positionY}%, ${selectedColors[0]} 0%, ${selectedColors[1]} 100%)`;
                                            }
                                        } else {
                                            // linear-gradient: 선형 그라데이션
                                            if (selectedColors.length === 2) {
                                                return `linear-gradient(${angle}deg, ${selectedColors[0]} 0%, ${selectedColors[1]} 100%)`;
                                            } else {
                                                return `linear-gradient(${angle}deg, ${selectedColors[0]} 0%, ${selectedColors[1]} ${stop1}%, ${selectedColors[2]} 100%)`;
                                            }
                                        }
                                    };
                                    
                                    // 핵심 감정 키워드 추출 (더 다양하고 세밀한 표현)
                                    const getEmotionKeyword = (emotionType, reportId, keywords, stats) => {
                                        // 리포트 ID를 기반으로 랜덤하게 다양한 태그 선택
                                        const seed = Math.abs(reportId || Date.now());
                                        
                                        // keywords에서 실제 화를 내는 표현이 있는지 확인
                                        const keywordText = keywords && keywords.length > 0 
                                            ? keywords.map(k => (k.word || k).toLowerCase()).join(' ')
                                            : '';
                                        const hasActualAnnoyance = /짜증(나|내|낸|나는|났|날)/.test(keywordText) || 
                                                                    /(너|당신|네|니|그쪽).{0,5}(때문|탓|잘못|화나|짜증)/.test(keywordText);
                                        
                                        const keywordOptions = {
                                            joy: ['기쁨', '행복', '설렘', '두근거림', '사랑', '즐거움', '웃음'],
                                            sad: ['우울', '슬픔', '울적함', '절망', '비관'],
                                            calm: ['평온', '안정', '차분', '평화', '여유', '편안'],
                                            // "짜증"은 실제 화를 내는 표현이 있을 때만 태그로 표시
                                            anger: hasActualAnnoyance 
                                                ? ['화남', '분노', '짜증', '답답함', '스트레스']
                                                : ['화남', '분노', '답답함', '스트레스'],
                                            tired: ['피로', '지침', '힘듦', '무기력', '권태'],
                                            lonely: ['외로움', '그리움', '허전함', '공허']
                                        };
                                        
                                        const options = keywordOptions[emotionType] || keywordOptions.calm;
                                        const index = seed % options.length;
                                        return options[index];
                                    };
                                    
                                    const emotionType = analyzeEmotion(savedReport.dominantEmotion, savedReport.keywords, savedReport.stats);
                                    // dominantMood 가져오기 (dominantMood 또는 stats.dominantMood)
                                    const dominantMood = savedReport.dominantMood || savedReport.stats?.dominantMood || null;
                                    // 고유한 ID 생성 (id, episode, date 조합)
                                    const uniqueId = savedReport.id || savedReport.episode || (savedReport.date ? new Date(savedReport.date).getTime() : Date.now());
                                    const gradientBg = generateGradient(emotionType, uniqueId, savedReport.episode, dominantMood);
                                    const emotionKeyword = getEmotionKeyword(emotionType, uniqueId, savedReport.keywords, savedReport.stats);
                                    
                                    // 디버깅용 (필요시 주석 해제)
                                    // console.log('Report:', savedReport.id || savedReport.episode, 'Emotion:', emotionType, 'Gradient:', gradientBg);
                                    
                                    // 날짜 포맷팅 (11.30 형식)
                                    const formatDate = (dateString) => {
                                        if (!dateString) return '';
                                        try {
                                            const date = new Date(dateString);
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const day = String(date.getDate()).padStart(2, '0');
                                            return `${month}.${day}`;
                                        } catch (e) {
                                            return '';
                                        }
                                    };
                                    
                                    return (
                                        <div 
                                            key={savedReport.id || savedReport.episode}
                                            onClick={() => handleViewReport(savedReport)}
                                            style={{
                                                backgroundImage: gradientBg,
                                                background: gradientBg, // fallback
                                                borderRadius: '16px',
                                                padding: '0',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100px',
                                                height: '140px',
                                                flexShrink: 0,
                                                position: 'relative',
                                                cursor: 'pointer',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                            }}
                                        >
                                            {/* 삭제 버튼 */}
                                            <button
                                                className="history-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteReport(savedReport.id);
                                                }}
                                                title="삭제"
                                                style={{
                                                    position: 'absolute',
                                                    top: '6px',
                                                    right: '6px',
                                                    zIndex: 10,
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(255, 255, 255, 0.9)',
                                                    border: 'none',
                                                    display: 'none',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                            
                                            {/* 배경 장식 (추가 그라데이션 레이어로 깊이감 추가) */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20%',
                                                right: '-20%',
                                                width: '80%',
                                                height: '80%',
                                                borderRadius: '50%',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                filter: 'blur(30px)',
                                                pointerEvents: 'none'
                                            }}></div>
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-15%',
                                                left: '-15%',
                                                width: '60%',
                                                height: '60%',
                                                borderRadius: '50%',
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                filter: 'blur(25px)',
                                                pointerEvents: 'none'
                                            }}></div>
                                            
                                            {/* 텍스트 콘텐츠 영역 */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '20px 12px 16px 12px',
                                                width: '100%',
                                                position: 'relative',
                                                zIndex: 1
                                            }}>
                                                {/* 날짜 및 에피소드 번호 */}
                                                {savedReport.date && (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        marginTop: '8px'
                                                    }}>
                                                        <div style={{
                                                            fontSize: '0.9rem',
                                                            fontWeight: '700',
                                                            color: '#4A3B32',
                                                            letterSpacing: '0.3px'
                                                        }}>
                                                            {formatDate(savedReport.date)}
                                                        </div>
                                                        {savedReport.episodeNumber && (
                                                            <div style={{
                                                                fontSize: '0.6rem',
                                                                fontWeight: '500',
                                                                color: '#4A3B32',
                                                                opacity: 0.5,
                                                                fontFamily: 'Georgia, "Times New Roman", serif',
                                                                fontStyle: 'italic',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                ep.{savedReport.episodeNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* 핵심 감정 키워드 */}
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    color: '#4A3B32',
                                                    letterSpacing: '1px',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    background: '#FFFFFF',
                                                    border: 'none',
                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                                }}>
                                                    #{emotionKeyword}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>
            
            {/* 바텀 시트 / 팝업 모달 (모바일/웹 분기) */}
            {showBottomSheet && selectedActivity && (() => {
                // messages에서 가장 많이 대화한 캐릭터 찾기
                const characterCounts = {};
                if (messages && Array.isArray(messages)) {
                    messages.forEach(msg => {
                        const charId = msg.characterId || msg.character_id;
                        if (charId && msg.sender === 'ai') {
                            characterCounts[charId] = (characterCounts[charId] || 0) + 1;
                        }
                    });
                }
                
                const topCharacterId = Object.keys(characterCounts).sort((a, b) => characterCounts[b] - characterCounts[a])[0];
                const topCharacter = topCharacterId ? characterData[topCharacterId] : null;
                const charName = topCharacter?.name?.split(' (')[0] || '친구';
                
                return (
                    <ActivityBottomSheet 
                        selectedActivity={selectedActivity}
                        isMobile={isMobile}
                        onClose={() => setShowBottomSheet(false)}
                        topCharacter={topCharacter}
                        topCharacterId={topCharacterId}
                        charName={charName}
                        userNickname={userProfile?.nickname || '사용자'}
                    />
                );
            })()}
            
            {/* 리포트 상세 보기 모달 */}
            {showReportDetail && selectedReport && (
                <ReportDetailModal
                    selectedReport={selectedReport}
                    userProfile={userProfile}
                    generatePersona={generatePersona}
                    generateTendencyData={generateTendencyData}
                    onClose={() => setShowReportDetail(false)}
                    onDelete={handleDeleteReport}
                />
            )}
        </>
    );
};

