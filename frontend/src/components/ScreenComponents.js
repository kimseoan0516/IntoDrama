import React, { useState, useEffect, useRef } from 'react';
import { characterData } from '../constants/characterData';
import { api, API_BASE_URL } from '../utils/api';
import { auth, psychologyReports } from '../utils/storage';
import html2canvas from 'html2canvas';

// 마이페이지 모달
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

export const StatsScreen = ({ onClose, token, messages, onDeleteChat, refreshTrigger, onShowWeeklyRecap, onLoadChat }) => {
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuotePage, setCurrentQuotePage] = useState(1);
    const quotesPerPage = 5;
    
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const now = new Date();
            
            // 날짜만 비교하기 위해 시간을 00:00:00으로 설정
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            // 오늘인지 확인
            if (targetDate.getTime() === today.getTime()) {
                return '오늘';
            }
            
            // 어제인지 확인
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (targetDate.getTime() === yesterday.getTime()) {
                return '어제';
            }
            
            // 그 외에는 날짜 형식으로 표시 (MM/DD)
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}/${day}`;
        } catch {
            return dateString;
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                // 주간 통계, 대사 목록을 동시에 가져오기
                const [statsData, quotesData] = await Promise.all([
                    api.getWeeklyStats(),
                    api.getSavedQuotes()
                ]);
                setWeeklyStats(statsData);
                setQuotes(quotesData.quotes || []);
                setCurrentQuotePage(1); // 데이터 새로고침 시 첫 페이지로
                } catch (error) {
                    console.error('통계 불러오기 실패:', error);
            } finally {
            setLoading(false);
            }
        };
        fetchStats();
    }, [token, refreshTrigger]);

    const handleDelete = async (chatId) => {
        if (!window.confirm('이 대화를 삭제하시겠습니까?')) {
            return;
        }

        if (token) {
            try {
                await api.deleteChatHistory(chatId);
                setQuotes(prev => prev.filter(q => q.id !== chatId));
                    if (onDeleteChat) {
                        onDeleteChat(chatId);
                }
            } catch (error) {
                console.error('대화 삭제 실패:', error);
                alert('대화 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="stats-modal">
                <h2>대화 통계</h2>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div className="stats-content">
                    {loading ? (
                        <p className="empty-message">불러오는 중...</p>
                    ) : (
                        <>
                            <div className="weekly-stats-header" style={{ marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#5D4037', marginBottom: '4px' }}>이번주 가장 많이 대화한 캐릭터</h3>
                                <p style={{ fontSize: '0.85rem', color: '#8D6E63', margin: 0 }}>가장 티키타카가 잘 맞는 파트너를 모았어요</p>
                            </div>
                            
                            {!weeklyStats || weeklyStats.top_characters.length === 0 ? (
                                <div style={{ 
                                    padding: '40px 20px', 
                                    textAlign: 'center',
                                    color: '#8D6E63',
                                    fontSize: '0.95rem'
                                }}>
                                    <p style={{ margin: 0, opacity: 0.7 }}>이번주 대화 기록이 없습니다.</p>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>대화를 시작하고 저장하면 통계가 표시됩니다.</p>
                                </div>
                            ) : (
                                <>
                            {/* 상위 3명 캐릭터 카드 - 1위 위에, 2·3위 아래 가로로 */}
                            <div style={{ marginBottom: '12px' }}>
                                {/* 1위 카드 */}
                                {weeklyStats.top_characters[0] && (() => {
                                    const char = weeklyStats.top_characters[0];
                                    const charInfo = characterData && char.character_id ? characterData[char.character_id] : null;
                                    const charName = charInfo?.name?.split(' (')[0] || '알 수 없음';
                                    const charImage = charInfo?.image || '/default-character.png';
                                    
                                    // 태그 생성 (예시)
                                    const tags = ['#소울메이트', '#티키타카 최고', '#시비러'];
                                    const randomTag = tags[Math.floor(Math.random() * tags.length)];
                                    
                                    return (
                                        <div 
                                            key={char.character_id} 
                                            className="top-character-card"
                                            style={{
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                padding: '20px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(180deg, #FFFEF5 0%, #FFFFFF 100%)',
                                                border: '2px solid #D4AF37',
                                                marginBottom: '16px',
                                                maxWidth: '300px',
                                                margin: '0 auto 16px auto',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {/* MY SOULMATE 배너 */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '0',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                color: '#FFFFFF',
                                                padding: '4px 16px',
                                                borderRadius: '0 0 8px 8px',
                                                fontSize: '0.65rem',
                                                fontWeight: '700',
                                                letterSpacing: '1px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                zIndex: 5
                                            }}>
                                                MY SOULMATE
                                            </div>
                                            
                                            {/* 순위 뱃지 - 프로필 사진 살짝 겹치는 위치 */}
                                            <div 
                                                style={{
                                                    position: 'absolute',
                                                    top: '24px',
                                                    right: 'calc(50% - 50px)',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#FFFFFF',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                                                    zIndex: 10,
                                                    border: '2px solid #FFFFFF',
                                                    paddingTop: '2px',
                                                    paddingBottom: '2px'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.4rem', lineHeight: '1', fontWeight: 'bold', marginTop: '0px' }}>1</span>
                                                <span style={{ fontSize: '0.4rem', lineHeight: '0.9', marginTop: '0px', letterSpacing: '0.5px' }}>TOP</span>
                                            </div>
                                            
                                            {/* 캐릭터 이미지 */}
                                            <div 
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    marginTop: '20px',
                                                    marginBottom: '18px',
                                                    border: '3px solid #E8E0DB',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                }}
                                            >
                                                <img 
                                                    src={charImage} 
                                                    alt={charName}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                            
                                            {/* 캐릭터 이름 */}
                                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#5D4037', marginBottom: '6px', textAlign: 'center' }}>
                                                {charName}
                                            </div>
                                            
                                            {/* 태그 */}
                                            <div style={{ fontSize: '0.7rem', color: '#8D6E63', marginBottom: '10px', textAlign: 'center' }}>
                                                {randomTag}
                                            </div>
                                            
                                            {/* 통계 정보 - Chip/Tag 스타일 */}
                                            <div style={{ 
                                                display: 'inline-block',
                                                padding: '6px 12px',
                                                borderRadius: '16px',
                                                backgroundColor: '#F5F1EB',
                                                fontSize: '0.75rem',
                                                color: '#8D6E63',
                                                textAlign: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                대화 {char.chat_count}회 · 메시지 {char.message_count}개
                                            </div>
                                            
                                            {/* 평균 메시지 수 분석 (1위만) */}
                                            {(() => {
                                                const avgMessages = char.chat_count > 0 ? (char.message_count / char.chat_count).toFixed(1) : 0;
                                                return (
                                                    <div style={{ 
                                                        fontSize: '0.7rem', 
                                                        color: '#6B4E3D', 
                                                        textAlign: 'center',
                                                        marginTop: '4px',
                                                        opacity: 0.9
                                                    }}>
                                                        💬 대화당 평균 {avgMessages}개의 메시지를 주고받았어요.
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}
                                
                                {/* 2위, 3위 카드 - 가로로 나란히 */}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    {weeklyStats.top_characters.slice(1, 3).map((char, index) => {
                                        const charInfo = characterData && char.character_id ? characterData[char.character_id] : null;
                                        const charName = charInfo?.name?.split(' (')[0] || '알 수 없음';
                                        const charImage = charInfo?.image || '/default-character.png';
                                        const rank = index + 2; // 2 또는 3
                                        
                                        // 뱃지 색상 및 테두리 색상
                                        const rankColors = {
                                            2: { 
                                                badge: 'linear-gradient(135deg, #D4C5B9 0%, #C4B5A9 100%)',
                                                text: '#8B6F47',
                                                border: '#C0C0C0'
                                            },
                                            3: { 
                                                badge: 'linear-gradient(135deg, #D4A574 0%, #C49464 100%)',
                                                text: '#8B5A2B',
                                                border: '#CD7F32'
                                            }
                                        };
                                        
                                        const rankColor = rankColors[rank];
                                        
                                        // 태그 생성
                                        const tags = ['#소울메이트', '#티키타카 최고', '#시비러', '#대화왕', '#친구'];
                                        const randomTag = tags[Math.floor(Math.random() * tags.length)];
                                        
                                        return (
                                            <div 
                                                key={char.character_id} 
                                                className="top-character-card"
                                                style={{
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '16px',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#FFFFFF',
                                                    border: `2px solid ${rankColor.border}`,
                                                    flex: '1',
                                                    maxWidth: '140px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {/* 순위 뱃지 */}
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        top: '16px',
                                                        right: 'calc(50% - 35px)',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: rankColor.badge,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#FFFFFF',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                                                        zIndex: 10,
                                                        border: '2px solid #FFFFFF',
                                                        paddingTop: '2px',
                                                        paddingBottom: '2px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.8rem', lineHeight: '1', fontWeight: 'bold', marginTop: '0px' }}>{rank}</span>
                                                    <span style={{ fontSize: '0.6rem', lineHeight: '0.9', marginTop: '3px', letterSpacing: '0.5px' }}>TOP</span>
                            </div>
                                                
                                                {/* 캐릭터 이미지 */}
                                                <div 
                                                    style={{
                                                        width: '70px',
                                                        height: '70px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        marginTop: '12px',
                                                        marginBottom: '14px',
                                                        border: '3px solid #E8E0DB',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                    }}
                                                >
                                                    <img 
                                                        src={charImage} 
                                                        alt={charName}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                            </div>
                                                
                                                {/* 캐릭터 이름 */}
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#5D4037', marginBottom: '4px', textAlign: 'center' }}>
                                                    {charName}
                                </div>
                                                
                                                {/* 태그 */}
                                                <div style={{ fontSize: '0.65rem', color: '#8D6E63', marginBottom: '8px', textAlign: 'center' }}>
                                                    {randomTag}
                                                </div>
                                                
                                                {/* 통계 정보 - Chip/Tag 스타일 (한 줄, 작은 글씨) */}
                                                <div style={{ 
                                                    display: 'inline-block',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#F5F1EB',
                                                    fontSize: '0.6rem',
                                                    color: '#8D6E63',
                                                    textAlign: 'center',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    대화 {char.chat_count}회 · 메시지 {char.message_count}개
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* 구분선 */}
                                <div style={{
                                    width: '100%',
                                    height: '1px',
                                    background: 'rgba(0, 0, 0, 0.08)',
                                    marginTop: '12px',
                                    marginBottom: '12px'
                                }}></div>
                            </div>
                            
                            {/* 총 통계 */}
                            <div className="total-stats-container" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '12px',
                                marginTop: '12px'
                            }}>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '10px',
                                    border: '1px solid #E8E0DB',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                        {weeklyStats?.total_chats || 0}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 대화 수</div>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '10px',
                                    border: '1px solid #E8E0DB',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                        {weeklyStats?.total_messages || 0}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 메시지 수</div>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '10px',
                                    border: '1px solid #E8E0DB',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                        {weeklyStats?.top_characters?.length || 0}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#8D6E63', lineHeight: '1.3' }}>
                                        대화한<br />캐릭터
                                    </div>
                                </div>
                            </div>
                                </>
                            )}
                            
                            {/* 총 통계 (데이터가 없을 때도 표시) */}
                            {(!weeklyStats || weeklyStats.top_characters.length === 0) && (
                                <div className="total-stats-container" style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(3, 1fr)', 
                                    gap: '12px',
                                    marginTop: '12px'
                                }}>
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '10px',
                                        border: '1px solid #E8E0DB',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                            0
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 대화 수</div>
                                    </div>
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '10px',
                                        border: '1px solid #E8E0DB',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                            0
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 메시지 수</div>
                                    </div>
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '10px',
                                        border: '1px solid #E8E0DB',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                            0
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#8D6E63', lineHeight: '1.3' }}>
                                            대화한<br />캐릭터
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Weekly Recap 박스 */}
                    {onShowWeeklyRecap && (
                        <div className="weekly-recap-box" style={{ marginTop: '16px', paddingLeft: '0px', paddingRight: '4px' }}>
                            <div
                                onClick={onShowWeeklyRecap}
                                style={{
                                    padding: '16px 20px',
                                    background: 'linear-gradient(135deg, #E8DDD4 0%, #D7C5B8 50%, #C9B4A3 100%)',
                                    borderRadius: '16px',
                                    border: '2px solid #d1bdaa',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s',
                                    boxShadow: '0 4px 16px rgba(107, 78, 61, 0.3), 0 2px 6px rgba(0, 0, 0, 0.15)',
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'visible'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 78, 61, 0.4), 0 3px 8px rgba(0, 0, 0, 0.2)';
                                    e.currentTarget.style.borderColor = '#8D6E63';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #EDE1D5 0%, #DDCEC0 50%, #D0C0B0 100%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 78, 61, 0.3), 0 2px 6px rgba(0, 0, 0, 0.15)';
                                    e.currentTarget.style.borderColor = '#d1bdaa';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #E8DDD4 0%, #D7C5B8 50%, #C9B4A3 100%)';
                                }}
                            >
                                <div style={{
                                    fontSize: '1.45rem',
                                    fontWeight: '700',
                                    color: '#5D4037',
                                    letterSpacing: '1px',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    Weekly Recap
                                </div>
                                <div style={{
                                    marginTop: '8px',
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    opacity: 0.8
                                }}>
                                    주별 통계 보기
                                </div>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="#8D6E63" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    width="24" 
                                    height="24"
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0.6
                                                }}
                                            >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        </div>
                    )}
                    
                    {/* 저장한 대사 목록 - 항상 표시 */}
                    <div className="stats-quotes-list" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #E8E0DB' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#5D4037', margin: 0 }}>저장한 대사 목록</h3>
                                    </div>
                        {quotes.length === 0 ? (
                            <div style={{ 
                                padding: '40px 20px', 
                                textAlign: 'center',
                                color: '#8D6E63',
                                fontSize: '0.95rem'
                            }}>
                                <p style={{ margin: 0, opacity: 0.7 }}>저장한 대사가 없습니다.</p>
                                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>대화 중 마음에 드는 대사를 하트로 저장하면 여기에 표시됩니다.</p>
                            </div>
                        ) : (
                            <div className="stats-quotes-items">
                                {(() => {
                                    const totalPages = Math.ceil(quotes.length / quotesPerPage);
                                    const startIndex = (currentQuotePage - 1) * quotesPerPage;
                                    const endIndex = startIndex + quotesPerPage;
                                    const currentQuotes = quotes.slice(startIndex, endIndex);
                                    
                                    return (
                                        <>
                                            {currentQuotes.map((quote) => {
                                    const charIds = quote.character_ids || [];
                                    const charInfo = charIds.length > 0 ? characterData[charIds[0]] : null;
                                    const charName = charInfo?.name.split(' (')[0] || '알 수 없음';
                                    const charImage = charInfo?.image || '/default-character.png';
                                    const quoteText = quote.message?.text || (typeof quote.message === 'string' ? quote.message : '');
                                    const date = quote.updated_at || quote.created_at || '';
                                    const messageId = quote.message_id || (quote.message?.id || (typeof quote.message === 'object' ? quote.message?.id : null));
                                    const fullChatHistoryId = quote.full_chat_history_id || null;
                                            
                                            return (
                                                <div 
                                            key={quote.id} 
                                            className="stats-quote-item"
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                gap: '12px',
                                                padding: '12px', 
                                                border: '1px solid #E8E0DB', 
                                                borderRadius: '8px', 
                                                marginBottom: '8px', 
                                                backgroundColor: '#FFFFFF'
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                border: '2px solid #E8E0DB'
                                            }}>
                                                <img 
                                                    src={charImage} 
                                                    alt={charName}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, position: 'relative', paddingRight: '8px' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#5D4037', marginBottom: '4px' }}>
                                                    {charName}
                                                        </div>
                                                <div style={{ fontSize: '0.9rem', color: '#3E2723', lineHeight: '1.6', marginBottom: '8px', paddingBottom: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>
                                                    {quoteText}
                                                    </div>
                                                {/* Footer */}
                                                <div style={{ 
                                                    paddingTop: '8px',
                                                    marginTop: '6px',
                                                    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '12px',
                                                    padding: '6px 4px 0 4px'
                                                }}>
                                                    <div style={{ fontSize: '0.875rem', color: '#b7a38f', whiteSpace: 'nowrap', lineHeight: '1' }}>
                                                        {formatDate(date)}
                                                    </div>
                                                    {/* 전체 맥락 열람하기 버튼 */}
                                                    <button 
                                                    onClick={async (e) => {
                                                                e.stopPropagation();
                                                        // 해당 대사가 포함된 전체 대화 찾기
                                                        try {
                                                            console.log('=== 전체 대화 찾기 시작 ===');
                                                            console.log('Quote object:', quote);
                                                            console.log('messageId:', messageId);
                                                            console.log('fullChatHistoryId:', fullChatHistoryId);
                                                            console.log('quoteText:', quoteText);
                                                            
                                                            // 전체 대화 찾기: 모든 히스토리 가져오기 (보관함용 + 자동 저장용 모두)
                                                            const allHistoriesResponse = await fetch(`${API_BASE_URL}/chat/histories/all`, {
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`
                                                                }
                                                            });
                                                            let allHistories = [];
                                                            if (allHistoriesResponse.ok) {
                                                                const allData = await allHistoriesResponse.json();
                                                                allHistories = allData.histories || allData;
                                                                } else {
                                                                // fallback: 기존 API 사용
                                                                const allHistoriesData = await api.getChatHistories();
                                                                allHistories = allHistoriesData.histories || allHistoriesData;
                                                            }
                                                            console.log('Total histories count:', allHistories?.length || 0);
                                                            
                                                            let fullChat = null;
                                                            
                                                            // 1순위: full_chat_history_id로 직접 찾기 (백엔드에서 찾은 전체 대화)
                                                            if (Array.isArray(allHistories) && fullChatHistoryId) {
                                                                fullChat = allHistories.find(h => {
                                                                    const found = h.id === fullChatHistoryId || String(h.id) === String(fullChatHistoryId);
                                                                    if (found) console.log('Found by full_chat_history_id:', h);
                                                                    return found;
                                                                });
                                                                console.log('1st priority result:', fullChat);
                                                            }
                                                            
                                                            // 2순위: quote_message_id가 있는 전체 대화 찾기 (대사 저장 시 자동 저장된 전체 대화)
                                                            if (!fullChat && Array.isArray(allHistories) && messageId) {
                                                                console.log('Searching by quote_message_id:', messageId, 'Type:', typeof messageId);
                                                                const messageIdStr = String(messageId);
                                                                fullChat = allHistories.find(h => {
                                                                    try {
                                                                        const msgs = typeof h.messages === 'string' ? JSON.parse(h.messages) : (h.messages || []);
                                                                        const hQuoteMsgId = h.quote_message_id ? String(h.quote_message_id) : null;
                                                                        const match = h.is_manual_quote === 1 && 
                                                                               hQuoteMsgId === messageIdStr &&
                                                                               h.id !== quote.id &&  // 대사 자체가 아닌 전체 대화
                                                                               msgs.length > 1;  // 메시지가 여러 개인 것만
                                                                        if (match) {
                                                                            console.log('Found by quote_message_id:', {
                                                                                id: h.id,
                                                                                quote_message_id: h.quote_message_id,
                                                                                msg_count: msgs.length
                                                                            });
                                                                        }
                                                                        return match;
                                                                    } catch (err) {
                                                                        console.error('Error in quote_message_id search:', err);
                                                                        return false;
                                                                    }
                                                                });
                                                                console.log('2nd priority result:', fullChat);
                                                            }
                                                            
                                                            // 3순위: 사용자가 "서버에 저장"한 대화 찾기 (is_manual = 1, is_manual_quote = 0)
                                                            if (!fullChat && Array.isArray(allHistories) && quoteText) {
                                                                console.log('Searching by manual save with text:', quoteText.substring(0, 50));
                                                                fullChat = allHistories.find(h => {
                                                                    try {
                                                                        const msgs = typeof h.messages === 'string' ? JSON.parse(h.messages) : (h.messages || []);
                                                                        const isManual = (h.is_manual === 1 || h.is_manual === true);
                                                                        const isNotQuote = (h.is_manual_quote === 0 || h.is_manual_quote === false || h.is_manual_quote === null);
                                                                        const hasMultipleMsgs = msgs.length > 1;
                                                                        const hasMatchingText = msgs.some(m => {
                                                                            const msgText = typeof m === 'string' ? JSON.parse(m).text : (m.text || '');
                                                                            return msgText === quoteText || msgText.trim() === quoteText.trim();
                                                                        });
                                                                        
                                                                        const match = isManual && isNotQuote && hasMultipleMsgs && hasMatchingText;
                                                                        if (match) {
                                                                            console.log('Found by manual save:', h);
                                                                        }
                                                                        return match;
                                                                    } catch (err) {
                                                                        console.error('Error in manual save search:', err);
                                                                        return false;
                                                                    }
                                                                });
                                                                console.log('3rd priority result:', fullChat);
                                                            }
                                                            
                                                            if (fullChat && onLoadChat) {
                                                                console.log('✅ 전체 대화를 찾았습니다. 불러오는 중...');
                                                                // 대화 불러오기
                                                                onLoadChat(fullChat, quoteText);
                                                                onClose();
                                                                } else {
                                                                console.error('❌ 전체 대화를 찾을 수 없습니다.', {
                                                                    quote_id: quote.id,
                                                                    message_id: messageId,
                                                                    full_chat_history_id: fullChatHistoryId,
                                                                    quoteText: quoteText?.substring(0, 50),
                                                                    histories_sample: allHistories?.slice(0, 3).map(h => ({
                                                                        id: h.id,
                                                                        is_manual: h.is_manual,
                                                                        is_manual_quote: h.is_manual_quote,
                                                                        quote_message_id: h.quote_message_id,
                                                                        msg_count: typeof h.messages === 'string' ? JSON.parse(h.messages).length : (h.messages?.length || 0)
                                                                    }))
                                                                });
                                                                // 더 자세한 오류 메시지
                                                                const errorMsg = messageId 
                                                                    ? '전체 대화를 찾을 수 없습니다. 대화를 먼저 "서버에 저장"해주세요.' 
                                                                    : '전체 대화를 찾을 수 없습니다.';
                                                                alert(errorMsg);
                                                            }
                                                        } catch (error) {
                                                            console.error('대화 불러오기 오류:', error);
                                                            alert('대화를 불러오는 중 오류가 발생했습니다: ' + error.message);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.7rem',
                                                        color: '#8D6E63',
                                                        background: '#F5F1EB',
                                                        border: '1px solid #E8E0DB',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: '500',
                                                        flexShrink: 0,
                                                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#E8E0DB';
                                                        e.currentTarget.style.color = '#5D4037';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = '#F5F1EB';
                                                        e.currentTarget.style.color = '#8D6E63';
                                                    }}
                                                >
                                                    대화 흐름 추적하기
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{ marginLeft: '2px' }}>
                                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                                    </svg>
                                                </button>
                                                        </div>
                                                    </div>
                                                    <button 
                                                className="stats-quote-delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                    handleDelete(quote.id);
                                                        }}
                                                        title="삭제"
                                                style={{ 
                                                    background: 'none', 
                                                    border: 'none', 
                                                    cursor: 'pointer', 
                                                    padding: '4px',
                                                    color: '#8D6E63',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    alignSelf: 'flex-start'
                                                }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                            
                                            {/* 페이지네이션 */}
                                            {totalPages > 1 && (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginTop: '20px',
                                                    paddingTop: '16px',
                                                    borderTop: '1px solid #E8E0DB'
                                                }}>
                                                    <button
                                                        onClick={() => setCurrentQuotePage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentQuotePage === 1}
                                                        style={{
                                                            padding: '6px 12px',
                                                            fontSize: '0.85rem',
                                                            color: currentQuotePage === 1 ? '#BDBDBD' : '#8D6E63',
                                                            background: currentQuotePage === 1 ? '#F5F5F5' : '#FFFFFF',
                                                            border: `1px solid ${currentQuotePage === 1 ? '#E0E0E0' : '#E8E0DB'}`,
                                                            borderRadius: '6px',
                                                            cursor: currentQuotePage === 1 ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        이전
                                                    </button>
                                                    
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setCurrentQuotePage(pageNum)}
                                                            style={{
                                                                minWidth: '32px',
                                                                height: '32px',
                                                                padding: '0 8px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: currentQuotePage === pageNum ? '600' : '400',
                                                                color: currentQuotePage === pageNum ? '#FFFFFF' : '#8D6E63',
                                                                background: currentQuotePage === pageNum ? '#8D6E63' : '#FFFFFF',
                                                                border: `1px solid ${currentQuotePage === pageNum ? '#8D6E63' : '#E8E0DB'}`,
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    ))}
                                                    
                                                    <button
                                                        onClick={() => setCurrentQuotePage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentQuotePage === totalPages}
                                                        style={{
                                                            padding: '6px 12px',
                                                            fontSize: '0.85rem',
                                                            color: currentQuotePage === totalPages ? '#BDBDBD' : '#8D6E63',
                                                            background: currentQuotePage === totalPages ? '#F5F5F5' : '#FFFFFF',
                                                            border: `1px solid ${currentQuotePage === totalPages ? '#E0E0E0' : '#E8E0DB'}`,
                                                            borderRadius: '6px',
                                                            cursor: currentQuotePage === totalPages ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        다음
                                    </button>
                                </div>
                            )}
                        </>
                                    );
                                })()}
                            </div>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 감정 분석 함수 (리포트용)
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
    
    const keywords = ['좋아해', '좋아', '사랑', '설레', '보고 싶', '너 생각', '그리워', '사랑해', '좋아한다', '마음', '심장', '떨려', '두근', '설렘', '행복', '기쁨', '웃음', '미소'];
    let score = 0;
    keywords.forEach(k => {
        if (text.includes(k)) score += 0.3;
    });
    if (text.endsWith('...') || text.endsWith('…')) score += 0.2;
    if (text.includes('❤') || text.includes('💕') || text.includes('💖')) score += 0.3;
    return Math.min(score, 1);
};

