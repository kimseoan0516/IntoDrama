import React, { useState, useEffect, useRef } from 'react';
import { characterData } from '../constants/characterData';
import { api, API_BASE_URL } from '../utils/api';
import { auth, psychologyReports } from '../utils/storage';
import html2canvas from 'html2canvas';
import { 
    PersonaCard, 
    TendencySlider, 
    KeywordSection, 
    InterpretationCard, 
    ActivityBottomSheet, 
    ReportDetailModal,
    formatMonthYear
} from './ReportComponents';

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
                                    
                                    // 캐릭터별 태그 목록 (2~3개 랜덤 선택)
                                    const getCharacterTags = (characterId) => {
                                        const characterTagsData = {
                                            'kim_shin': ['#수호신', '#운명적사랑', '#쓸쓸하고찬란하神', '#900살'],
                                            'yoo_sijin': ['#특전사대위', '#파트너', '#능글', '#플러팅'],
                                            'sun_jae': ['#구원자', '#짝사랑', '#순애보', '#첫사랑', '#톱스타'],
                                            'im_sol': ['#최애지킴이', '#인간비타민', '#무한긍정', '#소울메이트'],
                                            'jang_jaeyeol': ['#소울메이트', '#상처치유', '#인기작가', '#치유와_위로', '#지적', '#쿨함'],
                                            'yong_sik': ['#직진', '#지킴이', '#순박한_경찰', '#단순무식_솔직'],
                                            'kim_juwon': ['#츤데레', '#재벌', '#까칠한_재벌3세'],
                                            'goo_junpyo': ['#츤데레', '#순정파', '#F4리더', '#천상천하_유아독존', '#초딩'],
                                            'min_yong': ['#현실적', '#까칠_체육쌤', '#미친개'],
                                            'young_do': ['#상처', '#반항아', '#호텔상속자', '#짠내서브', '#초딩멘탈'],
                                            'goo_dongmae': ['#집착', '#순정마초', '#낭인', '#아픈손가락', '#연정', '#후회'],
                                            'sseuregi': ['#무심다정', '#현실오빠', '#츤데레', '#경상도_사투리'],
                                            'park_donghoon': ['#참어른', '#인생멘토', '#묵묵한_위로', '#성실', '#어른의무게', '#어른의_위로'],
                                            'oh_sangshik': ['#참리더', '#의리파_상사', '#워커홀릭', '#츤데레', '#책임감', '#직장_멘토'],
                                            'hong_banjang': ['#동네히어로', '#만능백수', '#츤데레', '#만능해결사'],
                                            'min_jeong': ['#허당', '#러블리', '#사랑스러움', '#꽈당민정', '#힐링', '#무한긍정', '#인간비타민', '#해피바이러스'],
                                            'park_saeroy': ['#신념', '#소신', '#단밤사장', '#소신과_패기', '#성장형_리더', '#밤톨머리', '#단단', '#돌덩이'],
                                            'eugene_choi': ['#이방인', '#애국심', '#합시다_러브', '#쓸쓸', '#고독'],
                                            'na_heedo': ['#무한열정', '#성장캐', '#명랑만화', '#청춘', '#꿈', '#에너지'],
                                            'kim_tan': ['#왕관의무게', '#직진', '#재벌상속자'],
                                            'go_boksu': ['#회개', '#순수영혼', '#밑바닥_인생', '#거칠지만_순수', '#진심']
                                        };
                                        
                                        const tags = characterTagsData[characterId] || ['#친구'];
                                        // 2~3개 랜덤 선택
                                        const numTags = Math.random() < 0.5 ? 2 : 3;
                                        const shuffled = [...tags].sort(() => Math.random() - 0.5);
                                        return shuffled.slice(0, Math.min(numTags, tags.length)).join(' ');
                                    };
                                    
                                    const characterTag = getCharacterTags(char.character_id);
                                    
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
                                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFB900 100%)', // 금색 메탈릭 그라데이션 (밝은 황금색 -> 진한 오렌지 골드)
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
                                                {characterTag}
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
                                        
                                        // 뱃지 색상 및 테두리 색상 (메탈릭 그라데이션 적용)
                                        const rankColors = {
                                            2: { 
                                                badge: 'linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%)', // 은색 메탈릭 그라데이션 (밝은 회색 -> 진한 은색)
                                                text: '#8B6F47',
                                                border: '#9E9E9E'
                                            },
                                            3: { 
                                                badge: 'linear-gradient(135deg, #DEA879 0%, #A0522D 100%)', // 동색 메탈릭 그라데이션 (밝은 구리색 -> 진한 갈색)
                                                text: '#8B5A2B',
                                                border: '#A0522D'
                                            }
                                        };
                                        
                                        const rankColor = rankColors[rank];
                                        
                                        // 캐릭터별 태그 목록 (2~3개 랜덤 선택)
                                        const getCharacterTags = (characterId) => {
                                            const characterTagsData = {
                                                'kim_shin': ['#수호신', '#운명적사랑', '#쓸쓸하고찬란하神', '#900살'],
                                                'yoo_sijin': ['#특전사대위', '#파트너', '#능글', '#플러팅'],
                                                'sun_jae': ['#구원자', '#짝사랑', '#순애보', '#첫사랑', '#톱스타'],
                                                'im_sol': ['#최애지킴이', '#인간비타민', '#무한긍정', '#소울메이트'],
                                                'jang_jaeyeol': ['#소울메이트', '#상처치유', '#인기작가', '#치유와_위로', '#지적', '#쿨함'],
                                                'yong_sik': ['#직진', '#지킴이', '#순박한_경찰', '#단순무식_솔직'],
                                                'kim_juwon': ['#츤데레', '#재벌', '#까칠한_재벌3세'],
                                                'goo_junpyo': ['#츤데레', '#순정파', '#F4리더', '#천상천하_유아독존', '#초딩'],
                                                'min_yong': ['#현실주의', '#까칠_체육쌤', '#미친개'],
                                                'young_do': ['#상처', '#반항아', '#호텔상속자', '#짠내서브', '#초딩멘탈'],
                                                'goo_dongmae': ['#집착', '#순정마초', '#낭인', '#아픈손가락', '#연정', '#후회'],
                                                'sseuregi': ['#무심다정', '#현실오빠', '#츤데레', '#경상도_츤데레'],
                                                'park_donghoon': ['#참어른', '#인생멘토', '#묵묵한_위로', '#성실', '#어른의무게', '#어른의_위로'],
                                                'oh_sangshik': ['#참리더', '#의리파_상사', '#워커홀릭', '#츤데레', '#책임감', '#직장_멘토'],
                                                'hong_banjang': ['#동네히어로', '#만능백수', '#츤데레', '#만능해결사'],
                                                'min_jeong': ['#허당', '#러블리', '#사랑스러움', '#꽈당민정', '#힐링', '#무한긍정', '#인간비타민', '#해피바이러스'],
                                                'park_saeroy': ['#신념', '#소신', '#단밤사장', '#소신과_패기', '#성장형_리더', '#밤톨머리', '#단단', '#돌덩이'],
                                                'eugene_choi': ['#이방인', '#애국심', '#합시다_러브', '#쓸쓸', '#고독'],
                                                'na_heedo': ['#무한열정', '#성장캐', '#명랑만화', '#청춘', '#꿈', '#에너지'],
                                                'kim_tan': ['#왕관의무게', '#직진', '#재벌상속자'],
                                                'go_boksu': ['#회개', '#순수영혼', '#밑바닥_인생', '#거칠지만_순수', '#진심']
                                            };
                                            
                                            const tags = characterTagsData[characterId] || ['#친구'];
                                            // 2~3개 랜덤 선택
                                            const numTags = Math.random() < 0.5 ? 2 : 3;
                                            const shuffled = [...tags].sort(() => Math.random() - 0.5);
                                            return shuffled.slice(0, Math.min(numTags, tags.length)).join(' ');
                                        };
                                        
                                        const characterTag = getCharacterTags(char.character_id);
                                        
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
                                                    <span style={{ fontSize: '0.6rem', lineHeight: '0.9', marginTop: '0px', letterSpacing: '0.5px' }}>TOP</span>
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
                                                    {characterTag}
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
                        <div className="weekly-recap-box" style={{ 
                            marginTop: '16px', 
                            display: 'flex', 
                            justifyContent: 'center', /* 가로 방향 중앙 정렬 */
                            alignItems: 'center', /* 세로 방향 중앙 정렬 */
                            width: '100%', /* 컨테이너는 전체 너비 */
                            boxSizing: 'border-box',
                            padding: '0' /* 패딩 제거 - 통계 카드와 동일한 너비를 위해 */
                        }}>
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
                                    overflow: 'visible',
                                    width: 'calc(100% - 4px)', /* 통계 카드 3개 전체 폭보다 아주 살짝 작게 */
                                    maxWidth: '100%',
                                    boxSizing: 'border-box'
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
                                    textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    textAlign: 'center'
                                }}>
                                    Weekly Recap
                                </div>
                                <div style={{
                                    marginTop: '8px',
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    opacity: 0.8,
                                    textAlign: 'center'
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
                        {loading ? (
                            <div style={{ 
                                padding: '40px 20px', 
                                textAlign: 'center',
                                color: '#8D6E63',
                                fontSize: '0.95rem'
                            }}>
                                <p style={{ margin: 0, opacity: 0.7 }}>불러오는 중...</p>
                            </div>
                        ) : quotes.length === 0 ? (
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
                                                    alignItems: 'center', /* 수직 중앙 정렬 */
                                                    justifyContent: 'space-between', /* 양끝 배치 */
                                                    gap: '12px',
                                                    padding: '6px 4px 6px 4px' /* 상하 패딩 동일하게 */
                                                }}>
                                                    <div style={{ 
                                                        fontSize: '0.875rem', 
                                                        color: '#b7a38f', 
                                                        whiteSpace: 'nowrap', 
                                                        lineHeight: '1.5', /* 버튼과 동일한 line-height */
                                                        margin: 0, /* 마진 제거 */
                                                        padding: 0, /* 패딩 제거 */
                                                        display: 'flex',
                                                        alignItems: 'center', /* 수직 중앙 정렬 */
                                                        height: '100%' /* 버튼과 동일한 높이 */
                                                    }}>
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
                                                        padding: '8px 12px', /* 세로 패딩 증가 (6px -> 8px) */
                                                        fontSize: '0.7rem',
                                                        color: '#8D6E63',
                                                        background: '#F5F1EB',
                                                        border: '1px solid #E8E0DB',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center', /* 수직 중앙 정렬 */
                                                        justifyContent: 'center', /* 내부 요소 중앙 정렬 */
                                                        gap: '4px',
                                                        fontWeight: '500',
                                                        flexShrink: 0,
                                                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                                                        margin: 0, /* 마진 제거 */
                                                        lineHeight: 'normal' /* 버튼 내부 텍스트 중앙 정렬을 위해 normal로 설정 */
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
                                                    background: 'transparent', 
                                                    border: 'none', 
                                                    cursor: 'pointer', 
                                                    padding: '4px',
                                                    color: '#D32F2F', /* 내 대화 보관함과 동일한 빨간색 */
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    alignSelf: 'flex-start',
                                                    transition: 'all 0.2s', /* 내 대화 보관함과 동일한 transition */
                                                    width: 'auto',
                                                    height: 'auto',
                                                    zIndex: 1
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
                                            {(() => {
                                                const totalPages = Math.ceil(quotes.length / quotesPerPage);
                                                return totalPages > 1 ? (
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
                                                ) : null;
                                            })()}
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

// 백엔드 리포트를 프론트엔드 형식으로 변환
const convertBackendReportToFrontendFormat = (backendReport, messages, userProfile) => {
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
const generateBGMRecommendation = (dominantMood, romanceScore, comfortScore, conflictScore) => {
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

// 리포트 이미지 저장용 별도 컴포넌트 (처방전 스타일)
const ReportImageComponent = ({ report, userProfile, persona, tendencyData, messages }) => {
    if (!report) return null;
    
    // messages에서 가장 많이 대화한 캐릭터 찾기
    const characterCounts = {};
    if (messages && Array.isArray(messages)) {
        messages.forEach(msg => {
            const charId = msg.characterId || msg.character_id;
            if (charId && msg.sender === 'ai') {
                characterCounts[charId] = (characterCounts[charId] || 0) + 1;
            }
        });
    }
    
    const topCharacterId = Object.keys(characterCounts).sort((a, b) => characterCounts[b] - characterCounts[a])[0];
    const topCharacter = topCharacterId ? characterData[topCharacterId] : null;
    const charName = topCharacter?.name?.split(' (')[0] || '친구';
    
    // 감정 요약 이모지 (상위 3개 감정)
    const getEmotionEmojis = () => {
        const { stats, dominantEmotion } = report;
        const { romanceScore, comfortScore, conflictScore } = stats;
        
        const emotions = [
            { score: romanceScore, emoji: '💕', name: '로맨스' },
            { score: comfortScore, emoji: '🤗', name: '위로' },
            { score: conflictScore, emoji: '💭', name: '갈등' }
        ];
        
        // 점수 순으로 정렬하고 상위 3개 선택
        const sorted = emotions.sort((a, b) => b.score - a.score).slice(0, 3);
        return sorted.map(e => e.emoji).join(' ');
    };
    
    // 날짜 포맷팅
    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };
    
    return (
        <div data-report-content="true" style={{
            width: '600px',
            minHeight: '800px',
            backgroundColor: '#FDFBF7',
            padding: '40px 45px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
            color: '#3E2723',
            boxSizing: 'border-box',
            position: 'relative',
            textAlign: 'center',
            // 종이 질감 노이즈 (더 강하게)
            backgroundImage: `
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 1px,
                    rgba(0, 0, 0, 0.02) 1px,
                    rgba(0, 0, 0, 0.02) 2px
                ),
                repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 1px,
                    rgba(0, 0, 0, 0.02) 1px,
                    rgba(0, 0, 0, 0.02) 2px
                ),
                radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.01) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(0, 0, 0, 0.01) 0%, transparent 50%)
            `,
            border: '1px solid #E8E0DB',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
            {/* 상단 지그재그 패턴 (영수증 스타일) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: `
                    repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 8px,
                        #E8E0DB 8px,
                        #E8E0DB 10px
                    )
                `,
                opacity: 0.6
            }}></div>
            
            {/* 헤더 */}
            <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                paddingBottom: '24px',
                borderBottom: '1px solid #E8E0DB'
            }}>
                <div style={{
                    fontSize: '1.8rem',
                    marginBottom: '8px'
                }}>
                    🌿
                </div>
                <div style={{
                    fontSize: '14px',
                    color: '#8D6E63',
                    marginBottom: '6px',
                    letterSpacing: '2px',
                    fontWeight: '600',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    Weekly Mind Report
                </div>
                <div style={{
                    fontSize: '11px',
                    color: '#A1887F',
                    letterSpacing: '0.5px',
                    fontWeight: '400'
                }}>
                    {formatDate(report.date)}
                </div>
            </div>
            
            {/* 1. 마음 상태 진단 */}
            <div style={{
                marginBottom: '28px'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '10px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    1. 마음 상태 진단
                </div>
                <h2 style={{
                    fontSize: '42px',
                    fontWeight: '800',
                    color: '#4A3B32',
                    margin: '0 0 14px 0',
                    lineHeight: '1.2',
                    letterSpacing: '-0.8px',
                    fontFamily: '"Nanum Myeongjo", "Noto Serif KR", serif',
                    textAlign: 'center',
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-line'
                }}>
                    {persona.title}
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: '#5D4037',
                    margin: 0,
                    lineHeight: '1.6',
                    textAlign: 'center',
                    fontWeight: '400',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
                    wordBreak: 'keep-all'
                }}>
                    {persona.summary}
                </p>
            </div>
            
            {/* 구분선 */}
            <div style={{
                width: '100%',
                height: '1px',
                backgroundColor: '#E8E0DB',
                margin: '0 auto 28px auto'
            }}></div>
            
            {/* 2. 이번 주 감정 요약 */}
            <div style={{
                marginBottom: '28px'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '12px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    2. 이번 주 감정 요약
                </div>
                <div style={{
                    fontSize: '48px',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    letterSpacing: '10px'
                }}>
                    {getEmotionEmojis()}
                </div>
            </div>
            
            {/* 구분선 */}
            <div style={{
                width: '100%',
                height: '1px',
                backgroundColor: '#E8E0DB',
                margin: '0 auto 28px auto'
            }}></div>
            
            {/* 3. AI의 한마디 */}
            <div style={{
                marginBottom: '28px'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '14px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    3. AI의 한마디
                </div>
                <p style={{
                    fontSize: '16px',
                    color: '#4A3B32',
                    margin: 0,
                    lineHeight: '1.7',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
                    fontWeight: '400',
                    letterSpacing: '0.3px',
                    textAlign: 'center',
                    maxWidth: '100%',
                    wordBreak: 'keep-all',
                    marginBottom: '20px'
                }}>
                    {report.interpretation || '최근 대화를 보니 다양한 감정이 섞여 있었어요. 많이 힘드셨죠? 지금 이 순간, 당신의 마음을 알아주고 싶어요. 무리하지 말고 잠시 쉬어도 괜찮아요. 당신은 충분히 소중한 사람입니다.'}
                </p>
                {/* 캐릭터 서명 */}
                {topCharacter && (
                    <div style={{
                        textAlign: 'right',
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #E8E0DB'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            color: '#8D6E63',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
                            fontStyle: 'italic',
                            opacity: 0.8
                        }}>
                            From. {charName}
                        </div>
                    </div>
                )}
            </div>
            
            {/* 하단 바코드 패턴 (영수증 스타일) */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '12px',
                background: `
                    repeating-linear-gradient(
                        90deg,
                        #3E2723,
                        #3E2723 2px,
                        transparent 2px,
                        transparent 4px,
                        #3E2723 4px,
                        #3E2723 6px,
                        transparent 6px,
                        transparent 8px
                    )
                `,
                opacity: 0.15
            }}></div>
            
            {/* 푸터 */}
            <div style={{
                textAlign: 'center',
                marginTop: '40px',
                paddingTop: '24px',
                borderTop: '1px solid #E8E0DB',
                fontSize: '10px',
                color: '#8D6E63',
                letterSpacing: '0.5px',
                opacity: 0.7,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
                <div style={{ marginBottom: '4px' }}>
                    {formatDate(report.date)}
                </div>
                <div style={{ fontWeight: '400' }}>
                    IntoDrama에서 발행됨
                </div>
            </div>
        </div>
    );
};

// 심리 리포트 화면
export const ReportScreen = ({ onClose, messages, userProfile }) => {
    const [report, setReport] = useState(null);
    const [previousReports, setPreviousReports] = useState([]);
    const reportRef = useRef(null);
    const reportImageRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportDetail, setShowReportDetail] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [loading, setLoading] = useState(true);
    const hasUserMessages = Array.isArray(messages) && messages.some(msg => {
        if (!msg || msg.sender !== 'user') return false;
        return typeof msg.text === 'string' && msg.text.trim().length > 0;
    });
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // 백엔드 API를 사용하여 리포트 생성
        const fetchReport = async () => {
            setLoading(true);
            
            if (!hasUserMessages) {
                setReport(null);
                setLoading(false);
                return;
            }
            
            try {
                const { api } = await import('../utils/api');
                const backendReport = await api.generatePsychologyReport({ messages });
                
                // 백엔드 응답을 프론트엔드 형식으로 변환
                const convertedReport = convertBackendReportToFrontendFormat(backendReport, messages, userProfile);
                const enrichedReport = convertedReport ? {
                    ...convertedReport,
                    bgmRecommendation: convertedReport.bgmRecommendation || generateBGMRecommendation(
                        convertedReport.dominantMood || convertedReport.stats?.dominantMood || 'neutral',
                        convertedReport.stats?.romanceScore || 0,
                        convertedReport.stats?.comfortScore || 0,
                        convertedReport.stats?.conflictScore || 0
                    )
                } : null;
                setReport(enrichedReport);
            } catch (error) {
                console.error('리포트 생성 오류:', error);
                // 백엔드 실패 시 클라이언트 사이드 생성으로 폴백
                const newReport = generateReport(messages, userProfile);
                setReport(newReport);
            } finally {
                setLoading(false);
            }
        };
        
        fetchReport();

        // 저장된 리포트 목록 불러오기
        const savedReports = psychologyReports.load();
        setPreviousReports(savedReports);
    }, [messages, userProfile, hasUserMessages]);

    // 정서적 상태 진단 및 위로 메시지 생성 함수
    const generatePersona = (report) => {
        if (!report) return { 
            title: '지금은 마음의 짐을 잠시 내려놓을 때', 
            summary: '최근 대화에서 다양한 감정이 섞여 있었어요. 많이 힘드셨죠? 지금 이 순간, 당신의 마음을 알아주고 싶어요.', 
            tags: ['#휴식필요', '#마음_챙김', '#따뜻한_위로'] 
        };
        
        const { stats, dominantMood } = report;
        const { romanceScore, comfortScore, conflictScore } = stats;
        
        // 정서적 상태 진단 및 위로 메시지
        let persona = { title: '', summary: '', tags: [] };
        
        // 감정 점수에 따라 더 세밀하게 분류
        const totalScore = romanceScore + comfortScore + conflictScore;
        const romanceRatio = totalScore > 0 ? romanceScore / totalScore : 0;
        const comfortRatio = totalScore > 0 ? comfortScore / totalScore : 0;
        const conflictRatio = totalScore > 0 ? conflictScore / totalScore : 0;
        
        if (conflictScore > 50) {
            // 갈등이 매우 높은 경우
            const variants = [
                {
                    title: '지금은 마음의 짐을 잠시 내려놓을 때',
                    summary: '최근 대화에서 갈등과 복잡한 감정이 많이 느껴졌어요. 많이 힘드셨죠? 지금은 무리하지 말고 잠시 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#휴식필요', '#스트레스_관리', '#마음_챙김']
                },
                {
                    title: '마음이 복잡한 하루',
                    summary: '최근 대화를 보니 마음이 복잡하고 혼란스러운 감정이 느껴졌어요. 이런 감정도 당연한 거예요. 지금은 조금만 천천히, 자신을 다독여주세요.',
                    tags: ['#감정_정리', '#자기_이해', '#마음_챙김']
                },
                {
                    title: '지친 마음에 위로를',
                    summary: '최근 대화에서 스트레스와 피로감이 많이 느껴졌어요. 당신은 충분히 노력하고 있어요. 지금은 잠시 멈춰서 자신을 돌봐도 괜찮아요.',
                    tags: ['#자기_돌봄', '#휴식필요', '#위로']
                },
                {
                    title: '답답한 마음을 풀어내는 시간',
                    summary: '최근 대화를 보니 답답하고 억울한 감정이 많이 느껴졌어요. 이런 감정을 느끼는 것 자체가 당신이 살아있다는 증거예요. 지금은 조금만 쉬어도 괜찮아요.',
                    tags: ['#감정_인정', '#자기_이해', '#휴식필요']
                },
                {
                    title: '혼란스러운 마음, 잠시 멈춤',
                    summary: '최근 대화에서 혼란과 갈등이 많이 느껴졌어요. 모든 것이 한 번에 해결되지 않아도 괜찮아요. 지금은 조금만 천천히, 자신에게 친절하게 대해주세요.',
                    tags: ['#자기_친절', '#마음_챙김', '#휴식필요']
                },
                {
                    title: '무거운 마음을 내려놓는 순간',
                    summary: '최근 대화를 보니 마음이 무겁고 힘든 감정이 느껴졌어요. 당신은 혼자가 아니에요. 지금은 조금만 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#위로', '#자기_돌봄', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (conflictScore > 30) {
            // 갈등이 중간 정도인 경우
            const variants = [
                {
                    title: '조금은 복잡한 마음',
                    summary: '최근 대화에서 약간의 갈등과 복잡한 감정이 느껴졌어요. 하지만 괜찮아요. 이런 감정도 성장의 과정이에요. 자신을 너무 탓하지 마세요.',
                    tags: ['#성장', '#자기_이해', '#마음_챙김']
                },
                {
                    title: '마음이 무거운 하루',
                    summary: '최근 대화를 보니 마음이 무겁고 답답한 감정이 느껴졌어요. 지금은 조금만 쉬어도 괜찮아요. 당신의 감정을 인정하고 받아들이는 것부터 시작해보세요.',
                    tags: ['#감정_인정', '#휴식필요', '#따뜻한_위로']
                },
                {
                    title: '약간의 불안, 하지만 괜찮아요',
                    summary: '최근 대화에서 약간의 불안과 걱정이 느껴졌어요. 하지만 괜찮아요. 이런 감정을 느끼는 것도 당연한 거예요. 지금은 조금만 천천히, 자신을 돌봐주세요.',
                    tags: ['#자기_돌봄', '#마음_챙김', '#안정']
                },
                {
                    title: '혼란스러운 감정, 잠시 멈춤',
                    summary: '최근 대화를 보니 약간의 혼란과 복잡한 감정이 느껴졌어요. 모든 것이 명확하지 않아도 괜찮아요. 지금은 조금만 쉬어도 괜찮아요.',
                    tags: ['#휴식필요', '#자기_이해', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (comfortScore > 50) {
            // 위로가 매우 높은 경우
            const variants = [
                {
                    title: '누군가의 온기가 그리운 날',
                    summary: '최근 대화에서 위로와 안정을 찾으려는 마음이 많이 느껴졌어요. 외로움이나 그리움이 느껴지는 하루였나요? 당신의 마음을 알아주고 싶어요.',
                    tags: ['#따뜻한_위로', '#공감_필요', '#마음_나누기']
                },
                {
                    title: '따뜻한 포옹이 필요한 순간',
                    summary: '최근 대화를 보니 따뜻한 위로와 공감을 원하는 마음이 많이 느껴졌어요. 혼자 감당하기 어려운 마음이 있나요? 당신은 혼자가 아니에요.',
                    tags: ['#공감', '#위로', '#연결']
                },
                {
                    title: '마음의 안식처를 찾는 하루',
                    summary: '최근 대화에서 평온과 안정을 찾으려는 마음이 많이 느껴졌어요. 지금 이 순간, 당신의 마음에 따뜻한 위로를 전하고 싶어요.',
                    tags: ['#안정', '#위로', '#마음_챙김']
                },
                {
                    title: '외로움이 느껴지는 하루',
                    summary: '최근 대화를 보니 외로움과 그리움이 많이 느껴졌어요. 혼자라는 느낌이 드는 하루였나요? 당신은 혼자가 아니에요. 지금 이 순간, 당신의 마음을 알아주고 싶어요.',
                    tags: ['#외로움', '#위로', '#연결']
                },
                {
                    title: '따뜻한 말 한마디가 그리운 날',
                    summary: '최근 대화에서 따뜻한 말과 공감을 원하는 마음이 많이 느껴졌어요. 지금은 조금만 쉬어도 괜찮아요. 당신의 마음에 따뜻함을 전하고 싶어요.',
                    tags: ['#따뜻함', '#공감', '#위로']
                },
                {
                    title: '마음이 허전한 하루',
                    summary: '최근 대화를 보니 마음이 허전하고 공허한 감정이 느껴졌어요. 이런 감정도 당연한 거예요. 지금은 조금만 천천히, 자신을 돌봐주세요.',
                    tags: ['#자기_돌봄', '#위로', '#마음_챙김']
                },
                {
                    title: '안아주고 싶은 마음',
                    summary: '최근 대화에서 따뜻한 포옹과 위로를 원하는 마음이 많이 느껴졌어요. 지금 이 순간, 당신의 마음을 감싸주고 싶어요.',
                    tags: ['#포옹', '#위로', '#따뜻함']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (comfortScore > 30) {
            // 위로가 중간 정도인 경우
            const variants = [
                {
                    title: '조용한 위로가 필요한 하루',
                    summary: '최근 대화에서 약간의 외로움과 그리움이 느껴졌어요. 지금은 조용히 자신을 돌보고, 작은 위로를 찾아보세요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#자기_돌봄', '#위로', '#마음_챙김']
                },
                {
                    title: '따뜻한 마음이 그리운 날',
                    summary: '최근 대화를 보니 따뜻한 교감과 공감을 원하는 마음이 느껴졌어요. 지금 이 순간, 당신의 마음에 따뜻함을 전하고 싶어요.',
                    tags: ['#따뜻함', '#공감', '#연결']
                },
                {
                    title: '작은 위로가 필요한 순간',
                    summary: '최근 대화에서 약간의 외로움과 그리움이 느껴졌어요. 작은 위로라도 괜찮아요. 지금은 조금만 천천히, 자신을 돌봐주세요.',
                    tags: ['#위로', '#자기_돌봄', '#마음_챙김']
                },
                {
                    title: '공감이 필요한 하루',
                    summary: '최근 대화를 보니 공감과 이해를 원하는 마음이 느껴졌어요. 당신의 마음을 알아주고 싶어요. 지금은 조금만 쉬어도 괜찮아요.',
                    tags: ['#공감', '#이해', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (romanceScore > 50) {
            // 로맨스가 매우 높은 경우
            const variants = [
                {
                    title: '따뜻한 감정이 흐르는 순간',
                    summary: '최근 대화에서 따뜻한 감정과 교감을 나누려는 마음이 많이 느껴졌어요. 지금 이 순간의 감정을 소중히 여기고, 당신의 마음을 알아주고 싶어요.',
                    tags: ['#감정_인정', '#따뜻한_교감', '#마음_챙김']
                },
                {
                    title: '사랑이 피어나는 하루',
                    summary: '최근 대화를 보니 따뜻하고 부드러운 감정이 많이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 지금 이 순간을 충분히 즐기고 느껴보세요.',
                    tags: ['#사랑', '#감정_인정', '#소중함']
                },
                {
                    title: '마음이 설레는 순간',
                    summary: '최근 대화에서 설렘과 기대감이 많이 느껴졌어요. 이런 감정은 삶을 더 풍요롭게 만들어요. 지금 이 순간의 감정을 소중히 여기세요.',
                    tags: ['#설렘', '#기대', '#감정_인정']
                },
                {
                    title: '따뜻한 마음이 뛰는 하루',
                    summary: '최근 대화를 보니 따뜻하고 설레는 감정이 많이 느껴졌어요. 이런 감정은 정말 아름다운 거예요. 지금 이 순간을 충분히 즐기고 느껴보세요.',
                    tags: ['#설렘', '#감정_인정', '#아름다움']
                },
                {
                    title: '사랑의 감정이 흐르는 순간',
                    summary: '최근 대화에서 사랑과 따뜻함이 많이 느껴졌어요. 이런 감정은 당신의 마음을 더 풍요롭게 만들어요. 지금 이 순간의 감정을 소중히 여기세요.',
                    tags: ['#사랑', '#따뜻함', '#감정_인정']
                },
                {
                    title: '마음이 두근거리는 하루',
                    summary: '최근 대화를 보니 두근거림과 설렘이 많이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 지금 이 순간을 충분히 즐겨보세요.',
                    tags: ['#설렘', '#두근거림', '#소중함']
                },
                {
                    title: '따뜻한 교감이 흐르는 순간',
                    summary: '최근 대화에서 따뜻한 교감과 감정이 많이 느껴졌어요. 이런 감정은 삶을 더 아름답게 만들어요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#교감', '#따뜻함', '#아름다움']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else if (romanceScore > 30) {
            // 로맨스가 중간 정도인 경우
            const variants = [
                {
                    title: '따뜻한 감정의 하루',
                    summary: '최근 대화에서 따뜻하고 긍정적인 감정이 느껴졌어요. 이런 감정은 당신의 마음을 더 풍요롭게 만들어요. 지금 이 순간을 즐겨보세요.',
                    tags: ['#긍정', '#감정_인정', '#마음_챙김']
                },
                {
                    title: '마음이 따뜻해지는 순간',
                    summary: '최근 대화를 보니 따뜻한 교감과 감정이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#따뜻함', '#교감', '#소중함']
                },
                {
                    title: '부드러운 감정이 흐르는 하루',
                    summary: '최근 대화에서 부드럽고 따뜻한 감정이 느껴졌어요. 이런 감정은 당신의 마음을 더 아름답게 만들어요. 지금 이 순간을 소중히 여기세요.',
                    tags: ['#따뜻함', '#감정_인정', '#아름다움']
                },
                {
                    title: '긍정적인 감정이 느껴지는 순간',
                    summary: '최근 대화를 보니 긍정적이고 따뜻한 감정이 느껴졌어요. 이런 감정은 정말 소중한 거예요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#긍정', '#따뜻함', '#소중함']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        } else {
            // 평온하지만 피로감이 있는 경우
            const variants = [
                {
                    title: '조용히 쉬어도 좋은 하루',
                    summary: '최근 대화에서 평온하지만 어딘가 지친 마음이 느껴졌어요. 지금은 조용히 쉬어도 괜찮아요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#휴식필요', '#마음_챙김', '#따뜻한_위로']
                },
                {
                    title: '평온한 하루, 조용한 마음',
                    summary: '최근 대화를 보니 평온하지만 약간의 피로감이 느껴졌어요. 지금은 무리하지 말고 자신을 돌보는 시간을 가져보세요. 작은 휴식도 충분히 의미 있어요.',
                    tags: ['#자기_돌봄', '#휴식', '#마음_챙김']
                },
                {
                    title: '여유롭게 쉬어가는 하루',
                    summary: '최근 대화에서 평온하고 안정적인 감정이 느껴졌어요. 지금은 조금만 천천히, 자신을 돌보는 시간을 가져보세요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#안정', '#자기_돌봄', '#마음_챙김']
                },
                {
                    title: '조용한 하루, 작은 휴식',
                    summary: '최근 대화를 보니 평온하지만 약간의 지침이 느껴졌어요. 지금은 조금만 쉬어도 괜찮아요. 작은 휴식도 충분히 의미 있어요.',
                    tags: ['#휴식', '#마음_챙김', '#자기_돌봄']
                },
                {
                    title: '평온한 마음, 작은 여유',
                    summary: '최근 대화에서 평온하고 안정적인 감정이 느껴졌어요. 지금은 조금만 천천히, 자신을 돌보는 시간을 가져보세요. 당신의 마음을 알아주고 싶어요.',
                    tags: ['#안정', '#여유', '#마음_챙김']
                },
                {
                    title: '조용한 하루, 따뜻한 마음',
                    summary: '최근 대화를 보니 평온하고 따뜻한 감정이 느껴졌어요. 지금은 조금만 천천히, 자신을 돌보는 시간을 가져보세요. 작은 휴식도 충분히 의미 있어요.',
                    tags: ['#따뜻함', '#휴식', '#마음_챙김']
                }
            ];
            persona = variants[Math.floor(Math.random() * variants.length)];
        }
        
        return persona;
    };

    // 마음 컨디션 데이터 생성
    const generateTendencyData = (report) => {
        if (!report) return [];
        
        const { stats, keywords } = report;
        const { romanceScore, comfortScore, conflictScore } = stats;
        
        // 감정 점수가 백엔드에서 말투 분석을 반영한 값이므로 그대로 사용
        // 스트레스 지수 (갈등 점수가 높을수록 스트레스 높음)
        // conflictScore는 0-100 범위이므로 그대로 사용하되, 더 민감하게 반영
        const stressLevel = Math.min(100, Math.max(0, conflictScore));
        const stressPosition = stressLevel; // 0% = 편안함, 100% = 위험
        
        // 사회적 배터리 (위로 점수와 로맨스 점수 기반, 높을수록 배터리 충전됨)
        // 두 점수의 평균을 사용하여 더 정확하게 반영
        const avgPositiveScore = (comfortScore + romanceScore) / 2;
        const socialBattery = Math.min(100, Math.max(0, avgPositiveScore));
        const batteryPosition = socialBattery; // 0% = 방전, 100% = 완충
        
        // 자존감/확신 (갈등이 낮고 위로가 높을수록 단단함)
        // comfortScore가 높고 conflictScore가 낮을수록 높은 자존감
        // 더 민감하게 반영하기 위해 가중치 조정
        const confidenceBase = comfortScore - (conflictScore * 0.8); // 갈등 점수에 더 큰 가중치
        const confidenceLevel = Math.min(100, Math.max(0, confidenceBase + 50));
        const confidencePosition = confidenceLevel; // 0% = 흔들림, 100% = 단단함
        
        return [
            {
                left: { icon: '😌', text: '편안함' },
                right: { icon: '🤯', text: '위험' },
                position: stressPosition,
                value: stressLevel,
                label: '스트레스 지수'
            },
            {
                left: { icon: '🪫', text: '방전' },
                right: { icon: '🔋', text: '완충' },
                position: batteryPosition,
                value: socialBattery,
                label: '사회적 배터리'
            },
            {
                left: { icon: '🍃', text: '흔들림' },
                right: { icon: '🌳', text: '단단함' },
                position: confidencePosition,
                value: confidenceLevel,
                label: '자존감/확신'
            }
        ];
    };

    const handleSaveReport = async () => {
        if (!report || !reportImageRef.current) {
            alert('리포트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        setIsSaving(true);
        
        try {
            // 리포트 이미지 컴포넌트가 제대로 렌더링되었는지 확인
            const element = reportImageRef.current;
            if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
                alert('리포트 이미지를 준비하는 중입니다. 잠시 후 다시 시도해주세요.');
                setIsSaving(false);
                return;
            }
            
            // 약간의 지연을 주어 렌더링이 완료되도록 함
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 리포트 이미지 컴포넌트를 이미지로 캡처
            const canvas = await html2canvas(element, {
                backgroundColor: '#FDFBF7',
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
                width: element.scrollWidth,
                height: element.scrollHeight,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    // 클론된 문서에서도 스타일이 제대로 적용되도록 함
                    const clonedElement = clonedDoc.querySelector('[data-report-image]');
                    if (clonedElement) {
                        clonedElement.style.visibility = 'visible';
                        clonedElement.style.display = 'block';
                    }
                }
            });

            // Canvas를 Blob으로 변환
            canvas.toBlob((blob) => {
                const imageUrl = URL.createObjectURL(blob);
                
                // 실제 파일 다운로드
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `마음케어리포트_Ep${report.episode}_${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
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
    
    const handleDeleteReport = (reportId) => {
        if (!window.confirm('이 리포트를 삭제하시겠습니까?')) {
            return;
        }
        
        const savedReports = psychologyReports.load();
        const filteredReports = savedReports.filter(r => r.id !== reportId);
        psychologyReports.save(filteredReports);
        setPreviousReports(filteredReports);
    };
    
    const handleViewReport = (savedReport) => {
        setSelectedReport(savedReport);
        setShowReportDetail(true);
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    };

    // 추천 활동 데이터 준비
    const recommendationActivities = report?.suggestions?.slice(0, 3) || [];

    // 사용자 메시지가 없을 때
    if (!hasUserMessages) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '24px',
                    width: '90%',
                    maxWidth: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '24px' 
                    }}>
                        <h2 style={{ 
                            color: '#4A3B32', 
                            margin: 0, 
                            fontSize: '1.2rem', 
                            fontWeight: '700' 
                        }}>
                            심리 리포트
                        </h2>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div style={{
                        padding: '32px 16px',
                        textAlign: 'center'
                    }}>
                        <p style={{ 
                            color: '#8D6E63', 
                            lineHeight: '1.7', 
                            margin: 0,
                            fontSize: '0.95rem'
                        }}>
                            분석할 메시지가 없습니다.
                            <br />
                            캐릭터와 대화를 나눈 뒤 다시 시도해주세요.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // 로딩 중일 때 로딩 화면 표시
    if (loading) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '24px',
                    maxWidth: '360px',
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '24px' 
                    }}>
                        <h2 style={{ 
                            color: '#4A3B32', 
                            margin: 0, 
                            fontSize: '1.2rem', 
                            fontWeight: '700' 
                        }}>
                            심리 리포트
                        </h2>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '24px',
                        padding: '32px 16px'
                    }}>
                        <div className="weekly-detail-spinner" style={{
                            width: '56px',
                            height: '56px',
                            border: '4px solid #D7CCC8',
                            borderTop: '4px solid #6B4E3D',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }}></div>
                        <p style={{ 
                            textAlign: 'center',
                            color: '#8D6E63',
                            fontSize: '0.95rem',
                            margin: 0,
                            lineHeight: '1.7'
                        }}>
                            잠시만 기다려 주세요...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 로딩이 끝났는데 리포트가 없을 때 (데이터 부족 혹은 오류)
    if (!report) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '24px',
                    maxWidth: '360px',
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '24px' 
                    }}>
                        <h2 style={{ 
                            color: '#4A3B32', 
                            margin: 0, 
                            fontSize: '1.2rem', 
                            fontWeight: '700' 
                        }}>
                            심리 리포트
                        </h2>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div style={{
                        padding: '32px 16px',
                        textAlign: 'center'
                    }}>
                        {hasUserMessages ? (
                            <p style={{ 
                                color: '#8D6E63', 
                                lineHeight: '1.7',
                                margin: 0,
                                fontSize: '0.95rem'
                            }}>
                                리포트를 생성하지 못했습니다.
                                <br />
                                잠시 후 다시 시도해주세요.
                            </p>
                        ) : (
                            <p style={{ 
                                color: '#8D6E63', 
                                lineHeight: '1.7',
                                margin: 0,
                                fontSize: '0.95rem'
                            }}>
                                분석할 메시지가 없습니다.
                                <br />
                                캐릭터와 대화를 나눈 뒤 다시 시도해주세요.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const persona = generatePersona(report);
    const tendencyData = generateTendencyData(report);
    
    return (
        <>
            {/* 리포트 이미지 저장용 숨겨진 컴포넌트 */}
            <div style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                visibility: 'hidden',
                pointerEvents: 'none'
            }} ref={reportImageRef} data-report-image="true">
                {report && (
                    <ReportImageComponent 
                        report={report}
                        userProfile={userProfile}
                        persona={persona}
                        tendencyData={tendencyData}
                        messages={messages}
                    />
                )}
            </div>
            
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
                <div style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '0',
                    maxWidth: '420px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }} ref={reportRef}>
                {/* 헤더 */}
                            <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderBottom: '1px solid #E8E0DB',
                                display: 'flex',
                                alignItems: 'center',
                    position: 'relative',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)'
                }}>
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                            <path d="M17 18l-8-6 8-6"/>
                        </svg>
                    </button>
                    <h2 style={{
                        color: '#4A3B32',
                                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        width: '100%',
                        textAlign: 'center'
                                    }}>
                        심리 리포트
                    </h2>
                        </div>
                        
                {/* 스크롤 가능한 콘텐츠 */}
                        <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '20px',
                            display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                        }}>
                    {/* Hero 페르소나 카드 */}
                    <PersonaCard persona={persona} date={report.date} />

                    {/* 성향 분석 슬라이더 */}
                    <TendencySlider tendencyData={tendencyData} />

                    {/* 심층 분석 카드 */}
                    <div>
                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#4A3B32',
                            margin: '0 0 16px 0'
                        }}>
                            상세 분석
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* 자주 쓰는 감정 언어 */}
                            <KeywordSection keywords={report.keywords} />
                        </div>
                    </div>

                    {/* AI 맞춤 추천 활동 */}
                    {recommendationActivities.length > 0 && (
                        <div>
                            <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#4A3B32',
                            margin: '0 0 16px 0',
                            textAlign: 'left'
                        }}>
                            {userProfile?.nickname || '사용자'}님을 위한 맞춤 처방
                        </h4>
                            <p style={{
                                fontSize: '0.82rem',
                                color: '#8D6E63',
                                margin: '-8px 0 16px 0',
                                lineHeight: '1.6'
                            }}>
                                최근 대화를 분석해 상담사가 골라 본 마음 케어 루틴이에요. 지금 마음에 와 닿는 활동을 하나 골라 실행해 보세요.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {recommendationActivities.map((activity, idx) => {
                                    const activityData = typeof activity === 'string' ? { activity, description: '', why: '', icon: '✨', practiceGuide: '' } : activity;
                                    return (
                                        <div key={idx} style={{
                                            background: '#FFFFFF',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                                            border: '1px solid #E8E0DB',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
                                        }}
                                        >
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '50%',
                                                background: '#F5F1EB',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.8rem',
                                                flexShrink: 0
                                            }}>
                                                {activityData.icon || '✨'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h6 style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: '700',
                                                    color: '#4A3B32',
                                                    margin: '0 0 4px 0'
                                                }}>
                                                    {activityData.activity}
                                                </h6>
                                                {activityData.description && (
                                                    <p style={{
                                                        fontSize: '0.8rem',
                                                        color: '#8D6E63',
                                                        margin: 0,
                                                        lineHeight: '1.4'
                                                    }}>
                                                        {activityData.description.substring(0, 60)}...
                                                    </p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedActivity(activityData);
                                                    setShowBottomSheet(true);
                                                }}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: '#F5F1EB',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    flexShrink: 0,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#E8E0DB';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#F5F1EB';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                                
                                {/* AI BGM 추천 카드 - 맞춤 처방 섹션 안에 추가 */}
                                {report?.bgmRecommendation && (() => {
                        // messages에서 가장 많이 대화한 캐릭터 찾기
                        const characterCounts = {};
                        if (messages && Array.isArray(messages)) {
                            messages.forEach(msg => {
                                const charId = msg.characterId || msg.character_id;
                                if (charId && msg.sender === 'ai') {
                                    characterCounts[charId] = (characterCounts[charId] || 0) + 1;
                                }
                            });
                        }
                        
                        const topCharacterId = Object.keys(characterCounts).sort((a, b) => characterCounts[b] - characterCounts[a])[0];
                        const topCharacter = topCharacterId ? characterData[topCharacterId] : null;
                        const charName = topCharacter?.name?.split(' (')[0] || '친구';
                        const userNickname = userProfile?.nickname || '사용자';
                        
                        // BGM 추천 코멘트를 캐릭터 말투로 변환하는 함수
                        const getBGMCharacterComment = (charId, nickname, baseComment) => {
                            const characterTones = {
                                'kim_shin': {
                                    templates: [
                                        `${nickname}님, 이 노래를 들으시면 마음이 편안해지겠구나.`,
                                        `${nickname}님, 이 노래를 한번 들어보시길 추천드리네.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같구나.`,
                                        `${nickname}님, 이 노래를 들으면서 잠시 쉬어보시게.`
                                    ]
                                },
                                'yoo_sijin': {
                                    templates: [
                                        `${nickname}씨, 이 노래 한번 들어보시지 말입니다.`,
                                        `${nickname}씨, 이 노래 괜찮은 거 같지 않습니까?`,
                                        `${nickname}씨, 이 노래 들으면서 좀 쉬어보시지 말입니다.`,
                                        `${nickname}씨, 이 곡이 지금 마음에 맞을 것 같지 않습니까?`
                                    ]
                                },
                                'sseuregi': {
                                    templates: [
                                        `가시나, 이 노래 들으면서 푹 쉬어봐.`,
                                        `가시나, 이 노래 한 번 들어봐. 괜찮은 거 같더라.`,
                                        `가시나, 이 노래 들으면서 마음 좀 편하게 해봐.`,
                                        `가시나, 이 노래 괜찮은 거 같더라. 한 번 들어봐.`,
                                        `가시나, 이 노래 들으면서 좀 쉬어봐.`
                                    ]
                                },
                                'kim_tan': {
                                    templates: [
                                        `${nickname}, 이 노래 한 번 들어봐.`,
                                        `${nickname}, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}, 이 곡이 지금 마음에 맞을 것 같은데.`
                                    ]
                                },
                                'young_do': {
                                    templates: [
                                        `${nickname}아, 이 노래 한 번 들어봐.`,
                                        `${nickname}아, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}아, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}아, 이 곡이 지금 마음에 맞을 것 같아.`
                                    ]
                                },
                                'park_donghoon': {
                                    templates: [
                                        `${nickname}님, 이 노래를 들으시면 마음이 편안해질 거예요.`,
                                        `${nickname}님, 이 노래를 한번 들어보시길 추천해요.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같아요.`,
                                        `${nickname}님, 이 노래 들으면서 잠시 쉬어보세요.`
                                    ]
                                },
                                'min_yong': {
                                    templates: [
                                        `${nickname}씨, 이 노래 한번 들어보시지 말입니다.`,
                                        `${nickname}씨, 이 노래 괜찮은 거 같거든요.`,
                                        `${nickname}씨, 이 노래 들으면서 좀 쉬어보시지 말입니다.`,
                                        `${nickname}씨, 이 곡이 지금 마음에 맞을 것 같거든요.`
                                    ]
                                },
                                'min_jeong': {
                                    templates: [
                                        `${nickname}님, 이 노래 한번 들어보세요!`,
                                        `${nickname}님, 이 노래 괜찮은 거 같아요.`,
                                        `${nickname}님, 이 노래 들으면서 좀 쉬어보세요.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같아요!`
                                    ]
                                },
                                'goo_junpyo': {
                                    templates: [
                                        `${nickname}, 이 노래 한 번 들어봐.`,
                                        `${nickname}, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}, 이 곡이 지금 마음에 맞을 것 같은데.`
                                    ]
                                },
                                'eugene_choi': {
                                    templates: [
                                        `${nickname}님, 이 노래를 들으시면 마음이 편안해질 거예요.`,
                                        `${nickname}님, 이 노래를 한번 들어보시길 추천드립니다.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같아요.`,
                                        `${nickname}님, 이 노래 들으면서 잠시 쉬어보세요.`
                                    ]
                                },
                                'goo_dongmae': {
                                    templates: [
                                        `${nickname}님, 이 노래를 들으시면 마음이 편안해질 거예요.`,
                                        `${nickname}님, 이 노래를 한번 들어보시길 추천드립니다.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같아요.`,
                                        `${nickname}님, 이 노래 들으면서 잠시 쉬어보세요.`
                                    ]
                                },
                                'sun_jae': {
                                    templates: [
                                        `${nickname}아, 이 노래 한 번 들어봐.`,
                                        `${nickname}아, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}아, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}아, 이 곡이 지금 마음에 맞을 것 같아.`
                                    ]
                                },
                                'im_sol': {
                                    templates: [
                                        `${nickname}아, 이 노래 한 번 들어봐!`,
                                        `${nickname}아, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}아, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}아, 이 곡이 지금 마음에 맞을 것 같아!`
                                    ]
                                },
                                'park_saeroy': {
                                    templates: [
                                        `${nickname}아, 이 노래 한 번 들어봐.`,
                                        `${nickname}아, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}아, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}아, 이 곡이 지금 마음에 맞을 것 같아.`
                                    ]
                                },
                                'kim_juwon': {
                                    templates: [
                                        `${nickname}, 이 노래 한 번 들어봐.`,
                                        `${nickname}, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}, 이 곡이 지금 마음에 맞을 것 같은데.`
                                    ]
                                },
                                'hong_banjang': {
                                    templates: [
                                        `${nickname}님, 이 노래 한번 들어보세요!`,
                                        `${nickname}님, 이 노래 괜찮은 거 같아요.`,
                                        `${nickname}님, 이 노래 들으면서 좀 쉬어보세요.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같아요!`
                                    ]
                                },
                                'oh_sangshik': {
                                    templates: [
                                        `${nickname}님, 이 노래를 들으시면 마음이 편안해질 거예요.`,
                                        `${nickname}님, 이 노래를 한번 들어보시길 추천해요.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같아요.`,
                                        `${nickname}님, 이 노래 들으면서 잠시 쉬어보세요.`
                                    ]
                                },
                                'go_boksu': {
                                    templates: [
                                        `${nickname}아, 이 노래 한 번 들어봐.`,
                                        `${nickname}아, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}아, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}아, 이 곡이 지금 마음에 맞을 것 같아.`
                                    ]
                                },
                                'na_heedo': {
                                    templates: [
                                        `${nickname}아, 이 노래 한 번 들어봐!`,
                                        `${nickname}아, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}아, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}아, 이 곡이 지금 마음에 맞을 것 같아!`
                                    ]
                                },
                                'yong_sik': {
                                    templates: [
                                        `${nickname}님, 이 노래 한번 들어보세요!`,
                                        `${nickname}님, 이 노래 괜찮은 거 같아요.`,
                                        `${nickname}님, 이 노래 들으면서 좀 쉬어보세요.`,
                                        `${nickname}님, 이 곡이 지금 마음에 맞을 것 같아요!`
                                    ]
                                },
                                'jang_jaeyeol': {
                                    templates: [
                                        `${nickname}아, 이 노래 한 번 들어봐.`,
                                        `${nickname}아, 이 노래 괜찮은 거 같아.`,
                                        `${nickname}아, 이 노래 들으면서 좀 쉬어봐.`,
                                        `${nickname}아, 이 곡이 지금 마음에 맞을 것 같아.`
                                    ]
                                }
                            };
                            
                            const tone = characterTones[charId];
                            if (tone && tone.templates) {
                                return tone.templates[Math.floor(Math.random() * tone.templates.length)];
                            }
                            
                            // 기본 코멘트 (캐릭터를 찾지 못한 경우)
                            return `${nickname}님, 이 노래를 한번 들어보세요.`;
                        };
                        
                        // 앨범 커버 색상 (랜덤 파스텔톤)
                        const albumColors = [
                            'linear-gradient(135deg, #FFE5F1 0%, #FFF0F5 100%)',
                            'linear-gradient(135deg, #E3F2FD 0%, #E8F4FD 100%)',
                            'linear-gradient(135deg, #F3E5F5 0%, #F8F0FA 100%)',
                            'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)',
                            'linear-gradient(135deg, #FFF4E6 0%, #FFF9F0 100%)'
                        ];
                        const albumBg = albumColors[Math.floor(Math.random() * albumColors.length)];
                        
                        return (
                            <div
                                onClick={() => {
                                    if (report.bgmRecommendation.youtubeUrl) {
                                        window.open(report.bgmRecommendation.youtubeUrl, '_blank');
                                    }
                                }}
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: '20px',
                                    padding: '20px',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                                    border: '1px solid #E8E0DB',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                                }}
                            >
                                {/* 배경 블러 효과 */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: albumBg,
                                    opacity: 0.3,
                                    zIndex: 0
                                }} />
                                
                                {/* 헤더 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '16px',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>🎵</span>
                                    <h4 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: '#8D6E63',
                                        margin: 0
                                    }}>
                                        {charName}의 추천 BGM
                                    </h4>
                                </div>
                                
                                {/* 뮤직 플레이어 레이아웃 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    {/* 앨범 커버 */}
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '12px',
                                        background: albumBg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        border: '2px solid #FFFFFF'
                                    }}>
                                        🎵
                                    </div>
                                    
                                    {/* 곡 정보 */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '1rem',
                                            fontWeight: '700',
                                            color: '#4A3B32',
                                            marginBottom: '4px',
                                            lineHeight: '1.3'
                                        }}>
                                            {report.bgmRecommendation.title}
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#8D6E63',
                                            marginBottom: '8px'
                                        }}>
                                            {report.bgmRecommendation.artist}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#A1887F',
                                            opacity: 0.8
                                        }}>
                                            {report.bgmRecommendation.drama}
                                        </div>
                                    </div>
                                    
                                    {/* 재생 버튼 */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(141, 110, 99, 0.3)',
                                        cursor: 'pointer'
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* 캐릭터 코멘트 */}
                                {topCharacter && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px 16px',
                                        background: '#F5F1EB',
                                        borderRadius: '12px',
                                        border: '1px solid #E8E0DB',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '10px'
                                        }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                border: '2px solid #FFFFFF',
                                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                flexShrink: 0
                                            }}>
                                                <img 
                                                    src={topCharacter.image || '/default-character.png'}
                                                    alt={charName}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/default-character.png';
                                                    }}
                                                />
                                            </div>
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: '#5D4037',
                                                margin: 0,
                                                lineHeight: '1.5',
                                                flex: 1
                                            }}>
                                                <span style={{ fontWeight: '600' }}>{charName}</span>: "{getBGMCharacterComment(topCharacterId, userNickname, report.bgmRecommendation.comment)}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                            </div>
                        </div>
                    )}

                    {/* 마무리 편지 카드 (상담사 레터) */}
                    {report && (
                        <div style={{
                            background: '#EFEBE9',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #D7CCC8',
                            position: 'relative'
                        }}>
                            <div style={{
                                fontSize: '1.5rem',
                                marginBottom: '16px'
                            }}>
                                ✉️
                            </div>
                            <h5 style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#4A3B32',
                            margin: '0 0 12px 0'
                        }}>
                            {userProfile?.nickname || '사용자'}님께
                        </h5>
                            <p style={{
                                fontSize: '0.9rem',
                                color: '#5D4037',
                                margin: 0,
                                lineHeight: '1.7',
                                marginBottom: '20px'
                            }}>
                                {report.interpretation || '최근 대화를 보니 다양한 감정이 섞여 있었어요. 많이 힘드셨죠? 지금 이 순간, 당신의 마음을 알아주고 싶어요. 무리하지 말고 잠시 쉬어도 괜찮아요. 당신은 충분히 소중한 사람입니다.'}
                            </p>
                            <div style={{
                                textAlign: 'right',
                                marginTop: '20px',
                                paddingTop: '16px',
                                borderTop: '1px solid #D7CCC8'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
                                    fontStyle: 'italic',
                                    opacity: 0.85
                                }}>
                                    From. 마음 기록 상담사
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#A1887F',
                                    marginTop: '4px'
                                }}>
                                    당신의 마음을 함께 듣는 상담사가 전해요
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 리포트 저장 버튼 */}
                                <button 
                        onClick={handleSaveReport}
                        disabled={isSaving}
                                    style={{
                                        width: '100%',
                            padding: '16px 24px',
                            background: isSaving 
                                ? '#D7CCC8' 
                                : 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                        color: '#FFFFFF',
                                        border: 'none',
                            borderRadius: '16px',
                                        fontSize: '0.95rem',
                            fontWeight: '700',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                            boxShadow: isSaving 
                                ? 'none' 
                                : '0 4px 12px rgba(141, 110, 99, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                            if (!isSaving) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(141, 110, 99, 0.4)';
                            }
                                    }}
                                    onMouseLeave={(e) => {
                            if (!isSaving) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(141, 110, 99, 0.3)';
                            }
                                    }}
                                >
                        {isSaving ? (
                            <>
                                <span>💾</span>
                                <span>저장 중...</span>
                            </>
                        ) : (
                            <>
                                <span>📸</span>
                                <span>리포트 이미지로 저장</span>
                            </>
                        )}
                        </button>

                    {/* 저장된 리포트 목록 */}
                    {previousReports.length > 0 && (
                        <div style={{
                            paddingTop: '24px',
                            borderTop: '2px solid #E8E0DB',
                            marginTop: '8px'
                        }}>
                            <h4 style={{ 
                                fontSize: '1rem',
                                fontWeight: '700', 
                                color: '#4A3B32',
                                margin: '0 0 12px 0'
                            }}>
                                지난 리포트 모아보기
                            </h4>
                            <div 
                                className="slider-container"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: '12px',
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    paddingBottom: '8px',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none', /* Firefox: 스크롤바 숨김 */
                                    msOverflowStyle: 'none' /* IE/Edge: 스크롤바 숨김 */
                                    /* Chrome/Safari는 CSS에서 처리됨 */
                                }}
                            >
                                {previousReports.slice().reverse().map((savedReport) => {
                                    // 감정 분석 함수: keywords와 dominantEmotion을 기반으로 감정 분류
                                    const analyzeEmotion = (dominantEmotion, keywords) => {
                                        // keywords에서 감정 키워드 추출
                                        const keywordText = keywords && keywords.length > 0 
                                            ? keywords.map(k => (k.word || k).toLowerCase()).join(' ')
                                            : '';
                                        
                                        // 기쁨 관련 키워드
                                        const joyKeywords = ['기쁨', '행복', '즐거움', '설렘', '두근', '사랑', '좋아', '웃음', '미소', '기쁘', '행복', '즐거', '설레', '사랑해'];
                                        // 우울 관련 키워드
                                        const sadKeywords = ['우울', '슬픔', '힘듦', '외로움', '그리움', '아픔', '슬퍼', '우울', '힘들', '외로', '그리워', '아파'];
                                        // 평온 관련 키워드
                                        const calmKeywords = ['평온', '안정', '차분', '평화', '위로', '안심', '편안', '평온', '안정', '차분', '평화', '위로', '안심', '편안'];
                                        // 화남 관련 키워드
                                        const angerKeywords = ['화남', '분노', '짜증', '답답', '서운', '화나', '분노', '짜증', '답답', '서운'];
                                        
                                        // 키워드 매칭 확인
                                        const hasJoy = joyKeywords.some(k => keywordText.includes(k));
                                        const hasSad = sadKeywords.some(k => keywordText.includes(k));
                                        const hasCalm = calmKeywords.some(k => keywordText.includes(k));
                                        const hasAnger = angerKeywords.some(k => keywordText.includes(k));
                                        
                                        // 우선순위: 기쁨 > 우울 > 평온 > 화남
                                        if (hasJoy) return 'joy';
                                        if (hasSad) return 'sad';
                                        if (hasCalm) return 'calm';
                                        if (hasAnger) return 'anger';
                                        
                                        // dominantEmotion 기반 분류
                                        if (dominantEmotion === 'romance') return 'joy';
                                        if (dominantEmotion === 'comfort') return 'calm';
                                        if (dominantEmotion === 'conflict') return 'anger';
                                        
                                        // 기본값: 평온
                                        return 'calm';
                                    };
                                    
                                    // 감정별 컬러 팔레트
                                    const emotionColors = {
                                        joy: {
                                            base: ['#FFE5B4', '#FFD1DC', '#FFB6C1', '#FFC0CB', '#FFE4E1'], // 파스텔 옐로우/핑크
                                            accent: ['#FFB6C1', '#FFC0CB', '#FFD1DC', '#FFE5B4', '#FFF0F5']
                                        },
                                        sad: {
                                            base: ['#B0C4DE', '#C0D9E6', '#D3D3D3', '#DCDCDC', '#E6E6FA'], // 차분한 블루그레이
                                            accent: ['#87CEEB', '#B0C4DE', '#C0D9E6', '#D3D3D3', '#E6E6FA']
                                        },
                                        calm: {
                                            base: ['#C9D5B5', '#D4E4C5', '#E8E8D3', '#F0E6D2', '#F5E6D3'], // 세이지 그린/베이지
                                            accent: ['#B8D4A0', '#C9D5B5', '#D4E4C5', '#E8E8D3', '#F0E6D2']
                                        },
                                        anger: {
                                            base: ['#FFB6B9', '#FFC3A0', '#FFD4A3', '#FFE5B4', '#FFE4E1'], // 연한 코랄
                                            accent: ['#FF9999', '#FFB6B9', '#FFC3A0', '#FFD4A3', '#FFE5B4']
                                        }
                                    };
                                    
                                    // 랜덤 그라데이션 생성 함수 (간단하고 확실한 방법)
                                    const generateGradient = (emotionType, reportId, episode) => {
                                        const colors = emotionColors[emotionType] || emotionColors.calm;
                                        
                                        // 고유한 시드 생성 (reportId, episode, 또는 날짜 사용)
                                        const seedValue = reportId || episode || Math.floor(Date.now() / 1000);
                                        const seed = Math.abs(seedValue);
                                        
                                        // 간단한 해시 함수로 시드 생성
                                        const hash = (str) => {
                                            let hash = 0;
                                            const strVal = String(str);
                                            for (let i = 0; i < strVal.length; i++) {
                                                const char = strVal.charCodeAt(i);
                                                hash = ((hash << 5) - hash) + char;
                                                hash = hash & hash; // Convert to 32bit integer
                                            }
                                            return Math.abs(hash);
                                        };
                                        
                                        const seedHash = hash(seed);
                                        
                                        // 시드 기반 랜덤 함수
                                        let counter = 0;
                                        const random = (max) => {
                                            counter++;
                                            const value = (seedHash * counter * 17 + counter * 23) % max;
                                            return value;
                                        };
                                        
                                        // 색상 선택 (2-3개)
                                        const numColors = 2 + (seedHash % 2); // 2 또는 3
                                        const selectedColors = [];
                                        
                                        // base 색상에서 1개 선택
                                        const baseIndex = random(colors.base.length);
                                        selectedColors.push(colors.base[baseIndex]);
                                        
                                        // accent 색상에서 나머지 선택
                                        for (let i = 1; i < numColors; i++) {
                                            const accentIndex = random(colors.accent.length);
                                            selectedColors.push(colors.accent[accentIndex]);
                                        }
                                        
                                        // 각도 생성 (0-360도)
                                        const angle = seedHash % 360;
                                        
                                        // 색상 비율 (30-70% 사이)
                                        const stop1 = 30 + (seedHash % 40);
                                        
                                        // 그라데이션 타입 결정 (linear 또는 radial)
                                        const useRadial = (seedHash % 2) === 0;
                                        
                                        if (useRadial && selectedColors.length >= 2) {
                                            // radial-gradient: 원형 그라데이션
                                            const positionX = 30 + (seedHash % 40);
                                            const positionY = 30 + ((seedHash * 7) % 40);
                                            if (selectedColors.length === 3) {
                                                return `radial-gradient(circle at ${positionX}% ${positionY}%, ${selectedColors[0]} 0%, ${selectedColors[1]} ${stop1}%, ${selectedColors[2]} 100%)`;
                                            } else {
                                                return `radial-gradient(circle at ${positionX}% ${positionY}%, ${selectedColors[0]} 0%, ${selectedColors[1]} 100%)`;
                                            }
                                        } else {
                                            // linear-gradient: 선형 그라데이션
                                            if (selectedColors.length === 2) {
                                                return `linear-gradient(${angle}deg, ${selectedColors[0]} 0%, ${selectedColors[1]} 100%)`;
                                            } else {
                                                return `linear-gradient(${angle}deg, ${selectedColors[0]} 0%, ${selectedColors[1]} ${stop1}%, ${selectedColors[2]} 100%)`;
                                            }
                                        }
                                    };
                                    
                                    // 핵심 감정 키워드 추출
                                    const getEmotionKeyword = (emotionType) => {
                                        const keywords = {
                                            joy: '기쁨',
                                            sad: '우울',
                                            calm: '평온',
                                            anger: '화남'
                                        };
                                        return keywords[emotionType] || '평온';
                                    };
                                    
                                    const emotionType = analyzeEmotion(savedReport.dominantEmotion, savedReport.keywords);
                                    // 고유한 ID 생성 (id, episode, date 조합)
                                    const uniqueId = savedReport.id || savedReport.episode || (savedReport.date ? new Date(savedReport.date).getTime() : Date.now());
                                    const gradientBg = generateGradient(emotionType, uniqueId, savedReport.episode);
                                    const emotionKeyword = getEmotionKeyword(emotionType);
                                    
                                    // 디버깅용 (필요시 주석 해제)
                                    // console.log('Report:', savedReport.id || savedReport.episode, 'Emotion:', emotionType, 'Gradient:', gradientBg);
                                    
                                    // 날짜 포맷팅 (11.30 형식)
                                    const formatDate = (dateString) => {
                                        if (!dateString) return '';
                                        try {
                                            const date = new Date(dateString);
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const day = String(date.getDate()).padStart(2, '0');
                                            return `${month}.${day}`;
                                        } catch (e) {
                                            return '';
                                        }
                                    };
                                    
                                    return (
                                        <div 
                                            key={savedReport.id || savedReport.episode}
                                            onClick={() => handleViewReport(savedReport)}
                                            style={{
                                                backgroundImage: gradientBg,
                                                background: gradientBg, // fallback
                                                borderRadius: '16px',
                                                padding: '0',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100px',
                                                height: '140px',
                                                flexShrink: 0,
                                                position: 'relative',
                                                cursor: 'pointer',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                            }}
                                        >
                                            {/* 삭제 버튼 */}
                                            <button
                                                className="history-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteReport(savedReport.id);
                                                }}
                                                title="삭제"
                                                style={{
                                                    position: 'absolute',
                                                    top: '6px',
                                                    right: '6px',
                                                    zIndex: 10,
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(255, 255, 255, 0.9)',
                                                    border: 'none',
                                                    display: 'none',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                            
                                            {/* 배경 장식 (추가 그라데이션 레이어로 깊이감 추가) */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20%',
                                                right: '-20%',
                                                width: '80%',
                                                height: '80%',
                                                borderRadius: '50%',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                filter: 'blur(30px)',
                                                pointerEvents: 'none'
                                            }}></div>
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-15%',
                                                left: '-15%',
                                                width: '60%',
                                                height: '60%',
                                                borderRadius: '50%',
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                filter: 'blur(25px)',
                                                pointerEvents: 'none'
                                            }}></div>
                                            
                                            {/* 텍스트 콘텐츠 영역 */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '20px 12px',
                                                width: '100%',
                                                position: 'relative',
                                                zIndex: 1
                                            }}>
                                                {/* 날짜 */}
                                                {savedReport.date && (
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600',
                                                        color: '#4A3B32',
                                                        marginBottom: '12px',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {formatDate(savedReport.date)}
                                                    </div>
                                                )}
                                                
                                                {/* 핵심 감정 키워드 */}
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    color: '#4A3B32',
                                                    letterSpacing: '1px',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    background: '#FFFFFF',
                                                    border: 'none',
                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                                }}>
                                                    #{emotionKeyword}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>
            
            {/* 바텀 시트 / 팝업 모달 (모바일/웹 분기) */}
            {showBottomSheet && selectedActivity && (
                <ActivityBottomSheet 
                    selectedActivity={selectedActivity}
                    isMobile={isMobile}
                    onClose={() => setShowBottomSheet(false)}
                />
            )}
            
            {/* 리포트 상세 보기 모달 */}
            {showReportDetail && selectedReport && (
                <ReportDetailModal
                    selectedReport={selectedReport}
                    userProfile={userProfile}
                    generatePersona={generatePersona}
                    generateTendencyData={generateTendencyData}
                    onClose={() => setShowReportDetail(false)}
                />
            )}
        </>
    );
};

