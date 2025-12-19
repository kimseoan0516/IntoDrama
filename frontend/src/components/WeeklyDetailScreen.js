import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import html2canvas from 'html2canvas';
import { api } from '../utils/api';
import { characterData } from '../constants/characterData';

// 커스텀 툴팁 컴포넌트 (감정 그래프용)
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        // 점수 해석: 높을수록 밝은 감정, 낮을수록 우울/힘든 감정
        let emotionText = '';
        if (value >= 80) {
            emotionText = '매우 밝음';
        } else if (value >= 60) {
            emotionText = '밝음';
        } else if (value >= 40) {
            emotionText = '보통';
        } else if (value >= 20) {
            emotionText = '우울함';
        } else {
            emotionText = '매우 우울함';
        }
        
        return (
            <div style={{
                backgroundColor: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                minWidth: '120px',
                zIndex: 1000,
                position: 'relative'
            }}>
                <div style={{
                    color: '#A1887F',
                    fontSize: '0.75rem',
                    marginBottom: '4px'
                }}>
                    {label}
                </div>
                <div style={{
                    color: '#4A3B32',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    marginBottom: '2px'
                }}>
                    {value}점
                </div>
                <div style={{
                    color: '#8D6E63',
                    fontSize: '0.7rem'
                }}>
                    {emotionText}
                </div>
            </div>
        );
    }
    return null;
};

// 커스텀 툴팁 컴포넌트 (도넛 차트용)
const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div style={{
                backgroundColor: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                minWidth: '120px',
                zIndex: 1000,
                position: 'relative'
            }}>
                <div style={{
                    color: '#A1887F',
                    fontSize: '0.75rem',
                    marginBottom: '4px'
                }}>
                    {data.name}
                </div>
                <div style={{
                    color: '#4A3B32',
                    fontSize: '0.95rem',
                    fontWeight: '700'
                }}>
                    {data.value}개 메시지
                </div>
            </div>
        );
    }
    return null;
};

