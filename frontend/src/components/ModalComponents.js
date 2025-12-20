import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { api } from '../utils/api';
import { auth } from '../utils/storage';
import { CustomDropdown } from './CommonComponents';
import { characterData } from '../constants/characterData';

// 시간 선택 아이콘 컴포넌트
const TimeIcon = ({ type, isSelected }) => {
    const iconColor = isSelected ? '#FFFFFF' : '#5D4037';
    const iconSize = 14;
    
    const icons = {
        now: (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
        ),
        tonight: (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        ),
        morning: (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        ),
        lunch: (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                <path d="M7 2v20"></path>
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v0"></path>
                <path d="M21 15v7"></path>
            </svg>
        ),
        custom: (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
        )
    };
    
    return icons[type] || null;
};

export const ArchetypeMapModal = ({ data, characterData, isLoading, onClose }) => {
    const width = 400;
    const height = 400;
    const padding = 60;
    
    // 로딩 중일 때는 "불러오는 중..." 표시
    if (isLoading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="my-page-modal archetype-map-modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <h2>캐릭터 성향 지도</h2>
                    <p className="empty-message">불러오는 중...</p>
                </div>
            </div>
        );
    }
    
    if (!data || !data.characters || data.characters.length === 0) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="my-page-modal archetype-map-modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <h2>캐릭터 성향 지도</h2>
                    <p className="empty-message">성향 지도 데이터를 불러올 수 없습니다.</p>
                    <button className="save-button" onClick={onClose}>확인</button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="my-page-modal archetype-map-modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h2>캐릭터 성향 지도</h2>
                <div style={{ position: 'relative', width: '100%', height: `${height}px`, background: '#FBF9F7', borderRadius: '12px', border: '1px solid #E8E0DB', marginBottom: '20px' }}>
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                        {/* 축 라인 */}
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#D7CCC8" strokeWidth="2" />
                        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#D7CCC8" strokeWidth="2" />
                        
                        {/* 축 레이블 */}
                        <text x={width / 2} y={height - 20} textAnchor="middle" fill="#8D6E63" fontSize="14" fontWeight="600">따뜻함 ← → 차가움</text>
                        <text x={35} y={height / 2} textAnchor="middle" fill="#8D6E63" fontSize="14" fontWeight="600" transform={`rotate(-90, 35, ${height / 2})`}>이상적 ← → 현실적</text>
                        
                        {/* 캐릭터 포인트 */}
                        {data.characters && data.characters.map((char, idx) => {
                            // 백엔드에서 x(warmth: 0.0=차가움, 1.0=따뜻함), y(realism: 0.0=이상적, 1.0=현실적)를 반환
                            // x축: 따뜻함(왼쪽) ← → 차가움(오른쪽) - warmth가 높을수록 왼쪽
                            // y축: 이상적(아래) ← → 현실적(위) - realism이 높을수록 위
                            const warmth = char.x !== undefined ? char.x : (char.warmth !== undefined ? char.warmth : 0.5);
                            const realism = char.y !== undefined ? char.y : (char.realism !== undefined ? char.realism : 0.5);
                            
                            // 따뜻함이 왼쪽이므로: warmth가 1.0이면 왼쪽(0), 0.0이면 오른쪽(1)
                            const x = padding + ((1 - warmth) * (width - 2 * padding));
                            // 이상적이 아래이므로: realism이 0.0이면 아래(1), 1.0이면 위(0)
                            const y = padding + ((1 - realism) * (height - 2 * padding));
                            const charInfo = characterData[char.id || char.character_id];
                            
                            return (
                                <g key={idx}>
                                    <circle cx={x} cy={y} r="8" fill="#8D6E63" />
                                    <text x={x} y={y - 15} textAnchor="middle" fill="#3E2723" fontSize="12" fontWeight="600">
                                        {charInfo ? charInfo.name.split(' (')[0] : (char.name || '')}
                                    </text>
                                </g>
                            );
                        })}
                        
                    </svg>
                </div>
                <button className="save-button" onClick={onClose}>확인</button>
            </div>
        </div>
    );
};

