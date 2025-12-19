import React, { useState, useEffect, useRef } from 'react';

// 날짜 포맷팅 함수
export const formatMonthYear = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 분석`;
};

// 페르소나 카드 컴포넌트
export const PersonaCard = ({ persona, date }) => {
    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px 24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E8E0DB'
        }}>
            <div style={{
                fontSize: '0.85rem',
                color: '#8D6E63',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <span>🌿</span>
                <span>{formatMonthYear(date)}</span>
            </div>
            <h3 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#4A3B32',
                margin: '0 0 12px 0',
                lineHeight: '1.3'
            }}>
                {persona.title}
            </h3>
            <p style={{
                fontSize: '0.95rem',
                color: '#5D4037',
                margin: '0 0 20px 0',
                lineHeight: '1.6'
            }}>
                {persona.summary}
            </p>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                {persona.tags.map((tag, idx) => (
                    <span key={idx} style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: '#F5F1EB',
                        color: '#5D4037',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                    }}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

// 성향 분석 슬라이더 컴포넌트
export const TendencySlider = ({ tendencyData, title = '마음 컨디션' }) => {
    if (!tendencyData || tendencyData.length === 0) return null;

    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E8E0DB'
        }}>
            <h4 style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#4A3B32',
                margin: '0 0 24px 0'
            }}>
                {title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {tendencyData.map((item, idx) => (
                    <div key={idx}>
                        {item.label && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '0.85rem', color: '#5D4037', fontWeight: '600' }}>{item.label}</span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '14px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1.1rem' }}>{item.left.icon}</span>
                                <span style={{ fontSize: '0.8rem', color: '#4A3B32', fontWeight: '600' }}>{item.left.text}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#4A3B32', fontWeight: '600' }}>{item.right.text}</span>
                                <span style={{ fontSize: '1.1rem' }}>{item.right.icon}</span>
                            </div>
                        </div>
                        <div style={{
                            position: 'relative',
                            height: '4px',
                            background: '#E0E0E0',
                            borderRadius: '2px',
                            overflow: 'visible'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: `${item.position}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#FFFFFF',
                                border: '2.5px solid #8D6E63',
                                boxShadow: '0 2px 8px rgba(141, 110, 99, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
                                zIndex: 2
                            }} />
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: `${item.position}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #8D6E63 0%, #A1887F 100%)',
                                borderRadius: '2px'
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 키워드 섹션 컴포넌트
export const KeywordSection = ({ keywords, title = '자주 쓰는 감정 언어' }) => {
    if (!keywords || keywords.length === 0) return null;

    const pastelColors = [
        '#FFE5F1', '#FFF4E6', '#E8F5E9', '#E3F2FD',
        '#F3E5F5', '#FFF9C4', '#FFE0B2', '#E0F2F1'
    ];
    const textColors = [
        '#C2185B', '#E65100', '#2E7D32', '#1565C0',
        '#7B1FA2', '#F57F17', '#E64A19', '#00695C'
    ];

    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E8E0DB'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#F5F1EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#4A3B32', margin: 0 }}>{title}</h5>
            </div>
            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '10px',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {keywords.slice(0, 8).map((keyword, idx) => {
                    const bgColor = pastelColors[idx % pastelColors.length];
                    const textColor = textColors[idx % textColors.length];
                    
                    return (
                        <span key={idx} style={{
                            padding: '10px 16px',
                            borderRadius: '16px',
                            background: bgColor,
                            color: textColor,
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            {keyword.word || keyword}
                            {keyword.count > 1 && (
                                <span style={{
                                    fontSize: '0.65rem',
                                    opacity: 0.6,
                                    marginLeft: '4px'
                                }}>
                                    {keyword.count}
                                </span>
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// 해석 카드 컴포넌트
export const InterpretationCard = ({ interpretation, userProfile }) => {
    return (
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
                lineHeight: '1.7'
            }}>
                {interpretation || '이번 대화를 통해 당신의 따뜻한 마음과 진솔한 감정 표현을 느낄 수 있었습니다. 앞으로도 자신의 감정을 소중히 여기시고, 필요할 때는 주변 사람들과 나누어보세요. 당신은 충분히 소중한 사람입니다.'}
            </p>
        </div>
    );
};

// 활동 바텀시트 컴포넌트
export const ActivityBottomSheet = ({ selectedActivity, isMobile, onClose, topCharacter, topCharacterId, charName, userNickname }) => {
    const [characterComment, setCharacterComment] = useState('');
    const [loadingComment, setLoadingComment] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const prevActivityKey = useRef('');
    const commentCache = useRef({});
    
    // 컴포넌트 마운트 시 캐릭터 코멘트 가져오기
    useEffect(() => {
        const fetchCharacterComment = async () => {
            if (!topCharacterId || !selectedActivity) return;
            
            // 활동이 바뀌었는지 확인
            const currentActivityKey = `${topCharacterId}-${selectedActivity.activity}`;
            
            // 캐시에 있으면 즉시 표시
            if (commentCache.current[currentActivityKey]) {
                setCharacterComment(commentCache.current[currentActivityKey]);
                setIsVisible(true);
                setLoadingComment(false);
                prevActivityKey.current = currentActivityKey;
                return;
            }
            
            // 다른 활동으로 바뀌었을 때만 페이드 아웃
            if (prevActivityKey.current && prevActivityKey.current !== currentActivityKey) {
                setIsVisible(false);
                // 약간의 딜레이 후 로딩 시작 (부드러운 전환)
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            
            prevActivityKey.current = currentActivityKey;
            setLoadingComment(true);
            
            try {
                const { api } = await import('../utils/api');
                const response = await api.getActivityComment({
                    character_id: topCharacterId,
                    activity_name: selectedActivity.activity,
                    user_nickname: userNickname || '사용자'
                });
                
                const newComment = response.comment || `${userNickname || '사용자'}, 이 활동을 실천해 보면 좋을 것 같아. 네 마음이 편안해지길 바라.`;
                
                // 캐시에 저장
                commentCache.current[currentActivityKey] = newComment;
                setCharacterComment(newComment);
            } catch (error) {
                console.error('캐릭터 코멘트 로드 실패:', error);
                const fallbackComment = `${userNickname || '사용자'}, 이 활동을 실천해 보면 좋을 것 같아. 네 마음이 편안해지길 바라.`;
                commentCache.current[currentActivityKey] = fallbackComment;
                setCharacterComment(fallbackComment);
            } finally {
                setLoadingComment(false);
                // 페이드 인
                setTimeout(() => setIsVisible(true), 50);
            }
        };
        
        fetchCharacterComment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topCharacterId, selectedActivity?.activity, userNickname]);
    
    if (!selectedActivity) return null;

    return (
        <>
            {/* 배경 어둡게 처리 (Dimmed) */}
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 2000,
                    animation: 'fadeIn 0.3s ease'
                }}
                onClick={onClose}
            />
            
            {/* 모바일: 바텀 시트, 웹: 팝업 모달 */}
            <div 
                className={isMobile ? "bottom-sheet" : "activity-popup"}
                style={isMobile ? {
                    // 모바일: 바텀 시트 스타일
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    maxHeight: '85vh',
                    backgroundColor: '#FAF8F5',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
                    zIndex: 2001,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden'
                } : {
                    // 웹: 팝업 모달 스타일
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: '500px',
                    maxHeight: '85vh',
                    backgroundColor: '#FAF8F5',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    zIndex: 2001,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'popupFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden'
                }}
            >
                {/* 헤더 */}
                <div style={{
                    padding: '24px 20px 20px 20px',
                    borderBottom: '1px solid #E8E0DB',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexShrink: 0
                }}>
                    {/* 활동 아이콘 (크게) */}
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#F5F1EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        flexShrink: 0
                    }}>
                        {selectedActivity.icon || '✨'}
                    </div>
                    
                    {/* 활동 제목 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#4A3B32',
                            margin: 0,
                            lineHeight: '1.3'
                        }}>
                            {selectedActivity.activity}
                        </h3>
                    </div>
                    
                    {/* 닫기 버튼 */}
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
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
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F5F1EB';
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3B32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                {/* 스크롤 가능한 콘텐츠 */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                }}>
                    {/* 상세 가이드 */}
                    <div>
                        <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#5D4037',
                            margin: '0 0 12px 0'
                        }}>
                            실천 방법
                        </h4>
                        <p style={{
                            fontSize: '0.95rem',
                            color: '#5D4037',
                            margin: 0,
                            lineHeight: '1.7',
                            whiteSpace: 'pre-line'
                        }}>
                            {selectedActivity.description || selectedActivity.practiceGuide || '이 활동을 꾸준히 실천해 보세요.'}
                        </p>
                        {selectedActivity.practiceGuide && (
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: '#F5F1EB',
                                borderRadius: '12px',
                                border: '1px solid #E8E0DB'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#8D6E63',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <img src="/lightbulb.png" alt="lightbulb" style={{ width: '16px', height: '16px' }} />
                                    오늘 바로 시작하기
                                </div>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: '#5D4037',
                                    margin: 0,
                                    lineHeight: '1.6'
                                }}>
                                    {selectedActivity.practiceGuide}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* 캐릭터 코멘트 섹션 - 말풍선 스타일 */}
                    {topCharacter && topCharacterId && (
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                        }}>
                            {/* 캐릭터 아바타 - 박스 밖으로 */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '3px solid #FFFFFF',
                                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
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
                            
                            {/* 말풍선 */}
                            <div style={{
                                flex: 1,
                                position: 'relative'
                            }}>
                                {/* 캐릭터 이름 라벨 */}
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#8D6E63',
                                    marginBottom: '6px',
                                    marginLeft: '4px'
                                }}>
                                    {charName}
                                </div>
                                
                                {/* 말풍선 박스 */}
                                <div style={{
                                    position: 'relative',
                                    padding: '14px 16px',
                                    background: '#FFFFFF',
                                    borderRadius: '16px',
                                    border: '2px solid #E8E0DB',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                    // 말풍선 꼬리 (CSS)
                                    '::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: '-10px',
                                        top: '16px',
                                        width: '0',
                                        height: '0',
                                        borderTop: '8px solid transparent',
                                        borderBottom: '8px solid transparent',
                                        borderRight: '10px solid #E8E0DB'
                                    }
                                }}>
                                    {/* 말풍선 꼬리 (실제 구현) */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '-10px',
                                        top: '16px',
                                        width: '0',
                                        height: '0',
                                        borderStyle: 'solid',
                                        borderWidth: '8px 10px 8px 0',
                                        borderColor: 'transparent #E8E0DB transparent transparent'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        left: '-7px',
                                        top: '18px',
                                        width: '0',
                                        height: '0',
                                        borderStyle: 'solid',
                                        borderWidth: '6px 8px 6px 0',
                                        borderColor: 'transparent #FFFFFF transparent transparent'
                                    }} />
                                    
                                    {/* 말풍선 내용 - 최소 높이 설정으로 레이아웃 시프트 방지 */}
                                    <div style={{
                                        minHeight: '48px',
                                        transition: 'opacity 0.3s ease-in-out',
                                        opacity: loadingComment ? 1 : (isVisible ? 1 : 0)
                                    }}>
                                        {loadingComment ? (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}>
                                                {/* 스켈레톤 라인 1 */}
                                                <div style={{
                                                    height: '12px',
                                                    background: 'linear-gradient(90deg, #E8E0DB 25%, #F5F1EB 50%, #E8E0DB 75%)',
                                                    backgroundSize: '200% 100%',
                                                    borderRadius: '6px',
                                                    animation: 'skeleton-loading 1.5s ease-in-out infinite',
                                                    width: '100%'
                                                }} />
                                                {/* 스켈레톤 라인 2 */}
                                                <div style={{
                                                    height: '12px',
                                                    background: 'linear-gradient(90deg, #E8E0DB 25%, #F5F1EB 50%, #E8E0DB 75%)',
                                                    backgroundSize: '200% 100%',
                                                    borderRadius: '6px',
                                                    animation: 'skeleton-loading 1.5s ease-in-out infinite',
                                                    animationDelay: '0.1s',
                                                    width: '85%'
                                                }} />
                                                {/* 스켈레톤 라인 3 */}
                                                <div style={{
                                                    height: '12px',
                                                    background: 'linear-gradient(90deg, #E8E0DB 25%, #F5F1EB 50%, #E8E0DB 75%)',
                                                    backgroundSize: '200% 100%',
                                                    borderRadius: '6px',
                                                    animation: 'skeleton-loading 1.5s ease-in-out infinite',
                                                    animationDelay: '0.2s',
                                                    width: '70%'
                                                }} />
                                                
                                                <style>
                                                    {`
                                                        @keyframes skeleton-loading {
                                                            0% {
                                                                background-position: 200% 0;
                                                            }
                                                            100% {
                                                                background-position: -200% 0;
                                                            }
                                                        }
                                                    `}
                                                </style>
                                            </div>
                                        ) : characterComment ? (
                                            <p style={{
                                                fontSize: '0.9rem',
                                                color: '#3E2723',
                                                margin: 0,
                                                lineHeight: '1.6',
                                                transition: 'opacity 0.3s ease-in-out'
                                            }}>
                                                {characterComment}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// 리포트 상세 보기 모달 컴포넌트
export const ReportDetailModal = ({ 
    selectedReport, 
    userProfile, 
    generatePersona, 
    generateTendencyData, 
    onClose,
    onDelete
}) => {
    if (!selectedReport) return null;

    // 저장된 리포트에 persona 정보가 있으면 그것을 사용, 없으면 새로 생성
    const savedPersona = selectedReport.persona || generatePersona(selectedReport);
    const savedTendencyData = generateTendencyData(selectedReport);

    const handleDelete = () => {
        if (window.confirm('이 리포트를 삭제하시겠습니까?')) {
            if (onDelete) {
                onDelete(selectedReport.id);
            }
            onClose();
        }
    };

    // 모바일 여부 확인
    const isMobile = window.innerWidth <= 768;

    return (
        <div className="modal-overlay" 
            style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                zIndex: 2002,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '0' : '20px'
            }}
            onClick={onClose}
        >
            <div 
                className="report-modal"
                style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: isMobile ? '0' : '20px',
                    padding: '0',
                    maxWidth: isMobile ? '100%' : '420px',
                    width: isMobile ? '100%' : '90%',
                    maxHeight: isMobile ? '100vh' : '90vh',
                    height: isMobile ? '100vh' : 'auto',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    position: 'relative',
                    margin: isMobile ? '0' : 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
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
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        <h2 style={{
                            color: '#4A3B32',
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            textAlign: 'center'
                        }}>
                            심리 리포트
                        </h2>
                        {selectedReport.date && (
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#8D6E63',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>{new Date(selectedReport.date).toLocaleDateString('ko-KR')}</span>
                                {selectedReport.episodeNumber && (
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontFamily: 'Georgia, "Times New Roman", serif',
                                        fontStyle: 'italic',
                                        opacity: 0.7
                                    }}>
                                        ep.{selectedReport.episodeNumber}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 리포트 콘텐츠 */}
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
                    {/* 페르소나 카드 */}
                    <PersonaCard persona={savedPersona} date={selectedReport.date} />
                    
                    {/* 성향 분석 슬라이더 */}
                    {savedTendencyData.length > 0 && (
                        <TendencySlider tendencyData={savedTendencyData} title="나의 대화 성향" />
                    )}
                    
                    {/* 키워드 */}
                    {selectedReport.keywords && selectedReport.keywords.length > 0 && (
                        <KeywordSection keywords={selectedReport.keywords} />
                    )}
                    
                    {/* 해석 */}
                    <InterpretationCard 
                        interpretation={selectedReport.interpretation} 
                        userProfile={userProfile} 
                    />
                    
                    {/* 삭제 버튼 */}
                    <button
                        onClick={handleDelete}
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            marginTop: '3px',
                            background: 'transparent',
                            color: '#D32F2F',
                            border: '1px solid #EF5350',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: 0.8
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFEBEE';
                            e.currentTarget.style.color = '#C62828';
                            e.currentTarget.style.borderColor = '#E57373';
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#D32F2F';
                            e.currentTarget.style.borderColor = '#EF5350';
                            e.currentTarget.style.opacity = '0.8';
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                        삭제하기
                    </button>
                </div>
            </div>
        </div>
    );
};