const detectComfortLevel = (text) => {
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

const detectConflictLevel = (text) => {
    if (!text) return 0;
    // 갈등 키워드: 화나고 섭섭한 감정 표현
    const conflictKeywords = ['화나', '싫어', '미워', '이해 못해', '짜증', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망'];
    // "지친다"와 함께 갈등으로 판단할 키워드
    const conflictWithTired = ['화나', '싫어', '미워', '짜증', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망', '답답'];
    
    let score = 0;
    const hasTired = text.includes('지치') || text.includes('피곤') || text.includes('힘들');
    
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
    }
    
    // "답답"은 "지친다"와 함께 있을 때만 갈등으로 판단
    if (text.includes('답답')) {
        if (hasTired) {
            score += 0.2;
        }
    }
    
    return Math.min(score, 1);
};

// 심리 리포트 생성
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

    // 심리 분석
    const analysis = `이 대화에서 ${userProfile.nickname}님은 주로 ${dominantMood === 'romance' ? '로맨틱한 감정' : dominantMood === 'comfort' ? '위로와 안정' : dominantMood === 'conflict' ? '갈등과 긴장' : '중립적인 감정'}을 표현하셨습니다.`;

    // 심리적 포지션
    const position = `${userProfile.nickname}님은 현재 ${dominantMood === 'romance' ? '감정적으로 열려있는 상태' : dominantMood === 'comfort' ? '위로를 필요로 하는 상태' : dominantMood === 'conflict' ? '갈등 상황에 있는 상태' : '평온한 상태'}입니다.`;

    // 전문가 해석
    const interpretation = `이 대화 패턴을 보면, ${userProfile.nickname}님은 ${dominantMood === 'romance' ? '감정적 교류를 중요하게 생각하시는 분' : dominantMood === 'comfort' ? '안정과 위로를 추구하시는 분' : dominantMood === 'conflict' ? '갈등 상황에서 솔직한 의사소통을 하시는 분' : '균형잡힌 의사소통을 하시는 분'}으로 보입니다.`;

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

    // 기본 추천 활동
    const suggestions = [
        {
            activity: '충분한 휴식 취하기',
            description: '하루 중 최소 7-8시간의 수면을 취하고, 스트레스를 줄이는 활동을 해보세요.',
            why: '충분한 휴식은 정신 건강의 기초입니다. 피로가 쌓이면 감정 조절 능력이 떨어지고, 스트레스에 더 취약해집니다.'
        },
        {
            activity: '신뢰하는 사람과 대화하기',
            description: '가족, 친구, 또는 전문 상담사와 자신의 감정과 고민을 솔직하게 나눠보세요.',
            why: '감정을 언어로 표현하는 것만으로도 심리적 부담이 줄어듭니다. 타인의 관점을 듣는 것은 새로운 해결책을 찾는 데 도움이 됩니다.'
        },
        {
            activity: '취미 활동 즐기기',
            description: '자신이 즐기는 활동(독서, 운동, 음악 감상, 그림 그리기 등)에 시간을 투자해보세요.',
            why: '취미 활동은 일상의 스트레스에서 벗어나 긍정적인 감정을 경험하게 해줍니다. 성취감과 만족감을 느끼는 것은 자존감 향상에 도움이 됩니다.'
        }
    ];

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
        imageUrl: null // 이미지 URL 저장용
    };
};

