/**
 * 한글 조사 자동 처리 유틸리티
 * 받침 유무에 따라 올바른 조사를 자동으로 선택합니다.
 */

/**
 * 한글 문자의 받침 유무를 확인합니다.
 * @param {string} word - 확인할 단어
 * @returns {boolean} - 받침이 있으면 true, 없으면 false
 */
export function hasBatchim(word) {
    if (!word || word.length === 0) return false;
    
    const lastChar = word[word.length - 1];
    const charCode = lastChar.charCodeAt(0);
    
    // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
    if (charCode < 0xAC00 || charCode > 0xD7A3) {
        return false;
    }
    
    // 받침 유무: (charCode - 0xAC00) % 28
    // 0이면 받침 없음, 0이 아니면 받침 있음
    return (charCode - 0xAC00) % 28 !== 0;
}

/**
 * 받침 유무에 따라 '와' 또는 '과'를 반환합니다.
 * @param {string} word - 단어
 * @returns {string} - '와' 또는 '과'
 */
export function josaWa(word) {
    return hasBatchim(word) ? '과' : '와';
}

/**
 * 받침 유무에 따라 '이' 또는 '가'를 반환합니다.
 * @param {string} word - 단어
 * @returns {string} - '이' 또는 '가'
 */
export function josaI(word) {
    return hasBatchim(word) ? '이' : '가';
}

/**
 * 받침 유무에 따라 '을' 또는 '를'을 반환합니다.
 * @param {string} word - 단어
 * @returns {string} - '을' 또는 '를'
 */
export function josaEul(word) {
    return hasBatchim(word) ? '을' : '를';
}

/**
 * 받침 유무에 따라 '은' 또는 '는'을 반환합니다.
 * @param {string} word - 단어
 * @returns {string} - '은' 또는 '는'
 */
export function josaEun(word) {
    return hasBatchim(word) ? '은' : '는';
}

/**
 * 받침 유무에 따라 '로' 또는 '으로'를 반환합니다.
 * @param {string} word - 단어
 * @returns {string} - '로' 또는 '으로'
 */
export function josaRo(word) {
    return hasBatchim(word) ? '으로' : '로';
}

/**
 * 여러 이름을 조사와 함께 연결합니다.
 * 예: ["박동훈", "오상식"] -> "박동훈, 오상식과의 대화"
 * @param {string[]} names - 이름 배열
 * @param {string} suffix - 접미사 (예: "의 대화" 또는 "와의 대화")
 * @returns {string} - 연결된 문자열
 */
export function joinNamesWithJosa(names, suffix = '') {
    if (!names || names.length === 0) return '';
    
    if (suffix === '의 대화') {
        if (names.length === 1) {
            // 단일 이름일 때는 받침 유무에 따라 "와" 또는 "과" 선택
            return names[0] + josaWa(names[0]) + '의 대화';
        } else {
            const allButLast = names.slice(0, -1).join(', ');
            const last = names[names.length - 1];
            return `${allButLast}, ${last}${josaWa(last)}의 대화`;
        }
    }
    
    if (names.length === 1) return names[0] + suffix;
    
    // 마지막 이름을 제외한 모든 이름을 쉼표로 연결
    const allButLast = names.slice(0, -1).join(', ');
    const last = names[names.length - 1];

    return `${allButLast}, ${last}${josaWa(last)}${suffix}`;
}