export const DiaryCalendar = ({ diaryList, onDateSelect, selectedDate: externalSelectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(externalSelectedDate || null);
    
    useEffect(() => {
        if (externalSelectedDate !== undefined) {
            setSelectedDate(externalSelectedDate);
        }
    }, [externalSelectedDate]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 일기 작성 날짜 추출
    const diaryDates = new Set(
        diaryList.map(d => {
            if (!d.date) return null;
            const date = new Date(d.date);
            if (isNaN(date.getTime())) return null;
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }).filter(d => d !== null)
    );
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 달력 날짜 배열 생성
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    // 첫 주 빈 칸
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    
    // 날짜 배열 생성
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        days.push({
            day,
            date: dateStr,
            hasDiary: diaryDates.has(dateStr),
            isToday: dateStr === todayStr
        });
    }
    
    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };
    
    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };
    
    const handleDateClick = (date) => {
        if (date && date.hasDiary) {
            setSelectedDate(date.date);
            onDateSelect(date.date);
        } else if (date) {
            setSelectedDate(date.date);
            onDateSelect(date.date);
        }
    };
    
    return (
        <div className="diary-calendar">
            <div className="diary-calendar-header">
                <button className="diary-calendar-nav" onClick={prevMonth}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h3 className="diary-calendar-title">{year}년 {month + 1}월</h3>
                <button className="diary-calendar-nav" onClick={nextMonth}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
            <div className="diary-calendar-weekdays">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="diary-calendar-weekday">{day}</div>
                ))}
            </div>
            <div className="diary-calendar-days">
                {days.map((date, idx) => (
                    <div
                        key={idx}
                        className={`diary-calendar-day ${!date ? 'empty' : ''} ${date && date.hasDiary ? 'has-diary' : ''} ${date && date.isToday ? 'is-today' : ''} ${date && selectedDate === date.date ? 'selected' : ''}`}
                        onClick={() => handleDateClick(date)}
                    >
                        {date && (
                            <span>{date.day}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const DatePickerCalendar = ({ value, onChange, onClose, maxDate = null }) => {
    const [currentDate, setCurrentDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const selectedDateStr = value || todayStr;
    
    // 오늘 이후 날짜만 비활성화 (오늘은 선택 가능)
    const maxDateObj = maxDate ? new Date(maxDate + 'T00:00:00') : today;
    if (maxDateObj) {
        maxDateObj.setHours(0, 0, 0, 0);
    }
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(dateStr + 'T00:00:00');
        dateObj.setHours(0, 0, 0, 0);
        let isDisabled = false;
        
        // 오늘 이후 날짜만 비활성화 (오늘은 선택 가능)
        // maxDate가 있으면 maxDate 이후, 없으면 오늘 이후 날짜만 비활성화
        const compareDate = maxDateObj || today;
        isDisabled = dateObj > compareDate;
        
        days.push({
            day,
            date: dateStr,
            isToday: dateStr === todayStr,
            isSelected: dateStr === selectedDateStr,
            isDisabled: isDisabled
        });
    }
    
    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };
    
    const nextMonth = () => {
        // 미래 월 이동 제한
        const nextMonthDate = new Date(year, month + 1, 1);
        if (maxDateObj && nextMonthDate > maxDateObj) {
            return;
        }
        setCurrentDate(nextMonthDate);
    };
    
    const handleDateClick = (date) => {
        if (!date || date.isDisabled) {
            return;
        }
        onChange(date.date);
        onClose();
    };
    
    const handleTodayClick = () => {
        const todayDate = new Date();
        const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
        onChange(todayStr);
        onClose();
    };
    
    return (
        <div className="date-picker-calendar" onClick={(e) => e.stopPropagation()}>
            <div className="date-picker-calendar-header">
                <button type="button" className="date-picker-calendar-nav" onClick={prevMonth}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h3 className="date-picker-calendar-title">{year}년 {month + 1}월</h3>
                <button type="button" className="date-picker-calendar-nav" onClick={nextMonth}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
            <div className="date-picker-calendar-weekdays">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="date-picker-calendar-weekday">{day}</div>
                ))}
            </div>
            <div className="date-picker-calendar-days">
                {days.map((date, idx) => (
                    <div
                        key={idx}
                        className={`date-picker-calendar-day ${!date ? 'empty' : ''} ${date && date.isToday ? 'is-today' : ''} ${date && date.isSelected ? 'selected' : ''} ${date && date.isDisabled ? 'disabled' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (date && !date.isDisabled) {
                                handleDateClick(date);
                            }
                        }}
                    >
                        {date && (
                            <span>{date.day}</span>
                        )}
                    </div>
                ))}
            </div>
            <div className="date-picker-calendar-actions">
                <button type="button" className="date-picker-today-button" onClick={handleTodayClick}>
                    오늘
                </button>
            </div>
        </div>
    );
};

export const DiaryModal = ({ diaryData, diaryList, isGenerating, onGenerate, onClose, token, onDiarySelect, onDeleteDiary, onRefreshList, onShowExchangeDiary, fromChat = false }) => {
    const [selectedDiary, setSelectedDiary] = useState(diaryData);
    const [isWritingMode, setIsWritingMode] = useState(false);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
    const [writingTitle, setWritingTitle] = useState('');
    const [writingContent, setWritingContent] = useState('');
    const [writingWeather, setWritingWeather] = useState('맑음');
    const [writingEmotions, setWritingEmotions] = useState([]);
    const [writingDate, setWritingDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const datePickerRef = useRef(null);
    const datePickerPopupRef = useRef(null);
    const [requestReply, setRequestReply] = useState(false);
    const [selectedCharacterId, setSelectedCharacterId] = useState(null);
    const [showCharacterSelector, setShowCharacterSelector] = useState(false);
    const [unreadRepliesCount, setUnreadRepliesCount] = useState(0);
    const [showAIOptions, setShowAIOptions] = useState(false);
    const [aiGenerationType, setAIGenerationType] = useState(null); // 'chat' or 'keyword'
    const [keywordInput, setKeywordInput] = useState('');
    const [selectedReplyTime, setSelectedReplyTime] = useState('now'); // 'now', 'tonight', 'tomorrow_morning', 'tomorrow_lunch', 'custom'
    const [customTime, setCustomTime] = useState(''); // 사용자가 직접 선택한 시간 (HH:mm 형식)
    const [customTimePeriod, setCustomTimePeriod] = useState('am');
    const [customHour, setCustomHour] = useState('8');
    const [customMinute, setCustomMinute] = useState('00');
    const keywordTextareaRef = useRef(null);
    const [todayTopic, setTodayTopic] = useState(null); // 오늘의 주제
    
    const hourOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const minuteOptions = ['00', '10', '20', '30', '40', '50'];
    
    const syncCustomStateFromTimeString = (timeStr) => {
        if (!timeStr || !timeStr.includes(':')) return;
        const [hourStr, minuteStr] = timeStr.split(':');
        let hourNum = parseInt(hourStr, 10);
        if (isNaN(hourNum)) return;
        const periodValue = hourNum >= 12 ? 'pm' : 'am';
        let displayHour = hourNum % 12;
        if (displayHour === 0) {
            displayHour = 12;
        }
        const hourLabel = String(displayHour);
        const rawMinute = String((minuteStr || '00')).padStart(2, '0');
        const minuteLabel = minuteOptions.includes(rawMinute) ? rawMinute : '00';
        if (customTimePeriod !== periodValue) {
            setCustomTimePeriod(periodValue);
        }
        if (customHour !== hourLabel) {
            setCustomHour(hourLabel);
        }
        if (customMinute !== minuteLabel) {
            setCustomMinute(minuteLabel);
        }
    };
    
    const convertTo24Hour = (hourValue, periodValue) => {
        let hourNum = parseInt(hourValue, 10);
        if (isNaN(hourNum) || hourNum < 1) {
            hourNum = 8;
        }
        if (periodValue === 'pm' && hourNum !== 12) {
            hourNum += 12;
        } else if (periodValue === 'am' && hourNum === 12) {
            hourNum = 0;
        }
        return String(hourNum).padStart(2, '0');
    };
    
    const updateCustomTimeValue = (hourValue = customHour, minuteValue = customMinute, periodValue = customTimePeriod) => {
        const formattedHour = convertTo24Hour(hourValue, periodValue);
        const formattedMinute = minuteValue.padStart(2, '0');
        setCustomTime(`${formattedHour}:${formattedMinute}`);
    };
    
    const ensureCustomTimeInitialized = () => {
        if (customTime) {
            syncCustomStateFromTimeString(customTime);
        } else {
            setCustomTimePeriod('am');
            setCustomHour('8');
            setCustomMinute('00');
            setCustomTime('08:00');
        }
    };
    
    const handleCustomReplyTimeSelect = () => {
        ensureCustomTimeInitialized();
        setSelectedReplyTime('custom');
    };
    
    const handleHourSelect = (hourValue) => {
        setCustomHour(hourValue);
        updateCustomTimeValue(hourValue, customMinute, customTimePeriod);
    };
    
    const handleMinuteSelect = (minuteValue) => {
        setCustomMinute(minuteValue);
        updateCustomTimeValue(customHour, minuteValue, customTimePeriod);
    };
    
    const handlePeriodSelect = (periodValue) => {
        setCustomTimePeriod(periodValue);
        updateCustomTimeValue(customHour, customMinute, periodValue);
    };
    
    useEffect(() => {
        if (diaryData) {
            setSelectedDiary(diaryData);
            setIsWritingMode(false);
            setShowAIOptions(false);
            setAIGenerationType(null);
            setKeywordInput('');
            // 일기 생성 중이 아닐 때만 답장 관련 상태 초기화
            if (!isGenerating) {
                setRequestReply(false);
                setSelectedCharacterId(null);
                setSelectedReplyTime('now');
                setCustomTime('');
            }
            if (diaryData.date) {
                const date = new Date(diaryData.date);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                setSelectedCalendarDate(dateStr);
            }
        } else {
            // diaryData가 null일 때도 selectedDiary를 null로 설정
            setSelectedDiary(null);
        }
    }, [diaryData, isGenerating]);
    
    // 모바일 감지
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 480);
        };
        handleResize(); // 초기값 설정
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // 오늘의 주제 가져오기
    useEffect(() => {
        const fetchTodayTopic = async () => {
            if (!token) return;
            try {
                const data = await api.getTodayTopic();
                console.log('오늘의 주제 데이터:', data);
                // 주제가 있으면 표시 (답장에서 받은 주제 또는 랜덤 주제)
                if (data && data.topic) {
                    setTodayTopic(data);
                } else {
                    setTodayTopic(null);
                }
            } catch (error) {
                console.error('오늘의 주제 가져오기 실패:', error);
                setTodayTopic(null);
            }
        };
        
        fetchTodayTopic();
    }, [token]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDatePicker && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                const inputElement = event.target.closest('.diary-form-input');
                if (!inputElement || inputElement.type !== 'text' || !inputElement.readOnly) {
                    setShowDatePicker(false);
                }
            }
        };
        
        if (showDatePicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDatePicker]);

    useEffect(() => {
        if (showDatePicker && datePickerRef.current && datePickerPopupRef.current) {
            const updatePosition = () => {
                const inputRect = datePickerRef.current.getBoundingClientRect();
                const popup = datePickerPopupRef.current;
                const popupHeight = popup.offsetHeight || 350;
                const popupWidth = popup.offsetWidth || 280;
                
                const spaceBelow = window.innerHeight - inputRect.bottom;
                const spaceAbove = inputRect.top;
                const spaceLeft = inputRect.left;
                const spaceRight = window.innerWidth - inputRect.right;
                
                let top = 'calc(100% + 8px)';
                let left = '50%';
                let transform = 'translateX(-50%)';
                
                // 화면 하단 공간 부족 시 상단에 표시
                if (spaceBelow < popupHeight && spaceAbove > spaceBelow) {
                    top = 'auto';
                    popup.style.bottom = 'calc(100% + 8px)';
                    popup.style.top = 'auto';
                } else {
                    popup.style.top = top;
                    popup.style.bottom = 'auto';
                }
                
                popup.style.left = left;
                popup.style.transform = transform;
            };
            
            updatePosition();
            
            // 스크롤 및 리사이즈 시 위치 업데이트
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [showDatePicker]);

    // 날짜 포맷팅 함수 (요일 포함)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[date.getDay()];
        return `${year}.${month}.${day} (${weekday})`;
    };
    
    // 날짜 입력 필드용 포맷팅 함수
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[date.getDay()];
        return `${year}.${month}.${day} (${weekday})`;
    };

    const handleExportImage = async () => {
        if (!selectedDiary) return;
        
        try {
            const tempContainer = document.createElement('div');
            tempContainer.className = 'diary-content-export';
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '800px';
            tempContainer.style.background = '#FFFFFF';
            tempContainer.style.padding = '40px 60px';
            tempContainer.style.fontSize = '1rem';
            tempContainer.style.lineHeight = '1.8';
            tempContainer.style.color = '#3E2723';
            
            const formattedDate = formatDate(selectedDiary.date);
            const getWeatherEmoji = (weather) => {
                const weatherLower = weather.toLowerCase();
                if (weatherLower.includes('맑음') || weatherLower.includes('맑은')) return '☀️';
                if (weatherLower.includes('흐림') || weatherLower.includes('흐린')) return '☁️';
                if (weatherLower.includes('비') || weatherLower.includes('소나기')) return '🌦️';
                if (weatherLower.includes('눈')) return '❄️';
                if (weatherLower.includes('바람') || weatherLower.includes('강풍')) return '💨';
                if (weatherLower.includes('안개')) return '🌫️';
                if (weatherLower.includes('번개') || weatherLower.includes('천둥')) return '⚡';
                return '🌤️';
            };
            const weatherEmoji = selectedDiary.weather ? getWeatherEmoji(selectedDiary.weather) : '';
            const weatherText = selectedDiary.weather ? selectedDiary.weather : '';
            
            const cleanContent = selectedDiary.content
                .split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    return trimmed && 
                           !trimmed.startsWith('제목:') && 
                           !trimmed.startsWith('내용:') &&
                           !trimmed.includes('제목:');
                });
            
            tempContainer.innerHTML = `
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #E8E0DB;">
                    <div style="display: flex; align-items: center; gap: 50px; margin-bottom: 8px;">
                        <div style="font-size: 0.9rem; color: #8D6E63;">${formattedDate}</div>
                        ${weatherText ? `
                            <div style="font-size: 0.9rem; color: #8D6E63;">
                                ${weatherEmoji} 날씨: ${selectedDiary.weather}
                            </div>
                        ` : ''}
                    </div>
                    <h3 style="font-size: 1.5rem; color: #3E2723; font-weight: 600; margin-bottom: 4px;">${selectedDiary.title}</h3>
                    ${selectedDiary.emotions && selectedDiary.emotions.emotions ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                            ${selectedDiary.emotions.emotions.map(emotion => `
                                <span style="padding: 6px 12px; background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); color: #5D4037; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">${emotion}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div style="line-height: 1.8; color: #3E2723; font-size: 1rem; white-space: pre-wrap; margin-top: 0px;">
                    ${cleanContent.map(line => `<p style="margin-bottom: 16px;">${line}</p>`).join('')}
                </div>
            `;
            
            document.body.appendChild(tempContainer);
            
            const canvas = await html2canvas(tempContainer, {
                backgroundColor: '#FFFFFF',
                scale: 2,
                logging: false,
                width: 800,
                windowWidth: 800
            });
            
            document.body.removeChild(tempContainer);
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const dateForFilename = selectedDiary.date ? selectedDiary.date.split('T')[0] : '일기';
                a.download = `마음기록노트_${dateForFilename}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        } catch (error) {
            console.error('이미지 내보내기 오류:', error);
            alert('이미지 내보내기 중 오류가 발생했습니다.');
        }
    };

    // 최애 캐릭터 찾기 (가장 최근 대화한 캐릭터 또는 가장 많이 대화한 캐릭터)
    useEffect(() => {
        const findFavoriteCharacter = async () => {
            // 일기 생성 중이거나, 이미 캐릭터가 선택되어 있거나, 토큰이 없으면 실행하지 않음
            if (!token || selectedCharacterId || isGenerating) return;
            
            try {
                const histories = await api.getChatHistories();
                if (histories && histories.length > 0) {
                    // 가장 최근 대화의 캐릭터 ID 찾기
                    const latestHistory = histories[0];
                    const charIds = latestHistory.character_ids || [];
                    if (charIds.length > 0) {
                        setSelectedCharacterId(charIds[0]);
                    } else {
                        // 기본값: 첫 번째 캐릭터
                        const firstCharId = Object.keys(characterData)[0];
                        setSelectedCharacterId(firstCharId);
                    }
                } else {
                    // 기본값: 첫 번째 캐릭터
                    const firstCharId = Object.keys(characterData)[0];
                    setSelectedCharacterId(firstCharId);
                }
            } catch (error) {
                console.error('캐릭터 정보 불러오기 실패:', error);
                const firstCharId = Object.keys(characterData)[0];
                setSelectedCharacterId(firstCharId);
            }
        };
        
        findFavoriteCharacter();
    }, [token, isGenerating]);

    // 읽지 않은 답장 개수 확인
    useEffect(() => {
        const checkUnreadReplies = async () => {
            if (!token) return;
            
            try {
                const data = await api.getExchangeDiaryList();
                const replies = (data.diaries || data || []).filter(diary => diary.reply_received && !diary.reply_read);
                setUnreadRepliesCount(replies.length);
            } catch (error) {
                console.error('답장 확인 실패:', error);
            }
        };
        
        checkUnreadReplies();
        const interval = setInterval(checkUnreadReplies, 30000); // 30초마다 확인
        return () => clearInterval(interval);
    }, [token]);

    // 답장 시간 계산 함수 (한국 시간대 기준)
    const calculateScheduledTime = (timeOption, customTimeValue = null) => {
        if (timeOption === 'now') {
            return null; // 즉시 생성
        }
        
        // 현재 시간을 한국 시간대(KST, UTC+9)로 변환
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환
        const localOffset = now.getTimezoneOffset() * 60 * 1000; // 로컬 오프셋을 밀리초로 변환
        const kstNow = new Date(now.getTime() + kstOffset + localOffset);
        
        // 한국 시간대 기준으로 스케줄 시간 계산
        let scheduledTime = new Date(kstNow);
        
        switch (timeOption) {
            case 'tonight':
                // 오늘 밤 10시 (KST)
                scheduledTime.setHours(22, 0, 0, 0);
                if (scheduledTime <= kstNow) {
                    // 이미 지났으면 내일 밤 10시
                    scheduledTime.setDate(scheduledTime.getDate() + 1);
                }
                break;
            case 'tomorrow_morning':
                // 내일 아침 8시 (KST)
                scheduledTime.setDate(scheduledTime.getDate() + 1);
                scheduledTime.setHours(8, 0, 0, 0);
                break;
            case 'tomorrow_lunch':
                // 내일 점심 12시 (KST)
                scheduledTime.setDate(scheduledTime.getDate() + 1);
                scheduledTime.setHours(12, 0, 0, 0);
                break;
            case 'custom':
                // 사용자가 직접 선택한 시간
                if (customTimeValue) {
                    const [hours, minutes] = customTimeValue.split(':').map(Number);
                    scheduledTime.setHours(hours, minutes, 0, 0);
                    // 선택한 시간이 이미 지났으면 내일로 설정
                    if (scheduledTime <= kstNow) {
                        scheduledTime.setDate(scheduledTime.getDate() + 1);
                    }
                } else {
                    return null;
                }
                break;
            default:
                return null;
        }
        
        // KST 시간을 UTC로 변환 (ISO 형식으로 반환)
        const utcTime = new Date(scheduledTime.getTime() - kstOffset);
        return utcTime.toISOString();
    };
    
    // 시간 포맷팅 함수 (HH:mm -> 오전/오후 형식)
    const formatTimeForDisplay = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':').map(Number);
        const hour12 = hours % 12 || 12;
        const ampm = hours < 12 ? '오전' : '오후';
        return `${ampm} ${hour12}:${String(minutes).padStart(2, '0')}`;
    };
    
    const renderCustomTimePicker = () => {
        if (selectedReplyTime !== 'custom') return null;
        const fallbackTime = `${convertTo24Hour(customHour, customTimePeriod)}:${customMinute}`;
        const displayTimeLabel = formatTimeForDisplay(customTime || fallbackTime);
        const hourDropdownOptions = hourOptions.map((hour) => ({ value: hour, label: `${hour}시` }));
        const minuteDropdownOptions = minuteOptions.map((minute) => ({ value: minute, label: `${minute}분` }));
        
        return (
            <div style={{ width: '100%', marginTop: '12px' }}>
                <div style={{
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
                    borderRadius: '18px',
                    border: '1px solid #E8E0DB',
                    padding: '16px',
                    boxShadow: '0 12px 30px rgba(74, 59, 50, 0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#8D6E63', fontWeight: '600' }}>직접 시간 설정</span>
                        <span style={{ fontSize: '0.85rem', color: '#8D6E63' }}>{displayTimeLabel}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            display: 'flex',
                            background: '#F7F2EC',
                            borderRadius: '999px',
                            padding: '4px',
                            gap: '4px',
                            flex: '0 0 auto'
                        }}>
                            {[
                                { value: 'am', label: '오전' },
                                { value: 'pm', label: '오후' }
                            ].map((period) => {
                                const isActive = customTimePeriod === period.value;
                                return (
                                    <button
                                        key={period.value}
                                        type="button"
                                        onClick={() => handlePeriodSelect(period.value)}
                                        style={{
                                            minWidth: '64px',
                                            border: 'none',
                                            borderRadius: '999px',
                                            padding: '10px 0',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            background: isActive ? 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)' : 'transparent',
                                            color: isActive ? '#FFFFFF' : '#5D4037',
                                            boxShadow: isActive ? '0 6px 15px rgba(141, 110, 99, 0.25)' : 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {period.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#8D6E63', fontWeight: '600', marginBottom: '6px', display: 'block' }}>시</label>
                            <CustomDropdown
                                value={customHour}
                                onChange={handleHourSelect}
                                options={hourDropdownOptions}
                                className="time-select-dropdown"
                            />
                        </div>
                        <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#8D6E63', fontWeight: '600', marginBottom: '6px', display: 'block' }}>분</label>
                            <CustomDropdown
                                value={customMinute}
                                onChange={handleMinuteSelect}
                                options={minuteDropdownOptions}
                                className="time-select-dropdown"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderReplyTimeSection = () => {
        const fallbackTime = `${convertTo24Hour(customHour, customTimePeriod)}:${customMinute}`;
        const customLabel = selectedReplyTime === 'custom' && (customTime || fallbackTime)
            ? formatTimeForDisplay(customTime || fallbackTime)
            : '직접 설정';
        
        const timeOptions = [
            { value: 'now', label: '지금 바로', iconType: 'now', timeLabel: null },
            { value: 'tonight', label: '오늘 밤', iconType: 'tonight', timeLabel: '(22:00)' },
            { value: 'tomorrow_morning', label: '아침', iconType: 'morning', timeLabel: '(08:00)' },
            { value: 'tomorrow_lunch', label: '점심', iconType: 'lunch', timeLabel: '(12:00)' },
            { value: 'custom', label: customLabel, iconType: 'custom', timeLabel: null }
        ];
        
        return (
            <div style={{
                paddingTop: '16px',
                marginTop: '12px',
                borderTop: '1px solid rgba(232, 224, 219, 0.5)'
            }}>
                <div style={{
                    fontSize: '0.9rem',
                    color: '#5D4037',
                    fontWeight: '600',
                    marginBottom: '12px'
                }}>
                    언제 답장을 보내드릴까요?
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    {timeOptions.map((timeOption) => {
                        const isSelected = selectedReplyTime === timeOption.value;
                        return (
                            <button
                                key={timeOption.value}
                                type="button"
                                onClick={() => {
                                    if (timeOption.value === 'custom') {
                                        handleCustomReplyTimeSelect();
                                    } else {
                                        setSelectedReplyTime(timeOption.value);
                                    }
                                }}
                                style={{
                                    padding: '6px 12px',
                                    background: isSelected 
                                        ? 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)' 
                                        : 'transparent',
                                    color: isSelected ? '#FFFFFF' : '#5D4037',
                                    border: isSelected ? 'none' : '1px solid #D7CCC8',
                                    borderRadius: '16px',
                                    fontSize: '0.8rem',
                                    fontWeight: isSelected ? '600' : '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isSelected 
                                        ? '0 1px 4px rgba(141, 110, 99, 0.2)' 
                                        : 'none',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'rgba(245, 241, 235, 0.6)';
                                        e.currentTarget.style.borderColor = '#BCAAA4';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = '#D7CCC8';
                                    }
                                }}
                            >
                                <TimeIcon type={timeOption.iconType} isSelected={isSelected} />
                                <span>{timeOption.label}</span>
                                {timeOption.timeLabel && (
                                    <span style={{
                                        fontSize: '0.7rem',
                                        opacity: isSelected ? 0.9 : 0.6,
                                        fontWeight: '400'
                                    }}>
                                        {timeOption.timeLabel}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                {renderCustomTimePicker()}
            </div>
        );
    };

    const handleSaveDiary = async () => {
        if (!writingTitle.trim() || !writingContent.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }
        
        if (requestReply && !selectedCharacterId) {
            alert('답장을 받을 캐릭터를 선택해주세요.');
            return;
        }
        
        setIsSaving(true);
        try {
            const emotionsData = {
                emotions: writingEmotions,
                dominant: writingEmotions[0] || '평온',
                intensity: 0.5
            };
            
            const data = await api.createDiary({
                title: writingTitle,
                content: writingContent,
                date: writingDate,
                weather: writingWeather,
                emotions: emotionsData
            });
            
            // 답장 요청이 활성화되어 있으면 교환일기 생성
            if (requestReply && selectedCharacterId) {
                try {
                    const scheduledTime = calculateScheduledTime(selectedReplyTime, customTime);
                    await api.createExchangeDiary({
                        character_id: selectedCharacterId,
                        content: writingContent,
                        diary_id: data.id,
                        request_reply: true,
                        scheduled_time: scheduledTime
                    });
                } catch (error) {
                    console.error('답장 요청 실패:', error);
                    // 답장 요청 실패해도 일기는 저장됨
                }
            }
            
            setSelectedDiary(data);
            setIsWritingMode(false);
            setWritingTitle('');
            setWritingContent('');
            setWritingWeather('맑음');
            setWritingEmotions([]);
            setRequestReply(false);
            setSelectedReplyTime('now');
            setCustomTime('');
            await onRefreshList();
        } catch (error) {
            console.error('일기 저장 오류:', error);
            alert(`일기 저장 중 오류가 발생했습니다: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const availableEmotions = ['기쁨', '슬픔', '설렘', '그리움', '사랑', '외로움', '행복', '감사', '희망', '피로', '지침', '스트레스', '걱정', '불안', '화남', '답답함', '만족', '후회', '아쉬움', '평온', '편안함'];
    
    const getWeatherEmoji = (weather) => {
        const weatherLower = weather.toLowerCase();
        if (weatherLower.includes('맑음') || weatherLower.includes('맑은')) return '☀️';
        if (weatherLower.includes('흐림') || weatherLower.includes('흐린')) return '☁️';
        if (weatherLower.includes('비') || weatherLower.includes('소나기')) return '🌦️';
        if (weatherLower.includes('눈')) return '❄️';
        if (weatherLower.includes('바람') || weatherLower.includes('강풍')) return '💨';
        if (weatherLower.includes('안개')) return '🌫️';
        if (weatherLower.includes('번개') || weatherLower.includes('천둥')) return '⚡';
        return '🌤️';
    };
    
    const weatherOptions = [
        { value: '맑음', label: '☀️ 맑음' },
        { value: '흐림', label: '☁️ 흐림' },
        { value: '비', label: '🌦️ 비' },
        { value: '눈', label: '❄️ 눈' },
        { value: '바람', label: '💨 바람' },
        { value: '안개', label: '🌫️ 안개' },
        { value: '번개', label: '⚡ 번개' }
    ];
    
    const toggleEmotion = (emotion) => {
        setWritingEmotions(prev => 
            prev.includes(emotion) 
                ? prev.filter(e => e !== emotion)
                : prev.length < 5 ? [...prev, emotion] : prev
        );
    };

    const handleExportPDF = () => {
        if (!selectedDiary) return;
        
        // 일기 내용 정리: 제목/내용 라인 제거
        const cleanContent = selectedDiary.content
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed && 
                       !trimmed.startsWith('제목:') && 
                       !trimmed.startsWith('내용:') &&
                       !trimmed.includes('제목:');
            })
            .join('\n');
        
        const formattedDate = formatDate(selectedDiary.date);
        const getWeatherEmoji = (weather) => {
            const weatherLower = weather.toLowerCase();
            if (weatherLower.includes('맑음') || weatherLower.includes('맑은')) return '☀️';
            if (weatherLower.includes('흐림') || weatherLower.includes('흐린')) return '☁️';
            if (weatherLower.includes('비') || weatherLower.includes('소나기')) return '🌦️';
            if (weatherLower.includes('눈')) return '❄️';
            if (weatherLower.includes('바람') || weatherLower.includes('강풍')) return '💨';
            if (weatherLower.includes('안개')) return '🌫️';
            if (weatherLower.includes('번개') || weatherLower.includes('천둥')) return '⚡';
            return '🌤️';
        };
        const weatherEmoji = selectedDiary.weather ? getWeatherEmoji(selectedDiary.weather) : '';
        const weatherText = selectedDiary.weather ? `${weatherEmoji} 날씨: ${selectedDiary.weather}` : '';
        
        const title = selectedDiary.title || '제목 없음';
        const content = `
${formattedDate}${weatherText ? `  ${weatherText}` : ''}

제목: ${title}

${cleanContent}
        `.trim();
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateForFilename = selectedDiary.date ? selectedDiary.date.split('T')[0] : '일기';
        a.download = `마음기록노트_${dateForFilename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="my-page-modal diary-modal" onClick={(e) => e.stopPropagation()}>
                <h2>마음 기록 노트</h2>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div className="diary-modal-header">
                    {/* 오늘의 주제 표시 */}
                    {todayTopic && todayTopic.topic && !selectedDiary && !isWritingMode && !showAIOptions && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF9F7 100%)',
                            borderRadius: '16px',
                            border: '1px solid #E8E0DB',
                            boxShadow: '0 2px 12px rgba(74, 59, 50, 0.08)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
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
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {todayTopic.topic}
                                    </div>
                                    {todayTopic.has_topic && todayTopic.character_name && (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#A1887F',
                                            marginTop: '6px',
                                            fontWeight: '500'
                                        }}>
                                            {todayTopic.character_name}이(가) 기다리는 이야기
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="diary-modal-body">
                    {!selectedDiary && !isWritingMode && !showAIOptions ? (
                        <>
                        <div className="diary-empty-state">
                            <p>오늘의 감정 일기를 작성해보세요</p>
                            <p className="diary-subtitle">AI가 생성하거나 직접 작성할 수 있습니다</p>
                            <div className="diary-action-buttons">
                                <button 
                                    className="diary-generate-button"
                                    onClick={() => {
                                        if (fromChat) {
                                            // 채팅방에서 호출: 소스 선택 바텀 시트 표시
                                            setShowAIOptions(true);
                                        } else {
                                            // 메인 화면에서 호출: 키워드 입력 모달 바로 표시
                                            setShowAIOptions(true);
                                            setAIGenerationType('keyword');
                                        }
                                    }}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? '일기 생성 중...' : <><span style={{ fontSize: '0.85em' }}>✨</span> AI로 일기 생성하기</>}
                                </button>
                                <button 
                                    className="diary-write-button"
                                    onClick={() => setIsWritingMode(true)}
                                >
                                    직접 일기 쓰기
                                </button>
                            </div>
                        </div>
                            
                            <div className="diary-calendar-section">
                                <h3>나의 기록 캘린더</h3>
                                <DiaryCalendar 
                                    diaryList={diaryList || []} 
                                    selectedDate={selectedCalendarDate}
                                    onDateSelect={(date) => {
                                        setSelectedCalendarDate(date);
                                    }} 
                                />
                            </div>
                            
                            {diaryList && diaryList.length > 0 && (
                                    <div className="diary-list-section">
                                        <h3>이전 일기</h3>
                                        <div className="diary-list">
                                            {(() => {
                                                const filteredDiaries = selectedCalendarDate 
                                                    ? diaryList.filter(diary => {
                                                        if (!diary.date) return false;
                                                        const diaryDate = new Date(diary.date);
                                                        const selectedDate = new Date(selectedCalendarDate + 'T00:00:00');
                                                        return diaryDate.getFullYear() === selectedDate.getFullYear() &&
                                                               diaryDate.getMonth() === selectedDate.getMonth() &&
                                                               diaryDate.getDate() === selectedDate.getDate();
                                                    })
                                                    : diaryList;
                                                
                                                // 최신순으로 정렬 (날짜 내림차순, 같은 날짜면 id 내림차순)
                                                const sortedDiaries = filteredDiaries.sort((a, b) => {
                                                    const dateA = new Date(a.date || a.created_at);
                                                    const dateB = new Date(b.date || b.created_at);
                                                    const dateDiff = dateB - dateA;
                                                    // 날짜가 같으면 id로 정렬 (최신 id가 더 큼)
                                                    if (dateDiff === 0) {
                                                        return (b.id || 0) - (a.id || 0);
                                                    }
                                                    return dateDiff;
                                                });
                                                
                                                return sortedDiaries && sortedDiaries.length > 0 ? (
                                                    sortedDiaries.map((diary) => (
                                                <div 
                                                    key={diary.id}
                                                    className="diary-list-item"
                                                    onClick={async () => {
                                                        await onDiarySelect(diary.id);
                                                    }}
                                                >
                                                <div className="diary-list-date">
                                                    {diary.date ? (() => {
                                                        const date = new Date(diary.date);
                                                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                                    })() : diary.date}
                                                </div>
                                                <div className="diary-list-title">{diary.title || '제목 없음'}</div>
                                                </div>
                                                    ))
                                                ) : (
                                                    <div className="diary-list-empty">
                                                        {selectedCalendarDate ? '선택한 날짜에 작성된 일기가 없습니다.' : '작성된 일기가 없습니다.'}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                            )}
                        </>
                    ) : showAIOptions ? (
                        <div className="diary-write-form">
                            <div className="diary-form-section">
                                <label className="diary-form-label" style={{ marginBottom: '20px' }}>
                                    <span>✨</span> AI로 일기 생성하기
                                </label>
                            </div>
                            
                            {/* 채팅방에서 진입 시: 소스 선택 */}
                            {fromChat && !aiGenerationType && (
                                <div className="diary-form-section">
                                    <label className="diary-form-label">
                                        생성 방식 선택
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        {/* 선택지 1: 현재 대화로 쓰기 */}
                                        <button
                                            onClick={() => {
                                                setAIGenerationType('chat');
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '16px 20px',
                                                background: '#FBF9F7',
                                                border: '2px solid #E8E0DB',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#F5F1EB';
                                                e.currentTarget.style.borderColor = '#D7CCC8';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#FBF9F7';
                                                e.currentTarget.style.borderColor = '#E8E0DB';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <span style={{ fontSize: '1.3rem' }}>💬</span>
                                                <div>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '700',
                                                        color: '#4A3B32',
                                                        marginBottom: '4px'
                                                    }}>
                                                        현재 대화로 쓰기
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: '#5D4037',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        오늘 캐릭터와 나눈 대화를 바탕으로 일기를 씁니다.
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                        
                                        {/* 선택지 2: 키워드로 쓰기 */}
                                        <button
                                            onClick={() => {
                                                setAIGenerationType('keyword');
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '16px 20px',
                                                background: '#FBF9F7',
                                                border: '2px solid #E8E0DB',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#F5F1EB';
                                                e.currentTarget.style.borderColor = '#D7CCC8';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#FBF9F7';
                                                e.currentTarget.style.borderColor = '#E8E0DB';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <span style={{ fontSize: '1.3rem' }}>🔑</span>
                                                <div>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '700',
                                                        color: '#4A3B32',
                                                        marginBottom: '4px'
                                                    }}>
                                                        키워드로 쓰기
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: '#5D4037',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        대화가 없어도 괜찮아요. 오늘 기분이나 사건을 키워드로 입력하면 AI가 문장을 완성해줍니다.
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* 키워드 입력 섹션 (메인 화면 또는 채팅방에서 키워드 선택 시) */}
                            {(!fromChat || aiGenerationType === 'keyword') && (
                                <div className="diary-form-section">
                                    <label className="diary-form-label" style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        marginBottom: '12px'
                                    }}>
                                        키워드 입력
                                    </label>
                                    <p style={{
                                        margin: '0 0 16px 0',
                                        fontSize: '0.9rem',
                                        color: '#5D4037',
                                        lineHeight: '1.6'
                                    }}>
                                        오늘의 기분이나 사건을 키워드로 적어주세요
                                    </p>
                                    <textarea
                                        ref={keywordTextareaRef}
                                        value={keywordInput}
                                        onChange={(e) => {
                                            setKeywordInput(e.target.value);
                                            // 내용에 따라 높이 자동 조절
                                            const textarea = e.target;
                                            textarea.style.height = 'auto';
                                            textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`;
                                        }}
                                        placeholder="예: 비오는날, 우울함, 커피&#10;또는 여러 줄로 자유롭게 적어주세요..."
                                        className="diary-form-input"
                                        style={{
                                            width: '100%',
                                            minHeight: '100px',
                                            height: '100px',
                                            padding: '16px',
                                            fontSize: '1rem',
                                            lineHeight: '1.6',
                                            backgroundColor: '#FAFAFA',
                                            border: '1.5px solid #E0E0E0',
                                            borderRadius: '12px',
                                            resize: 'none',
                                            overflow: 'hidden',
                                            fontFamily: 'inherit',
                                            color: '#3E2723',
                                            transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#8D6E63';
                                            e.target.style.backgroundColor = '#FFFFFF';
                                            e.target.style.boxShadow = '0 2px 8px rgba(141, 110, 99, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#E0E0E0';
                                            e.target.style.backgroundColor = '#FAFAFA';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    <p style={{
                                        margin: '10px 0 0 0',
                                        fontSize: '0.85rem',
                                        color: '#8D6E63',
                                        fontStyle: 'italic'
                                    }}>
                                        여러 키워드를 쉼표로 구분하거나 여러 줄로 자유롭게 입력하세요
                                    </p>
                                </div>
                            )}
                            
                            {/* 채팅방에서 대화 기반 선택 시 */}
                            {fromChat && aiGenerationType === 'chat' && (
                                <div className="diary-form-section">
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '24px',
                                        background: '#FEFCF9',
                                        borderRadius: '12px',
                                        border: '1.5px solid #E8E0DB'
                                    }}>
                                        <div style={{
                                            fontSize: '3rem',
                                            marginBottom: '16px'
                                        }}>
                                            💬
                                        </div>
                                        <h3 style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            color: '#4A3B32'
                                        }}>
                                            현재 대화로 일기 생성
                                        </h3>
                                        <p style={{
                                            margin: '0 0 24px 0',
                                            fontSize: '0.95rem',
                                            color: '#5D4037',
                                            lineHeight: '1.6'
                                        }}>
                                            오늘 캐릭터와 나눈 대화를 바탕으로 일기를 작성합니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {/* 답장 요청 토글 및 캐릭터 선택 */}
                            <div className="diary-form-section" style={{ 
                                padding: '18px 20px',
                                background: '#F7F4F0',
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
                                            onChange={(e) => {
                                                const newValue = e.target.checked;
                                                setRequestReply(newValue);
                                                // 답장받기를 켤 때 캐릭터가 선택되지 않았으면 캐릭터 선택 UI 표시
                                                if (newValue && !selectedCharacterId) {
                                                    setShowCharacterSelector(true);
                                                }
                                            }}
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
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: requestReply ? 'translateX(0)' : 'translateX(0)'
                                            }}></div>
                                        </div>
                                    </label>
                                </div>
                                
                                {/* 두 번째 줄: 캐릭터 선택 드롭다운 + 답장 받기 텍스트 (토글 ON 시 표시) */}
                                {requestReply && (
                                    <>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            paddingTop: '12px',
                                            marginTop: '4px',
                                            borderTop: '1px solid rgba(232, 224, 219, 0.5)'
                                        }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowCharacterSelector(true)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '6px 12px',
                                                    background: 'transparent',
                                                    border: '1px solid rgba(232, 224, 219, 0.5)',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    color: '#4A3B32',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    flexShrink: 0
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(245, 241, 235, 0.5)';
                                                    e.currentTarget.style.borderColor = 'rgba(215, 204, 200, 0.8)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.borderColor = 'rgba(232, 224, 219, 0.5)';
                                                }}
                                            >
                                                {selectedCharacterId ? (
                                                    <>
                                                        <img
                                                            src={characterData[selectedCharacterId]?.image || '/default-character.png'}
                                                            alt={characterData[selectedCharacterId]?.name || 'Character'}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                        <span>{characterData[selectedCharacterId]?.name?.split(' (')[0]}</span>
                                                    </>
                                                ) : (
                                                    <span>캐릭터 선택</span>
                                                )}
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="#8D6E63" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                    style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        opacity: 0.6
                                                    }}
                                                >
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </button>
                                            {selectedCharacterId && (
                                                <span style={{
                                                    color: '#4A3B32',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600'
                                                }}>
                                                    님에게
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* 시간 선택 섹션 - 캐릭터가 선택되었을 때만 표시 */}
                                        {selectedCharacterId && renderReplyTimeSection()}
                                    </>
                                )}
                            </div>
                            
                            {/* 캐릭터 선택 팝업 모달 */}
                            {showCharacterSelector && (
                                <>
                                    <div
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'rgba(0, 0, 0, 0.5)',
                                            zIndex: 100000,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '20px'
                                        }}
                                        onClick={() => setShowCharacterSelector(false)}
                                    >
                                        <div
                                            className="character-selector-modal"
                                            style={{
                                                background: '#FFFFFF',
                                                borderRadius: '20px',
                                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                                zIndex: 100001,
                                                maxWidth: '500px',
                                                width: '100%',
                                                maxHeight: '70vh',
                                                overflow: 'hidden',
                                                padding: '24px',
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '24px',
                                                paddingBottom: '16px',
                                                borderBottom: '2px solid #E8E0DB',
                                                flexShrink: 0
                                            }}>
                                                <h3 style={{
                                                    margin: 0,
                                                    fontSize: '1.2rem',
                                                    fontWeight: '700',
                                                    color: '#4A3B32'
                                                }}>
                                                    답장을 받을 캐릭터 선택
                                                </h3>
                                                <button
                                                    onClick={() => setShowCharacterSelector(false)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        fontSize: '28px',
                                                        color: '#8D6E63',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        width: '32px',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '50%',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#EFEBE9';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'none';
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                                gap: '16px',
                                                paddingTop: '8px',
                                                paddingBottom: '8px',
                                                overflowY: 'auto',
                                                flex: 1,
                                                paddingRight: '8px'
                                            }}
                                            className="character-selector-grid"
                                            >
                                                {Object.values(characterData).map((char) => (
                                                    <button
                                                        key={char.id}
                                                        onClick={() => {
                                                            setSelectedCharacterId(char.id);
                                                            setShowCharacterSelector(false);
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '20px 8px',
                                                            background: selectedCharacterId === char.id 
                                                                ? '#F5F1EB' 
                                                                : '#FBF9F7',
                                                            border: selectedCharacterId === char.id 
                                                                ? '2px solid #8D6E63' 
                                                                : '2px solid #E8E0DB',
                                                            borderRadius: '14px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            width: '100%',
                                                            boxShadow: selectedCharacterId === char.id 
                                                                ? '0 2px 8px rgba(141, 110, 99, 0.2)' 
                                                                : '0 1px 3px rgba(0, 0, 0, 0.04)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (selectedCharacterId !== char.id) {
                                                                e.currentTarget.style.background = '#F5F1EB';
                                                                e.currentTarget.style.borderColor = '#D7CCC8';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (selectedCharacterId !== char.id) {
                                                                e.currentTarget.style.background = '#FBF9F7';
                                                                e.currentTarget.style.borderColor = '#E8E0DB';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                                                            }
                                                        }}
                                                    >
                                                        <img
                                                            src={char.image || '/default-character.png'}
                                                            alt={char.name}
                                                            style={{
                                                                width: '80px',
                                                                height: '80px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover',
                                                                border: `2px solid ${selectedCharacterId === char.id ? '#8D6E63' : '#E8E0DB'}`,
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        />
                                                        <span style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: selectedCharacterId === char.id ? '600' : '600',
                                                            color: selectedCharacterId === char.id ? '#8D6E63' : '#4A3B32',
                                                            textAlign: 'center',
                                                            lineHeight: '1.3'
                                                        }}>
                                                            {char.name.split(' (')[0]}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* 생성 버튼 */}
                            <div className="diary-form-actions">
                                <button
                                    onClick={() => {
                                        setShowAIOptions(false);
                                        setAIGenerationType(null);
                                        setKeywordInput('');
                                    }}
                                    className="diary-form-cancel-button"
                                >
                                    취소
                                </button>
                                <button
                                    className="diary-form-save-button"
                                    onClick={() => {
                                        if (requestReply && !selectedCharacterId) {
                                            alert('답장을 받을 캐릭터를 선택해주세요.');
                                            return;
                                        }
                                        
                                        if (fromChat && aiGenerationType === 'chat') {
                                            // 채팅방에서 대화 기반 생성
                                            const scheduledTime = calculateScheduledTime(selectedReplyTime, customTime);
                                            onGenerate({
                                                requestReply: requestReply,
                                                selectedCharacterId: selectedCharacterId,
                                                scheduled_time: scheduledTime
                                            });
                                            // 생성 완료 후 모달 닫지 않음
                                        } else {
                                            // 키워드 기반 생성
                                            if (!keywordInput.trim()) {
                                                alert('키워드를 입력해주세요.');
                                                return;
                                            }
                                            const scheduledTime = calculateScheduledTime(selectedReplyTime, customTime);
                                            onGenerate({ 
                                                keywords: keywordInput.trim(),
                                                requestReply: requestReply,
                                                selectedCharacterId: selectedCharacterId,
                                                scheduled_time: scheduledTime
                                            });
                                            // 생성 완료 후 모달 닫지 않음
                                        }
                                    }}
                                    disabled={isGenerating || (fromChat && !aiGenerationType) || ((!fromChat || aiGenerationType === 'keyword') && !keywordInput.trim())}
                                >
                                    {isGenerating ? '일기 생성 중...' : '일기 생성하기'}
                                </button>
                            </div>
                        </div>
                    ) : isWritingMode ? (
                        <div className="diary-write-form">
                            <div className="diary-form-section">
                                <label className="diary-form-label">
                                    날짜
                                </label>
                                <div className="diary-date-input-wrapper" style={{ position: 'relative' }} ref={datePickerRef}>
                                    <input
                                        type="text"
                                        value={formatDateForInput(writingDate)}
                                        readOnly
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                        className="diary-form-input diary-date-input"
                                        placeholder="날짜를 선택하세요"
                                    />
                                    {showDatePicker && (
                                        <div className="date-picker-popup" ref={datePickerPopupRef} style={{ zIndex: 10001 }}>
                                            <DatePickerCalendar
                                                value={writingDate}
                                                onChange={(date) => {
                                                    setWritingDate(date);
                                                    setShowDatePicker(false);
                                                }}
                                                onClose={() => setShowDatePicker(false)}
                                                maxDate={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="diary-form-section">
                                <label className="diary-form-label">
                                    제목
                                </label>
                                <input
                                    type="text"
                                    value={writingTitle}
                                    onChange={(e) => setWritingTitle(e.target.value)}
                                    placeholder="일기 제목을 입력하세요"
                                    className="diary-form-input diary-form-input-title"
                                />
                            </div>
                            
                            <div className="diary-form-section" style={{ position: 'relative', zIndex: 1 }}>
                                <label className="diary-form-label">
                                    날씨
                                </label>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <CustomDropdown
                                        value={writingWeather}
                                        onChange={(value) => {
                                            setWritingWeather(value);
                                        }}
                                        onOpen={() => {
                                            // 날씨 드롭다운이 열릴 때 달력 닫기
                                            if (showDatePicker) {
                                                setShowDatePicker(false);
                                            }
                                        }}
                                        options={weatherOptions}
                                        className="diary-weather-dropdown"
                                    />
                                </div>
                            </div>
                            
                            <div className="diary-form-section">
                                <label className="diary-form-label">
                                    감정 <span className="diary-label-hint">(최대 5개)</span>
                                </label>
                                <div className="diary-emotion-chips">
                                    {availableEmotions.map(emotion => (
                                        <button
                                            key={emotion}
                                            type="button"
                                            onClick={() => toggleEmotion(emotion)}
                                            className={`diary-emotion-chip ${writingEmotions.includes(emotion) ? 'selected' : ''}`}
                                        >
                                            {emotion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="diary-form-section">
                                <label className="diary-form-label">
                                    내용
                                </label>
                                <textarea
                                    value={writingContent}
                                    onChange={(e) => setWritingContent(e.target.value)}
                                    placeholder="오늘 하루를 기록해보세요..."
                                    rows="12"
                                    className="diary-form-textarea"
                                />
                            </div>
                            
                            {/* 답장 요청 토글 및 캐릭터 선택 */}
                            <div className="diary-form-section" style={{ 
                                padding: '18px 20px',
                                background: '#F7F4F0',
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
                                            onChange={(e) => {
                                                const newValue = e.target.checked;
                                                setRequestReply(newValue);
                                                // 답장받기를 켤 때 캐릭터가 선택되지 않았으면 캐릭터 선택 UI 표시
                                                if (newValue && !selectedCharacterId) {
                                                    setShowCharacterSelector(true);
                                                }
                                            }}
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
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: requestReply ? 'translateX(0)' : 'translateX(0)'
                                            }}></div>
                                        </div>
                                    </label>
                                </div>
                                
                                {/* 두 번째 줄: 캐릭터 선택 드롭다운 + 답장 받기 텍스트 (토글 ON 시 표시) */}
                                {requestReply && (
                                    <>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            paddingTop: '12px',
                                            marginTop: '4px',
                                            borderTop: '1px solid rgba(232, 224, 219, 0.5)'
                                        }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowCharacterSelector(true)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '6px 12px',
                                                    background: 'transparent',
                                                    border: '1px solid rgba(232, 224, 219, 0.5)',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    color: '#4A3B32',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    flexShrink: 0
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(245, 241, 235, 0.5)';
                                                    e.currentTarget.style.borderColor = 'rgba(215, 204, 200, 0.8)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.borderColor = 'rgba(232, 224, 219, 0.5)';
                                                }}
                                            >
                                                {selectedCharacterId ? (
                                                    <>
                                                        <img
                                                            src={characterData[selectedCharacterId]?.image || '/default-character.png'}
                                                            alt={characterData[selectedCharacterId]?.name || 'Character'}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                        <span>{characterData[selectedCharacterId]?.name?.split(' (')[0]}</span>
                                                    </>
                                                ) : (
                                                    <span>캐릭터 선택</span>
                                                )}
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="#8D6E63" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                    style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        opacity: 0.6
                                                    }}
                                                >
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </button>
                                            {selectedCharacterId && (
                                                <span style={{
                                                    color: '#4A3B32',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600'
                                                }}>
                                                    님에게
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* 시간 선택 섹션 - 캐릭터가 선택되었을 때만 표시 */}
                                        {selectedCharacterId && renderReplyTimeSection()}
                                    </>
                                )}
                            </div>
                            
                            {/* 캐릭터 선택 팝업 모달 */}
                            {showCharacterSelector && (
                                <>
                                    <div
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'rgba(0, 0, 0, 0.5)',
                                            zIndex: 100000,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '20px'
                                        }}
                                        onClick={() => setShowCharacterSelector(false)}
                                    >
                                        <div
                                            className="character-selector-modal"
                                            style={{
                                                background: '#FFFFFF',
                                                borderRadius: '20px',
                                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                                zIndex: 100001,
                                                maxWidth: '500px',
                                                width: '100%',
                                                maxHeight: '70vh',
                                                overflow: 'hidden',
                                                padding: '24px',
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '24px',
                                                paddingBottom: '16px',
                                                borderBottom: '2px solid #E8E0DB',
                                                flexShrink: 0
                                            }}>
                                                <h3 style={{
                                                    margin: 0,
                                                    fontSize: '1.2rem',
                                                    fontWeight: '700',
                                                    color: '#4A3B32'
                                                }}>
                                                    답장을 받을 캐릭터 선택
                                                </h3>
                                                <button
                                                    onClick={() => setShowCharacterSelector(false)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        fontSize: '28px',
                                                        color: '#8D6E63',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        width: '32px',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '50%',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#EFEBE9';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'none';
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                                gap: '16px',
                                                paddingTop: '8px',
                                                paddingBottom: '8px',
                                                overflowY: 'auto',
                                                flex: 1,
                                                paddingRight: '8px'
                                            }}
                                            className="character-selector-grid"
                                            >
                                                {Object.values(characterData).map((char) => (
                                                    <button
                                                        key={char.id}
                                                        onClick={() => {
                                                            setSelectedCharacterId(char.id);
                                                            setShowCharacterSelector(false);
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '20px 8px',
                                                            background: selectedCharacterId === char.id 
                                                                ? '#F5F1EB' 
                                                                : '#FBF9F7',
                                                            border: selectedCharacterId === char.id 
                                                                ? '2px solid #8D6E63' 
                                                                : '2px solid #E8E0DB',
                                                            borderRadius: '14px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            width: '100%',
                                                            boxShadow: selectedCharacterId === char.id 
                                                                ? '0 2px 8px rgba(141, 110, 99, 0.2)' 
                                                                : '0 1px 3px rgba(0, 0, 0, 0.04)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (selectedCharacterId !== char.id) {
                                                                e.currentTarget.style.background = '#F5F1EB';
                                                                e.currentTarget.style.borderColor = '#D7CCC8';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (selectedCharacterId !== char.id) {
                                                                e.currentTarget.style.background = '#FBF9F7';
                                                                e.currentTarget.style.borderColor = '#E8E0DB';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                                                            }
                                                        }}
                                                    >
                                                        <img
                                                            src={char.image || '/default-character.png'}
                                                            alt={char.name}
                                                            style={{
                                                                width: '80px',
                                                                height: '80px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover',
                                                                border: `2px solid ${selectedCharacterId === char.id ? '#8D6E63' : '#E8E0DB'}`,
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        />
                                                        <span style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: selectedCharacterId === char.id ? '600' : '600',
                                                            color: selectedCharacterId === char.id ? '#8D6E63' : '#4A3B32',
                                                            textAlign: 'center',
                                                            lineHeight: '1.3'
                                                        }}>
                                                            {char.name.split(' (')[0]}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <div className="diary-form-actions">
                                <button
                                    onClick={() => {
                                        setIsWritingMode(false);
                                        setWritingTitle('');
                                        setWritingContent('');
                                        setWritingWeather('맑음');
                                        setWritingEmotions([]);
                                    }}
                                    className="diary-form-cancel-button"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSaveDiary}
                                    disabled={isSaving || !writingTitle.trim() || !writingContent.trim()}
                                    className="diary-form-save-button"
                                >
                                    {isSaving ? '저장 중...' : '일기 저장하기'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div id="diary-content" className="diary-content">
                            <div className="diary-header">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <div className="diary-date" style={{ fontSize: '0.9rem', color: '#8D6E63' }}>
                                        {formatDate(selectedDiary.date)}
                                    </div>
                                    {(() => {
                                        const weather = selectedDiary.weather || '맑음';
                                        const getWeatherEmoji = (weather) => {
                                            const weatherLower = weather.toLowerCase();
                                            if (weatherLower.includes('맑음') || weatherLower.includes('맑은')) return '☀️';
                                            if (weatherLower.includes('흐림') || weatherLower.includes('흐린')) return '☁️';
                                            if (weatherLower.includes('비') || weatherLower.includes('소나기')) return '🌦️';
                                            if (weatherLower.includes('눈')) return '❄️';
                                            if (weatherLower.includes('바람') || weatherLower.includes('강풍')) return '💨';
                                            if (weatherLower.includes('안개')) return '🌫️';
                                            if (weatherLower.includes('번개') || weatherLower.includes('천둥')) return '⚡';
                                            return '🌤️';
                                        };
                                        return (
                                            <div style={{ 
                                                fontSize: '0.9rem', 
                                                color: '#8D6E63',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {getWeatherEmoji(weather)} 날씨: {weather}
                                        </div>
                                        );
                                    })()}
                                </div>
                                <h3 className="diary-title">{selectedDiary.title}</h3>
                                {selectedDiary.emotions && selectedDiary.emotions.emotions && (
                                    <div className="diary-emotions">
                                        {selectedDiary.emotions.emotions.map((emotion, idx) => (
                                            <span key={idx} className="emotion-tag">{emotion}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="diary-text">
                                {selectedDiary.content
                                    .split('\n')
                                    .filter(line => {
                                        const trimmed = line.trim();
                                        return trimmed && 
                                               !trimmed.startsWith('제목:') && 
                                               !trimmed.startsWith('내용:') &&
                                               !trimmed.includes('제목:');
                                    })
                                    .map((line, idx) => {
                                        return <p key={idx}>{line}</p>;
                                    })}
                            </div>
                            
                            <div className="diary-actions">
                                <div className="diary-actions-top">
                                    <button className="diary-icon-button" onClick={handleExportImage} title="이미지로 저장">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    </button>
                                    <button className="diary-icon-button" onClick={handleExportPDF} title="텍스트로 저장">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="diary-actions-bottom">
                                    <button 
                                        className="diary-action-button delete-button"
                                        onClick={async () => {
                                            if (window.confirm('이 일기를 삭제하시겠습니까?')) {
                                                try {
                                                    await onDeleteDiary(selectedDiary.id);
                                                    setSelectedDiary(null);
                                                    await onRefreshList();
                                                } catch (error) {
                                                    console.error('일기 삭제 오류:', error);
                                                }
                                            }
                                        }}
                                    >
                                        일기 삭제
                                    </button>
                                    <button 
                                        className="diary-action-button back-button"
                                        onClick={async () => {
                                            setSelectedDiary(null);
                                            await onDiarySelect(null);
                                        }}
                                    >
                                        목록으로
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 로그인/회원가입 모달
export const AuthModal = ({ onClose, onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const body = isLogin 
                ? { username, password }
                : { username, email, password, nickname: nickname || username };

            const data = isLogin 
                ? await api.login(body)
                : await api.register(body);

            auth.setToken(data.access_token);
            auth.setUser(data.user);
            onSuccess(data.user);
            onClose();
        } catch (err) {
            console.error('로그인/회원가입 오류:', err);
            let errorMessage = err.message || '오류가 발생했습니다.';
            
            // 네트워크 오류나 연결 실패 시 더 명확한 메시지
            if (errorMessage.includes('네트워크 오류') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
                errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
            } else if (errorMessage.includes('CORS 오류')) {
                errorMessage = '서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            } else if (errorMessage.includes('Incorrect username or password')) {
                errorMessage = '사용자명 또는 비밀번호가 올바르지 않습니다.';
            } else if (errorMessage.includes('already exists')) {
                errorMessage = '이미 사용 중인 사용자명 또는 이메일입니다.';
            } else if (errorMessage.includes('validation')) {
                errorMessage = '입력 정보를 확인해주세요.';
            } else if (errorMessage.includes('HTTP 401')) {
                errorMessage = '인증에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.';
            } else if (errorMessage.includes('HTTP 500')) {
                errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            } else if (errorMessage.includes('HTTP 404')) {
                errorMessage = '서버를 찾을 수 없습니다. API 주소를 확인해주세요.';
            }
            
            setError(errorMessage);
            setLoading(false); // 에러 발생 시 즉시 로딩 해제
        }
    };

    return (
        <div className="modal-overlay auth-overlay">
            <div className="auth-modal">
                <div className="auth-header">
                    <h2>{isLogin ? '로그인' : '회원가입'}</h2>
                    {!isLogin && (
                        <button className="close-button" onClick={() => {
                            setIsLogin(true);
                            setError('');
                            setUsername('');
                            setEmail('');
                            setPassword('');
                            setNickname('');
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    )}
                </div>
                
                <form onSubmit={handleSubmit} className="auth-form" style={!isLogin ? { padding: '24px 32px', gap: '14px' } : {}}>
                    {error && (
                        <div className="error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <div className="auth-input-wrapper">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="사용자명"
                            className="auth-input"
                        />
                    </div>
                    
                    {!isLogin && (
                        <>
                            <div className="auth-input-wrapper">
                                <div className="input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="이메일"
                                    className="auth-input"
                                />
                            </div>
                            <div className="auth-input-wrapper">
                                <div className="input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="닉네임 (선택사항)"
                                    className="auth-input"
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="auth-input-wrapper">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                            </svg>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="비밀번호"
                            className="auth-input"
                        />
                    </div>
                    
                    {isLogin && (
                        <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setShowPasswordReset(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#8D6E63',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    padding: '4px 0',
                                    textDecoration: 'underline'
                                }}
                            >
                                비밀번호를 잊으셨나요?
                            </button>
                        </div>
                    )}
                    
                    <button type="submit" className="auth-submit-button" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                <span>처리 중...</span>
                            </>
                        ) : (
                            <>
                                <span>{isLogin ? '로그인' : '회원가입'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                </svg>
                            </>
                        )}
                    </button>
                </form>
                
                {isLogin && (
                    <div className="auth-divider">
                        <span>또는</span>
                    </div>
                )}
                
                <div className="auth-switch" style={!isLogin ? { padding: '16px 32px 24px 32px' } : {}}>
                    <span>{isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}</span>
                    <button 
                        type="button"
                        className={`auth-link-button ${isLogin ? 'signup-link-button' : ''}`}
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setUsername('');
                            setEmail('');
                            setPassword('');
                            setNickname('');
                        }}
                    >
                        {isLogin ? '회원가입' : '로그인'}
                    </button>
                </div>
                
                {/* 비밀번호 재설정 모달 */}
                {showPasswordReset && (
                    <PasswordResetModal 
                        onClose={() => {
                            setShowPasswordReset(false);
                            setError('');
                        }}
                        onSuccess={() => {
                            setShowPasswordReset(false);
                            setError('');
                            alert('비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.');
                        }}
                    />
                )}
            </div>
        </div>
    );
};

// 비밀번호 재설정 모달
const PasswordResetModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 새 비밀번호 입력
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.requestPasswordReset(email);
            setStep(2);
        } catch (err) {
            console.error('비밀번호 재설정 요청 오류:', err);
            let errorMessage = err.message || '오류가 발생했습니다.';
            if (errorMessage.includes('404')) {
                errorMessage = '해당 이메일로 등록된 사용자를 찾을 수 없습니다.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 4) {
            setError('비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }

        setLoading(true);

        try {
            await api.resetPassword(email, newPassword);
            onSuccess();
        } catch (err) {
            console.error('비밀번호 재설정 오류:', err);
            let errorMessage = err.message || '오류가 발생했습니다.';
            if (errorMessage.includes('404')) {
                errorMessage = '해당 이메일로 등록된 사용자를 찾을 수 없습니다.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '20px'
        }} onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%' }}>
                <div className="auth-header">
                    <h2>비밀번호 재설정</h2>
                    <button className="close-button" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                {step === 1 ? (
                    <form onSubmit={handleEmailSubmit} className="auth-form">
                        {error && (
                            <div className="error-message">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <p style={{ marginBottom: '20px', color: '#5D4037', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            회원가입 시 입력하신 이메일 주소를 입력해주세요.
                        </p>
                        
                        <div className="auth-input-wrapper">
                            <div className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="이메일 주소"
                                className="auth-input"
                            />
                        </div>
                        
                        <button type="submit" className="auth-submit-button" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>확인 중...</span>
                                </>
                            ) : (
                                <>
                                    <span>다음</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="auth-form">
                        {error && (
                            <div className="error-message">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <p style={{ marginBottom: '20px', color: '#5D4037', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            새로운 비밀번호를 입력해주세요.
                        </p>
                        
                        <div className="auth-input-wrapper">
                            <div className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                </svg>
                            </div>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="새 비밀번호 (최소 4자)"
                                className="auth-input"
                            />
                        </div>
                        
                        <div className="auth-input-wrapper">
                            <div className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                </svg>
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="새 비밀번호 확인"
                                className="auth-input"
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button 
                                type="button" 
                                onClick={() => setStep(1)}
                                className="auth-submit-button"
                                style={{ 
                                    width: 'auto',
                                    padding: '16px 24px',
                                    background: '#D7CCC8',
                                    flexShrink: 0
                                }}
                            >
                                이전
                            </button>
                            <button 
                                type="submit" 
                                className="auth-submit-button" 
                                disabled={loading} 
                                style={{ 
                                    flex: 1
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner"></div>
                                        <span>처리 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>비밀번호 변경</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

