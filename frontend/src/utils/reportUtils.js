import { psychologyReports } from './storage';

// 감정 분석 함수 (리포트용)
export const detectRomanceLevel = (text) => {
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
    
    const keywords = ['좋아해', '좋아', '사랑', '설레', '보고 싶', '너 생각', '그리워', '사랑해', '좋아한다', '마음', '심장', '떨려', '두근', '설렘', '행복', '기쁨', '웃음', '미소'];
    let score = 0;
    keywords.forEach(k => {
        if (text.includes(k)) score += 0.3;
    });
    if (text.endsWith('...') || text.endsWith('…')) score += 0.2;
    if (text.includes('❤') || text.includes('💕') || text.includes('💖')) score += 0.3;
    return Math.min(score, 1);
};

export const detectComfortLevel = (text) => {
    if (!text) return 0;
    const keywords = ['괜찮아', '힘내', '위로', '안아', '따뜻', '포근', '편안', '안심', '걱정', '아픔', '아프', '아파', '슬퍼', '울어', '힘들어', '외로워', '지치', '피곤', '힘들', '지침'];
    let score = 0;
    keywords.forEach(k => {
        if (text.includes(k)) {
            // "지치", "피곤", "힘들"은 위로가 필요한 감정이므로 점수 높게
            if (k === '지치' || k === '피곤' || k === '힘들' || k === '지침') {
                score += 0.4;
            } else {
                score += 0.3;
            }
        }
    });
    return Math.min(score, 1);
};

export const detectConflictLevel = (text) => {
    if (!text) return 0;
    // 갈등 키워드: 화나고 섭섭한 감정 표현 - "짜증"은 제외 (별도 처리)
    const conflictKeywords = ['화나', '싫어', '미워', '이해 못해', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망'];
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
        score += 0.3; // 실제 짜증 표현이 있을 때만 갈등 점수 추가
    }
    
    conflictKeywords.forEach(k => {
        if (text.includes(k)) {
            score += 0.3;
        }
    });
    
    // "지친다"만 있으면 갈등으로 판단하지 않음
    // "지친다" + 화나고 섭섭한 키워드가 함께 있을 때만 갈등 점수 추가
    if (hasTired) {
        const hasConflictWithTired = conflictWithTired.some(k => text.includes(k));
        if (hasConflictWithTired) {
            score += 0.2; // 갈등 점수 추가
        }
        // "지친다" + 실제 짜증 표현이 함께 있을 때도 갈등으로 판단
        if (hasActualAnnoyance) {
            score += 0.2;
        }
    }
    
    // "답답"은 "지친다"와 함께 있을 때만 갈등으로 판단
    if (text.includes('답답')) {
        if (hasTired) {
            score += 0.2;
        }
    }
    
    return Math.min(score, 1);
};

// 백엔드 리포트를 프론트엔드 형식으로 변환
export const convertBackendReportToFrontendFormat = (backendReport, messages, userProfile) => {
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
export const generateReport = (messages, userProfile) => {
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
export const generateBGMRecommendation = (dominantMood, romanceScore, comfortScore, conflictScore) => {
    // 실제 드라마 OST 데이터베이스 (감정 상태별 추천)
    const bgmDatabase = {
        romance: [
            {
                title: '그대를 사랑해',
                artist: '이승기',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=이승기+그대를+사랑해+미안하다+사랑한다',
                comment: '따뜻한 감정이 느껴지는 이 노래, 지금 이 순간을 소중히 여기세요.'
            },
            {
                title: '너를 사랑해',
                artist: '임창정',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=임창정+너를+사랑해+미안하다+사랑한다',
                comment: '진심 어린 사랑의 감정을 담은 이 곡, 마음을 따뜻하게 해줄 거예요.'
            },
            {
                title: '사랑해',
                artist: '김범수',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=김범수+사랑해+미안하다+사랑한다',
                comment: '부드럽고 따뜻한 멜로디가 마음을 편안하게 만들어줄 거예요.'
            },
            {
                title: '너의 모든 순간',
                artist: '성시경',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=성시경+너의+모든+순간+미안하다+사랑한다',
                comment: '진심 어린 사랑의 감정을 담은 이 곡, 마음을 따뜻하게 해줄 거예요.'
            }
        ],
        comfort: [
            {
                title: '안녕',
                artist: '박효신',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=박효신+안녕+미안하다+사랑한다',
                comment: '위로가 필요한 순간, 이 노래가 당신의 마음을 감싸줄 거예요.'
            },
            {
                title: '그리워하다',
                artist: '이승기',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=이승기+그리워하다+미안하다+사랑한다',
                comment: '차분하고 평온한 멜로디로 마음을 진정시켜줄 거예요.'
            },
            {
                title: '하루',
                artist: '성시경',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=성시경+하루+미안하다+사랑한다',
                comment: '따뜻한 위로의 메시지가 담긴 이 곡, 지금 이 순간을 위로해줄 거예요.'
            }
        ],
        conflict: [
            {
                title: '가시',
                artist: '버즈',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=버즈+가시+미안하다+사랑한다',
                comment: '복잡한 감정을 표현하는 이 노래, 당신의 마음을 이해해줄 거예요.'
            },
            {
                title: '슬픈 인연',
                artist: '나미',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=나미+슬픈+인연+미안하다+사랑한다',
                comment: '갈등과 아픔을 함께 나눌 수 있는 이 곡, 혼자가 아니에요.'
            },
            {
                title: '눈물',
                artist: '이승기',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=이승기+눈물+미안하다+사랑한다',
                comment: '감정을 정리하는 데 도움이 될 거예요. 천천히 들어보세요.'
            }
        ],
        neutral: [
            {
                title: '그대를 사랑해',
                artist: '이승기',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=이승기+그대를+사랑해+미안하다+사랑한다',
                comment: '평온한 하루를 위한 이 노래, 지금 이 순간을 즐겨보세요.'
            },
            {
                title: '너의 모든 순간',
                artist: '성시경',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=성시경+너의+모든+순간+미안하다+사랑한다',
                comment: '따뜻하고 편안한 멜로디로 하루를 마무리해보세요.'
            },
            {
                title: '사랑했나봐',
                artist: '윤도현',
                drama: '미안하다 사랑한다',
                youtubeUrl: 'https://www.youtube.com/results?search_query=윤도현+사랑했나봐+미안하다+사랑한다',
                comment: '진솔한 감정을 담은 이 곡, 마음을 편안하게 해줄 거예요.'
            }
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

