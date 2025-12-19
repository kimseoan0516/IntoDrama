import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { characterData } from '../constants/characterData';
import { sanitizeCharacterText } from '../utils/text';
import { auth } from '../utils/storage';

// 캐릭터 우편함 메인 화면 (답장만 보여주는 아카이브)
export const ReplyBoxMainScreen = ({ onClose, token, onReadReply, onShowDiary }) => {
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [fadingOutId, setFadingOutId] = useState(null);
    const [hasWaitingReply, setHasWaitingReply] = useState(false); // 답장 대기 중인 편지가 있는지
    
    // 사용자 정보 가져오기
    const user = auth.getUser();
    const userNickname = user?.nickname || user?.name || '사용자';

    useEffect(() => {
        const fetchReplies = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                const data = await api.getExchangeDiaryList();
                // 답장이 있는 것만 필터링 (reply_received가 명시적으로 true인 것만)
                const allDiaries = data.diaries || [];
                const repliesOnly = allDiaries.filter(diary => 
                    diary && diary.reply_received === true
                );
                // 최신순 정렬
                repliesOnly.sort((a, b) => {
                    const dateA = new Date(a.reply_created_at || a.updated_at);
                    const dateB = new Date(b.reply_created_at || b.updated_at);
                    return dateB - dateA;
                });
                setReplies(repliesOnly);
                
                // 답장 대기 중인 편지가 있는지 확인
                const waitingForReply = allDiaries.some(diary => 
                    diary && diary.reply_received === false && diary.request_reply === true
                );
                setHasWaitingReply(waitingForReply);
            } catch (error) {
                console.error('답장 목록 불러오기 실패:', error);
                setReplies([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchReplies();
    }, [token]);
    
    // 답장 대기 중이면 주기적으로 확인 (5초마다)
    useEffect(() => {
        if (!hasWaitingReply || !token) return;
        
        const intervalId = setInterval(async () => {
            try {
                const data = await api.getExchangeDiaryList();
                const allDiaries = data.diaries || [];
                const repliesOnly = allDiaries.filter(diary => 
                    diary && diary.reply_received === true
                );
                repliesOnly.sort((a, b) => {
                    const dateA = new Date(a.reply_created_at || a.updated_at);
                    const dateB = new Date(b.reply_created_at || b.updated_at);
                    return dateB - dateA;
                });
                setReplies(repliesOnly);
                
                // 답장 대기 중인 편지가 있는지 확인
                const waitingForReply = allDiaries.some(diary => 
                    diary && diary.reply_received === false && diary.request_reply === true
                );
                setHasWaitingReply(waitingForReply);
            } catch (error) {
                console.error('답장 목록 새로고침 실패:', error);
            }
        }, 5000); // 5초마다 확인
        
        return () => {
            clearInterval(intervalId);
        };
    }, [hasWaitingReply, token]);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = () => {
            if (openMenuId) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openMenuId]);

    const handleMenuToggle = (replyId, e) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === replyId ? null : replyId);
    };

    const handleDeleteClick = (replyId, e) => {
        e.stopPropagation();
        setOpenMenuId(null);
        setConfirmDeleteId(replyId);
    };

    const handleConfirmDelete = async (replyId) => {
        setConfirmDeleteId(null);
        setFadingOutId(replyId);
        
        setTimeout(async () => {
            try {
                await api.deleteExchangeDiary(replyId);
                setReplies(prev => prev.filter(reply => reply.id !== replyId));
            } catch (error) {
                console.error('답장 삭제 실패:', error);
                alert('답장 삭제에 실패했습니다.');
                setFadingOutId(null);
            }
        }, 600); // 애니메이션 지속 시간
    };

    const handleCancelDelete = () => {
        setConfirmDeleteId(null);
    };

    const formatMailDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const today = new Date();
            const diffTime = today.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return '오늘 도착';
            if (diffDays === 1) return '어제 도착';
            if (diffDays > 1 && diffDays <= 7) return `${diffDays}일 전 도착`;
            const year = date.getFullYear();
            const month = `${date.getMonth() + 1}`.padStart(2, '0');
            const day = `${date.getDate()}`.padStart(2, '0');
            return `${year}.${month}.${day}`;
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="modal-overlay">
            {/* 답장 작성 중 로딩 화면 (소설 형식 저장할 때처럼) */}
            {hasWaitingReply && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    답장 작성 중...
                </div>
            )}
            <div 
                className="reply-box-modal"
                style={{
                    backgroundColor: '#FBF9F7',
                    borderRadius: '20px',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '85vh',
                    maxHeight: '85vh',
                    overflow: 'hidden',
                    maxWidth: '380px',
                    width: '90%',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    position: 'relative'
                }}>
                {/* 헤더 */}
                <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderBottom: '2px solid #E8E0DB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <h2 style={{
                        color: '#4A3B32',
                        margin: 0,
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>캐릭터 우편함</span>
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* 일기 목록 */}
                <div 
                    className="reply-box-list"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px',
                        background: '#FBF9F7'
                    }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '60px 20px',
                            color: '#8D6E63'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid #D7CCC8',
                                borderTop: '3px solid #8D6E63',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                marginBottom: '16px'
                            }}></div>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>편지를 불러오는 중...</p>
                        </div>
                    ) : replies.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '80px 20px',
                            textAlign: 'center',
                            minHeight: '400px'
                        }}>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="#A1887F" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                width="80" 
                                height="80"
                                style={{ marginBottom: '24px', opacity: 0.6 }}
                            >
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '600', color: '#5D4037' }}>
                                아직 받은 편지가 없어요
                            </p>
                            <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#8D6E63', lineHeight: '1.6' }}>
                                일기장에서 일기를 작성하면<br />캐릭터가 답장을 보내드려요
                            </p>
                            {onShowDiary && (
                                <button
                                    onClick={onShowDiary}
                                    style={{
                                        padding: '14px 28px',
                                        background: 'linear-gradient(135deg, #8D6E63 0%, #A1887F 100%)',
                                        border: 'none',
                                        borderRadius: '16px',
                                        color: '#FFFFFF',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        boxShadow: '0 4px 16px rgba(141, 110, 99, 0.25), 0 2px 4px rgba(141, 110, 99, 0.15)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #6B4E3D 0%, #8D6E63 100%)';
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(141, 110, 99, 0.35), 0 4px 8px rgba(141, 110, 99, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #8D6E63 0%, #A1887F 100%)';
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(141, 110, 99, 0.25), 0 2px 4px rgba(141, 110, 99, 0.15)';
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                                    }}
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2.5" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        width="20" 
                                        height="20"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <span style={{ letterSpacing: '0.3px' }}>일기 쓰러 가기</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div style={{
                                padding: '0 0 20px 5px',
                                marginTop: '-7px',
                                color: '#8D6E63',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textAlign: 'left'
                            }}>
                                {`${replies.length}개의 마음이 도착했습니다.`}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {replies.map((reply, index) => {
                                    const charInfo = characterData[reply.character_id];
                                    const isUnread = !reply.reply_read;
                                    const charName = charInfo?.name?.split(' (')[0] || '캐릭터';
                                    const arrivalLabel = formatMailDate(reply.reply_created_at || reply.updated_at);
                                    const previewColor = isUnread ? '#8D837F' : '#888888';
                                    const previewWeight = isUnread ? 600 : 400;
                                    const nameColor = isUnread ? '#3E2723' : '#555555';
                                    const nameWeight = isUnread ? 650 : 600;
                                    const cardBackground = isUnread ? '#FDF7EB' : '#FAFAFA';
                                    const arrivalLabelColor = isUnread ? '#B08A74' : '#888888';
                                    const recipientColor = isUnread ? '#5D4037' : '#888888';

                                    const isFadingOut = fadingOutId === reply.id;
                                    
                                    return (
                                        <div
                                            key={reply.id}
                                            onClick={() => onReadReply(reply.id)}
                                            style={{
                                                background: cardBackground,
                                                backgroundImage: `
                                                    repeating-linear-gradient(
                                                        0deg,
                                                        rgba(0, 0, 0, 0.028) 0px,
                                                        transparent 1px,
                                                        transparent 2px,
                                                        rgba(0, 0, 0, 0.024) 3px
                                                    ),
                                                    repeating-linear-gradient(
                                                        90deg,
                                                        rgba(0, 0, 0, 0.028) 0px,
                                                        transparent 1px,
                                                        transparent 2px,
                                                        rgba(0, 0, 0, 0.024) 3px
                                                    )
                                                `,
                                                backgroundSize: '3px 3px, 3px 3px',
                                                borderRadius: '18px',
                                                padding: '18px 22px',
                                                border: isUnread ? '1.5px solid rgba(200, 170, 120, 0.5)' : '1px solid #E6D7C8',
                                                boxShadow: isUnread 
                                                    ? '0 8px 28px rgba(73, 45, 19, 0.2), 0 0 0 1px rgba(200, 170, 120, 0.3), 0 0 18px rgba(200, 170, 120, 0.2)' 
                                                    : '0 8px 24px rgba(73, 45, 19, 0.15)',
                                                cursor: 'pointer',
                                                transition: isFadingOut ? 'opacity 0.6s ease, transform 0.6s ease' : 'all 0.25s ease',
                                                display: 'flex',
                                                gap: '16px',
                                                alignItems: 'flex-start',
                                                position: 'relative',
                                                opacity: isFadingOut ? 0 : 1,
                                                transform: isFadingOut ? 'scale(0.85)' : 'scale(1)',
                                                zIndex: openMenuId === reply.id ? 9999 : 1
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isFadingOut) {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = isUnread
                                                        ? '0 12px 36px rgba(73, 45, 19, 0.25), 0 0 0 1px rgba(200, 170, 120, 0.4), 0 0 22px rgba(200, 170, 120, 0.25)'
                                                        : '0 12px 32px rgba(73, 45, 19, 0.2)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isFadingOut) {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = isUnread
                                                        ? '0 8px 28px rgba(73, 45, 19, 0.2), 0 0 0 1px rgba(200, 170, 120, 0.3), 0 0 18px rgba(200, 170, 120, 0.2)'
                                                        : '0 8px 24px rgba(73, 45, 19, 0.15)';
                                                }
                                            }}
                                        >
                                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                                    <div style={{
                                                        width: '58px',
                                                        height: '58px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        border: `2px solid ${isUnread ? '#8D6E63' : '#E8E0DB'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <img
                                                            src={charInfo?.image || '/default-character.png'}
                                                            alt={charName}
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '100%', 
                                                                objectFit: 'cover',
                                                                objectPosition: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                    {isUnread && (
                                                        <span
                                                            style={{
                                                                position: 'absolute',
                                                                top: '2px',
                                                                right: '2px',
                                                                width: '11px',
                                                                height: '11px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #FFB74D 0%, #F57C00 50%, #E65100 100%)',
                                                                boxShadow: '0 0 5px rgba(255, 140, 0, 0.5), 0 0 8px rgba(255, 140, 0, 0.3), 0 2px 6px rgba(255, 100, 0, 0.5), 0 3px 10px rgba(255, 152, 0, 0.3)'
                                                            }}
                                                            aria-label="읽지 않은 편지"
                                                        ></span>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '12px',
                                                        marginBottom: '10px'
                                                    }}>
                                                        <div style={{
                                                            color: nameColor,
                                                            fontSize: '0.95rem',
                                                            fontWeight: nameWeight,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: '65%'
                                                        }}>
                                                            {charName}
                                                        </div>
                                                        <div style={{
                                                            color: arrivalLabelColor,
                                                            fontSize: '0.72rem',
                                                            fontWeight: '600',
                                                            flexShrink: 0
                                                        }}>
                                                            {arrivalLabel}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
                                                        fontWeight: 600,
                                                        color: recipientColor,
                                                        fontSize: '0.83rem',
                                                        marginBottom: '12px'
                                                    }}>
                                                        To. {userNickname}에게
                                                    </div>
                                                    <p style={{
                                                        margin: '0',
                                                        color: previewColor,
                                                        fontSize: '0.88rem',
                                                        lineHeight: '1.5',
                                                        fontWeight: previewWeight,
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {reply.preview_message || '오늘 하루도 정말 고생 많았어...'}
                                                    </p>
                                                </div>
                                                
                                                {/* 점 세 개 메뉴 버튼 */}
                                                <button
                                                    onClick={(e) => handleMenuToggle(reply.id, e)}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '8px',
                                                        right: '12px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '2px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'color 0.25s ease',
                                                        color: '#BCAAA4',
                                                        fontSize: '1rem',
                                                        fontWeight: '700',
                                                        letterSpacing: '2px',
                                                        zIndex: 10
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = '#5D4037';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = '#BCAAA4';
                                                    }}
                                                >
                                                    ···
                                                </button>
                                                
                                                {/* 드롭다운 메뉴 */}
                                                {openMenuId === reply.id && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '-33px',
                                                            right: '-10px',
                                                            background: 'linear-gradient(135deg, #FBF9F7 0%, #F5F1ED 100%)',
                                                            border: '1.5px solid #D7C4B8',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 8px 24px rgba(73, 45, 19, 0.2), 0 2px 8px rgba(141, 110, 99, 0.1)',
                                                            padding: '3px',
                                                            minWidth: '145px',
                                                            zIndex: 10000,
                                                            animation: 'dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => handleDeleteClick(reply.id, e)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '7px 12px',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                                fontSize: '0.88rem',
                                                                color: '#5D4037',
                                                                transition: 'background-color 0.3s ease',
                                                                fontWeight: '600',
                                                                borderRadius: '9px',
                                                                letterSpacing: '0.3px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'rgba(141, 110, 99, 0.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                            }}
                                                        >
                                                            <span>기억 정리하기</span>
                                                            <span style={{ fontSize: '14px', opacity: 0.7 }}>🍃</span>
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

            </div>
            
            {/* 기억 정리 확인 대화상자 */}
            {confirmDeleteId && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(74, 59, 50, 0.45)',
                        backdropFilter: 'blur(2px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        animation: 'overlayFadeIn 0.25s ease'
                    }}
                    onClick={handleCancelDelete}
                >
                    <div
                        style={{
                            background: 'linear-gradient(180deg, #FFFBF5 0%, #FBF9F7 100%)',
                            backgroundImage: `
                                linear-gradient(180deg, #FFFBF5 0%, #FBF9F7 100%),
                                repeating-linear-gradient(
                                    0deg,
                                    rgba(0, 0, 0, 0.015) 0px,
                                    transparent 1px,
                                    transparent 2px,
                                    rgba(0, 0, 0, 0.015) 3px
                                )
                            `,
                            borderRadius: '20px',
                            padding: '36px 32px 32px 32px',
                            maxWidth: '340px',
                            width: '88%',
                            border: '1.5px solid #E5D4C1',
                            boxShadow: '0 16px 48px rgba(73, 45, 19, 0.25), 0 4px 16px rgba(141, 110, 99, 0.15)',
                            animation: 'dialogScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '28px'
                        }}>
                            <div style={{
                                fontSize: '1.08rem',
                                color: '#3E2723',
                                lineHeight: '1.65',
                                fontWeight: '600',
                                marginBottom: '14px',
                                letterSpacing: '0.2px'
                            }}>
                                이 편지를 기억 너머로<br />흘려보낼까요?
                            </div>
                            <div style={{
                                fontSize: '0.87rem',
                                color: '#8D6E63',
                                lineHeight: '1.6',
                                fontWeight: '500',
                                opacity: 0.85
                            }}>
                                정리된 기억은 다시 꺼내볼 수 없습니다.
                            </div>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <button
                                onClick={handleCancelDelete}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    background: '#FFFFFF',
                                    border: '1.5px solid #D7C4B8',
                                    borderRadius: '14px',
                                    color: '#6B5B4F',
                                    fontSize: '0.94rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    letterSpacing: '0.3px',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#F8F5F2';
                                    e.currentTarget.style.borderColor = '#C8B4A6';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#D7C4B8';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
                                }}
                            >
                                아니요
                            </button>
                            <button
                                onClick={() => handleConfirmDelete(confirmDeleteId)}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                    border: 'none',
                                    borderRadius: '14px',
                                    color: '#FFFFFF',
                                    fontSize: '0.94rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    letterSpacing: '0.3px',
                                    boxShadow: '0 4px 12px rgba(141, 110, 99, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #6B4E3D 0%, #5D4037 100%)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(141, 110, 99, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(141, 110, 99, 0.3)';
                                }}
                            >
                                정리할게요
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* CSS 애니메이션 */}
            <style>{`
                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
                
                @keyframes dropdownFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-6px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes overlayFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes dialogScaleIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.85) translateY(10px);
                    }
                    60% {
                        opacity: 1;
                        transform: scale(1.02) translateY(-2px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

// 일기 쓰기 화면
export const WriteDiaryScreen = ({ onBack, token, characterId, onSuccess }) => {
    const [content, setContent] = useState('');
    const [selectedCharacterId, setSelectedCharacterId] = useState(characterId || null);
    const [sending, setSending] = useState(false);
    const [characters, setCharacters] = useState([]);
    const [requestReply, setRequestReply] = useState(true); // 기본값 true로 설정
    const [selectedReplyTime, setSelectedReplyTime] = useState('now'); // now, tonight, tomorrow_morning, tomorrow_lunch, custom
    const customTime = ''; // 커스텀 시간 (현재 미사용)
    const [todayTopic, setTodayTopic] = useState(null); // 오늘의 주제
    const [topicUsed, setTopicUsed] = useState(false); // 주제 사용 여부

    useEffect(() => {
        // 사용 가능한 캐릭터 목록 가져오기 (실제로는 API에서 가져와야 함)
        const availableCharacters = Object.keys(characterData).map(id => ({
            id,
            ...characterData[id]
        }));
        setCharacters(availableCharacters);
        
        if (characterId) {
            setSelectedCharacterId(characterId);
        }
        
        // 오늘의 주제 가져오기
        const fetchTodayTopic = async () => {
            if (!token) return;
            try {
                const data = await api.getTodayTopic();
                if (data && data.topic) {
                    setTodayTopic(data);
                }
            } catch (error) {
                console.error('오늘의 주제 가져오기 실패:', error);
            }
        };
        
        fetchTodayTopic();
    }, [characterId, token]);

    // 스케줄 시간 계산 함수
    const calculateScheduledTime = (replyTime, customTimeValue) => {
        if (replyTime === 'now') {
            return null; // 즉시 답장
        }
        
        const kstOffset = 9 * 60 * 60 * 1000; // KST는 UTC+9
        let scheduledTime = null;
        
        switch (replyTime) {
            case 'tonight':
                scheduledTime = new Date();
                scheduledTime.setHours(22, 0, 0, 0);
                if (scheduledTime.getTime() < Date.now()) {
                    scheduledTime.setDate(scheduledTime.getDate() + 1);
                }
                break;
            case 'tomorrow_morning':
                scheduledTime = new Date();
                scheduledTime.setDate(scheduledTime.getDate() + 1);
                scheduledTime.setHours(8, 0, 0, 0);
                break;
            case 'tomorrow_lunch':
                scheduledTime = new Date();
                scheduledTime.setDate(scheduledTime.getDate() + 1);
                scheduledTime.setHours(12, 0, 0, 0);
                break;
            case 'custom':
                if (!customTimeValue) return null;
                const [hours, minutes] = customTimeValue.split(':').map(Number);
                scheduledTime = new Date();
                scheduledTime.setHours(hours, minutes, 0, 0);
                if (scheduledTime.getTime() < Date.now()) {
                    scheduledTime.setDate(scheduledTime.getDate() + 1);
                }
                break;
            default:
                return null;
        }
        
        // KST 시간을 UTC로 변환 (ISO 형식으로 반환)
        const utcTime = new Date(scheduledTime.getTime() - kstOffset);
        return utcTime.toISOString();
    };

    const handleSend = async () => {
        if (!content.trim()) {
            alert('일기 내용을 입력해주세요.');
            return;
        }
        
        if (!selectedCharacterId) {
            alert('캐릭터를 선택해주세요.');
            return;
        }

        setSending(true);
        try {
            const payload = {
                character_id: selectedCharacterId,
                content: content.trim(),
                request_reply: requestReply,
                topic_used: topicUsed && todayTopic !== null  // 주제를 사용했는지 여부
            };
            
            if (requestReply && selectedReplyTime !== 'now') {
                const scheduledTime = calculateScheduledTime(selectedReplyTime, customTime);
                if (scheduledTime) {
                    payload.scheduled_time = scheduledTime;
                }
            }
            
            await api.createExchangeDiary(payload);
            
            if (onSuccess) {
                onSuccess();
            }
            onBack();
        } catch (error) {
            console.error('일기 전송 실패:', error);
            alert('일기 전송 중 오류가 발생했습니다.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div style={{
                backgroundColor: '#FBF9F7',
                borderRadius: '20px',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                height: '85vh',
                maxHeight: '85vh',
                overflow: 'hidden',
                maxWidth: '380px',
                width: '90%',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}>
                {/* 헤더 */}
                <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderBottom: '2px solid #E8E0DB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <button
                        onClick={onBack}
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                            <path d="M17 18l-8-6 8-6"/>
                        </svg>
                    </button>
                    <h2 style={{
                        color: '#4A3B32',
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700'
                    }}>
                        일기 쓰기
                    </h2>
                    <div style={{ width: '24px' }}></div>
                </div>

                {/* 캐릭터 선택 */}
                <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderBottom: '1px solid #E8E0DB',
                    background: '#FFFFFF'
                }}>
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#8D6E63',
                        marginBottom: '8px',
                        fontWeight: '600'
                    }}>
                        누구에게 보낼까요?
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '4px'
                    }}>
                        {characters.map((char) => (
                            <button
                                key={char.id}
                                onClick={() => setSelectedCharacterId(char.id)}
                                style={{
                                    flexShrink: 0,
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: selectedCharacterId === char.id ? '3px solid #8D6E63' : '2px solid #E8E0DB',
                                    background: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <img
                                    src={char.image || '/default-character.png'}
                                    alt={char.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* 오늘의 주제 배지 */}
                {todayTopic && todayTopic.topic && (
                    <div style={{
                        flexShrink: 0,
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF9F7 100%)',
                        borderBottom: '1px solid #E8E0DB'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '14px 18px',
                            background: '#FFFFFF',
                            borderRadius: '14px',
                            border: '1px solid #E8E0DB',
                            boxShadow: '0 2px 8px rgba(74, 59, 50, 0.06)'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(141, 110, 99, 0.2)'
                            }}>
                                <span style={{ fontSize: '1rem' }}>📝</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#8D6E63',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    letterSpacing: '0.3px',
                                    textTransform: 'uppercase'
                                }}>
                                    오늘의 주제미션
                                </div>
                                <div style={{
                                    fontSize: '0.95rem',
                                    color: '#4A3B32',
                                    fontWeight: '600',
                                    lineHeight: '1.5',
                                    letterSpacing: '-0.01em',
                                    marginBottom: '8px'
                                }}>
                                    {todayTopic.topic}
                                </div>
                                {todayTopic.has_topic && todayTopic.character_name && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#A1887F',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        {todayTopic.character_name}이(가) 기다리는 이야기
                                    </div>
                                )}
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    gap: '6px',
                                    marginTop: '4px'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={topicUsed}
                                        onChange={(e) => setTopicUsed(e.target.checked)}
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            cursor: 'pointer',
                                            accentColor: '#8D6E63'
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: '#8D6E63',
                                        fontWeight: '500'
                                    }}>이 주제로 작성하기</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* 일기 작성 영역 */}
                <div style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    background: `
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 39px,
                            rgba(139, 110, 99, 0.12) 39px,
                            rgba(139, 110, 99, 0.12) 40px
                        ),
                        #FEFCF9
                    `,
                    backgroundSize: '100% 40px',
                    padding: '20px',
                    paddingTop: '30px'
                }}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={todayTopic ? `"${todayTopic.topic}"에 대해 이야기해보세요...&#10;또는 오늘 하루를 자유롭게 써주세요.` : "오늘 하루는 어땠나요?&#10;마음껏 이야기해주세요..."}
                        style={{
                            flex: 1,
                            width: '100%',
                            border: 'none',
                            background: 'transparent',
                            resize: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            lineHeight: '40px',
                            color: '#4A3B32',
                            fontFamily: 'inherit',
                            padding: '0',
                            margin: '0'
                        }}
                    />
                </div>

                {/* 답장 받기 옵션 */}
                <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderTop: '1px solid #E8E0DB',
                    background: '#FFFFFF'
                }}>
                    <div style={{
                        background: requestReply ? 'linear-gradient(135deg, #F7F2EC 0%, #FEFCF9 100%)' : '#FFFFFF',
                        padding: '16px',
                        borderRadius: '14px',
                        border: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: 'none'
                    }}>
                        {/* 첫 줄: 답장 받기 텍스트와 토글 스위치 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            flexWrap: 'nowrap',
                            marginBottom: requestReply ? '12px' : '0'
                        }}>
                            {/* 좌측: 텍스트 */}
                            <span style={{
                                color: requestReply ? '#4A3B32' : '#8D6E63',
                                fontSize: '0.95rem',
                                fontWeight: requestReply ? '700' : '600',
                                transition: 'all 0.2s ease',
                                flex: '1',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                            }}>
                                답장 받기
                            </span>
                            
                            {/* 우측: 토글 스위치 */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                position: 'relative',
                                width: '48px',
                                height: '28px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={requestReply}
                                    onChange={(e) => setRequestReply(e.target.checked)}
                                    style={{
                                        opacity: 0,
                                        width: 0,
                                        height: 0,
                                        position: 'absolute'
                                    }}
                                />
                                <div style={{
                                    position: 'relative',
                                    width: '48px',
                                    height: '28px',
                                    borderRadius: '14px',
                                    background: requestReply ? '#6B4E3D' : '#D7CCC8',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: requestReply ? '22px' : '2px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: '#FFFFFF',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                    }}></div>
                                </div>
                            </label>
                        </div>
                        
                        {/* 답장 시간 선택 (토글 ON 시 표시) */}
                        {requestReply && (
                            <div style={{
                                paddingTop: '12px',
                                marginTop: '4px',
                                borderTop: '1px solid rgba(232, 224, 219, 0.5)'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    marginBottom: '10px',
                                    fontWeight: '600'
                                }}>
                                    답장 받을 시간
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '8px'
                                }}>
                                    {[
                                        { value: 'now', label: '바로 받기', icon: '⚡' },
                                        { value: 'tonight', label: '오늘 밤 10시', icon: '🌙' },
                                        { value: 'tomorrow_morning', label: '내일 아침 8시', icon: '☀️' },
                                        { value: 'tomorrow_lunch', label: '내일 점심 12시', icon: '🌤️' }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSelectedReplyTime(option.value)}
                                            style={{
                                                padding: '12px',
                                                background: selectedReplyTime === option.value 
                                                    ? 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)' 
                                                    : '#FFFFFF',
                                                color: selectedReplyTime === option.value ? '#FFFFFF' : '#8D6E63',
                                                border: selectedReplyTime === option.value ? 'none' : '1px solid #E8E0DB',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: selectedReplyTime === option.value ? '700' : '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                justifyContent: 'center',
                                                boxShadow: selectedReplyTime === option.value 
                                                    ? '0 4px 12px rgba(141, 110, 99, 0.25)' 
                                                    : 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.1rem' }}>{option.icon}</span>
                                            <span style={{ whiteSpace: 'nowrap' }}>{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderTop: '2px solid #E8E0DB',
                    background: '#FFFFFF',
                    borderRadius: '0 0 20px 20px'
                }}>
                    <button
                        onClick={handleSend}
                        disabled={sending || !content.trim() || !selectedCharacterId}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            backgroundColor: sending || !content.trim() || !selectedCharacterId ? '#D7CCC8' : '#8D6E63',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: sending || !content.trim() || !selectedCharacterId ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: sending || !content.trim() || !selectedCharacterId ? 'none' : '0 2px 8px rgba(141, 110, 99, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            if (!sending && content.trim() && selectedCharacterId) {
                                e.currentTarget.style.backgroundColor = '#6B4E3D';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(141, 110, 99, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!sending && content.trim() && selectedCharacterId) {
                                e.currentTarget.style.backgroundColor = '#8D6E63';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(141, 110, 99, 0.2)';
                            }
                        }}
                    >
                        {sending ? (
                            <>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTop: '2px solid #FFFFFF',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }}></div>
                                <span>전송 중...</span>
                            </>
                        ) : (
                            <>
                                <span>✈️</span>
                                <span>오늘 하루 보내기 슝</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// 답장 읽기 화면
export const ReadReplyScreen = ({ diaryId, onBack, token, onShowOriginalDiary }) => {
    const [diary, setDiary] = useState(null);
    const [reply, setReply] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reacted, setReacted] = useState(false);
    const [showWhisper, setShowWhisper] = useState(false);
    const [showTopic, setShowTopic] = useState(false);
    const [whisperMessage, setWhisperMessage] = useState('');
    const [nextTopic, setNextTopic] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    
    // 사용자 정보 가져오기
    const user = auth.getUser();
    const userNickname = user?.nickname || user?.name || '사용자';

    useEffect(() => {
        // 답장 로딩 메시지 랜덤 선택
        const loadingMessages = [
            "지금, 천천히 답장을 쓰고 있어요.",
            "당신의 이야기를 정리하고 있어요.",
            "편지에 담을 말을 고르고 있어요.",
            "조심스럽게 문장을 적고 있어요.",
            "조금만 기다려줘요. 곧 도착해요.",
            "어떤 말이 좋을지 오래 고민하고 있어요.",
            "오늘 당신의 마음이 자꾸 떠올라서…",
            "괜히 단어를 고르는 데 시간이 걸리네요.",
            "차분하게, 천천히 쓰고 있어요.",
            "종이를 한 번 고르고 있어요.",
            "잉크가 번지지 않게 조심히 쓰는 중이에요.",
            "고쳐 썼다 지웠다 하고 있어요.",
            "마지막 문장을 고민 중이에요."
        ];
        const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setLoadingMessage(randomMessage);
        
        const fetchData = async () => {
            if (!token || !diaryId) {
                setLoading(false);
                return;
            }
            
            try {
                const diaryData = await api.getExchangeDiary(diaryId);
                setDiary(diaryData);
                
                if (diaryData.reply_received) {
                    const replyData = await api.getExchangeDiaryReply(diaryId);
                    setReply(replyData);
                    setReacted(replyData.reacted || false);
                }
            } catch (error) {
                console.error('일기/답장 불러오기 실패:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [diaryId, token]);

    const handleReaction = async () => {
        if (reacted) return;
        
        setReacted(true);
        
        // 랜덤 whisper_message 목록
        const whisperMessages = [
            "고마워, 네 마음이 전해졌어.",
            "너의 이야기가 내 마음에 와닿았어.",
            "항상 네 편이야.",
            "네가 있어서 행복해.",
            "오늘도 고생 많았어.",
            "내일도 함께해줘.",
            "네 마음을 잘 알고 있어.",
            "항상 응원하고 있을게.",
            "고마워, 정말 고마워.",
            "너는 소중한 사람이야.",
            "네 이야기가 내게 힘이 돼.",
            "항상 여기 있을게.",
            "고마워, 정말 고마워해.",
            "네가 있어서 따뜻해.",
            "오늘도 수고했어."
        ];
        
        // 랜덤으로 whisper_message 선택하여 바로 표시
        const randomWhisper = whisperMessages[Math.floor(Math.random() * whisperMessages.length)];
        setWhisperMessage(randomWhisper);
        setShowWhisper(true);
        
        // 1.5초 후 whisper 사라지기
        setTimeout(() => {
            setShowWhisper(false);
        }, 1500);
        
        // 내일 주제 추천 목록
        const nextTopics = [
            "오늘 하루 중 가장 행복했던 순간",
            "내일 하고 싶은 일 한 가지",
            "요즘 가장 많이 생각하는 것",
            "오늘 느꼈던 감정에 대해",
            "내일의 나에게 전하고 싶은 말",
            "요즘 가장 듣고 싶은 말",
            "오늘 하루를 한 단어로 표현한다면",
            "내일의 나에게 바라는 것",
            "요즘 가장 고민되는 것",
            "오늘 하루 중 가장 아쉬웠던 순간",
            "내일 새롭게 시작하고 싶은 것",
            "요즘 가장 감사한 것",
            "오늘 하루를 다시 살 수 있다면",
            "내일의 나에게 응원의 말",
            "요즘 가장 기대되는 것"
        ];
        
        // whisper_message 표시 후 2초 후에 내일 주제 추천 표시
        setTimeout(() => {
            const randomTopic = nextTopics[Math.floor(Math.random() * nextTopics.length)];
            setNextTopic(randomTopic);
            setShowTopic(true);
            
            // 2.5초 후 topic 사라지기
            setTimeout(() => {
                setShowTopic(false);
            }, 2500);
        }, 2000);
        
        // API 호출은 백그라운드에서 처리 (에러가 나도 UI에는 영향 없음)
        try {
            await api.reactToReply(diaryId, 'heart');
        } catch (error) {
            console.error('리액션 전송 실패:', error);
            // 에러가 나도 이미 UI는 표시되었으므로 버튼 상태는 유지
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            const weekday = weekdays[date.getDay()];
            
            return `${year}년 ${month}월 ${day}일 (${weekday})`;
        } catch (e) {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div style={{
                    backgroundColor: '#FBF9F7',
                    borderRadius: '20px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '380px',
                    width: '90%',
                    minHeight: '300px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #D7CCC8',
                        borderTop: '3px solid #8D6E63',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: '16px'
                    }}></div>
                    <p style={{ color: '#8D6E63', fontSize: '0.9rem', margin: 0 }}>불러오는 중...</p>
                </div>
            </div>
        );
    }

    const charInfo = diary ? characterData[diary.character_id] : null;
    const diaryTitle = diary && diary.title ? `[ ${diary.title} ]` : null;
    const sanitizedReplyContent = reply ? sanitizeCharacterText(reply.content, userNickname) : '';
    
    // 답장이 오는 중인지 확인 (일기가 있고, 답장 요청했지만 아직 답장이 없을 때)
    const isWaitingForReply = diary && !reply && diary.request_reply && !diary.reply_received;

    return (
        <div className="modal-overlay">
            {/* 답장 오는 중 로딩 화면 (소설 형식 저장할 때처럼) */}
            {isWaitingForReply && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    {loadingMessage || '답장 작성 중...'}
                </div>
            )}
            <div 
                className="reply-reader-modal"
                style={{
                    backgroundColor: '#FEFCF9',
                    borderRadius: '20px',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '85vh',
                    maxHeight: '85vh',
                    overflow: 'hidden',
                    maxWidth: '380px',
                    width: '90%',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }}>
                {/* 헤더 */}
                <div style={{
                    flexShrink: 0,
                    padding: '16px 20px',
                    borderBottom: '2px solid #E8E0DB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
                    borderRadius: '20px 20px 0 0'
                }}>
                    <button
                        onClick={onBack}
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                            <path d="M17 18l-8-6 8-6"/>
                        </svg>
                    </button>
                    <h2 style={{
                        color: '#4A3B32',
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700'
                    }}>
                        {reply ? '답장 읽기' : '일기 보기'}
                    </h2>
                    <div style={{ width: '24px' }}></div>
                </div>

                {/* 스크롤 가능한 콘텐츠 */}
                <div
                    className="reply-reader-scroll"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '28px 24px 40px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '28px'
                    }}
                >
                    {/* 내가 쓴 일기 */}
                    {diary && (
                        <div style={{
                            background: '#FFFEFA',
                            borderRadius: '12px',
                            padding: '22px',
                            border: '1.5px solid #E8E0DB',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                            backgroundImage: `
                                linear-gradient(0deg, rgba(141, 110, 99, 0.05) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(141, 110, 99, 0.02) 1px, transparent 1px)
                            `,
                            backgroundSize: '100% 34px, 34px 100%'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '10px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '2px solid #E8E0DB'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(135deg, #8D6E63 0%, #A1887F 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: '1.2rem',
                                        fontWeight: '600'
                                    }}>
                                        나
                                    </div>
                                </div>
                                <div>
                                    <div style={{
                                        color: '#4A3B32',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                    }}>
                                        내 일기
                                    </div>
                                    <div style={{
                                        color: '#8D6E63',
                                        fontSize: '0.75rem'
                                    }}>
                                        {formatDate(diary.created_at)}
                                    </div>
                                </div>
                            </div>
                            {diaryTitle && (
                                <div style={{
                                    color: '#5D4037',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    marginBottom: '12px',
                                    fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif'
                                }}>
                                    {diaryTitle}
                                </div>
                            )}
                            <div style={{
                                color: '#5D4037',
                                fontSize: '0.95rem',
                                lineHeight: '1.7',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {diary.content}
                            </div>
                        </div>
                    )}

                    {/* 캐릭터의 답장 */}
                    {reply ? (
                        <div style={{
                            background: '#FFFBF2',
                            borderRadius: '18px',
                            padding: '26px 26px 32px 26px',
                            border: '1.5px solid #E5D4C1',
                            boxShadow: '0 14px 32px rgba(71, 45, 19, 0.15)',
                            backgroundImage: 'linear-gradient(180deg, rgba(224,224,224,0.8) 1px, transparent 1px)',
                            backgroundSize: '100% 44px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '2px solid #E8E0DB',
                                    flexShrink: 0,
                                    boxShadow: '0 3px 10px rgba(0,0,0,0.15)'
                                }}>
                                    <img
                                        src={charInfo?.image || '/default-character.png'}
                                        alt={charInfo?.name || 'Character'}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                                <div>
                                    <div style={{
                                        color: '#3E2723',
                                        fontSize: '1.08rem',
                                        fontWeight: '700'
                                    }}>
                                        {charInfo?.name?.split(' (')[0] || '캐릭터'}
                                    </div>
                                    <div style={{
                                        color: '#8D6E63',
                                        fontSize: '0.8rem',
                                        marginTop: '4px'
                                    }}>
                                        {formatDate(reply.created_at)}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                marginTop: '24px',
                                padding: '0 12px',
                                color: '#352822',
                                fontSize: '1.08rem',
                                lineHeight: '2.05',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: '"MapoFlowerIsland", "Nanum Pen Script", "Noto Serif KR", serif'
                            }}>
                                {sanitizedReplyContent}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: '#FFF8F0',
                            borderRadius: '12px',
                            padding: '40px 24px',
                            border: '1.5px solid #E8E0DB',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px'
                        }}>
                            {/* 로딩 메시지 배너 */}
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 24px',
                                background: 'linear-gradient(135deg, #8D6E63 0%, #A1887F 100%)',
                                borderRadius: '50px',
                                boxShadow: '0 4px 16px rgba(141, 110, 99, 0.3)',
                                animation: 'gentlePulse 2s ease-in-out infinite'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2.5px solid rgba(255,255,255,0.3)',
                                    borderTop: '2.5px solid #FFFFFF',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }}></div>
                                <span style={{
                                    color: '#FFFFFF',
                                    fontSize: '0.92rem',
                                    fontWeight: '600',
                                    letterSpacing: '0.3px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {loadingMessage}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 리액션 버튼 */}
                {reply && (
                    <div style={{
                        flexShrink: 0,
                        padding: '16px 20px',
                        borderTop: '2px solid #E8E0DB',
                        background: '#FFFFFF',
                        borderRadius: '0 0 20px 20px',
                        position: 'relative',
                        zIndex: 10
                    }}>
                        <button
                            onClick={handleReaction}
                            disabled={reacted}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                backgroundColor: reacted ? '#D7CCC8' : '#8D6E63',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '14px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: reacted ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: reacted ? 'none' : '0 4px 12px rgba(141, 110, 99, 0.25)',
                                position: 'relative',
                                zIndex: 1000,
                                userSelect: 'none',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (!reacted) {
                                    e.currentTarget.style.backgroundColor = '#6B4E3D';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(141, 110, 99, 0.35)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!reacted) {
                                    e.currentTarget.style.backgroundColor = '#8D6E63';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(141, 110, 99, 0.25)';
                                }
                            }}
                            onMouseDown={(e) => {
                                if (!reacted) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(141, 110, 99, 0.2)';
                                }
                            }}
                            onMouseUp={(e) => {
                                if (!reacted) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(141, 110, 99, 0.35)';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.5rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                                {reacted ? '❤️' : '🤍'}
                            </span>
                            <span style={{ fontWeight: '700', letterSpacing: '0.3px' }}>
                                {reacted ? '마음 잘 받았어요' : '잘 받았어요'}
                            </span>
                        </button>
                    </div>
                )}
                
                {/* Whisper 메시지 오버레이 */}
                {showWhisper && (
                    <div style={{
                        position: 'fixed',
                        bottom: showTopic ? '280px' : '200px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        pointerEvents: 'none',
                        animation: 'whisperFadeIn 1.5s ease-out forwards',
                        maxWidth: '92%',
                        width: 'calc(100% - 24px)',
                        padding: '0 12px'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(251, 249, 247, 0.98) 100%)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            padding: '16px 24px',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(74, 59, 50, 0.25), 0 4px 16px rgba(141, 110, 99, 0.15)',
                            border: '1.5px solid rgba(232, 224, 219, 0.8)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                color: '#4A3B32',
                                fontSize: '1rem',
                                fontWeight: '600',
                                letterSpacing: '0.3px',
                                lineHeight: '1.5'
                            }}>
                                {whisperMessage}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* 내일의 주제 오버레이 */}
                {showTopic && nextTopic && (
                    <div style={{
                        position: 'fixed',
                        bottom: '200px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        pointerEvents: 'none',
                        animation: 'topicFadeIn 2.5s ease-out forwards',
                        maxWidth: '92%',
                        width: 'calc(100% - 24px)',
                        padding: '0 12px'
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            padding: '20px 24px',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                            border: '1px solid rgba(232, 224, 219, 0.4)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                color: '#8D6E63',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                marginBottom: '12px',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                opacity: 0.7
                            }}>
                                내일의 주제
                            </div>
                            <div style={{
                                color: '#3E2723',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                letterSpacing: '-0.02em',
                                lineHeight: '1.5',
                                marginBottom: '4px',
                                wordBreak: 'keep-all'
                            }}>
                                {nextTopic}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* CSS 애니메이션 */}
            <style>{`
                @keyframes whisperFadeIn {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(10px) scale(0.95);
                    }
                    15% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                    85% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-5px) scale(0.95);
                    }
                }
                
                @keyframes whisperFadeOut {
                    0% {
                        opacity: 0.7;
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-1px);
                    }
                }
                
                @keyframes topicFadeIn {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(8px) scale(0.96);
                    }
                    10% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                    90% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-4px) scale(0.98);
                    }
                }
                
                @keyframes topicFadeOut {
                    0% {
                        opacity: 0.85;
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-1px);
                    }
                }
                
                @keyframes gentlePulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.9;
                        transform: scale(1.02);
                    }
                }
            `}</style>
        </div>
    );
};

// 메인 캐릭터 우편함 화면 (통합 컴포넌트)
export const ExchangeDiaryScreen = ({ onClose, token, onShowDiary }) => {
    const [screen, setScreen] = useState('main'); // 'main', 'read'
    const [selectedDiaryId, setSelectedDiaryId] = useState(null);
    const [replyListKey, setReplyListKey] = useState(0);

    const handleReadReply = (diaryId) => {
        setSelectedDiaryId(diaryId);
        setScreen('read');
    };

    const handleBack = () => {
        if (screen === 'read') {
            setScreen('main');
            setSelectedDiaryId(null);
            // 답장 화면에서 돌아올 때 목록 새로고침
            setReplyListKey(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handleShowOriginalDiary = (diaryId) => {
        if (onShowDiary) {
            onShowDiary(diaryId);
        }
    };

    if (screen === 'read') {
        return (
            <ReadReplyScreen
                diaryId={selectedDiaryId}
                onBack={handleBack}
                token={token}
                onShowOriginalDiary={handleShowOriginalDiary}
            />
        );
    }

    return (
        <ReplyBoxMainScreen
            key={replyListKey}
            onClose={onClose}
            token={token}
            onReadReply={handleReadReply}
            onShowDiary={onShowDiary}
        />
    );
};

