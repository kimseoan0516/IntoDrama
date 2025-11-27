import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { api } from '../utils/api';
import { auth } from '../utils/storage';
import { CustomDropdown } from './CommonComponents';

export const GiftModal = ({ gift, onClose }) => {
    const getGiftIcon = (type) => {
        switch(type) {
            case 'playlist': return '🎧';
            case 'poem': return '📖';
            case 'letter': return '💌';
            default: return '🎁';
        }
    };
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="my-page-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h2>{getGiftIcon(gift.type)} 선물</h2>
                <div style={{ padding: '20px', background: '#F5F1EB', borderRadius: '12px', marginBottom: '16px' }}>
                    <h3 style={{ marginBottom: '12px', color: '#3E2723' }}>{gift.title}</h3>
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#5D4037' }}>
                        {gift.content}
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#8D6E63', fontStyle: 'italic' }}>
                        {gift.trigger_reason}
                    </div>
                </div>
                <button className="save-button" onClick={onClose}>확인</button>
            </div>
        </div>
    );
};

export const ArchetypeMapModal = ({ data, characterData, onClose }) => {
    const width = 400;
    const height = 400;
    const padding = 60;
    
    if (!data || !data.characters || data.characters.length === 0) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="my-page-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
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
            <div className="my-page-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
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
                        <text x={35} y={height / 2} textAnchor="middle" fill="#8D6E63" fontSize="14" fontWeight="600" transform={`rotate(-90, 35, ${height / 2})`}>현실적 ← → 이상적</text>
                        
                        {/* 캐릭터 포인트 */}
                        {data.characters && data.characters.map((char, idx) => {
                            // 성향 지도 좌표 계산: 따뜻함(왼쪽) ← → 차가움(오른쪽), 현실적(위) ← → 이상적(아래)
                            const x = padding + ((1 - char.warmth) * (width - 2 * padding));
                            const y = padding + (char.realism * (height - 2 * padding));
                            const charInfo = characterData[char.character_id];
                            
                            return (
                                <g key={idx}>
                                    <circle cx={x} cy={y} r="8" fill="#8D6E63" />
                                    <text x={x} y={y - 15} textAnchor="middle" fill="#3E2723" fontSize="12" fontWeight="600">
                                        {charInfo ? charInfo.name.split(' (')[0] : char.name}
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
    
    // 일기 작성 날짜 추출 및 정규화
    const diaryDates = new Set(
        diaryList.map(d => {
            if (!d.date) return null;
            // 날짜를 YYYY-MM-DD 형식으로 변환
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

export const DiaryModal = ({ diaryData, diaryList, isGenerating, onGenerate, onClose, token, onDiarySelect, onDeleteDiary, onRefreshList }) => {
    const [selectedDiary, setSelectedDiary] = useState(diaryData);
    const [isWritingMode, setIsWritingMode] = useState(false);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
    const [writingTitle, setWritingTitle] = useState('');
    const [writingContent, setWritingContent] = useState('');
    const [writingWeather, setWritingWeather] = useState('맑음');
    const [writingEmotions, setWritingEmotions] = useState([]);
    const [writingDate, setWritingDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const datePickerRef = useRef(null);
    const datePickerPopupRef = useRef(null);
    
    useEffect(() => {
        if (diaryData) {
            setSelectedDiary(diaryData);
            setIsWritingMode(false);
            if (diaryData.date) {
                const date = new Date(diaryData.date);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                setSelectedCalendarDate(dateStr);
            }
        }
    }, [diaryData]);
    
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
            
            // 일기 내용 정리: 제목/내용 라인 제거
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

    const handleSaveDiary = async () => {
        if (!writingTitle.trim() || !writingContent.trim()) {
            alert('제목과 내용을 입력해주세요.');
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
            
            setSelectedDiary(data);
            setIsWritingMode(false);
            setWritingTitle('');
            setWritingContent('');
            setWritingWeather('맑음');
            setWritingEmotions([]);
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
                <div className="diary-modal-header">
                    <div>
                        <span>🌿</span>
                        <h2>마음 기록 노트</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '28px',
                            color: '#8D6E63',
                            cursor: 'pointer',
                            padding: '0',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#EFEBE9'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                    >×</button>
                </div>
                
                <div className="diary-modal-body">
                    {!selectedDiary && !isWritingMode ? (
                        <>
                        <div className="diary-empty-state">
                            <p>오늘의 감정 일기를 작성해보세요</p>
                            <p className="diary-subtitle">AI가 생성하거나 직접 작성할 수 있습니다</p>
                            <div className="diary-action-buttons">
                            <button 
                                className="diary-generate-button"
                                onClick={onGenerate}
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
                                                
                                                return filteredDiaries && filteredDiaries.length > 0 ? (
                                                    filteredDiaries.map((diary) => (
                                                <div 
                                                    key={diary.id}
                                                    className="diary-list-item"
                                                    onClick={async () => {
                                                        setSelectedDiary(null);
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
                                    {selectedDiary.weather && (() => {
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
                                                {getWeatherEmoji(selectedDiary.weather)} 날씨: {selectedDiary.weather}
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const body = isLogin 
                ? { username, password }
                : { username, email, password, nickname: nickname || '사용자' };

            const data = isLogin 
                ? await api.login(body)
                : await api.register(body);

            auth.setToken(data.access_token);
            auth.setUser(data.user);
            onSuccess(data.user);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay auth-overlay">
            <div className="auth-modal">
                <div className="auth-header">
                    <h2>{isLogin ? '로그인' : '회원가입'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="auth-form">
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
                
                <div className="auth-divider">
                    <span>또는</span>
                </div>
                
                <div className="auth-switch">
                    <span>{isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}</span>
                    <button 
                        type="button"
                        className="auth-link-button"
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
            </div>
        </div>
    );
};

