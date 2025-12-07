import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

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
            
            // 그 외에는 날짜 형식으로 표시 (MM/DD)
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}/${day}`;
        } catch (error) {
            console.error('날짜 포맷 오류:', error);
            return dateString;
        }
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    width: '90%',
                    maxWidth: '500px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #E8E0DB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{ 
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#3E2723'
                    }}>대화 기록</h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#8D6E63',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* 내용 */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#8D6E63' }}>
                            로딩 중...
                        </div>
                    ) : histories.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px',
                            color: '#8D6E63'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
                            <div>아직 저장된 대화가 없습니다</div>
                        </div>
                    ) : (
                        histories.map(history => {
                            // 프리뷰 텍스트 생성
                            const messages = history.messages || [];
                            const firstUserMessage = messages.find(m => m.sender === 'user');
                            const previewText = firstUserMessage?.text || '대화 내용 없음';
                            const messageCount = messages.length;
                            
                            return (
                            <div 
                                key={history.id}
                                style={{
                                    padding: '16px',
                                    marginBottom: '12px',
                                    backgroundColor: '#FAF9F7',
                                    borderRadius: '12px',
                                    border: '1px solid #E8E0DB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ 
                                        fontSize: '0.9rem', 
                                        color: '#3E2723',
                                        marginBottom: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {previewText.substring(0, 30)}{previewText.length > 30 ? '...' : ''}
                                    </div>
                                    <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#8D6E63',
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center'
                                    }}>
                                        <span>{formatDate(history.updated_at || history.created_at)}</span>
                                        <span>•</span>
                                        <span>{messageCount}개의 메시지</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                    <button 
                                        className="history-delete-btn"
                                        onClick={() => handleDelete(history.id)}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '0.8rem',
                                            color: '#D84315',
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #D84315',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#D84315';
                                            e.target.style.color = '#FFFFFF';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#FFFFFF';
                                            e.target.style.color = '#D84315';
                                        }}
                                    >
                                        삭제
                                    </button>
                                    <button 
                                        className="history-load-btn"
                                        onClick={() => onLoadChat(history)}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

