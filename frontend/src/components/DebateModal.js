import React, { useState, useEffect, useRef } from 'react';
import { debateTopics } from '../constants/debateTopics';

// 토론 모달 컴포넌트
const DebateModal = ({ selectedCharIds, characterData, debateTopic, setDebateTopic, onStart, onClose, debateStyle, setDebateStyle }) => {
    // 토론 주제 랜덤 선택 (9개)
    const shuffleTopics = () => {
        const shuffled = [...debateTopics].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 9);
    };
    
    // 컴포넌트 마운트 시 주제 목록 랜덤 선택
    const [topicSuggestions, setTopicSuggestions] = useState(() => shuffleTopics());
    const [isShuffling, setIsShuffling] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customInputValue, setCustomInputValue] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [editingCustomTopic, setEditingCustomTopic] = useState(false);
    const [slotMachineText, setSlotMachineText] = useState('');
    const [isSlotMachineActive, setIsSlotMachineActive] = useState(false);
    const [isSlotMachineComplete, setIsSlotMachineComplete] = useState(false);
    const textareaRef = useRef(null);
    
    // 주제 목록 새로고침
    const refreshTopics = (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        setTopicSuggestions(shuffleTopics());
        setDebateTopic('');
    };
    
    const pickRandomTopic = () => {
        setIsShuffling(true);
        setIsSlotMachineActive(true);
        setSlotMachineText('');
        
        // 슬롯머신 효과: 빠르게 여러 주제를 보여주다가 최종 선택
        const allTopics = [...debateTopics];
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < 8) {
                // 빠르게 랜덤 주제 표시
                const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
                const topicText = typeof randomTopic === 'string' ? randomTopic : randomTopic.text;
                setSlotMachineText(topicText);
                currentIndex++;
            } else {
                clearInterval(interval);
                // 최종 주제 선택
                const finalTopic = topicSuggestions[Math.floor(Math.random() * topicSuggestions.length)];
                const finalTopicText = typeof finalTopic === 'string' ? finalTopic : finalTopic.text;
                setDebateTopic(finalTopicText);
                setSlotMachineText(finalTopicText);
                setIsShuffling(false);
                setIsSlotMachineActive(false);
                setIsSlotMachineComplete(true);
                
                // 반짝이 효과 후 정리
                setTimeout(() => {
                    setIsSlotMachineComplete(false);
                    setSlotMachineText('');
                }, 600);
            }
        }, 80); // 80ms마다 변경 (총 약 640ms)
    };
    
    const handleCustomInputSubmit = () => {
        if (customInputValue.trim()) {
            const trimmedValue = customInputValue.trim();
            setCustomTopic(trimmedValue);
            setDebateTopic(trimmedValue);
            setShowCustomInput(false);
            setEditingCustomTopic(false);
            setCustomInputValue('');
        } else {
            // 빈 값이면 커스텀 주제 삭제
            setCustomTopic('');
            setShowCustomInput(false);
            setEditingCustomTopic(false);
            setCustomInputValue('');
        }
    };
    
    const handleCustomTopicClick = () => {
        setEditingCustomTopic(true);
        setShowCustomInput(true);
        setCustomInputValue(customTopic);
        setDebateTopic('');
    };
    
    // showCustomInput이 true가 될 때 textarea 높이 초기화 (한 번만 실행)
    useEffect(() => {
        if (showCustomInput && textareaRef.current) {
            // 초기 높이를 100px로 설정 (버튼 크기 그대로)
            textareaRef.current.style.height = '100px';
            // 기존 텍스트가 있으면 그에 맞춰 높이 조절
            if (customInputValue) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.max(100, textareaRef.current.scrollHeight) + 'px';
            }
        }
    }, [showCustomInput]); // customInputValue 의존성 제거
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="my-page-modal debate-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h2>토론 모드</h2>
                <div className="debate-content">
                    <div className="debate-description">
                        같은 주제, 다른 시선.<br />
                        그들의 이야기가 시작됩니다.
                    </div>
                    
                    {/* 토론 주제 섹션 */}
                    <div className="debate-topic-section">
                        <label className="debate-topic-label">토론 주제</label>
                        
                        {/* 전광판 영역 */}
                        <div className={`debate-topic-billboard ${isSlotMachineActive ? 'slot-machine-active' : ''}`}>
                            {(debateTopic || slotMachineText) ? (
                                <div className={`billboard-selected ${isSlotMachineActive ? 'slot-machine-text' : ''} ${isSlotMachineComplete ? 'slot-machine-complete' : ''}`}>
                                    <span className="billboard-quote-left">❝</span>
                                    <span className="billboard-text">{slotMachineText || debateTopic}</span>
                                    <span className="billboard-quote-right">❞</span>
                                </div>
                            ) : (
                                <div className="billboard-placeholder">
                                    <span className="billboard-quote-left">❝</span>
                                    <span className="billboard-text">여기에 선택한 주제가 뜹니다</span>
                                    <span className="billboard-quote-right">❞</span>
                                </div>
                            )}
                        </div>
                        
                        {/* 랜덤 뽑기 및 새로고침 버튼 */}
                        <div className="debate-random-floating">
                            <button 
                                className={`random-topic-floating-btn ${isShuffling ? 'shuffling' : ''}`}
                                onClick={pickRandomTopic}
                                title="랜덤 주제 뽑기"
                            >
                                <span className="dice-icon">🎲</span>
                                <span className="btn-text">오늘의 질문 추천</span>
                            </button>
                            <button 
                                className="refresh-topics-floating-btn"
                                onClick={refreshTopics}
                                title="주제 목록 새로고침"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <polyline points="1 20 1 14 7 14"></polyline>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                            </button>
                        </div>
                        
                        {/* 카드 리스트 */}
                        <div className="debate-topic-suggestions">
                            {topicSuggestions.map((topic, idx) => {
                                const topicText = typeof topic === 'string' ? topic : topic.text;
                                const topicTone = typeof topic === 'string' ? 'medium' : (topic.tone || 'medium');
                                
                                const isSelected = debateTopic === topicText;
                                
                                return (
                                    <button
                                        key={idx}
                                        className={`topic-suggestion-btn topic-tone-${topicTone} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            // 이미 선택된 카드를 다시 클릭하면 선택 취소
                                            if (isSelected) {
                                                setDebateTopic('');
                                            } else {
                                                setDebateTopic(topicText);
                                            }
                                        }}
                                    >
                                        <span className="topic-text">
                                            {topicText}
                                        </span>
                                    </button>
                                );
                            })}
                            
                            {/* 커스텀 주제 카드 (입력한 주제가 있을 때) */}
                            {customTopic && !showCustomInput && (
                                <button
                                    className={`topic-suggestion-btn topic-tone-medium ${debateTopic === customTopic ? 'selected' : ''}`}
                                    onClick={handleCustomTopicClick}
                                >
                                    <span className="topic-text">
                                        {customTopic}
                                    </span>
                                </button>
                            )}
                            
                            {/* 직접 입력하기 카드 */}
                            {(!customTopic || showCustomInput) && (
                                <div 
                                    className={`topic-suggestion-btn topic-custom-input-btn ${showCustomInput ? 'input-active' : ''}`}
                                    onClick={() => !showCustomInput && !editingCustomTopic && setShowCustomInput(true)}
                                >
                                    {!showCustomInput ? (
                                        <>
                                            <span className="custom-input-icon">+</span>
                                            <span className="custom-input-text">직접 주제 입력하기</span>
                                        </>
                                    ) : (
                                        <textarea
                                            ref={textareaRef}
                                            className="custom-topic-input-inline"
                                            value={customInputValue}
                                            onChange={(e) => {
                                                setCustomInputValue(e.target.value);
                                                // 텍스트 입력 시 높이 자동 조절 (최소 높이 100px)
                                                e.target.style.height = 'auto';
                                                const newHeight = Math.max(100, e.target.scrollHeight);
                                                e.target.style.height = newHeight + 'px';
                                            }}
                                            onFocus={(e) => {
                                                // 포커스 시: 빈 값이면 100px 유지, 값이 있으면 내용에 맞춰 조절
                                                if (!e.target.value.trim()) {
                                                    e.target.style.height = '100px';
                                                } else {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = Math.max(100, e.target.scrollHeight) + 'px';
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleCustomInputSubmit();
                                                }
                                                if (e.key === 'Escape') {
                                                    setShowCustomInput(false);
                                                    setEditingCustomTopic(false);
                                                    setCustomInputValue('');
                                                }
                                            }}
                                            onBlur={() => {
                                                if (!customInputValue.trim()) {
                                                    setShowCustomInput(false);
                                                    setEditingCustomTopic(false);
                                                    setCustomInputValue('');
                                                }
                                            }}
                                            placeholder="토론 주제를 입력하세요"
                                            autoFocus
                                            rows={1}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="debate-style-section">
                        <label>토론 스타일</label>
                        <div className="debate-style-buttons">
                            <button 
                                className={`debate-style-btn ${debateStyle === 'aggressive' ? 'active' : ''}`}
                                onClick={() => setDebateStyle('aggressive')}
                            >
                                ⚔️ 공격형
                            </button>
                            <button 
                                className={`debate-style-btn ${debateStyle === 'calm' ? 'active' : ''}`}
                                onClick={() => setDebateStyle('calm')}
                            >
                                🧘 차분형
                            </button>
                            <button 
                                className={`debate-style-btn ${debateStyle === 'playful' ? 'active' : ''}`}
                                onClick={() => setDebateStyle('playful')}
                            >
                                😊 장난형
                            </button>
                            <button 
                                className={`debate-style-btn ${debateStyle === 'balanced' ? 'active' : ''}`}
                                onClick={() => setDebateStyle('balanced')}
                            >
                                ⚖️ 균형형
                            </button>
                        </div>
                    </div>
                    <div className="debate-modal-actions">
                        <button className="debate-start-button" onClick={onStart} disabled={!debateTopic.trim()}>
                            토론 시작
                        </button>
                        <button className="debate-cancel-button" onClick={onClose}>
                            취소
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebateModal;

