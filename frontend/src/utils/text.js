export const sanitizeCharacterText = (text, userNickname = null) => {
    if (!text || typeof text !== 'string') {
        return text;
    }
    // 볼드체(마크다운) 제거
    let cleanedText = text.replace(/\*\*/g, '');
    
    // 템플릿 치환 (백엔드에서 놓친 경우를 대비)
    if (userNickname) {
        cleanedText = cleanedText.replace(/\{\{USER\}\}/g, userNickname);
        cleanedText = cleanedText.replace(/\{\{user_nickname\}\}/g, userNickname);
    }
    
    return cleanedText;
};

