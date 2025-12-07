// API 설정 및 호출 유틸리티
// 환경 변수가 설정되어 있으면 우선 사용, 없으면 환경에 따라 자동 선택
const getApiBaseUrl = () => {
    // 환경 변수가 명시적으로 설정되어 있으면 사용
    if (process.env.REACT_APP_API_URL) {
        console.log('API URL (환경 변수):', process.env.REACT_APP_API_URL);
        return process.env.REACT_APP_API_URL;
    }
    
    // 로컬 개발 환경 (localhost 또는 127.0.0.1)
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';
    
    if (isLocalhost) {
        const url = 'http://localhost:8000';
        console.log('API URL (로컬):', url);
        return url;
    }
    
    // 배포 환경 - 동일한 호스트의 백엔드 사용 시도
    // Hugging Face Spaces의 경우 프론트엔드와 백엔드가 같은 도메인을 사용할 수 있음
    const currentOrigin = window.location.origin;
    const hostname = window.location.hostname;
    
    // Hugging Face Spaces 패턴 감지
    if (hostname.includes('hf.space') || hostname.includes('huggingface.co')) {
        // Hugging Face Spaces는 프론트엔드와 백엔드가 같은 도메인을 공유
        // 백엔드는 보통 /api 경로나 같은 포트를 사용
        const url = currentOrigin;
        console.log('API URL (Hugging Face):', url);
        return url;
    }
    
    // Vercel 배포 환경
    if (hostname.includes('vercel.app')) {
        // Vercel의 경우 백엔드가 별도로 배포되어 있을 수 있음
        const url = 'https://seoan0516-intodrama.hf.space';
        console.log('API URL (Vercel 기본):', url);
        return url;
    }
    
    // 기타 배포 환경 - 기본값
    const url = 'https://seoan0516-intodrama.hf.space';
    console.log('API URL (기본값):', url);
    console.warn('⚠️ REACT_APP_API_URL 환경 변수를 설정하는 것을 권장합니다.');
    return url;
};

const API_BASE_URL = getApiBaseUrl();

// 인증 토큰 가져오기
const getToken = () => localStorage.getItem('token');

