// API 설정 및 호출 유틸리티
// [변경 전] 로컬에서 개발할 때 사용했던 주소
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// [변경 후] 모바일에서 접근 가능한 로컬 네트워크 주소
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.104:8000';

// 인증 토큰 가져오기
const getToken = () => localStorage.getItem('token');

// 기본 fetch 옵션
const getFetchOptions = (method = 'GET', body = null, requiresAuth = false) => {
  const options = {
    method,
    mode: 'cors',
    credentials: 'omit',
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
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    getFetchOptions(method, body, requiresAuth)
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`서버 오류 (HTTP ${response.status}): ${errorData}`);
  }

  return response.json();
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

  // 인증
  register: (userData) => apiCall('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => apiCall('/auth/login', { method: 'POST', body: credentials }),
  getCurrentUser: () => apiCall('/auth/me', { requiresAuth: true }),
  updateProfile: (profileData) => apiCall('/auth/profile', { method: 'PUT', body: profileData, requiresAuth: true }),

  // 일기
  generateDiary: (data) => apiCall('/diary/generate', { method: 'POST', body: data, requiresAuth: true }),
  createDiary: (data) => apiCall('/diary/create', { method: 'POST', body: data, requiresAuth: true }),
  getDiaryList: () => apiCall('/diary/list', { requiresAuth: true }),
  getDiary: (diaryId) => apiCall(`/diary/${diaryId}`, { requiresAuth: true }),
  deleteDiary: (diaryId) => apiCall(`/diary/${diaryId}`, { method: 'DELETE', requiresAuth: true }),

  // 선물
  checkGifts: (characterId) => apiCall(`/gifts/check?character_id=${characterId}`, { requiresAuth: true }),

  // 성향 지도
  getArchetypeMap: (characterIds = null) => {
    const query = characterIds ? `?character_ids=${JSON.stringify(characterIds)}` : '';
    return apiCall(`/archetype/map${query}`, { requiresAuth: true });
  },

  // 주간 대화 통계
  getWeeklyStats: () => apiCall('/chat/stats/weekly', { requiresAuth: true }),
  getWeeklyHistoryStats: () => apiCall('/chat/stats/weekly-history', { requiresAuth: true }),
  
  // 저장된 대사 목록
  getSavedQuotes: () => apiCall('/chat/quotes', { requiresAuth: true }),
};

export { API_BASE_URL };

