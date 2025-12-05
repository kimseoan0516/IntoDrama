export const sanitizeCharacterText = (text) => {
    if (!text || typeof text !== 'string') {
        return text;
    }
    return text.replace(/\*\*/g, '');
};

