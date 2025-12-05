import React, { useState, useEffect, useRef } from 'react';
import { characterData } from '../constants/characterData';
import { CustomDropdown } from './CommonComponents';
import { favorites as favoritesStorage } from '../utils/storage';

// 캐릭터 선택 화면 컴포넌트 (필터링/검색 추가)
const CharacterSelectScreen = ({ onStartChat, onMyPageClick, onHistoryClick, onStatsClick, userProfile, onShowDiary, onExchangeDiaryClick }) => {
    const [selectedChars, setSelectedChars] = useState([]); 
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDrama, setSelectedDrama] = useState('all');
    const [favorites, setFavorites] = useState(favoritesStorage.load());
    const nameRefs = useRef({});

    const dramas = [...new Set(Object.values(characterData).map(c => c.dramaTitle))];

    const filteredCharacters = Object.values(characterData)
        .filter(char => {
            const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                char.dramaTitle.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDrama = selectedDrama === 'all' || char.dramaTitle === selectedDrama;
            return matchesSearch && matchesDrama;
        })
        .sort((a, b) => {
            const aIsFavorite = favorites.includes(a.id);
            const bIsFavorite = favorites.includes(b.id);
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            return 0;
        });

    const handleSelectChar = (charId) => {
        setSelectedChars(prev => {
            if (prev.includes(charId)) {
                return prev.filter(id => id !== charId);
            } else {
                if (prev.length < 2) {
                    return [...prev, charId];
                } else {
                    return [prev[1], charId];
                }
            }
        });
    };

    const toggleFavorite = (charId, e) => {
        e.stopPropagation();
        setFavorites(prev => {
            const newFavs = prev.includes(charId) 
                ? prev.filter(id => id !== charId)
                : [...prev, charId];
            favoritesStorage.save(newFavs);
            return newFavs;
        });
    };

    // 캐릭터 이름 폰트 크기 자동 조정
    useEffect(() => {
        const adjustFontSizes = () => {
            Object.keys(nameRefs.current).forEach(charId => {
                const element = nameRefs.current[charId];
                if (!element) return;
                
                const parent = element.parentElement;
                if (!parent) return;
                
                const maxWidth = parent.offsetWidth - 16;
                let fontSize = 0.95;
                
                element.style.fontSize = `${fontSize}rem`;
                
                // 텍스트 오버플로우 시 폰트 크기 조정
                while (element.scrollWidth > maxWidth && fontSize > 0.65) {
                    fontSize -= 0.05;
                    element.style.fontSize = `${fontSize}rem`;
                }
            });
        };

        adjustFontSizes();
        window.addEventListener('resize', adjustFontSizes);
        return () => window.removeEventListener('resize', adjustFontSizes);
    }, [filteredCharacters]);


    return (
        <div className="character-select-screen">
            <div className="top-buttons">
                <button className="history-button" onClick={onHistoryClick} title="내 대화 보관함">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                </button>
                <button className="stats-button" onClick={onStatsClick} title="통계">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
                    </svg>
                </button>
                <button className="history-button" onClick={onShowDiary} title="마음 기록 노트">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                    </svg>
                </button>
                {onExchangeDiaryClick && (
                    <button className="history-button" onClick={onExchangeDiaryClick} title="교환일기">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                    </button>
                )}
                <button className="my-page-button" onClick={onMyPageClick} title="내 정보">
                {userProfile.profilePic ? (
                    <img src={userProfile.profilePic} alt="My Profile" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                )}
            </button>
            </div>

            <h1 className="select-title">드라마 속으로</h1>
            <p className="select-description">(Into the Drama)</p>
            
            <div className="filter-section">
                <CustomDropdown
                    value={selectedDrama}
                    onChange={setSelectedDrama}
                    options={[
                        { value: 'all', label: '전체 드라마' },
                        ...dramas.map(drama => ({ value: drama, label: drama }))
                    ]}
                    className="drama-filter"
                />
                <input
                    type="text"
                    placeholder="캐릭터 또는 드라마 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {selectedChars.length > 0 && (
                    <div className="selected-characters-display">
                        {selectedChars.map((charId, idx) => {
                            const char = characterData[charId];
                            if (!char) return null;
                            return (
                                <div 
                                    key={charId} 
                                    className="selected-char-badge"
                                    onClick={() => handleSelectChar(charId)}
                                >
                                    <img src={char.image} alt={char.name} />
                                    <span>{char.name.split(' (')[0]}</span>
                                    <button 
                                        className="remove-char-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectChar(charId);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <p className="select-instruction">대화할 캐릭터를 1명 또는 2명 선택하세요.</p>
            <div className="select-status" style={{ display: 'none' }}>
                {selectedChars.length === 0 ? (
                    <>
                        <div className="char-slot empty">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            <span>캐릭터 1</span>
                        </div>
                        <div className="char-slot empty">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            <span>캐릭터 2</span>
                        </div>
                    </>
                ) : selectedChars.length === 1 ? (
                    <>
                        <div className="char-slot clickable" onClick={() => handleSelectChar(selectedChars[0])}>
                            <img src={characterData[selectedChars[0]].image} alt={characterData[selectedChars[0]].name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                            <span>{characterData[selectedChars[0]].name.split(' (')[0]}</span>
                            <span className="remove-text">닫기</span>
                        </div>
                        <div className="char-slot empty">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            <span>선택 가능</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="char-slot clickable" onClick={() => handleSelectChar(selectedChars[0])}>
                            <img src={characterData[selectedChars[0]].image} alt={characterData[selectedChars[0]].name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                            <span>{characterData[selectedChars[0]].name.split(' (')[0]}</span>
                            <span className="remove-text">닫기</span>
                        </div>
                        <div className="char-slot clickable" onClick={() => handleSelectChar(selectedChars[1])}>
                            <img src={characterData[selectedChars[1]].image} alt={characterData[selectedChars[1]].name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                            <span>{characterData[selectedChars[1]].name.split(' (')[0]}</span>
                            <span className="remove-text">닫기</span>
                        </div>
                    </>
                )}
            </div>

            <div className="slider-container">
                <div className="character-slider">
                    {filteredCharacters.map(char => {
                        const isSelected = selectedChars.includes(char.id);
                        const isDisabled = !isSelected && selectedChars.length >= 2;
                        const isFavorite = favorites.includes(char.id);
                        return (
                            <div
                                key={char.id}
                                className={`character-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => !isDisabled && handleSelectChar(char.id)}
                            >
                                <button
                                    className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                                    onClick={(e) => toggleFavorite(char.id, e)}
                                    title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                                >
                                    <img 
                                        src={isFavorite ? '/star-filled.png' : '/star-outline.png'} 
                                        alt={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                </button>
                                <div className="drama-title">{char.dramaTitle}</div>
                                <img src={char.image} alt={char.name} className="character-image" />
                                <div 
                                    className="character-name" 
                                    ref={el => nameRefs.current[char.id] = el}
                                >
                                    {char.name}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="start-chat-section">
                <button 
                    className="start-chat-button"
                    disabled={selectedChars.length === 0}
                    onClick={() => onStartChat(selectedChars)}
                >
                    {selectedChars.length === 2 ? "멀티 대화 시작" : "대화 시작"}
                </button>
            </div>
        </div>
    );
};

export default CharacterSelectScreen;

