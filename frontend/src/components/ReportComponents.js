import React from 'react';

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
                {userProfile?.nickname || '서안'}님께
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
export const ActivityBottomSheet = ({ selectedActivity, isMobile, onClose }) => {
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
                                    marginBottom: '8px'
                                }}>
                                    💡 오늘 바로 시작하기
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
    onClose 
}) => {
    if (!selectedReport) return null;

    const savedPersona = generatePersona(selectedReport);
    const savedTendencyData = generateTendencyData(selectedReport);

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
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '20px',
                    padding: '0',
                    maxWidth: '420px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    position: 'relative'
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
                    <h2 style={{
                        color: '#4A3B32',
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        심리 리포트 Ep.{selectedReport.episode}
                    </h2>
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
                </div>
            </div>
        </div>
    );
};

