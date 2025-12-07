import React, { useState, useEffect } from 'react';
import { characterData } from '../constants/characterData';
import { api } from '../utils/api';
import { auth } from '../utils/storage';

export const MyPageScreen = ({ userProfile, onClose, onSave, token, onLogout }) => {
    const defaultProfilePic = "https://placehold.co/100x100/bcaaa4/795548?text=User";
    const [nickname, setNickname] = useState(userProfile.nickname);
    const [profilePic, setProfilePic] = useState(userProfile.profilePic);

    const handleSave = async () => {
        if (token) {
            try {
                const data = await api.updateProfile({
                        nickname,
                        profile_pic: profilePic || defaultProfilePic,
                });
                auth.setUser(data);
                    onSave({
                        nickname: data.nickname,
                        profilePic: data.profile_pic || defaultProfilePic,
                    });
                    onClose();
            } catch (error) {
                alert('프로필 업데이트 중 오류가 발생했습니다.');
            }
        } else {
        onSave({ nickname, profilePic });
        onClose();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="my-page-modal">
                <h2>프로필 설정</h2>
                <div className="profile-preview-area">
                    <img src={profilePic} alt="Profile Preview" className="profile-preview" />
                    <label htmlFor="profile-pic-upload" className="file-input-label" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
                        변경
                    </label>
                    <input
                        id="profile-pic-upload"
                        type="file"
                        accept="image/*"
                        className="file-input-hidden"
                        onChange={handleFileChange}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="nickname">닉네임</label>
                    <input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                    />
                </div>
                <div className="logout-section">
                    <button className="logout-button-in-modal" onClick={onLogout}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        <span>로그아웃</span>
                    </button>
                </div>
                <div className="button-group">
                    <button className="close-button" onClick={onClose}>닫기</button>
                    <button className="save-button" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

// 대화 기록 화면
export const HistoryScreen = ({ onClose, onLoadChat, onDeleteChat, token, refreshTrigger }) => {
    const [histories, setHistories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistories = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                const data = await api.getChatHistories();
                // 백엔드에서 이미 필터링된 대화만 반환됨 (is_manual == 1 AND is_manual_quote == 0)
                setHistories(data.histories || data);
            } catch (error) {
                console.error('Failed to load histories:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchHistories();
    }, [token, refreshTrigger]);

    const handleDelete = async (chatId) => {
        if (!window.confirm('이 대화를 삭제하시겠습니까?')) return;
        
        try {
            await api.deleteChatHistory(chatId);
                setHistories(histories.filter(h => h.id !== chatId));
                onDeleteChat(chatId);
        } catch (error) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            // ISO 형식 날짜 파싱 (UTC 처리)
            let date;
            if (typeof dateString === 'string') {
                let dateStr = dateString.trim();
                if (dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
                    dateStr = dateStr + 'Z';
                }
                date = new Date(dateStr);
            } else {
                date = new Date(dateString);
            }
            
            // 유효한 날짜인지 확인
            if (isNaN(date.getTime())) {
                console.error('유효하지 않은 날짜:', dateString);
                return dateString;
            }
            
            const now = new Date();
            const diffMs = now - date;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            
            // 방금 전 (1분 미만)
            if (diffSec < 60) {
                return '방금 전';
            }
            
            // n분 전 (1시간 미만)
            if (diffMin < 60) {
                return `${diffMin}분 전`;
            }
            
            // n시간 전 (24시간 미만)
            if (diffHour < 24) {
                return `${diffHour}시간 전`;
            }
            
            // n일 전 (7일 미만)
            if (diffDay < 7) {
                return `${diffDay}일 전`;
            }
            
            // 7일 이상이면 날짜 형식으로 표시 (25.11.27 형식)
            const year = String(date.getFullYear()).slice(-2); // 마지막 2자리
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}.${month}.${day}`;
        } catch (e) {
            console.error('날짜 포맷 오류:', e, dateString);
            return dateString;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="history-modal">
                <h2>내 대화 보관함</h2>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div className="history-list">
                    {loading ? (
                        <p className="empty-message">불러오는 중...</p>
                    ) : histories.length === 0 ? (
                        <p className="empty-message">저장된 대화가 없습니다.</p>
                    ) : (
                        histories.map(history => {
                            // 캐릭터 정보 가져오기
                            const charIds = history.character_ids || [];
                            const firstCharId = charIds[0];
                            const secondCharId = charIds[1];
                            const firstChar = firstCharId ? characterData[firstCharId] : null;
                            const secondChar = secondCharId ? characterData[secondCharId] : null;
                            const charImage = firstChar?.image || '/default-character.png';
                            const secondCharImage = secondChar?.image || '/default-character.png';
                            const isTwoChars = charIds.length === 2;
                            
                            return (
                            <div key={history.id} className="history-item">
                                <button 
                                    className="history-delete-btn"
                                    onClick={() => handleDelete(history.id)}
                                    title="삭제"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                                {/* 캐릭터 프로필 이미지 */}
                                <div className={`history-avatar ${isTwoChars ? 'history-avatar-cluster' : ''}`}>
                                    {isTwoChars ? (
                                        <>
                                            {/* 1번 캐릭터: 왼쪽 위 */}
                                            <div className="history-avatar-item history-avatar-top-left">
                                                <img 
                                                    src={charImage} 
                                                    alt={firstChar?.name || 'Character'} 
                                                    onError={(e) => {
                                                        e.target.src = '/default-character.png';
                                                    }}
                                                />
                                            </div>
                                            {/* 2번 캐릭터: 오른쪽 아래 */}
                                            <div className="history-avatar-item history-avatar-bottom-right">
                                                <img 
                                                    src={secondCharImage} 
                                                    alt={secondChar?.name || 'Character'} 
                                                    onError={(e) => {
                                                        e.target.src = '/default-character.png';
                                                    }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <img 
                                            src={charImage} 
                                            alt={firstChar?.name || 'Character'} 
                                            onError={(e) => {
                                                e.target.src = '/default-character.png';
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="history-info">
                                    <h3>{history.title || '제목 없음'}</h3>
                                    <p>
                                        {(history.character_ids || []).map(id => characterData[id]?.name).filter(Boolean).join(', ')}
                                    </p>
                                    <div className="history-meta">
                                        <p className="history-date">
                                            <span role="img" aria-label="clock">🕒</span> {formatDate(history.created_at || history.updated_at)}
                                        </p>
                                        <p className="history-message-count">
                                            <span role="img" aria-label="message">💬</span> 메시지 {history.messages?.length || 0}개
                                        </p>
                                </div>
                                </div>
                                <button 
                                    className="history-load-btn"
                                    onClick={() => onLoadChat(history)}
                                >
                                    불러오기
                                </button>
                            </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
