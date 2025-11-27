import React, { useState, useEffect, useRef } from 'react';
import { chatTemplates } from '../constants/chatTemplates';

// 커스텀 드롭다운 컴포넌트
export const CustomDropdown = ({ value, onChange, options, className, onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            // 드롭다운이 열릴 때 콜백 호출 (날씨 드롭다운의 경우 달력 닫기)
            if (onOpen) {
                onOpen();
            }
            // 다른 모든 드롭다운 닫기 (설정 화면에서 여러 드롭다운이 동시에 열리는 것 방지)
            const allDropdowns = document.querySelectorAll('.custom-dropdown');
            allDropdowns.forEach(dropdown => {
                if (dropdown !== dropdownRef.current && dropdown.classList.contains('open')) {
                    dropdown.classList.remove('open');
                    const menu = dropdown.querySelector('.custom-dropdown-menu');
                    if (menu) {
                        menu.style.display = 'none';
                    }
                }
            });
            
            // 설정 화면의 경우 settings-content의 overflow를 visible로 변경
            const settingsContent = dropdownRef.current?.closest('.settings-content');
            if (settingsContent) {
                settingsContent.style.overflow = 'visible';
            }
            
            // setting-item의 z-index를 높임
            const settingItem = dropdownRef.current?.closest('.setting-item');
            if (settingItem) {
                settingItem.style.zIndex = '10004';
                settingItem.style.overflow = 'visible';
            }
            
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            // 드롭다운이 닫힐 때 settings-content의 overflow 복원
            const settingsContent = dropdownRef.current?.closest('.settings-content');
            if (settingsContent) {
                settingsContent.style.overflow = '';
            }
            
            // setting-item의 z-index 복원
            const settingItem = dropdownRef.current?.closest('.setting-item');
            if (settingItem) {
                settingItem.style.zIndex = '';
                settingItem.style.overflow = '';
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onOpen]);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className={`custom-dropdown ${className || ''} ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button
                type="button"
                className="custom-dropdown-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption.label}</span>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
                >
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </button>
            {isOpen && (
                <div className="custom-dropdown-menu">
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`custom-dropdown-option ${value === option.value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 타이핑 효과 컴포넌트
export const TypingText = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, text]);

    useEffect(() => {
        setDisplayedText('');
        setCurrentIndex(0);
    }, [text]);

    return <span>{displayedText}</span>;
};

// 설정 화면
export const SettingsScreen = ({ onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState({
        timeOfDay: settings?.timeOfDay || 'current',
        mood: settings?.mood || 'normal',
        typingEffect: settings?.typingEffect !== undefined ? settings.typingEffect : false,
        showNameInMultiChat: settings?.showNameInMultiChat !== undefined ? settings.showNameInMultiChat : true,
        soundEnabled: settings?.soundEnabled !== undefined ? settings.soundEnabled : true,
        background: settings?.background || null
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings({
                    ...localSettings,
                    background: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBackground = () => {
        setLocalSettings({
            ...localSettings,
            background: null
        });
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const timeOfDayOptions = [
        { value: 'current', label: '현재 시간' },
        { value: 'morning', label: '아침' },
        { value: 'afternoon', label: '오후' },
        { value: 'evening', label: '저녁' },
        { value: 'night', label: '밤' }
    ];

    const moodOptions = [
        { value: 'normal', label: '일반' },
        { value: 'romantic', label: '로맨틱' },
        { value: 'friendly', label: '친근' },
        { value: 'serious', label: '진지' }
    ];

    return (
        <div className="modal-overlay">
            <div className="settings-modal">
                <h2>설정</h2>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div className="settings-content">
                    <div className="setting-item">
                        <label>시간대:</label>
                        <CustomDropdown
                            value={localSettings.timeOfDay}
                            onChange={(value) => setLocalSettings({
                                ...localSettings,
                                timeOfDay: value
                            })}
                            options={timeOfDayOptions}
                        />
                    </div>
                    <div className="setting-item">
                        <label>분위기:</label>
                        <CustomDropdown
                            value={localSettings.mood}
                            onChange={(value) => setLocalSettings({
                                ...localSettings,
                                mood: value
                            })}
                            options={moodOptions}
                        />
                    </div>
                    <div className="setting-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={localSettings.typingEffect}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    typingEffect: e.target.checked
                                })}
                            />
                            타이핑 효과
                        </label>
                    </div>
                    <div className="setting-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={localSettings.showNameInMultiChat}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    showNameInMultiChat: e.target.checked
                                })}
                            />
                            캐릭터 이름 표시
                        </label>
                    </div>
                    <div className="setting-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={localSettings.soundEnabled}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    soundEnabled: e.target.checked
                                })}
                            />
                            답장 알림 소리
                        </label>
                    </div>
                    <div className="setting-item">
                        <label>배경 이미지:</label>
                        {localSettings.background ? (
                            <div className="background-preview-area">
                                <img 
                                    src={localSettings.background} 
                                    alt="Background Preview" 
                                    className="background-preview" 
                                />
                                <div className="background-actions">
                                    <label htmlFor="background-upload" className="file-input-label">
                                        변경
                                    </label>
                                    <button 
                                        type="button"
                                        className="remove-background-button"
                                        onClick={handleRemoveBackground}
                                    >
                                        제거
                                    </button>
                                </div>
                                <input
                                    id="background-upload"
                                    type="file"
                                    accept="image/*"
                                    className="file-input-hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <>
                                <label htmlFor="background-upload" className="file-input-label">
                                    배경 이미지 선택
                                </label>
                                <input
                                    id="background-upload"
                                    type="file"
                                    accept="image/*"
                                    className="file-input-hidden"
                                    onChange={handleFileChange}
                                />
                            </>
                        )}
                    </div>
                </div>
                <div className="button-group">
                    <button className="close-button" onClick={onClose}>취소</button>
                    <button className="save-button" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

// 템플릿 선택 화면
export const TemplateScreen = ({ onClose, onSelectTemplate }) => {
    return (
        <div className="modal-overlay">
            <div className="template-modal">
                <h2>대화 템플릿</h2>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div className="template-list">
                    {chatTemplates.map(template => (
                        <div
                            key={template.id}
                            className="template-item"
                            onClick={() => {
                                onSelectTemplate(template);
                                onClose();
                            }}
                        >
                            <div className="template-icon">{template.icon}</div>
                            <div className="template-info">
                                <h3>{template.name}</h3>
                                <p>{template.messages.join(', ')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

