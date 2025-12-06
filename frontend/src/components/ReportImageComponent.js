import React from 'react';
import { characterData } from '../constants/characterData';

// 리포트 이미지 저장용 별도 컴포넌트 (현재 UI 스타일 적용)
export const ReportImageComponent = ({ report, userProfile, persona, tendencyData, messages }) => {
    if (!report) return null;
    
    // 감정 요약 데이터 (이모지 대신 텍스트와 점수)
    const getEmotionSummary = () => {
        const { stats } = report;
        const { romanceScore, comfortScore, conflictScore } = stats;
        
        const emotions = [
            { score: romanceScore, name: '로맨스', color: '#E91E63' },
            { score: comfortScore, name: '위로', color: '#4CAF50' },
            { score: conflictScore, name: '갈등', color: '#FF9800' }
        ];
        
        // 점수 순으로 정렬하고 상위 3개 선택
        return emotions.sort((a, b) => b.score - a.score).slice(0, 3);
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
    
    const emotionSummary = getEmotionSummary();
    const recommendationActivities = report?.suggestions?.slice(0, 3) || [];
    
    return (
        <div data-report-content="true" style={{
            width: '600px',
            minHeight: '900px',
            backgroundColor: '#FFFFFF',
            padding: '40px 50px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
            color: '#5D4037',
            boxSizing: 'border-box',
            position: 'relative',
            border: '1px solid #E8E0DB',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
            {/* 헤더 */}
            <div style={{
                marginBottom: '40px',
                paddingBottom: '24px',
                borderBottom: '1.5px solid #E8E0DB'
            }}>
                <div style={{
                    fontSize: '11px',
                    color: '#8D6E63',
                    marginBottom: '8px',
                    letterSpacing: '2px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    Weekly Mind Report
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#A1887F',
                    letterSpacing: '0.5px',
                    fontWeight: '400',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    {formatDate(report.date)}
                </div>
            </div>
            
            {/* 1. 마음 상태 진단 */}
            <div style={{
                background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F1EB 100%)',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid #E8E0DB',
                marginBottom: '32px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '12px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    1. 마음 상태 진단
                </div>
                <h2 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#5D4037',
                    margin: '0 0 16px 0',
                    lineHeight: '1.3',
                    letterSpacing: '-0.5px',
                    fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                    textAlign: 'left',
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-line'
                }}>
                    {persona?.title || '마음 상태 진단'}
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: '#5D4037',
                    margin: 0,
                    lineHeight: '1.6',
                    textAlign: 'left',
                    fontWeight: '400',
                    fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                    wordBreak: 'keep-all'
                }}>
                    {persona?.summary || '이번 주 대화를 분석한 결과입니다.'}
                </p>
            </div>
            
            {/* 2. 이번 주 감정 요약 */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid #E8E0DB',
                marginBottom: '32px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '20px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    2. 이번 주 감정 요약
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {emotionSummary.map((emotion, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '70px',
                                fontSize: '12px',
                                color: '#5D4037',
                                fontWeight: '600',
                                fontFamily: '"Noto Sans KR", sans-serif',
                                textAlign: 'left'
                            }}>
                                {emotion.name}
                            </div>
                            <div style={{
                                flex: 1,
                                height: '8px',
                                backgroundColor: '#F5F1EB',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: `${emotion.score}%`,
                                    height: '100%',
                                    backgroundColor: emotion.color,
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                            <div style={{
                                width: '45px',
                                fontSize: '12px',
                                color: '#5D4037',
                                fontWeight: '600',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                textAlign: 'right'
                            }}>
                                {Math.round(emotion.score)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* 3. 맞춤 처방 */}
            {recommendationActivities.length > 0 && (
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1.5px solid #E8E0DB',
                    marginBottom: '32px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                    <div style={{
                        fontSize: '8px',
                        color: '#A1887F',
                        marginBottom: '16px',
                        letterSpacing: '1.5px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}>
                        3. 맞춤 처방
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {recommendationActivities.map((activity, idx) => {
                            const activityData = typeof activity === 'string' ? { activity, description: '', icon: '✨' } : activity;
                            return (
                                <div key={idx} style={{
                                    background: '#FAF8F5',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    border: '1px solid #E8E0DB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        fontSize: '1.4rem',
                                        flexShrink: 0
                                    }}>
                                        {activityData.icon || '✨'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#5D4037',
                                            marginBottom: '4px',
                                            fontFamily: '"Noto Sans KR", sans-serif'
                                        }}>
                                            {activityData.activity}
                                        </div>
                                        {activityData.description && (
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#8D6E63',
                                                lineHeight: '1.4',
                                                fontFamily: '"Noto Sans KR", sans-serif'
                                            }}>
                                                {activityData.description.substring(0, 80)}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* 4. 추천 BGM */}
            {report?.bgmRecommendation && (
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1.5px solid #E8E0DB',
                    marginBottom: '32px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                    <div style={{
                        fontSize: '8px',
                        color: '#A1887F',
                        marginBottom: '16px',
                        letterSpacing: '1.5px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}>
                        4. 추천 BGM
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F5F1EB 0%, #E8E0DB 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            flexShrink: 0
                        }}>
                            🎵
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: '#5D4037',
                                marginBottom: '4px',
                                fontFamily: '"Noto Sans KR", sans-serif'
                            }}>
                                {report.bgmRecommendation.title}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#8D6E63',
                                marginBottom: '2px',
                                fontFamily: '"Noto Sans KR", sans-serif'
                            }}>
                                {report.bgmRecommendation.artist}
                            </div>
                            {report.bgmRecommendation.drama && (
                                <div style={{
                                    fontSize: '11px',
                                    color: '#A1887F',
                                    fontFamily: '"Noto Sans KR", sans-serif'
                                }}>
                                    {report.bgmRecommendation.drama}
                                </div>
                            )}
                        </div>
                    </div>
                    {report.bgmRecommendation.comment && (
                        <div style={{
                            marginTop: '14px',
                            paddingTop: '14px',
                            borderTop: '1px solid #E8E0DB'
                        }}>
                            <p style={{
                                fontSize: '12px',
                                color: '#5D4037',
                                margin: 0,
                                lineHeight: '1.6',
                                fontFamily: '"Noto Sans KR", sans-serif'
                            }}>
                                {report.bgmRecommendation.comment}
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            {/* 5. From. 마음기록 상담사 */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid #E8E0DB',
                marginBottom: '32px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    fontSize: '8px',
                    color: '#A1887F',
                    marginBottom: '16px',
                    letterSpacing: '1.5px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    5. 마음기록 상담사
                </div>
                <p style={{
                    fontSize: '14px',
                    color: '#5D4037',
                    margin: 0,
                    lineHeight: '1.7',
                    fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: '400',
                    textAlign: 'left',
                    wordBreak: 'keep-all',
                    marginBottom: '20px'
                }}>
                    {report.interpretation || persona?.summary || '최근 대화를 보니 다양한 감정이 섞여 있었어요. 많이 힘드셨죠? 지금 이 순간, 당신의 마음을 알아주고 싶어요. 무리하지 말고 잠시 쉬어도 괜찮아요. 당신은 충분히 소중한 사람입니다.'}
                </p>
                <div style={{
                    textAlign: 'right',
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid #E8E0DB'
                }}>
                    <div style={{
                        fontSize: '12px',
                        color: '#8D6E63',
                        fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: '400'
                    }}>
                        From. 마음기록 상담사
                    </div>
                </div>
            </div>
            
            {/* 푸터 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '24px',
                borderTop: '1px solid #E8E0DB',
                marginTop: 'auto'
            }}>
                <div style={{
                    fontSize: '10px',
                    color: '#A1887F',
                    letterSpacing: '0.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    {formatDate(report.date)}
                </div>
                <div style={{
                    fontSize: '10px',
                    color: '#A1887F',
                    letterSpacing: '0.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                    IntoDrama에서 발행됨
                </div>
            </div>
        </div>
    );
};