// 심리 리포트 화면
export const ReportScreen = ({ onClose, messages, userProfile }) => {
    const [report, setReport] = useState(null);
    const [previousReports, setPreviousReports] = useState([]);
    const reportRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // 리포트 생성 - messages가 변경될 때마다 새로 생성
        const newReport = generateReport(messages, userProfile);
        setReport(newReport);

        // 저장된 리포트 목록 불러오기
        const savedReports = psychologyReports.load();
        setPreviousReports(savedReports);
    }, [messages, userProfile]);

    const handleSaveReport = async () => {
        if (!report || !reportRef.current) return;
        
        setIsSaving(true);
        
        try {
            // 리포트를 이미지로 캡처
            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#FFFFFF',
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: false,
                windowWidth: reportRef.current.scrollWidth,
                windowHeight: reportRef.current.scrollHeight,
                scrollX: 0,
                scrollY: 0
            });

            // Canvas를 Blob으로 변환
            canvas.toBlob((blob) => {
                const imageUrl = URL.createObjectURL(blob);
                
                // 리포트에 이미지 URL 추가
                const reportWithImage = {
                    ...report,
                    imageUrl: imageUrl
                };
                
                const savedReports = psychologyReports.load();
        
                // 같은 ID가 이미 저장되어 있는지 확인
                const existingIndex = savedReports.findIndex(r => r.id === report.id);
                if (existingIndex >= 0) {
            const overwrite = window.confirm(
                `Ep.${report.episode} 리포트가 이미 저장되어 있습니다.\n덮어쓰시겠습니까?`
            );
                    if (!overwrite) {
                        setIsSaving(false);
                        return;
                    }
                    savedReports[existingIndex] = reportWithImage;
        } else {
                    savedReports.push(reportWithImage);
                }
                
                psychologyReports.save(savedReports);
        
                alert(`Ep.${report.episode} 리포트가 이미지와 함께 저장되었습니다.`);
        
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

    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    };

    if (!report) {
        return (
            <div className="modal-overlay">
                <div className="report-modal">
                    <h2>감정 분석 리포트</h2>
                    <button className="close-button" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                    <div className="report-content">
                        <p className="empty-message">분석할 메시지가 없습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="report-modal">
                <h2>감정 분석 리포트</h2>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div className="report-content" ref={reportRef}>
                    <div className="report-header" style={{
                        background: 'linear-gradient(135deg, #FBF9F7 0%, #FFFFFF 100%)',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '24px',
                        border: '2px solid #E8E0DB',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                    }}>
                        <div className="episode-header-main" style={{
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    boxShadow: '0 4px 12px rgba(141, 110, 99, 0.3)'
                                }}>
                                    📊
                                </div>
                                <div>
                                    <h3 style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '700',
                                        color: '#3E2723',
                                        margin: 0,
                                        lineHeight: '1.3'
                                    }}>
                                        감정 분석 리포트
                                    </h3>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        color: '#8D6E63',
                                        margin: '4px 0 0 0',
                                        fontWeight: '500'
                                    }}>
                                        Ep.{report.episode} · {formatDate(report.date)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* 감정 스탯 - 모던한 카드 스타일 */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '20px',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                flex: '1',
                                minWidth: '120px',
                                padding: '16px',
                                borderRadius: '14px',
                                background: report.stats.romanceScore > 20 
                                    ? 'linear-gradient(135deg, rgba(255, 200, 184, 0.3) 0%, rgba(255, 220, 210, 0.2) 100%)'
                                    : 'linear-gradient(135deg, #F5F1EB 0%, #FFFFFF 100%)',
                                border: `2px solid ${report.stats.romanceScore > 20 ? '#FFC8B8' : '#E8E0DB'}`,
                                textAlign: 'center',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    marginBottom: '8px',
                                    fontWeight: '600'
                                }}>
                                    로맨스
                                </div>
                                <div style={{
                                    fontSize: '1.8rem',
                                    fontWeight: '700',
                                    color: report.stats.romanceScore > 20 ? '#D84315' : '#5D4037',
                                    lineHeight: '1'
                                }}>
                                    {report.stats.romanceScore}%
                                </div>
                            </div>
                            <div style={{
                                flex: '1',
                                minWidth: '120px',
                                padding: '16px',
                                borderRadius: '14px',
                                background: report.stats.comfortScore > 20 
                                    ? 'linear-gradient(135deg, rgba(255, 235, 59, 0.3) 0%, rgba(255, 248, 225, 0.2) 100%)'
                                    : 'linear-gradient(135deg, #F5F1EB 0%, #FFFFFF 100%)',
                                border: `2px solid ${report.stats.comfortScore > 20 ? '#FFEB3B' : '#E8E0DB'}`,
                                textAlign: 'center',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    marginBottom: '8px',
                                    fontWeight: '600'
                                }}>
                                    위로/안정
                                </div>
                                <div style={{
                                    fontSize: '1.8rem',
                                    fontWeight: '700',
                                    color: report.stats.comfortScore > 20 ? '#F57F17' : '#5D4037',
                                    lineHeight: '1'
                                }}>
                                    {report.stats.comfortScore}%
                                </div>
                            </div>
                            <div style={{
                                flex: '1',
                                minWidth: '120px',
                                padding: '16px',
                                borderRadius: '14px',
                                background: report.stats.conflictScore > 20 
                                    ? 'linear-gradient(135deg, rgba(255, 150, 150, 0.3) 0%, rgba(255, 200, 200, 0.2) 100%)'
                                    : 'linear-gradient(135deg, #F5F1EB 0%, #FFFFFF 100%)',
                                border: `2px solid ${report.stats.conflictScore > 20 ? '#FF9696' : '#E8E0DB'}`,
                                textAlign: 'center',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    marginBottom: '8px',
                                    fontWeight: '600'
                                }}>
                                    갈등/긴장
                                </div>
                                <div style={{
                                    fontSize: '1.8rem',
                                    fontWeight: '700',
                                    color: report.stats.conflictScore > 20 ? '#C62828' : '#5D4037',
                                    lineHeight: '1'
                                }}>
                                    {report.stats.conflictScore}%
                                </div>
                            </div>
                        </div>

                        {/* 대표 감정 뱃지 */}
                        {report.dominantEmotion && report.dominantEmotion !== 'neutral' && (
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                color: '#FFFFFF',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                marginBottom: '20px',
                                boxShadow: '0 4px 12px rgba(141, 110, 99, 0.3)'
                            }}>
                                <span>대표 감정:</span>
                                <span style={{
                                    fontSize: '1rem',
                                    fontWeight: '700'
                                }}>
                                    {report.dominantEmotion === 'romance' && '💕 로맨스'}
                                    {report.dominantEmotion === 'comfort' && '🤗 위로/안정'}
                                    {report.dominantEmotion === 'conflict' && '⚡ 갈등/긴장'}
                                </span>
                            </div>
                        )}

                        {/* 에피소드 한 줄 요약 */}
                        {report.episodeSummary && (
                            <div style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #FFF8E1 0%, #FFFFFF 100%)',
                                border: '2px solid #FFE0B2',
                                marginBottom: '16px',
                                boxShadow: '0 2px 8px rgba(255, 224, 178, 0.2)'
                            }}>
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    margin: '0 0 8px 0',
                                    fontWeight: '600'
                                }}>
                                    이 에피소드의 한 줄 장면 요약
                                </p>
                                <p style={{
                                    fontSize: '1rem',
                                    color: '#5D4037',
                                    margin: 0,
                                    lineHeight: '1.6',
                                    fontWeight: '500'
                                }}>
                                    "{report.episodeSummary}"
                                </p>
                            </div>
                        )}

                        {/* 다음 장면 제안 */}
                        {report.nextSceneSuggestion && (
                            <div style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)',
                                border: '2px solid #C8E6C9',
                                boxShadow: '0 2px 8px rgba(200, 230, 201, 0.2)'
                            }}>
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    margin: '0 0 8px 0',
                                    fontWeight: '600'
                                }}>
                                    다음엔 이런 장면이 이어지면 좋겠어요:
                                </p>
                                <p style={{
                                    fontSize: '1rem',
                                    color: '#5D4037',
                                    margin: '0 0 16px 0',
                                    lineHeight: '1.6',
                                    fontWeight: '500'
                                }}>
                                    "{report.nextSceneSuggestion}"
                                </p>
                                <button 
                                    style={{
                                        width: '100%',
                                        padding: '12px 20px',
                                        background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(141, 110, 99, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(141, 110, 99, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(141, 110, 99, 0.3)';
                                    }}
                                    onClick={() => {
                                        onClose();
                                    }}
                                >
                                    이 분위기로 이어서 대화하기
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* 감정 강도 시각화 */}
                    <div className="report-section">
                        <h4>감정 강도 분석</h4>
                        <div className="emotion-bars">
                            <div className="emotion-bar-item">
                                <div className="emotion-label">
                                    <span>로맨스</span>
                                    <span className="emotion-percentage">{report.stats.romanceScore}%</span>
                                </div>
                                <div className="emotion-bar-container">
                                    <div 
                                        className="emotion-bar romance-bar" 
                                        style={{ width: `${report.stats.romanceScore}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="emotion-bar-item">
                                <div className="emotion-label">
                                    <span>위로/안정</span>
                                    <span className="emotion-percentage">{report.stats.comfortScore}%</span>
                                </div>
                                <div className="emotion-bar-container">
                                    <div 
                                        className="emotion-bar comfort-bar" 
                                        style={{ width: `${report.stats.comfortScore}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="emotion-bar-item">
                                <div className="emotion-label">
                                    <span>갈등/긴장</span>
                                    <span className="emotion-percentage">{report.stats.conflictScore}%</span>
                                </div>
                                <div className="emotion-bar-container">
                                    <div 
                                        className="emotion-bar conflict-bar" 
                                        style={{ width: `${report.stats.conflictScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 주요 감정 */}
                    {report.stats.dominantMood !== 'neutral' && (
                        <div className="report-section">
                            <h4>주요 감정</h4>
                            <div className="dominant-mood">
                                {report.stats.dominantMood === 'romance' && '로맨스'}
                                {report.stats.dominantMood === 'comfort' && '위로/안정'}
                                {report.stats.dominantMood === 'conflict' && '갈등/긴장'}
                            </div>
                        </div>
                    )}

                    {/* 드라마 타임라인 */}
                    {report.messageTimeline && report.messageTimeline.length > 0 && (
                        <div className="report-section">
                            <h4>🎬 드라마 타임라인</h4>
                            <div className="drama-timeline">
                                {report.messageTimeline.map((item, index) => (
                                    <div key={index} className="timeline-message-item">
                                        <div className="timeline-message-bead-container">
                                            <div 
                                                className={`timeline-message-bead emotion-${item.emotion}`}
                                                style={{ 
                                                    opacity: Math.max(0.4, item.intensity),
                                                    transform: `scale(${0.7 + item.intensity * 0.3})`
                                                }}
                                                title={item.text}
                                            ></div>
                                            {item.isImportant && (
                                                <div className="important-moment-bubble" title={item.importantNote}>
                                                    {item.importantNote}
                                                </div>
                                            )}
                                        </div>
                                        {index < report.messageTimeline.length - 1 && (
                                            <div className="timeline-message-connector"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 시간대별 감정 변화 */}
                    {report.moodTimeline && (
                        <div className="report-section">
                            <h4>⏰ 시간대별 감정 변화</h4>
                            <div className="mood-timeline">
                                <div className="timeline-item">
                                    <span className="timeline-label">초반</span>
                                    <div 
                                        className={`timeline-mood-bead mood-${report.moodTimeline.early}`}
                                        title={
                                            report.moodTimeline.early === 'romance' ? '로맨스' :
                                            report.moodTimeline.early === 'comfort' ? '위로/안정' :
                                            report.moodTimeline.early === 'conflict' ? '갈등/긴장' : '중립'
                                        }
                                    ></div>
                                </div>
                                <div className="timeline-connector"></div>
                                <div className="timeline-item">
                                    <span className="timeline-label">중반</span>
                                    <div 
                                        className={`timeline-mood-bead mood-${report.moodTimeline.mid}`}
                                        title={
                                            report.moodTimeline.mid === 'romance' ? '로맨스' :
                                            report.moodTimeline.mid === 'comfort' ? '위로/안정' :
                                            report.moodTimeline.mid === 'conflict' ? '갈등/긴장' : '중립'
                                        }
                                    ></div>
                                </div>
                                <div className="timeline-connector"></div>
                                <div className="timeline-item">
                                    <span className="timeline-label">후반</span>
                                    <div 
                                        className={`timeline-mood-bead mood-${report.moodTimeline.late}`}
                                        title={
                                            report.moodTimeline.late === 'romance' ? '로맨스' :
                                            report.moodTimeline.late === 'comfort' ? '위로/안정' :
                                            report.moodTimeline.late === 'conflict' ? '갈등/긴장' : '중립'
                                        }
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 키워드 분석 */}
                    {report.keywords && report.keywords.length > 0 && (
                        <div className="report-section">
                            <h4>🔤 자주 사용한 단어</h4>
                            <div className="keywords-list">
                                {report.keywords.map((keyword, index) => (
                                    <span key={index} className="keyword-tag">
                                        {keyword.word} ({keyword.count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="report-section">
                        <p className="report-text">{report.analysis}</p>
                    </div>

                    <div className="report-section">
                        <h4>현재 심리 포지션:</h4>
                        <p className="report-position">› {report.position}</p>
                    </div>

                    {/* 심리적 문제 진단 */}
                    {report.psychologicalIssues && report.psychologicalIssues.length > 0 && (
                        <div className="report-section">
                            <h4>심리적 문제 진단</h4>
                            <div className="psychological-issues">
                                {report.psychologicalIssues.map((issue, index) => (
                                    <div key={index} className="issue-card">
                                        <div className="issue-header">
                                            <span className="issue-title">{issue.title}</span>
                                            <span className={`issue-severity severity-${issue.severity === '높음' ? 'high' : issue.severity === '중간' ? 'mid' : 'low'}`}>
                                                {issue.severity}
                                            </span>
                                        </div>
                                        <p className="issue-description">{issue.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 심리적 원인 분석 */}
                    {report.issueReasons && report.issueReasons.length > 0 && (
                        <div className="report-section">
                            <h4>심리적 원인 분석</h4>
                            <div className="issue-reasons">
                                {report.issueReasons.map((reason, index) => (
                                    <div key={index} className="reason-card">
                                        <div className="reason-issue">{reason.issue}</div>
                                        <p className="reason-text">{reason.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {previousReports.length > 0 && (
                        <div className="report-section">
                            <h4>📚 이전 리포트</h4>
                            <div className="previous-reports">
                                {previousReports.slice(-3).reverse().map((prevReport, index) => (
                                    <div key={index} className="previous-report-item">
                                        <span className="prev-episode">Ep.{prevReport.episode}</span>
                                        <span className="prev-date">{formatDate(prevReport.date)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 전문가 해석 - 맨 아래로 이동 */}
                    <div className="report-section">
                        <div className="expert-interpretation-header">
                            <span className="expert-icon">💡</span>
                            <h4>전문가 해석:</h4>
                        </div>
                        <div className="expert-interpretation-box">
                            <p className="report-interpretation">{report.interpretation}</p>
                        </div>
                    </div>

                    {/* 치료 활동 추천 - 맨 아래로 이동 */}
                    {report.therapeuticActivities && report.therapeuticActivities.length > 0 && (
                        <div className="report-section">
                            <h4>🌿 맞춤형 치료 활동</h4>
                            <div className="therapeutic-activities">
                                {report.therapeuticActivities.map((activity, index) => (
                                    <div key={index} className="activity-card">
                                        <div className="activity-header">
                                            <span className="activity-number">{index + 1}</span>
                                            <span className="activity-title">{activity.activity}</span>
                                        </div>
                                        <p className="activity-description">{activity.description}</p>
                                        <div className="activity-why">
                                            <strong>왜 도움이 될까요?</strong>
                                            <p>{activity.why}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 기본 추천 활동 - 맨 아래로 이동 */}
                    {report.suggestions && report.suggestions.length > 0 && (
                        <div className="report-section">
                            <h4>🌿 추천 활동</h4>
                            <div className="therapeutic-activities">
                                {report.suggestions.map((suggestion, index) => (
                                    <div key={index} className="activity-card">
                                        <div className="activity-header">
                                            <span className="activity-number">{index + 1}</span>
                                            <span className="activity-title">{typeof suggestion === 'string' ? suggestion : suggestion.activity}</span>
                                        </div>
                                        {typeof suggestion === 'object' && suggestion.description && (
                                            <p className="activity-description">{suggestion.description}</p>
                                        )}
                                        {typeof suggestion === 'object' && suggestion.why && (
                                            <div className="activity-why">
                                                <strong>왜 도움이 될까요?</strong>
                                                <p>{suggestion.why}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="report-actions">
                        <button 
                            className="save-report-button" 
                            onClick={handleSaveReport}
                            disabled={isSaving}
                        >
                            {isSaving ? '저장 중...' : '📸 리포트 이미지로 저장'}
                        </button>
                    </div>

                    {/* 저장된 리포트 목록 */}
                    {previousReports.length > 0 && (
                        <div className="report-section saved-reports-section">
                            <h4 style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: '700', 
                                color: '#5D4037', 
                                marginBottom: '16px',
                                paddingTop: '24px',
                                borderTop: '2px solid #E8E0DB'
                            }}>
                                📚 저장된 리포트
                            </h4>
                            <div className="saved-reports-grid">
                                {previousReports.slice().reverse().map((savedReport) => (
                                    <div 
                                        key={savedReport.id || savedReport.episode} 
                                        className="saved-report-card"
                                        style={{
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF9F7 100%)',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            border: '2px solid #E8E0DB',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                                            e.currentTarget.style.borderColor = '#8D6E63';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.borderColor = '#E8E0DB';
                                        }}
                                        onClick={() => {
                                            if (savedReport.imageUrl) {
                                                const newWindow = window.open();
                                                if (newWindow) {
                                                    newWindow.document.write(`
                                                        <html>
                                                            <head>
                                                                <title>감정 분석 리포트 Ep.${savedReport.episode}</title>
                                                                <style>
                                                                    body { 
                                                                        margin: 0; 
                                                                        padding: 20px; 
                                                                        background: #F5F1EB; 
                                                                        display: flex; 
                                                                        justify-content: center; 
                                                                        align-items: center; 
                                                                        min-height: 100dvh;
                                                                    }
                                                                    img { 
                                                                        max-width: 100%; 
                                                                        height: auto; 
                                                                        border-radius: 12px;
                                                                        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                                                                    }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <img src="${savedReport.imageUrl}" alt="감정 분석 리포트 Ep.${savedReport.episode}" />
                                                            </body>
                                                        </html>
                                                    `);
                                                }
                                            }
                                        }}
                                    >
                                        {savedReport.imageUrl && (
                                            <div style={{
                                                width: '100%',
                                                height: '180px',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                marginBottom: '12px',
                                                background: '#F5F1EB',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <img 
                                                    src={savedReport.imageUrl} 
                                                    alt={`Ep.${savedReport.episode}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                </div>
                                        )}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                fontSize: '1rem',
                                                fontWeight: '700',
                                                color: '#5D4037'
                                            }}>
                                                Ep.{savedReport.episode}
                                            </span>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                color: '#8D6E63',
                                                opacity: 0.8
                                            }}>
                                                {formatDate(savedReport.date)}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            flexWrap: 'wrap',
                                            marginTop: '8px'
                                        }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                background: savedReport.stats?.romanceScore > 20 ? 'rgba(255, 200, 184, 0.3)' : '#F5F1EB',
                                                color: '#8D6E63'
                                            }}>
                                                로맨스 {savedReport.stats?.romanceScore || 0}%
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                background: savedReport.stats?.comfortScore > 20 ? 'rgba(255, 235, 59, 0.3)' : '#F5F1EB',
                                                color: '#8D6E63'
                                            }}>
                                                위로/안정 {savedReport.stats?.comfortScore || 0}%
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                background: savedReport.stats?.conflictScore > 20 ? 'rgba(255, 150, 150, 0.3)' : '#F5F1EB',
                                                color: '#8D6E63'
                                            }}>
                                                갈등/긴장 {savedReport.stats?.conflictScore || 0}%
                                            </span>
                                        </div>
                                        {savedReport.episodeSummary && (
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: '#6B4E3D',
                                                marginTop: '12px',
                                                lineHeight: '1.5',
                                                opacity: 0.9
                                            }}>
                                                {savedReport.episodeSummary}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

