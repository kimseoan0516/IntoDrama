import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { characterData } from '../constants/characterData';

export const WeeklyRecapScreen = ({ onClose, token, refreshTrigger, onWeekClick }) => {
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
    
    // 최근 7개월 생성 (과거 → 현재 순서, 현재 달이 항상 마지막)
    const getMonths = () => {
        const months = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) { // 6부터 0까지 = 7개월
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
        return monthNames[parseInt(month) - 1]; // 월만 반환 (연도 제거)
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
        
        // 모든 주 생성 (최대 5주, 단 미래 주차는 제외)
        const allWeeks = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 5; i++) {
            const weekStart = new Date(firstMonday);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            
            if (weekStart > monthEnd) break;
            
            // 미래 주차는 건너뛰기 (주의 시작일이 오늘보다 이후면 제외)
            if (weekStart > today) break;
            
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
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '85vh',
                    maxHeight: '85vh',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        flexShrink: 0,
                        padding: '28px 28px 0 28px',
                        borderBottom: '1px solid #F5F1EB'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ color: '#3E2723', margin: 0, fontSize: '1.5rem' }}>Weekly Recap</h2>
                            <button className="close-button" onClick={onClose}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="stats-content weekly-recap-content" style={{ 
                        backgroundColor: 'transparent', 
                        padding: '20px',
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        minHeight: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
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
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                height: '85vh',
                maxHeight: '85vh',
                overflow: 'hidden'
            }}>
                {/* 상단 고정 영역: 제목 + 월 선택 버튼 */}
                <div style={{ 
                    flexShrink: 0,
                    padding: '28px 28px 0 28px',
                    borderBottom: '1px solid #F5F1EB'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={{ color: '#3E2723', margin: 0, marginLeft: '4px', fontSize: '1.5rem' }}>Weekly Recap</h2>
                        <button className="close-button" onClick={onClose} style={{ backgroundColor: 'transparent', color: '#8D6E63', border: 'none' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    {/* 월 선택 버튼 - 텍스트 슬라이더 스타일 */}
                    <div
                        ref={monthSelectorRef}
                        className="month-selector"
                        style={{ 
                            display: 'flex', 
                            gap: '24px', /* 간격 24px (20px -> 24px로 증가) */
                            marginBottom: '8px', /* 여백 대폭 줄임 */
                            marginTop: '0px',
                            justifyContent: 'flex-start',
                            paddingLeft: '0px',
                            paddingRight: '0px',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            touchAction: 'pan-x',
                            minHeight: '40px', /* 컴팩트한 높이 */
                            boxSizing: 'border-box',
                            scrollbarWidth: 'none', /* Firefox: 스크롤바 숨김 */
                            msOverflowStyle: 'none' /* IE/Edge: 스크롤바 숨김 */
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
                                            border: 'none', /* 테두리 제거 */
                                            background: 'transparent', /* 배경색 제거 */
                                            color: isActive ? '#4A3B32' : 'rgba(0, 0, 0, 0.4)', /* 선택된 월: 진한 갈색, 선택 안 된 월: 연한 회색 */
                                            fontSize: '0.95rem',
                                            fontWeight: isActive ? '700' : '400', /* 선택된 월: 굵게, 선택 안 된 월: 얇게 */
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            padding: '0',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = 'rgba(0, 0, 0, 0.6)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = 'rgba(0, 0, 0, 0.4)';
                                            }
                                        }}
                                    >
                                        <span>{formatMonthLabel(month)}</span>
                                        {/* 선택된 월 아래 점 표시 */}
                                        {isActive && (
                                            <span style={{
                                                display: 'block',
                                                width: '4px',
                                                height: '4px',
                                                borderRadius: '50%',
                                                background: '#4A3B32',
                                                marginTop: '4px'
                                            }}></span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>
                
                {/* 하단 스크롤 영역: Week 카드 리스트만 스크롤 */}
                <div 
                    className="stats-content weekly-recap-content" 
                    style={{ 
                        backgroundColor: 'transparent', 
                        paddingTop: '10px', /* 50% 수준으로 줄임 (20px -> 10px) */
                        padding: '10px 0 20px 0', /* 상하 패딩만 유지, 좌우는 리스트 컨테이너에서 처리 */
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'visible', /* 뱃지가 잘리지 않도록 visible로 변경 */
                        minHeight: 0,
                        boxSizing: 'border-box'
                    }}
                >
                    {/* 주별 카드 */}
                    {(() => {
                        if (allWeeks.length === 0) {
                            return <p className="empty-message">이번 달 대화 기록이 없습니다.</p>;
                        }
                        
                        return (
                            <div className="weekly-recap-list" style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '16px', 
                                width: '100%', 
                                maxWidth: '100%', 
                                boxSizing: 'border-box',
                                paddingLeft: '28px', /* 왼쪽 여백 증가 (뱃지 공간 확보) */
                                paddingRight: '20px', /* 오른쪽 여백 추가 (스크롤바 공간 확보) */
                                paddingTop: '12px' /* 상단 여백 추가 (뱃지 공간 확보) */
                            }}>
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
                                            style={{ 
                                                position: 'relative', 
                                                marginTop: idx === 0 ? 0 : 0,
                                                overflow: 'visible' /* 뱃지가 잘리지 않도록 visible 설정 */
                                            }}
                                        >
                                            {/* 이번주 뱃지 - week 박스 밖에 배치 */}
                                            {isCurrentWeek && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-8px', /* 상단 여백 약간 증가 */
                                                    left: '0px', /* 왼쪽 여백을 0으로 조정 (컨테이너 padding으로 처리) */
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
                                                    border: isCurrentWeek ? '2px solid #D7C5B8' : 'none',
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    boxSizing: 'border-box',
                                                    cursor: 'pointer'
                                                }}
                                            onClick={() => {
                                                if (onWeekClick) {
                                                    // 기록이 없어도 클릭 가능하도록 변경
                                                    onWeekClick(hasData ? week : null, weekInfo.week_start);
                                                }
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

