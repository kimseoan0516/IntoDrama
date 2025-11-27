import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { characterData } from '../constants/characterData';

export const WeeklyRecapScreen = ({ onClose, token, refreshTrigger }) => {
    const [weeklyHistoryStats, setWeeklyHistoryStats] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [loading, setLoading] = useState(true);
    const monthSelectorRef = useRef(null);
    
    useEffect(() => {
        const fetchStats = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                const data = await api.getWeeklyHistoryStats();
                setWeeklyHistoryStats(data);
                
                // 현재 월로 초기화
                const now = new Date();
                setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
            } catch (error) {
                console.error('주별 통계 불러오기 실패:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token, refreshTrigger]);

    // 선택된 달이 항상 오른쪽 끝 근처에 보이도록 스크롤 조정 + 세로 스크롤 맨 위로
    useEffect(() => {
        if (!selectedMonth || !monthSelectorRef.current) return;
        const container = monthSelectorRef.current;
        const scrollContainer = container.parentElement;
        if (scrollContainer && scrollContainer.scrollTop !== 0) {
            scrollContainer.scrollTop = 0;
        }
        const activeBtn = container.querySelector('.month-button.active');
        if (!activeBtn) return;
        
        const offsetRight = activeBtn.offsetLeft + activeBtn.offsetWidth;
        const targetScrollLeft = offsetRight - container.clientWidth;
        container.scrollTo({
            left: Math.max(targetScrollLeft, 0),
            behavior: 'smooth'
        });
    }, [selectedMonth]);
    
    // 최근 6개월 생성 (과거 → 현재 순서, 현재 달이 항상 마지막)
    const getMonths = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push(monthKey);
        }
        return months;
    };
    
    // 선택된 월의 주별 데이터 필터링
    const getWeeksForMonth = () => {
        if (!weeklyHistoryStats || !weeklyHistoryStats.weeks || !selectedMonth) return [];
        
        return weeklyHistoryStats.weeks.filter(week => {
            const date = new Date(week.week_start);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === selectedMonth;
        });
    };
    
    const monthWeeks = getWeeksForMonth();
    
    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`;
    };
    
    const formatWeekDate = (weekStart) => {
        const date = new Date(weekStart);
        const day = String(date.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        return `${day} ${month}`;
    };
    
    // 월의 실제 주차 계산 (월의 첫 번째 주를 Week 1로)
    const getActualWeekNumber = (weekStart, selectedMonth) => {
        if (!selectedMonth) return 1;
        
        const [year, month] = selectedMonth.split('-');
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        // 월의 첫 번째 월요일 찾기
        const firstMonday = new Date(monthStart);
        const dayOfWeek = firstMonday.getDay(); // 0=일요일, 1=월요일, ...
        const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
        if (daysToMonday > 0) {
            firstMonday.setDate(firstMonday.getDate() + daysToMonday);
        }
        
        const weekDate = new Date(weekStart);
        const diffTime = weekDate - firstMonday;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekNum = Math.floor(diffDays / 7) + 1;
        
        return weekNum;
    };
    
    // 선택된 월의 모든 주 생성 (Week 1~5)
    const getAllWeeksForMonth = () => {
        if (!selectedMonth) return [];
        
        // 실제 데이터 가져오기
        const actualWeeks = getWeeksForMonth();
        
        const [year, month] = selectedMonth.split('-');
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0); // 월의 마지막 날
        
        // 월의 첫 번째 월요일 찾기
        const firstMonday = new Date(monthStart);
        const dayOfWeek = firstMonday.getDay();
        const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
        if (daysToMonday > 0) {
            firstMonday.setDate(firstMonday.getDate() + daysToMonday);
        }
        
        // 모든 주 생성 (최대 5주)
        const allWeeks = [];
        for (let i = 0; i < 5; i++) {
            const weekStart = new Date(firstMonday);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            
            if (weekStart > monthEnd) break;
            
            // 해당 주의 데이터 찾기 (같은 주의 월요일인지 확인)
            const weekData = actualWeeks.find(w => {
                const wDate = new Date(w.week_start);
                const diffTime = Math.abs(wDate - weekStart);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                return diffDays < 7;
            });
            
            allWeeks.push({
                week_start: weekStart.toISOString(),
                week_number: i + 1,
                has_data: !!weekData,
                data: weekData || null
            });
        }
        
        return allWeeks;
    };
    
    if (loading) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="stats-modal weekly-recap-modal" style={{ 
                    backgroundColor: '#FFFFFF',
                    color: '#3E2723',
                    borderRadius: '20px',
                    padding: '32px 28px 28px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 style={{ color: '#3E2723', margin: 0, fontSize: '1.5rem' }}>Weekly Recap</h2>
                        <button className="close-button" onClick={onClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div className="stats-content weekly-recap-content" style={{ backgroundColor: 'transparent', paddingTop: '8px' }}>
                        <p className="empty-message">불러오는 중...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const months = getMonths();
    
    if (!selectedMonth && months.length > 0) {
        // 항상 가장 최근 달(배열 마지막)을 기본 선택
        setSelectedMonth(months[months.length - 1]);
    }

    // 선택된 달의 모든 주 (달력 기반 Week 1~5)
    const allWeeks = getAllWeeksForMonth();
    
    return (
        <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="stats-modal weekly-recap-modal" style={{ 
                backgroundColor: '#FFFFFF',
                color: '#3E2723',
                borderRadius: '20px',
                padding: '36px 28px 32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ color: '#3E2723', margin: 0, marginLeft: '4px', fontSize: '1.5rem' }}>Weekly Recap</h2>
                    <button className="close-button" onClick={onClose} style={{ backgroundColor: 'transparent', color: '#8D6E63', border: 'none' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                {/* 월 선택 버튼 - 타이틀 바로 아래, 스크롤 영역 밖에 고정 */}
                <div
                    ref={monthSelectorRef}
                    className="month-selector"
                    style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginBottom: '16px',
                        marginTop: '0px',
                        justifyContent: 'flex-start',
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        touchAction: 'pan-x'
                    }}
                >
                        {months.map(month => {
                            const isActive = selectedMonth === month;
                            return (
                                <button
                                    key={month}
                                    onClick={() => setSelectedMonth(month)}
                                    className={`month-button ${isActive ? 'active' : ''}`}
                                    style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '50%',
                                        border: isActive ? '2px solid #D7CCC8' : '1.5px solid #E0D2C6',
                                        background: isActive 
                                            ? 'linear-gradient(135deg, #FAF6F0 0%, #EDE1D5 100%)'
                                            : '#FFFFFF',
                                        color: isActive ? '#5D4037' : '#BCAAA4',
                                        fontSize: '0.6rem',
                                        fontWeight: '400',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: isActive ? '0 4px 10px rgba(141, 110, 99, 0.25)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = '#F9F4EE';
                                            e.currentTarget.style.boxShadow = '0 3px 8px rgba(141, 110, 99, 0.18)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = '#FFFFFF';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    {formatMonthLabel(month)}
                                </button>
                            );
                        })}
                </div>
                
                <div 
                    className="stats-content weekly-recap-content" 
                    style={{ 
                        backgroundColor: 'transparent', 
                        paddingTop: '0',
                        padding: '0 20px 20px 20px'
                    }}
                >
                    {/* 주별 카드 */}
                    {(() => {
                        if (allWeeks.length === 0) {
                            return <p className="empty-message">이번 달 대화 기록이 없습니다.</p>;
                        }
                        
                        return (
                            <div className="weekly-recap-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {allWeeks.map((weekInfo, idx) => {
                                    const weekNum = weekInfo.week_number;
                                    const hasData = weekInfo.has_data;
                                    const week = weekInfo.data;
                                    
                                    // 현재 주(이번 주) 여부 계산
                                    const isCurrentWeek = (() => {
                                        if (!weekInfo.week_start) return false;
                                        const start = new Date(weekInfo.week_start);
                                        const end = new Date(start);
                                        end.setDate(end.getDate() + 6);

                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        start.setHours(0, 0, 0, 0);
                                        end.setHours(23, 59, 59, 999);

                                        return today >= start && today <= end;
                                    })();

                                    const defaultBackground = isCurrentWeek 
                                        ? 'linear-gradient(135deg, #E8DDD4 0%, #D7C5B8 100%)'
                                        : 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)';
                                    
                                    return (
                                        <div
                                            key={idx}
                                            style={{ position: 'relative', marginTop: idx === 0 ? 0 : 0 }}
                                        >
                                            {/* 이번주 뱃지 - week 박스 밖에 배치 */}
                                            {isCurrentWeek && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-6px',
                                                    left: '-8px',
                                                    background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                                                    color: '#FFFFFF',
                                                    padding: '4px 12px',
                                                    borderRadius: '50px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    letterSpacing: '0.3px',
                                                    boxShadow: '0 3px 8px rgba(107, 78, 61, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)',
                                                    zIndex: 10,
                                                    whiteSpace: 'nowrap',
                                                    pointerEvents: 'none'
                                                }}>
                                                    이번주
                                                </div>
                                            )}
                                            <div
                                                className="weekly-recap-card"
                                                style={{
                                                    padding: '12px 18px',
                                                    background: defaultBackground,
                                                    borderRadius: '16px',
                                                    color: isCurrentWeek ? '#5D4037' : '#FFFFFF',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 5px 14px rgba(141, 110, 99, 0.26)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    minHeight: '60px',
                                                    border: isCurrentWeek ? '2px solid #D7C5B8' : 'none'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (isCurrentWeek) {
                                                        e.currentTarget.style.background = 'linear-gradient(135deg, #E0D3C8 0%, #D0BDAE 100%)';
                                                    } else {
                                                        e.currentTarget.style.background = 'linear-gradient(135deg, #9B7A6B 0%, #7A5A4F 100%)';
                                                    }
                                                    e.currentTarget.style.boxShadow = '0 10px 26px rgba(141, 110, 99, 0.4)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = defaultBackground;
                                                    e.currentTarget.style.boxShadow = '0 5px 14px rgba(141, 110, 99, 0.26)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                            {/* 왼쪽: Week 정보 + 시작 날짜 */}
                                            <div>
                                                <div style={{ fontSize: '1.3rem', fontWeight: '800', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                    {`Week ${weekNum}`}
                                                </div>
                                                {weekInfo.week_start && (
                                                    <div style={{ marginTop: '4px', fontSize: '0.8rem', opacity: 0.9 }}>
                                                        {formatWeekDate(weekInfo.week_start)}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 오른쪽: 캐릭터 이미지들 (데이터가 있을 때만) */}
                                            {hasData && week && week.top_characters && week.top_characters.length > 0 ? (
                                                <div style={{ 
                                                    position: 'relative',
                                                    height: '58px',
                                                    width: '158px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end'
                                                }}>
                                                    {week.top_characters.slice(0, 3).map((char, charIdx) => {
                                                        const charInfo = characterData[char.character_id];
                                                        const charImage = charInfo?.image || '/default-character.png';
                                                        const zIndex = 3 - charIdx;
                                                        
                                                        return (
                                                            <div
                                                                key={char.character_id}
                                                                style={{
                                                                    width: '60px',
                                                                    height: '60px',
                                                                    borderRadius: '50%',
                                                                    overflow: 'hidden',
                                                                    border: '2px solid rgba(255, 255, 255, 0.7)',
                                                                    boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
                                                                    position: 'relative',
                                                                    zIndex: zIndex,
                                                                    marginLeft: charIdx === 0 ? 0 : -18
                                                                }}
                                                            >
                                                                <img 
                                                                    src={charImage} 
                                                                    alt={charInfo?.name || 'Character'}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div style={{ 
                                                    width: '158px',
                                                    height: '58px'
                                                }}></div>
                                            )}
                                        </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

