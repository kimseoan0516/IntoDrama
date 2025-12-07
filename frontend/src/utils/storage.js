// 로컬스토리지 유틸리티

// 채팅 히스토리
export const chatHistory = {
  save: (chatId, chatData) => {
    const histories = chatHistory.load();
    const existingIndex = histories.findIndex(h => h.id === chatId);
    const chatHistoryItem = {
      id: chatId,
      ...chatData,
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      histories[existingIndex] = chatHistoryItem;
    } else {
      histories.push(chatHistoryItem);
    }
    localStorage.setItem('chatHistories', JSON.stringify(histories));
  },

  load: () => JSON.parse(localStorage.getItem('chatHistories') || '[]'),

  delete: (chatId) => {
    const histories = chatHistory.load();
    const filtered = histories.filter(h => h.id !== chatId);
    localStorage.setItem('chatHistories', JSON.stringify(filtered));
  },

  clear: () => localStorage.removeItem('chatHistories'),
};

// 인증
export const auth = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('user'),

  clear: () => {
    auth.removeToken();
    auth.removeUser();
  },
};

// 즐겨찾기
export const favorites = {
  load: () => JSON.parse(localStorage.getItem('favorites') || '[]'),
  save: (favs) => localStorage.setItem('favorites', JSON.stringify(favs)),
};

// 심리 리포트
export const psychologyReports = {
  load: () => JSON.parse(localStorage.getItem('psychologyReports') || '[]'),
  save: (reports) => localStorage.setItem('psychologyReports', JSON.stringify(reports)),
};

