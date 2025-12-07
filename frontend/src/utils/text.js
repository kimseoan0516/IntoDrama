export const sanitizeCharacterText = (text, userNickname = null) => {
    if (!text || typeof text !== 'string') {
        return text;
    }
    // 볼드체(마크다운) 제거
    let cleanedText = text.replace(/\*\*/g, '');
    
    // 메타데이터 및 점수 정보 제거 (대사만 남기기)
    // "Scoring result:" 이후의 모든 내용 제거
    cleanedText = cleanedText.replace(/Scoring result:.*$/gim, '');
    // "Time context compliance rate:" 이후의 모든 내용 제거
    cleanedText = cleanedText.replace(/Time context compliance rate:.*$/gim, '');
    // 기타 점수나 메타데이터 패턴 제거
    cleanedText = cleanedText.replace(/Score:.*$/gim, '');
    cleanedText = cleanedText.replace(/Compliance rate:.*$/gim, '');
    cleanedText = cleanedText.replace(/점수:.*$/gim, '');
    cleanedText = cleanedText.replace(/준수율:.*$/gim, '');
    
    // 여러 줄에 걸친 메타데이터 블록 제거 (빈 줄로 시작하는 메타데이터)
    cleanedText = cleanedText.replace(/\n\s*(Scoring|Time|Score|Compliance|점수|준수).*$/gim, '');
    
    // 템플릿 치환 (백엔드에서 놓친 경우를 대비)
    if (userNickname) {
        cleanedText = cleanedText.replace(/\{\{USER\}\}/g, userNickname);
        cleanedText = cleanedText.replace(/\{\{user_nickname\}\}/g, userNickname);
    }
    
    // 앞뒤 공백 및 빈 줄 정리
    cleanedText = cleanedText.trim();
    
    return cleanedText;
};