// 포토카드 모달 컴포넌트
const PhotocardModal = ({ quote, character, onClose }) => {
    const photocardRef = useRef(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!photocardRef.current) return;
        
        setSaving(true);
        try {
            const canvas = await html2canvas(photocardRef.current, {
                backgroundColor: null,
                scale: 3,
                logging: false,
                useCORS: true,
                allowTaint: false,
                width: photocardRef.current.offsetWidth,
                height: photocardRef.current.offsetHeight,
                pixelRatio: Math.max(window.devicePixelRatio || 2, 2),
            });

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `포토카드_${character?.name?.split(' (')[0] || '캐릭터'}_${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSaving(false);
            }, 'image/png');
        } catch (error) {
            console.error('포토카드 저장 실패:', error);
            alert('포토카드 저장 중 오류가 발생했습니다.');
            setSaving(false);
        }
    };

    // 드라마별 그라데이션 배경색
    const getGradientByDrama = (dramaTitle) => {
        const gradients = {
            // 신비롭고 우아한 블루-그레이 (도깨비)
            '도깨비': 'linear-gradient(135deg, #2C3E50 0%, #34495E 50%, #5D6D7E 100%)',
            
            // 따뜻한 밀리터리 브라운-오렌지 (태양의 후예)
            '태양의 후예': 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
            
            // 활기찬 청춘 코랄-오렌지 (거침없이 하이킥)
            '거침없이 하이킥': 'linear-gradient(135deg, #E67E22 0%, #D35400 50%, #BA4A00 100%)',
            
            // 따뜻한 레트로 골드-베이지 (응답하라 1994)
            '응답하라 1994': 'linear-gradient(135deg, #D4A574 0%, #C19A6B 50%, #9B7E52 100%)',
            
            // 고급스러운 네이비-다크블루 (상속자들)
            '상속자들': 'linear-gradient(135deg, #1B1B2F 0%, #162447 50%, #1F4068 100%)',
            
            // 화려한 퍼플-핑크 (꽃보다 남자)
            '꽃보다 남자': 'linear-gradient(135deg, #6A1B9A 0%, #8E24AA 50%, #AB47BC 100%)',
            
            // 역사적 다크 브라운 (미스터 션샤인)
            '미스터 션샤인': 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #795548 100%)',
            
            // 청량한 스카이블루-민트 (선재 업고 튀어)
            '선재 업고 튀어': 'linear-gradient(135deg, #00ACC1 0%, #26C6DA 50%, #4DD0E1 100%)',
            
            // 열정적인 다크 레드-마룬 (이태원 클라쓰)
            '이태원 클라쓰': 'linear-gradient(135deg, #C0392B 0%, #922B21 50%, #7B241C 100%)',
            
            // 우아한 에메랄드 그린 (시크릿 가든)
            '시크릿 가든': 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)',
            
            // 자연스러운 포레스트 그린 (갯마을 차차차)
            '갯마을 차차차': 'linear-gradient(135deg, #4A5D4A 0%, #5C6F5C 50%, #7A8A7A 100%)',
            
            // 차분한 슬레이트 그레이-블루 (미생)
            '미생': 'linear-gradient(135deg, #37474F 0%, #455A64 50%, #546E7A 100%)',
            
            // 따뜻하고 부드러운 갈색 (나의 아저씨)
            '나의 아저씨': 'linear-gradient(135deg, #6B4E3D 0%, #8D6E63 50%, #A1887F 100%)',
            
            // 빈티지 세피아-브라운 (네 멋대로 해라)
            '네 멋대로 해라': 'linear-gradient(135deg, #6D4C41 0%, #8D6E63 50%, #A1887F 100%)',
            
            // 생기 넘치는 핑크-로즈 (스물다섯 스물하나)
            '스물다섯 스물하나': 'linear-gradient(135deg, #FF6B9D 0%, #C44569 50%, #8B3A62 100%)',
            
            // 따스한 올리브-베이지 (동백꽃 필 무렵)
            '동백꽃 필 무렵': 'linear-gradient(135deg, #827717 0%, #9E9D24 50%, #AFB42B 100%)',
            
            // 깊이 있는 틸-그린 (괜찮아 사랑이야)
            '괜찮아 사랑이야': 'linear-gradient(135deg, #00695C 0%, #00897B 50%, #26A69A 100%)',
            
            // 기본값
            '기본값': 'linear-gradient(135deg, #8B6F47 0%, #6B4E3D 50%, #5C4033 100%)'
        };
        return gradients[dramaTitle] || gradients['기본값'];
    };

    // 텍스트 길이에 따른 폰트 크기 계산
    const calculateFontSize = (text) => {
        const length = text.length;
        if (length < 50) return '1.5rem';
        if (length < 100) return '1.3rem';
        if (length < 150) return '1.1rem';
        if (length < 200) return '1rem';
        return '0.9rem';
    };

    const gradient = getGradientByDrama(character?.dramaTitle || '');
    const fontSize = calculateFontSize(quote.text);

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                maxWidth: '90vw',
                maxHeight: '90vh'
            }}>
                {/* 포토카드 미리보기 */}
                <div
                    ref={photocardRef}
                    style={{
                        width: '360px',
                        height: '640px',
                        background: gradient,
                        borderRadius: '20px',
                        padding: '50px 35px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {/* 배경 장식 */}
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        filter: 'blur(40px)'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-80px',
                        left: '-80px',
                        width: '250px',
                        height: '250px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        filter: 'blur(40px)'
                    }}></div>

                    {/* 명대사 텍스트 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1,
                        flex: 1,
                        padding: '40px 0'
                    }}>
                        {/* 큰 따옴표 장식 */}
                        <div style={{
                            fontSize: '3.5rem',
                            color: 'rgba(255, 255, 255, 0.2)',
                            fontFamily: 'Georgia, serif',
                            lineHeight: '1',
                            marginBottom: '20px',
                            fontWeight: '700'
                        }}>
                            ❝
                        </div>
                        
                        <div style={{
                            color: '#FFFFFF',
                            fontSize: fontSize,
                            lineHeight: '1.6',
                            fontWeight: '500',
                            wordBreak: 'keep-all',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
                            padding: '0 10px'
                        }}>
                            {quote.text}
                        </div>
                    </div>

                    {/* 하단 정보 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        position: 'relative',
                        zIndex: 1,
                        paddingTop: '30px'
                    }}>
                        {/* 캐릭터 이름 */}
                        <div style={{
                            color: '#FFFFFF',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            opacity: 0.95
                        }}>
                            {character?.name?.split(' (')[0] || '캐릭터'}
                        </div>

                        {/* 앱 로고/워터마크 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.75rem',
                            opacity: 0.8
                        }}>
                            <span>IntoDrama</span>
                            <span>•</span>
                            <span>드라마 속으로</span>
                        </div>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '360px',
                        padding: '16px 24px',
                        backgroundColor: saving ? '#A1887F' : '#FFFFFF',
                        color: saving ? '#FFFFFF' : '#4A3B32',
                        border: saving ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '16px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                        if (!saving) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.2)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!saving) {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
                        }
                    }}
                >
                    {saving ? (
                        <>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid #FFFFFF',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }}></div>
                            <span>저장 중...</span>
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>갤러리에 저장</span>
                        </>
                    )}
                </button>

                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export const WeeklyDetailScreen = ({ weekData, weekStart, onBack, token }) => {
    const [loading, setLoading] = useState(true);
    const [detailData, setDetailData] = useState(null);
    const [selectedPhotocard, setSelectedPhotocard] = useState(null);
    const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0); // 중앙에 표시할 캐릭터 인덱스
    const [hoveredCharacterIndex, setHoveredCharacterIndex] = useState(null); // hover 중인 캐릭터 인덱스
    const [editingQuote, setEditingQuote] = useState(null); // 편집 중인 명대사
    const [editText, setEditText] = useState(''); // 편집 텍스트
    const [deletingQuoteIndex, setDeletingQuoteIndex] = useState(null);
    
    // 명대사 편집 핸들러
    const handleEditQuote = (quote, index) => {
        setEditingQuote({ ...quote, index });
        setEditText(quote.text);
    };
    
    const handleSaveEdit = async () => {
        if (!editingQuote || !editText.trim()) return;
        
        try {
            if (editingQuote.source === 'user' && editingQuote.id) {
                await api.updateQuote(editingQuote.id, { text: editText.trim() });
            }
            
            // 로컬 상태 업데이트
            const updatedQuotes = [...detailData.top_quotes];
            updatedQuotes[editingQuote.index] = {
                ...updatedQuotes[editingQuote.index],
                text: editText.trim()
            };
            
            setDetailData({
                ...detailData,
                top_quotes: updatedQuotes
            });
            
            setEditingQuote(null);
            setEditText('');
        } catch (error) {
            console.error('명대사 수정 실패:', error);
            alert('명대사 수정 중 오류가 발생했습니다.');
        }
    };
    
    const handleDeleteQuote = async (quote, index) => {
        if (!window.confirm('이 명대사를 삭제하시겠습니까? 삭제하면 AI가 다른 명대사로 자동으로 대체합니다.')) {
            return;
        }
        
        setDeletingQuoteIndex(index);
        
        try {
            if (quote.source === 'user' && quote.id) {
                await api.deleteQuote(quote.id);
            }
            
            // 주간 날짜 범위 계산
            const weekStartDate = new Date(weekStart);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);
            weekEndDate.setHours(23, 59, 59, 999);
            
            // AI가 다른 명대사로 대체
            let chatHistories = [];
            try {
                const allHistoriesData = await api.getAllChatHistories();
                chatHistories = allHistoriesData.histories || allHistoriesData;
            } catch (error) {
                console.error('대화 로그 불러오기 실패:', error);
            }
            
            const currentQuotes = detailData.top_quotes.filter((q, i) => i !== index);
            const usedTexts = new Set(currentQuotes.map(q => q.text));
            
            // AI가 추천한 명대사 중에서 새로운 명대사 찾기
            const aiQuotes = extractEmotionalQuotes(chatHistories, weekStartDate, weekEndDate);
            const newQuote = aiQuotes.find(q => !usedTexts.has(q.text));
            
            const updatedQuotes = [...currentQuotes];
            if (newQuote && updatedQuotes.length < 3) {
                updatedQuotes.push(newQuote);
            }
            
            setDetailData({
                ...detailData,
                top_quotes: updatedQuotes
            });
        } catch (error) {
            console.error('명대사 삭제 실패:', error);
            alert('명대사 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeletingQuoteIndex(null);
        }
    };
    
    // AI가 감정적인/인상적인 대사를 추출하는 함수
    const extractEmotionalQuotes = (chatHistories, weekStartDate, weekEndDate) => {
        const allQuotes = [];
        
        chatHistories.forEach(history => {
            try {
                const messages = typeof history.messages === 'string' 
                    ? JSON.parse(history.messages) 
                    : history.messages;
                
                if (!messages || !Array.isArray(messages)) return;
                
                const characterIds = typeof history.character_ids === 'string'
                    ? JSON.parse(history.character_ids)
                    : history.character_ids;
                
                // 해당 주의 대화인지 확인
                const historyDate = new Date(history.updated_at);
                if (historyDate < weekStartDate || historyDate > weekEndDate) return;
                
                // AI 메시지만 필터링
                messages.forEach(msg => {
                    if (msg.sender === 'ai' && msg.text && msg.text.trim().length > 0) {
                        const charId = msg.character_id || (characterIds && characterIds[0]);
                        if (!charId) return;
                        
                        const text = msg.text.trim();
                        
                        // 감정적인 대사 점수 계산
                        let score = 0;
                        
                        // 긴 대사 (감정 표현이 많을 가능성)
                        if (text.length > 50) score += 2;
                        if (text.length > 100) score += 1;
                        
                        // 감정 표현 키워드
                        const emotionalKeywords = [
                            '사랑', '좋아', '행복', '기쁨', '슬픔', '아픔', '그리워', '보고싶',
                            '미안', '고마워', '감사', '축하', '응원', '걱정', '안심', '위로',
                            '괜찮', '힘내', '잘될', '믿어', '기대', '설레', '떨려', '두려',
                            '화나', '서운', '아쉽', '후회', '그리워', '그리운', '그리움',
                            '소중', '특별', '소중한', '특별한', '의미', '의미있', '의미있는'
                        ];
                        
                        emotionalKeywords.forEach(keyword => {
                            if (text.includes(keyword)) score += 2;
                        });
                        
                        // 감탄사나 강조 표현
                        if (/[!?]{2,}/.test(text)) score += 1;
                        if (/\.{3,}/.test(text)) score += 1; // 말줄임표
                        
                        // 인용부호나 강조 표현
                        if (text.includes('"') || text.includes("'") || text.includes('「')) score += 1;
                        
                        // 질문이나 대답이 아닌 진술형 (더 감정적일 가능성)
                        if (!text.includes('?') && !text.includes('어떻게') && !text.includes('왜')) {
                            score += 1;
                        }
                        
                        allQuotes.push({
                            text: text,
                            character_id: charId,
                            date: history.updated_at,
                            score: score,
                            source: 'ai' // AI 추천
                        });
                    }
                });
            } catch (error) {
                console.error('대화 로그 파싱 오류:', error);
            }
        });
        
        // 점수 순으로 정렬하고 상위 3개 반환
        return allQuotes
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(quote => ({
                text: quote.text,
                character_id: quote.character_id,
                date: quote.date,
                source: quote.source
            }));
    };
    
    useEffect(() => {
        // weekData가 null이면 기록이 없는 주
        if (weekData === null) {
            setDetailData(null);
            setLoading(false);
            return;
        }
        
        // 메시지 텍스트에서 감정 점수 계산 (0-100)
        const calculateEmotionScore = (text) => {
            if (!text || typeof text !== 'string') return 50; // 기본값: 중립
            
            let score = 50; // 기본 중립 점수
            
            // 강한 긍정 키워드 (더 높은 가중치)
            const strongPositiveKeywords = [
                '사랑', '행복', '기쁨', '설레', '두근', '사랑해', '좋아해', 
                '완전', '최고', '너무좋아', '진짜좋아', '대박', '신나', '즐거워'
            ];
            
            // 일반 긍정 키워드
            const positiveKeywords = [
                '좋아', '웃음', '미소', '떨려', '고마워', '감사', '축하', '응원', 
                '안심', '위로', '괜찮', '힘내', '잘될', '믿어', '기대', '소중', 
                '특별', '의미', '보고싶', '그리워', '기쁨', '평화', '편안', '즐거',
                '재밌', '재미있', '멋져', '좋네', '좋구나', '좋다', '예쁘'
            ];
            
            // 강한 부정 키워드 (더 높은 가중치)
            const strongNegativeKeywords = [
                '힘들어', '너무힘들', '정말힘들', '죽겠', '못하겠', '우울', '슬퍼',
                '아파', '외로워', '괴로워', '고통', '불안', '두려워', '무서워',
                '최악', '싫어', '미워', '화나', '짜증'
            ];
            
            // 일반 부정 키워드
            const negativeKeywords = [
                '힘들', '걱정', '답답', '서운', '실망', '후회', '아쉽', '미안',
                '그만', '안돼', '못해', '어려워', '피곤', '지쳐', '지친',
                '슬픔', '외로움', '불안함', '부담', '스트레스', '힘듦'
            ];
            
            // 강한 긍정 키워드 체크 (가중치: 12점)
            strongPositiveKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 12;
                }
            });
            
            // 일반 긍정 키워드 체크 (가중치: 8점)
            positiveKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 8;
                }
            });
            
            // 강한 부정 키워드 체크 (가중치: -12점)
            strongNegativeKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score -= 12;
                }
            });
            
            // 일반 부정 키워드 체크 (가중치: -8점)
            negativeKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score -= 8;
                }
            });
            
            // 긍정 감탄사나 강조 표현 (가중치: 5점)
            if (/[!]{2,}/.test(text) && !strongNegativeKeywords.some(k => text.includes(k))) {
                score += 5;
            }
            
            // 부정적 감탄사 (가중치: -5점)
            if (/[?]{2,}/.test(text) || /\.{3,}/.test(text)) {
                score -= 5;
            }
            
            // 긍정 이모지 체크 (가중치: 10점)
            const positiveEmojiCount = (text.match(/[😊😄😁😃😀😆😍🥰😘💕💖❤️💗🎉✨🌟😎🤗😌☺️🙂]/g) || []).length;
            score += positiveEmojiCount * 10;
            
            // 부정 이모지 체크 (가중치: -10점)
            const negativeEmojiCount = (text.match(/[😢😭😔😞😟😕🙁☹️😣😖😫😩😤😠😡💔]/g) || []).length;
            score -= negativeEmojiCount * 10;
            
            // 복합 표현 보너스
            // "너무 좋아", "정말 행복" 같은 강조 표현
            if (/(너무|정말|진짜|완전|엄청).{0,3}(좋아|행복|기쁨|설레|사랑)/.test(text)) {
                score += 8;
            }
            
            // "너무 힘들", "정말 슬프" 같은 강조 표현
            if (/(너무|정말|진짜|완전|엄청).{0,3}(힘들|슬퍼|아파|외로|우울)/.test(text)) {
                score -= 8;
            }
            
            // 점수 범위 제한 (0-100)
            return Math.max(0, Math.min(100, score));
        };
        
        // 감정 타임라인 생성 (실제 채팅 기록 기반, 오늘까지만)
        const generateEmotionTimeline = (weekStartDate, chatHistories) => {
            const days = ['월', '화', '수', '목', '금', '토', '일'];
            const timeline = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 각 날짜별로 메시지 수집
            const dayMessages = {};
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStartDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                dayMessages[dateStr] = [];
            }
            
            // 채팅 기록에서 해당 주의 메시지 추출
            if (chatHistories && Array.isArray(chatHistories)) {
                chatHistories.forEach(history => {
                    try {
                        const messages = typeof history.messages === 'string' 
                            ? JSON.parse(history.messages) 
                            : history.messages;
                        
                        if (!messages || !Array.isArray(messages)) return;
                        
                        const historyDate = new Date(history.updated_at);
                        const historyDateStr = historyDate.toISOString().split('T')[0];
                        
                        // 해당 주의 날짜인지 확인
                        if (dayMessages[historyDateStr]) {
                            messages.forEach(msg => {
                                if (msg.text && typeof msg.text === 'string') {
                                    dayMessages[historyDateStr].push(msg.text);
                                }
                            });
                        }
                    } catch (error) {
                        console.error('대화 로그 파싱 오류:', error);
                    }
                });
            }
            
            // 각 날짜별 감정 점수 계산 (오늘까지만)
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStartDate);
                date.setDate(date.getDate() + i);
                date.setHours(0, 0, 0, 0);
                const dateStr = date.toISOString().split('T')[0];
                
                // 오늘 이후 날짜는 건너뛰기
                if (date > today) {
                    continue;
                }
                
                const messages = dayMessages[dateStr] || [];
                
                let dayScore = 50; // 기본 중립 점수
                if (messages.length > 0) {
                    // 해당 날짜의 모든 메시지 평균 감정 점수 계산
                    const scores = messages.map(msg => calculateEmotionScore(msg));
                    dayScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                }
                
                timeline.push({
                    day: days[i],
                    value: Math.round(dayScore),
                    date: dateStr
                });
            }
            
            return timeline;
        };
        
        const fetchWeekDetail = async () => {
            if (!token || !weekStart) {
                setLoading(false);
                return;
            }
            
            try {
                // 주간 날짜 범위 계산
                const weekStartDate = new Date(weekStart);
                const weekEndDate = new Date(weekStartDate);
                weekEndDate.setDate(weekEndDate.getDate() + 6);
                weekEndDate.setHours(23, 59, 59, 999);
                
                // 1. User Pick: 저장된 대사 목록 가져오기
                let savedQuotes = [];
                try {
                    const quotesData = await api.getSavedQuotes();
                    savedQuotes = quotesData.quotes || [];
                } catch (error) {
                    console.error('저장된 대사 불러오기 실패:', error);
                }
                
                // 해당 주의 저장된 대사 필터링
                const weekSavedQuotes = savedQuotes
                    .filter(quote => {
                        // created_at 또는 updated_at을 date로 사용
                        const quoteDate = quote.created_at || quote.updated_at;
                        if (!quoteDate) return false;
                        const date = new Date(quoteDate);
                        return date >= weekStartDate && date <= weekEndDate;
                    })
                    .map(quote => ({
                        id: quote.id,
                        text: quote.message?.text || quote.text || '',
                        character_id: Array.isArray(quote.character_ids) ? quote.character_ids[0] : quote.character_ids,
                        date: quote.created_at || quote.updated_at,
                        source: 'user' // 사용자 저장
                    }))
                    .filter(quote => quote.text); // 텍스트가 있는 것만
                
                // 2. AI Pick: 해당 주의 대화 로그 가져오기
                let aiQuotes = [];
                let chatHistories = [];
                try {
                    const allHistoriesData = await api.getAllChatHistories();
                    chatHistories = allHistoriesData.histories || allHistoriesData;
                    aiQuotes = extractEmotionalQuotes(chatHistories, weekStartDate, weekEndDate);
                } catch (error) {
                    console.error('대화 로그 불러오기 실패:', error);
                }
                
                // 3. 하이브리드 선정: User Pick 우선, 부족하면 AI Pick으로 채움
                const finalQuotes = [];
                const usedTexts = new Set(); // 중복 방지
                
                weekSavedQuotes.forEach(quote => {
                    if (finalQuotes.length < 3 && !usedTexts.has(quote.text)) {
                        finalQuotes.push(quote);
                        usedTexts.add(quote.text);
                    }
                });
                
                // AI Pick으로 나머지 채우기 (최대 3개까지)
                aiQuotes.forEach(quote => {
                    if (finalQuotes.length < 3 && !usedTexts.has(quote.text)) {
                        finalQuotes.push(quote);
                        usedTexts.add(quote.text);
                    }
                });
                
                // 현재 주차인지 확인
                const isCurrentWeek = (() => {
                    if (!weekStart) return false;
                    const start = new Date(weekStart);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 6);

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);

                    return today >= start && today <= end;
                })();
                
                // AI 요약 생성 (기본값)
                const defaultSummary = weekData?.top_characters && weekData.top_characters.length > 0
                    ? `${isCurrentWeek ? '이번 주는 지금까지' : '이번 주는'} ${weekData.top_characters.map(c => {
                          const charInfo = characterData[c.character_id];
                          return charInfo?.name?.split(' (')[0] || '캐릭터';
                      }).join(', ')}와(과) 많은 대화를 나누셨네요. 전체적으로 따뜻하고 진솔한 분위기의 대화가 많았습니다.${isCurrentWeek ? ' 이번 주가 끝나면 더 자세한 분석이 제공됩니다.' : ''}`
                    : isCurrentWeek 
                        ? "이번 주는 지금까지 따뜻하고 진솔한 대화가 있었어요. 캐릭터들과 깊이 있는 이야기를 나누며 서로를 더 잘 이해하게 되고 있습니다. 이번 주가 끝나면 더 자세한 분석이 제공됩니다."
                        : "이번 주는 따뜻하고 진솔한 대화가 많았어요. 캐릭터들과 깊이 있는 이야기를 나누며 서로를 더 잘 이해하게 되었습니다.";
                
                // 백엔드에서 감정 타임라인 가져오기 (하루 전체 채팅방 통합)
                let backendEmotionTimeline = null;
                try {
                    const weekDetailData = await api.getWeekDetail(weekStart);
                    backendEmotionTimeline = weekDetailData.emotion_timeline || null;
                } catch (error) {
                    console.error('주간 상세 통계 불러오기 실패:', error);
                }
                
                const tempData = {
                    ai_summary: weekData?.ai_summary || defaultSummary,
                    character_ratio: weekData?.top_characters || [],
                    emotion_timeline: backendEmotionTimeline || generateEmotionTimeline(weekStart, chatHistories), // 백엔드 데이터 우선, 없으면 프론트엔드 계산
                    top_quotes: finalQuotes
                };
                
                setDetailData(tempData);
            } catch (error) {
                console.error('주간 상세 데이터 불러오기 실패:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchWeekDetail();
    }, [weekStart, token, weekData]);
    
    const formatWeekTitle = (weekStartDate) => {
        if (!weekStartDate) return '';
        const date = new Date(weekStartDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 주차 계산
        const firstDay = new Date(year, month - 1, 1);
        const weekNum = Math.ceil((day + firstDay.getDay()) / 7);
        
        // 현재 주차인지 확인
        const start = new Date(weekStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const isCurrentWeek = today >= start && today <= end;
        
        return `${year}년 ${month}월 ${weekNum}주차 리포트${isCurrentWeek ? ' [집계중]' : ''}`;
    };
    
    // 도넛 차트 데이터 준비
    const chartData = detailData?.character_ratio?.map((char, idx) => {
        const charInfo = characterData[char.character_id];
        const colors = ['#8D6E63', '#A1887F', '#D7CCC8', '#BCAAA4', '#EFEBE9'];
        return {
            name: charInfo?.name?.split(' (')[0] || '알 수 없음',
            value: char.message_count || 0,
            color: colors[idx % colors.length]
        };
    }) || [];
    
    const totalMessages = chartData.reduce((sum, item) => sum + item.value, 0);
    
    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="stats-modal weekly-detail-modal" style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '90vh',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    maxWidth: '420px',
                    width: '90%'
                }}>
                    {/* 헤더 - 로딩 중에도 표시 */}
                    <div style={{
                        flexShrink: 0,
                        padding: '12px 12px',
                        borderBottom: '1px solid #E8E0DB',
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
                        minHeight: '60px'
                    }}>
                        <button 
                            className="back-button"
                            onClick={onBack}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                zIndex: 2
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <path d="M17 18l-8-6 8-6"/>
                            </svg>
                        </button>
                        <h2 style={{ 
                            color: '#3E2723', 
                            margin: 0, 
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            position: 'absolute',
                            left: '48px',
                            right: '48px',
                            textAlign: 'center',
                            zIndex: 1,
                            whiteSpace: 'normal',
                            overflow: 'visible',
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'keep-all'
                        }}>
                            {formatWeekTitle(weekStart)}
                        </h2>
                    </div>
                    
                    {/* 로딩 콘텐츠 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        width: '100%',
                        gap: '20px'
                    }}>
                        <div className="weekly-detail-spinner" style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid #D7CCC8',
                            borderTop: '4px solid #6B4E3D',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }}></div>
                        <p style={{ 
                            textAlign: 'center',
                            color: '#8D6E63',
                            fontSize: '0.9rem',
                            margin: 0
                        }}>
                            잠시만 기다려 주세요...
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // 데이터가 없을 때 (기록이 없는 주)
    if (!detailData || detailData === null) {
        return (
            <div className="modal-overlay">
                <div className="stats-modal weekly-detail-modal" style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '90vh',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    maxWidth: '420px',
                    width: '90%'
                }}>
                    {/* 헤더 */}
                    <div style={{
                        flexShrink: 0,
                        padding: '12px 12px',
                        borderBottom: '1px solid #E8E0DB',
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
                        minHeight: '60px'
                    }}>
                        <button 
                            className="back-button"
                            onClick={onBack}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                zIndex: 2
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                                <path d="M17 18l-8-6 8-6"/>
                            </svg>
                        </button>
                        <h2 style={{ 
                            color: '#3E2723', 
                            margin: 0, 
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            position: 'absolute',
                            left: '48px',
                            right: '48px',
                            textAlign: 'center',
                            zIndex: 1,
                            whiteSpace: 'normal',
                            overflow: 'visible',
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'keep-all'
                        }}>
                            {formatWeekTitle(weekStart)}
                        </h2>
                    </div>
                    
                    {/* 기록 없음 메시지 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        width: '100%',
                        gap: '16px',
                        padding: '40px'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            opacity: 0.3
                        }}>
                            🎬
                        </div>
                        <div style={{
                            textAlign: 'center',
                            color: '#5D4037',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            기록이 없습니다
                        </div>
                        <div style={{
                            textAlign: 'center',
                            color: '#8D6E63',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            maxWidth: '280px'
                        }}>
                            이번 주는 캐릭터들과의 대화 기록이 없어요.{'\n'}
                            드라마 속 세계로 들어가 대화를 나눠보세요!
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="modal-overlay">
            <div className="stats-modal weekly-detail-modal" style={{ 
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                height: '90vh',
                maxHeight: '90vh',
                overflow: 'hidden',
                maxWidth: '420px',
                width: '90%'
            }}>
                {/* 헤더 */}
                <div style={{
                    flexShrink: 0,
                    padding: '12px 12px',
                    borderBottom: '1px solid #E8E0DB',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
                    minHeight: '60px'
                }}>
                    <button 
                        className="back-button"
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            zIndex: 2
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                            <path d="M17 18l-8-6 8-6"/>
                        </svg>
                    </button>
                    <h2 style={{ 
                        color: '#3E2723', 
                        margin: 0, 
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        position: 'absolute',
                        left: '48px',
                        right: '48px',
                        textAlign: 'center',
                        zIndex: 1,
                        whiteSpace: 'normal',
                        overflow: 'visible',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'keep-all'
                    }}>
                        {formatWeekTitle(weekStart)}
                    </h2>
                </div>
                
                {/* 스크롤 가능한 콘텐츠 */}
                <div className="weekly-detail-content" style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '16px 20px 24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {/* 1. AI 요약 섹션 */}
                    <div style={{
                        background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F1EB 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1.5px solid #E8E0DB',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>✨</span>
                            <h3 style={{
                                color: '#5D4037',
                                margin: 0,
                                fontSize: '0.95rem',
                                fontWeight: '700'
                            }}>
                                AI의 주간 브리핑
                            </h3>
                        </div>
                        <p style={{
                            color: '#5D4037',
                            margin: 0,
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-line'
                        }}>
                            {detailData?.ai_summary || '이번 주 대화 요약 데이터가 없습니다.'}
                        </p>
                    </div>
                    
                    {/* 2. 캐릭터 대화 비율 (도넛 차트) */}
                    {chartData.length > 0 && (
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            padding: '24px 20px',
                            border: '1.5px solid #E8E0DB',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <h3 style={{
                                color: '#5D4037',
                                margin: '0 0 20px 0',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                textAlign: 'center'
                            }}>
                                캐릭터 대화 비율
                            </h3>
                            <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart
                                        onMouseLeave={() => {
                                            // 차트 전체 영역을 벗어날 때만 hover 초기화
                                            setHoveredCharacterIndex(null);
                                        }}
                                    >
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            style={{ cursor: 'pointer', outline: 'none' }}
                                            onClick={(data, index) => {
                                                if (index !== undefined && index !== null) {
                                                    setSelectedCharacterIndex(index);
                                                    setHoveredCharacterIndex(null); // 클릭 시 hover 상태 초기화
                                                }
                                            }}
                                            isAnimationActive={false}
                                            activeShape={null}
                                            activeIndex={-1}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.color}
                                                    style={{ cursor: 'pointer', outline: 'none' }}
                                                    onMouseEnter={() => {
                                                        // 각 셀에 hover 시 인덱스 저장
                                                        if (index !== hoveredCharacterIndex) {
                                                            setHoveredCharacterIndex(index);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={<CustomPieTooltip />}
                                            trigger="hover"
                                            cursor={false}
                                            wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                                            allowEscapeViewBox={{ x: true, y: true }}
                                            isAnimationActive={false}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* 선택된 캐릭터 프로필 사진 (hover 또는 클릭으로 변경 가능) */}
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    pointerEvents: 'none',
                                    zIndex: 10
                                }}>
                                    {(() => {
                                        // hover 중이면 hover된 캐릭터, 아니면 선택된 캐릭터 표시
                                        const displayIndex = hoveredCharacterIndex !== null ? hoveredCharacterIndex : selectedCharacterIndex;
                                        const displayCharacter = detailData?.character_ratio?.[displayIndex];
                                        const displayCharInfo = displayCharacter ? characterData[displayCharacter.character_id] : null;
                                        return displayCharInfo ? (
                                            <div 
                                                key={`char-${displayIndex}-${displayCharInfo.name}`}
                                                className="character-image-center"
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: '3px solid #FFFFFF',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                                }}>
                                                <img 
                                                    src={displayCharInfo.image || '/default-character.png'} 
                                                    alt={displayCharInfo.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{
                                                color: '#4A3B32',
                                                fontSize: '1.8rem',
                                                fontWeight: '700',
                                                lineHeight: '1.2'
                                            }}>
                                                {totalMessages}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            
                            {/* 범례 */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                marginTop: '32px'
                            }}>
                                {chartData.map((item, idx) => {
                                    const charInfo = characterData[detailData.character_ratio[idx]?.character_id];
                                    const percentage = totalMessages > 0 ? Math.round((item.value / totalMessages) * 100) : 0;
                                    return (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            minHeight: '40px'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                border: `3px solid ${item.color}`,
                                                flexShrink: 0
                                            }}>
                                                <img 
                                                    src={charInfo?.image || '/default-character.png'} 
                                                    alt={item.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    color: '#5D4037',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    marginBottom: '2px'
                                                }}>
                                                    {item.name}
                                                </div>
                                                <div style={{
                                                    color: '#8D6E63',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {item.value}개 메시지 · {percentage}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {/* 3. 감정 변화 그래프 */}
                    {detailData?.emotion_timeline && detailData.emotion_timeline.length > 0 && (
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            padding: '24px 20px',
                            border: '1.5px solid #E8E0DB',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            position: 'relative'
                        }}>
                            <h3 style={{
                                color: '#5D4037',
                                margin: '0 0 20px 0',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                textAlign: 'center'
                            }}>
                                감정 변화
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart 
                                    data={detailData.emotion_timeline}
                                    style={{ cursor: 'default' }}
                                    onClick={(e) => e?.preventDefault?.()}
                                    onMouseDown={(e) => e?.preventDefault?.()}
                                >
                                    <defs>
                                        <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8D6E63" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8D6E63" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0DB" />
                                    <XAxis 
                                        dataKey="day" 
                                        stroke="#8D6E63"
                                        style={{ fontSize: '0.75rem' }}
                                    />
                                    <YAxis 
                                        domain={[0, 100]}
                                        tick={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <Tooltip 
                                        content={<CustomTooltip />}
                                        offset={-10}
                                        trigger="hover"
                                        cursor={false}
                                        wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#8D6E63" 
                                        strokeWidth={2}
                                        fill="url(#emotionGradient)"
                                        dot={{ fill: '#8D6E63', r: 4 }}
                                        activeDot={{ r: 6, style: { cursor: 'default' } }}
                                        style={{ cursor: 'default', outline: 'none' }}
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        {/* Y축 커스텀 아이콘 */}
                        <div style={{
                            position: 'absolute',
                            left: '20px',
                            top: '65px',
                            height: '170px',
                            width: '24px',
                            pointerEvents: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            {/* 상단: 웃는 표정 (100점 위치) - 그리드 최상단 라인과 맞춤 */}
                            <div style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                                </svg>
                            </div>
                            {/* 중단: 무표정 (50점 위치) - 그리드 중앙 라인과 맞춤 */}
                            <div style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="8" y1="15" x2="16" y2="15"/>
                                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                                </svg>
                            </div>
                            {/* 하단: 슬픈 표정 (0점 위치) - 그리드 최하단 라인과 맞춤 */}
                            <div style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
                                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                                </svg>
                            </div>
                        </div>
                        </div>
                    )}
                    
                    {/* 4. 명대사 TOP 3 */}
                    <div>
                        <h3 style={{
                            color: '#5D4037',
                            margin: '0 0 16px 0',
                            fontSize: '0.95rem',
                            fontWeight: '700'
                        }}>
                            명대사 TOP 3
                        </h3>
                        {detailData?.top_quotes && detailData.top_quotes.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {detailData.top_quotes.slice(0, 3).map((quote, idx) => {
                                    const charInfo = characterData[quote.character_id];
                                    const rankEmojis = ['🥇', '🥈', '🥉'];
                                    
                                    return (
                                        <div 
                                            key={idx}
                                            className="weekly-top-quote-card"
                                            style={{
                                                background: '#FFFFFF',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                paddingBottom: '52px',
                                                border: '1.5px solid #E8E0DB',
                                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                                                display: 'flex',
                                                gap: '12px',
                                                alignItems: 'flex-start',
                                                position: 'relative',
                                                minHeight: 'fit-content'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '4px',
                                                flexShrink: 0
                                            }}>
                                                <div style={{
                                                    fontSize: '1.5rem'
                                                }}>
                                                    {rankEmojis[idx]}
                                                </div>
                                            </div>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                border: '2px solid #E8E0DB',
                                                flexShrink: 0
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
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    color: '#5D4037',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    marginBottom: '6px'
                                                }}>
                                                    {charInfo?.name?.split(' (')[0] || '알 수 없음'}
                                                </div>
                                                <div style={{
                                                    color: '#3E2723',
                                                    fontSize: '0.9rem',
                                                    lineHeight: '1.5',
                                                    wordBreak: 'break-word',
                                                    marginBottom: '8px'
                                                }}>
                                                    "{quote.text}"
                                                </div>
                                                {quote.date && (
                                                    <div style={{
                                                        color: '#8D6E63',
                                                        fontSize: '0.75rem',
                                                        opacity: 0.7
                                                    }}>
                                                        {new Date(quote.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 편집/삭제 버튼 (우측 상단) */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                display: 'flex',
                                                gap: '6px'
                                            }}>
                                                {/* 편집 버튼 */}
                                                <button
                                                    onClick={() => handleEditQuote(quote, idx)}
                                                    disabled={deletingQuoteIndex === idx}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        padding: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: deletingQuoteIndex === idx ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        opacity: deletingQuoteIndex === idx ? 0.5 : 1
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (deletingQuoteIndex !== idx) {
                                                            e.currentTarget.style.opacity = '0.7';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (deletingQuoteIndex !== idx) {
                                                            e.currentTarget.style.opacity = '1';
                                                        }
                                                    }}
                                                    title="명대사 수정"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                
                                                {/* 삭제 버튼 */}
                                                <button
                                                    onClick={() => handleDeleteQuote(quote, idx)}
                                                    disabled={deletingQuoteIndex === idx}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        padding: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: deletingQuoteIndex === idx ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        opacity: deletingQuoteIndex === idx ? 0.5 : 1
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (deletingQuoteIndex !== idx) {
                                                            e.currentTarget.style.opacity = '0.7';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (deletingQuoteIndex !== idx) {
                                                            e.currentTarget.style.opacity = '1';
                                                        }
                                                    }}
                                                    title="명대사 삭제"
                                                >
                                                    {deletingQuoteIndex === idx ? (
                                                        <div style={{
                                                            width: '14px',
                                                            height: '14px',
                                                            border: '2px solid rgba(244, 67, 54, 0.3)',
                                                            borderTop: '2px solid #F44336',
                                                            borderRadius: '50%',
                                                            animation: 'spin 0.8s linear infinite'
                                                        }}></div>
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18"></path>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            
                                            {/* 포토카드 버튼 */}
                                            <button
                                                onClick={() => setSelectedPhotocard({ quote, character: charInfo })}
                                                disabled={deletingQuoteIndex === idx}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '12px',
                                                    right: '12px',
                                                    background: '#8D6E63',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '6px 10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: deletingQuoteIndex === idx ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                    opacity: deletingQuoteIndex === idx ? 0.5 : 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (deletingQuoteIndex !== idx) {
                                                        e.currentTarget.style.backgroundColor = '#6B4E3D';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (deletingQuoteIndex !== idx) {
                                                        e.currentTarget.style.backgroundColor = '#8D6E63';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                                    }
                                                }}
                                                title="포토카드 만들기"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 19V8a2 2 0 0 0-2-2h-4l-2-3H9L7 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"></path>
                                                    <circle cx="11.0" cy="13" r="4"></circle>
                                                </svg>
                                                <span style={{
                                                    color: '#FFFFFF',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600'
                                                }}>
                                                    포토카드
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                padding: '24px',
                                textAlign: 'center',
                                color: '#8D6E63',
                                fontSize: '0.9rem'
                            }}>
                                {(() => {
                                    if (!weekStart) return '이번 주 저장된 명대사가 없습니다.';
                                    const start = new Date(weekStart);
                                    const end = new Date(start);
                                    end.setDate(end.getDate() + 6);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    start.setHours(0, 0, 0, 0);
                                    end.setHours(23, 59, 59, 999);
                                    const isCurrentWeek = today >= start && today <= end;
                                    return isCurrentWeek 
                                        ? '아직 저장된 명대사가 없습니다. 대화 중 마음에 드는 대사를 저장해보세요!' 
                                        : '이번 주 저장된 명대사가 없습니다.';
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* 포토카드 모달 */}
            {selectedPhotocard && (
                <PhotocardModal
                    quote={selectedPhotocard.quote}
                    character={selectedPhotocard.character}
                    onClose={() => setSelectedPhotocard(null)}
                />
            )}
            
            {/* 명대사 편집 모달 */}
            {editingQuote && (
                <div className="modal-overlay" onClick={() => setEditingQuote(null)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10001,
                    padding: '20px'
                }}>
                    <div onClick={(e) => e.stopPropagation()} style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '100%',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h3 style={{
                            color: '#5D4037',
                            margin: '0 0 16px 0',
                            fontSize: '1.1rem',
                            fontWeight: '700'
                        }}>
                            명대사 수정
                        </h3>
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="명대사를 입력하세요"
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '12px',
                                border: '1.5px solid #E8E0DB',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                color: '#3E2723',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                marginBottom: '16px'
                            }}
                            autoFocus
                        />
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => {
                                    setEditingQuote(null);
                                    setEditText('');
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#F5F5F5',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: '#5D4037',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#E8E0DB';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#F5F5F5';
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={!editText.trim()}
                                style={{
                                    padding: '10px 20px',
                                    background: editText.trim() ? '#8D6E63' : '#D7CCC8',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: '#FFFFFF',
                                    cursor: editText.trim() ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (editText.trim()) {
                                        e.currentTarget.style.background = '#6B4E3D';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (editText.trim()) {
                                        e.currentTarget.style.background = '#8D6E63';
                                    }
                                }}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