// 기본 fetch 옵션
const getFetchOptions = (method = 'GET', body = null, requiresAuth = false) => {
  const options = {
    method,
    mode: 'cors',
    credentials: 'include', // 모바일 호환성을 위해 변경
    headers: { 'Content-Type': 'application/json' },
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

// API 호출 래퍼
const apiCall = async (endpoint, options = {}) => {
  const { method = 'GET', body = null, requiresAuth = false } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const fetchOptions = getFetchOptions(method, body, requiresAuth);
  
  try {
    // 타임아웃 설정 (30초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // CORS 오류 감지
    if (response.status === 0 || response.type === 'opaque') {
      throw new Error(
        `CORS 오류: ${url}에 접근할 수 없습니다. ` +
        `백엔드 CORS 설정을 확인하거나 REACT_APP_API_URL 환경 변수를 설정해주세요.`
      );
    }

    if (!response.ok) {
      let errorMessage = `서버 오류 (HTTP ${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch (e) {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      // 네트워크 오류나 연결 실패 시 더 자세한 정보 제공
      if (response.status === 404) {
        errorMessage = `API 엔드포인트를 찾을 수 없습니다: ${url}`;
      } else if (response.status >= 500) {
        errorMessage = `서버 내부 오류 (${response.status}): ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    // 타임아웃 오류 처리
    if (error.name === 'AbortError') {
      throw new Error(
        `요청 시간이 초과되었습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.`
      );
    }
    // 네트워크 오류 처리
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        `네트워크 오류: ${url}에 연결할 수 없습니다. ` +
        `백엔드 서버가 실행 중인지 확인하거나 REACT_APP_API_URL 환경 변수를 확인해주세요. ` +
        `현재 API URL: ${API_BASE_URL}`
      );
    }
    throw error;
  }
};

// API 함수들
export const api = {
  // 채팅
  sendChat: (data) => apiCall('/chat', { method: 'POST', body: data, requiresAuth: true }),
  saveChat: (chatData) => apiCall('/chat/save', { method: 'POST', body: chatData, requiresAuth: true }),
  getChatHistories: () => apiCall('/chat/histories', { requiresAuth: true }),
  deleteChatHistory: (chatId) => apiCall(`/chat/histories/${chatId}`, { method: 'DELETE', requiresAuth: true }),
  summarizeChat: (chatData) => apiCall('/chat/summarize', { method: 'POST', body: chatData, requiresAuth: true }),
  convertToNovel: (chatData) => apiCall('/chat/convert-to-novel', { method: 'POST', body: chatData }),
  startDebate: (data) => apiCall('/chat/debate', { method: 'POST', body: data, requiresAuth: true }),
  getDebateSummary: (data) => apiCall('/chat/debate/summary', { method: 'POST', body: data, requiresAuth: true }),
  getBgmComment: (data) => apiCall('/chat/bgm-comment', { method: 'POST', body: data }),

  // 인증
  register: (userData) => apiCall('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => apiCall('/auth/login', { method: 'POST', body: credentials }),
  getCurrentUser: () => apiCall('/auth/me', { requiresAuth: true }),
  updateProfile: (profileData) => apiCall('/auth/profile', { method: 'PUT', body: profileData, requiresAuth: true }),
  requestPasswordReset: (email) => apiCall('/auth/password-reset-request', { method: 'POST', body: { email } }),
  resetPassword: (email, newPassword) => apiCall('/auth/password-reset', { method: 'POST', body: { email, new_password: newPassword } }),

  // 일기
  generateDiary: (data) => apiCall('/diary/generate', { method: 'POST', body: data, requiresAuth: true }),
  createDiary: (data) => apiCall('/diary/create', { method: 'POST', body: data, requiresAuth: true }),
  getDiaryList: () => apiCall('/diary/list', { requiresAuth: true }),
  getDiary: (diaryId) => apiCall(`/diary/${diaryId}`, { requiresAuth: true }),
  deleteDiary: (diaryId) => apiCall(`/diary/${diaryId}`, { method: 'DELETE', requiresAuth: true }),


  // 성향 지도
  getArchetypeMap: (characterIds = null) => {
    const query = characterIds ? `?character_ids=${JSON.stringify(characterIds)}` : '';
    return apiCall(`/archetype/map${query}`, { requiresAuth: true });
  },

  // 주간 대화 통계
  getWeeklyStats: () => apiCall('/chat/stats/weekly', { requiresAuth: true }),
  getWeeklyHistoryStats: () => apiCall('/chat/stats/weekly-history', { requiresAuth: true }),
  getWeekDetail: (weekStart) => apiCall(`/chat/stats/week-detail?week_start=${weekStart}`, { requiresAuth: true }),
  
  // 저장된 대사 목록
  getSavedQuotes: () => apiCall('/chat/quotes', { requiresAuth: true }),
  updateQuote: (quoteId, quoteData) => apiCall(`/chat/quotes/${quoteId}`, { method: 'PUT', body: quoteData, requiresAuth: true }),
  deleteQuote: (quoteId) => apiCall(`/chat/quotes/${quoteId}`, { method: 'DELETE', requiresAuth: true }),
  
  // 모든 채팅 히스토리 (수동 + 자동, 대사 제외)
  getAllChatHistories: () => apiCall('/chat/histories/all', { requiresAuth: true }),
  
  // 교환일기
  createExchangeDiary: (data) => apiCall('/exchange-diary/create', { method: 'POST', body: data, requiresAuth: true }),
  getExchangeDiaryList: () => apiCall('/exchange-diary/list', { requiresAuth: true }),
  getExchangeDiary: (diaryId) => apiCall(`/exchange-diary/${diaryId}`, { requiresAuth: true }),
  getExchangeDiaryReply: (diaryId) => apiCall(`/exchange-diary/${diaryId}/reply`, { requiresAuth: true }),
  deleteExchangeDiary: (diaryId) => apiCall(`/exchange-diary/${diaryId}`, { method: 'DELETE', requiresAuth: true }),
  reactToReply: (diaryId, reaction) => apiCall(`/exchange-diary/${diaryId}/react`, { method: 'POST', body: { reaction }, requiresAuth: true }),
  getTodayTopic: () => apiCall('/exchange-diary/today-topic', { requiresAuth: true }),
  
  // 심리 리포트
  generatePsychologyReport: (data) => apiCall('/psychology/report', { method: 'POST', body: data, requiresAuth: true }),
};

export { API_BASE_URL };

