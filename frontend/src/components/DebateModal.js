import React, { useState } from 'react';
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
    
    const [showRandomTopic, setShowRandomTopic] = useState(false);
    
    // 주제 목록 새로고침
    const refreshTopics = () => {
        setTopicSuggestions(shuffleTopics());
        setDebateTopic('');
    };
    
    const pickRandomTopic = () => {
        const randomTopic = topicSuggestions[Math.floor(Math.random() * topicSuggestions.length)];
        setDebateTopic(typeof randomTopic === 'string' ? randomTopic : randomTopic.text);
        setShowRandomTopic(true);
        setTimeout(() => setShowRandomTopic(false), 2000);
    };
    
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
                        같은 주제, 다른 시선. 그들의 이야기가 시작됩니다.
                    </div>
                    <div className="debate-topic-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                            <label>토론 주제</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button 
                                    className="random-topic-btn"
                                    onClick={pickRandomTopic}
                                >
                                    🎲 랜덤 주제 뽑기
                                </button>
                                <button 
                                    className="refresh-topics-btn"
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
                        </div>
                        {showRandomTopic && (
                            <div style={{ padding: '8px', background: '#e9d9c3', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', color: '#8D6E63', fontSize: '0.9rem' }}>
                                ✨ 주제가 선택되었습니다!
                            </div>
                        )}
                        <input
                            type="text"
                            className="debate-topic-input"
                            value={debateTopic}
                            onChange={(e) => setDebateTopic(e.target.value)}
                            placeholder="토론 주제를 입력하세요"
                        />
                        <div className="debate-topic-suggestions">
                            {topicSuggestions.map((topic, idx) => {
                                const topicText = typeof topic === 'string' ? topic : topic.text;
                                const topicTone = typeof topic === 'string' ? 'medium' : (topic.tone || 'medium');
                                return (
                                    <button
                                        key={idx}
                                        className={`topic-suggestion-btn topic-tone-${topicTone} ${debateTopic === topicText ? 'selected' : ''}`}
                                        onClick={() => setDebateTopic(topicText)}
                                    >
                                        {topicText}
                                    </button>
                                );
                            })}
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

