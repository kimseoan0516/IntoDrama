import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import './App.css';
import DebateModal from './components/DebateModal';
import CharacterSelectScreen from './components/CharacterSelectScreen';
import { TypingText, SettingsScreen, TemplateScreen } from './components/CommonComponents';
import { GiftModal, ArchetypeMapModal, DiaryModal, AuthModal } from './components/ModalComponents';
import { MyPageScreen, HistoryScreen, StatsScreen, ReportScreen } from './components/ScreenComponents';
import { WeeklyRecapScreen } from './components/WeeklyRecapScreen';
import { characterData } from './constants/characterData';

import { api, API_BASE_URL } from './utils/api';
import { auth, chatHistory as chatHistoryStorage, psychologyReports } from './utils/storage';
import { joinNamesWithJosa, josaWa, hasBatchim } from './utils/koreanJosa';

const ChatScreen = ({ 
    selectedChars, 
    messages, 
    inputText, 
    setInputText, 
    handleSend, 
    handleKeyPress, 
    handleInput, 
    isLoading, 
    messageListRef, 
    textareaRef,
    isCursorInAction, 
    onBack, 
    userProfile,
    currentTurn,
    onExport,
    onExportNovel,
    onSave,
    typingEffect,
    settings,
    randomPlaceholder,
    playMessageSound,
    onShowReport,
    messageType,
    setMessageType,
    isMultiChat,
    onStartDebate,
    onShowArchetype,
    onShowDiary,
    isExportingNovel,
    debateMode,
    waitingForUserInput,
    handleContinueDebate,
    debateCharPositions,
    selectedCharIds,
    characterData,
    showDebateIntervention,
    isInterventionPanelHidden,
    setIsInterventionPanelHidden,
    handleDebateIntervention,
    endDebate,
    debateTopic,
    likedMessages,
    setLikedMessages,
    token,
    setHistoryRefreshTrigger
}) => {
    const charA = selectedChars[0];
    const charB = selectedChars[1]; 
    const isMultiChatLocal = isMultiChat !== undefined ? isMultiChat : (selectedChars.length > 1);
    const [captureMode, setCaptureMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const captureRef = useRef(null);
    const headerNameRefs = useRef({});
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const voiceEmotionRef = useRef(null);
    const interimTranscriptRef = useRef('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const headerMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
                setShowHeaderMenu(false);
            }
        };

        if (showExportMenu || showHeaderMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportMenu, showHeaderMenu]);
    
    const [sceneState, setSceneState] = useState({
        timePhase: 'day',
        mood: 'neutral',
        spotlight: false,
        intensity: 0
    });

    // 커서 위치 가져오기
    const getCaretPosition = (element) => {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return 0;
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
    };

    // 특정 위치의 텍스트 노드 가져오기
    const getTextNodeAtPosition = (root, index) => {
        const treeWalker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null
        );
        let currentIndex = 0;
        let node;
        while ((node = treeWalker.nextNode())) {
            const nodeLength = node.textContent.length;
            if (currentIndex + nodeLength >= index) {
                return node;
            }
            currentIndex += nodeLength;
        }
        return null;
    };

    // HTML 업데이트 및 커서 위치 복원 함수 (즉시 실행)
    const updateHTMLWithCursorRestoreImmediate = (element, newText, savedCursorPos) => {
        // 한글 입력 중이면 즉시 리턴
        if (element._isComposing) {
            return;
        }
        
        const html = formatTextToHTML(newText);
        const currentHTML = element.innerHTML;
        
        if (currentHTML !== html) {
            const cursorBeforeUpdate = savedCursorPos;
            
            // 즉시 HTML 업데이트 (지연 없음)
            element.innerHTML = html;
            
            // 커서 위치 복원
            requestAnimationFrame(() => {
                try {
                    // 다시 한번 한글 입력 중인지 확인
                    if (element._isComposing) {
                        return;
                    }
                    
                    const newSelection = window.getSelection();
                    if (!newSelection) return;
                    
                    const textNodes = [];
                    const walker = document.createTreeWalker(
                        element,
                        NodeFilter.SHOW_TEXT,
                        null
                    );
                    
                    let node = walker.nextNode();
                    while (node) {
                        textNodes.push(node);
                        node = walker.nextNode();
                    }
                    
                    if (textNodes.length === 0) {
                        // 텍스트 노드가 없으면 요소 끝에 커서
                        const newRange = document.createRange();
                        newRange.selectNodeContents(element);
                        newRange.collapse(false);
                        newSelection.removeAllRanges();
                        newSelection.addRange(newRange);
                        element.focus();
                        return;
                    }
                    
                    let currentPos = 0;
                    let targetNode = null;
                    let targetOffset = 0;
                    
                    for (const textNode of textNodes) {
                        const nodeLength = textNode.textContent.length;
                        if (currentPos + nodeLength >= cursorBeforeUpdate) {
                            targetNode = textNode;
                            targetOffset = Math.max(0, Math.min(cursorBeforeUpdate - currentPos, nodeLength));
                            break;
                        }
                        currentPos += nodeLength;
                    }
                    
                    if (targetNode && targetNode.parentNode) {
                        const newRange = document.createRange();
                        newRange.setStart(targetNode, targetOffset);
                        newRange.setEnd(targetNode, targetOffset);
                        newSelection.removeAllRanges();
                        newSelection.addRange(newRange);
                        element.focus();
                    } else if (textNodes.length > 0) {
                        // 텍스트 노드를 찾지 못한 경우 마지막 노드의 끝에 커서 위치
                        const lastNode = textNodes[textNodes.length - 1];
                        if (lastNode && lastNode.parentNode) {
                            const newRange = document.createRange();
                            newRange.setStart(lastNode, lastNode.textContent.length);
                            newRange.setEnd(lastNode, lastNode.textContent.length);
                            newSelection.removeAllRanges();
                            newSelection.addRange(newRange);
                            element.focus();
                        }
                    }
                } catch (err) {
                    console.error('커서 위치 복원 실패:', err);
                    // 실패 시 요소 끝에 커서 위치
                    try {
                        const newSelection = window.getSelection();
                        if (newSelection) {
                            const newRange = document.createRange();
                            newRange.selectNodeContents(element);
                            newRange.collapse(false);
                            newSelection.removeAllRanges();
                            newSelection.addRange(newRange);
                            element.focus();
                        }
                    } catch (fallbackErr) {
                        // 최종 실패 시 무시
                    }
                }
            });
        }
    };

    // HTML 업데이트 및 커서 위치 복원 함수 (지연 있음, 한글 입력 대응용)
    const updateHTMLWithCursorRestore = (element, newText, savedCursorPos) => {
        // 한글 입력 중이면 즉시 리턴
        if (element._isComposing) {
            return;
        }
        
        const html = formatTextToHTML(newText);
        const currentHTML = element.innerHTML;
        
        if (currentHTML !== html) {
            const cursorBeforeUpdate = savedCursorPos;
            
            // 입력 중일 때는 HTML 업데이트 지연 (오타 방지)
            clearTimeout(element._htmlUpdateTimeout);
            element._htmlUpdateTimeout = setTimeout(() => {
                // 다시 한번 한글 입력 중인지 확인
                if (element._isComposing) {
                    return;
                }
                
                const currentText = element.innerText || element.textContent || '';
                if (currentText !== newText) {
                    return;
                }
                
                // 커서 위치 확인
                const currentSelection = window.getSelection();
                const currentRange = currentSelection.rangeCount > 0 ? currentSelection.getRangeAt(0) : null;
                let currentCursorPos = 0;
                if (currentRange && currentRange.commonAncestorContainer) {
                    const tempRange = currentRange.cloneRange();
                    tempRange.selectNodeContents(element);
                    tempRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                    currentCursorPos = tempRange.toString().length;
                }
                
                // 커서 위치가 크게 변경되지 않았을 때만 HTML 업데이트
                if (Math.abs(currentCursorPos - cursorBeforeUpdate) <= 1) {
                    element.innerHTML = html;
                    
                    // 커서 위치 복원
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            try {
                                // 다시 한번 한글 입력 중인지 확인
                                if (element._isComposing) {
                                    return;
                                }
                                
                                const newSelection = window.getSelection();
                                if (!newSelection) return;
                                
                                const textNodes = [];
                                const walker = document.createTreeWalker(
                                    element,
                                    NodeFilter.SHOW_TEXT,
                                    null
                                );
                                
                                let node = walker.nextNode();
                                while (node) {
                                    textNodes.push(node);
                                    node = walker.nextNode();
                                }
                                
                                if (textNodes.length === 0) {
                                    // 텍스트 노드가 없으면 요소 끝에 커서
                                    const newRange = document.createRange();
                                    newRange.selectNodeContents(element);
                                    newRange.collapse(false);
                                    newSelection.removeAllRanges();
                                    newSelection.addRange(newRange);
                                    element.focus();
                                    return;
                                }
                                
                                let currentPos = 0;
                                let targetNode = null;
                                let targetOffset = 0;
                                
                                for (const textNode of textNodes) {
                                    const nodeLength = textNode.textContent.length;
                                    if (currentPos + nodeLength >= cursorBeforeUpdate) {
                                        targetNode = textNode;
                                        targetOffset = Math.max(0, Math.min(cursorBeforeUpdate - currentPos, nodeLength));
                                        break;
                                    }
                                    currentPos += nodeLength;
                                }
                                
                                if (targetNode && targetNode.parentNode) {
                                    const newRange = document.createRange();
                                    newRange.setStart(targetNode, targetOffset);
                                    newRange.setEnd(targetNode, targetOffset);
                                    newSelection.removeAllRanges();
                                    newSelection.addRange(newRange);
                                    element.focus();
                                } else if (textNodes.length > 0) {
                                    // 텍스트 노드를 찾지 못한 경우 마지막 노드의 끝에 커서 위치
                                    const lastNode = textNodes[textNodes.length - 1];
                                    if (lastNode && lastNode.parentNode) {
                                        const newRange = document.createRange();
                                        newRange.setStart(lastNode, lastNode.textContent.length);
                                        newRange.setEnd(lastNode, lastNode.textContent.length);
                                        newSelection.removeAllRanges();
                                        newSelection.addRange(newRange);
                                        element.focus();
                                    }
                                }
                            } catch (err) {
                                console.error('커서 위치 복원 실패:', err);
                                // 실패 시 요소 끝에 커서 위치
                                try {
                                    const newSelection = window.getSelection();
                                    if (newSelection) {
                                        const newRange = document.createRange();
                                        newRange.selectNodeContents(element);
                                        newRange.collapse(false);
                                        newSelection.removeAllRanges();
                                        newSelection.addRange(newRange);
                                        element.focus();
                                    }
                                } catch (fallbackErr) {
                                    // 최종 실패 시 무시
                                }
                            }
                        });
                    });
                }
            }, 100); // 100ms 지연 (한글 입력 완전 종료 대기)
        }
    };

    // 텍스트를 파싱해서 대사/행동 부분을 구분하는 함수
    const parseTextToSegments = (text) => {
        const segments = [];
        let currentSegment = { type: '말', text: '', start: 0 };
        let depth = 0;

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '(') {
                if (depth === 0) {
                    if (currentSegment.text.trim()) {
                        currentSegment.end = i;
                        segments.push({ ...currentSegment });
                    }
                    currentSegment = { type: '행동', text: '(', start: i };
                } else {
                    currentSegment.text += text[i];
                }
                depth++;
            } else if (text[i] === ')') {
                currentSegment.text += text[i];
                depth--;
                if (depth === 0) {
                    currentSegment.end = i + 1;
                    segments.push({ ...currentSegment });
                    currentSegment = { type: '말', text: '', start: i + 1 };
                }
            } else {
                currentSegment.text += text[i];
            }
        }

        if (currentSegment.text.trim() || depth > 0) {
            if (depth > 0) {
                currentSegment.type = '행동';
            }
            if (currentSegment.text.trim()) {
                currentSegment.end = text.length;
                segments.push({ ...currentSegment });
            }
        }

        return segments;
    };

    // 텍스트를 HTML로 변환하는 함수 (괄호 안의 텍스트는 기울임체)
    const formatTextToHTML = (text) => {
        if (!text) return '';
        const segments = parseTextToSegments(text);
        return segments.map(segment => {
            if (segment.type === '행동') {
                return `<span style="font-style: italic; color: #8D6E63; opacity: 0.85;">${segment.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
            } else {
                return segment.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
        }).join('');
    };

    const detectRomanceLevel = (text) => {
        if (!text) return 0;
        
        // 취향을 묻는 패턴 감지 (로맨스가 아닌 경우)
        const preferencePatterns = [
            /어떤\s+\w+\s*(좋아|조아|선호|취향)/,
            /무엇(을|를)\s*(좋아|조아|선호)/,
            /뭐\s*(좋아|조아|선호)/,
            /\w+\s*(좋아|조아|선호|취향)\s*(해|해요|하세요|하나|하니|하냐)/,
            /\w+\s*(종류|맛|스타일|스타일|타입)\s*(좋아|조아|선호)/,
            /(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미|취향|선호)\s*(좋아|조아|선호)/,
            /(좋아|조아|선호)\s*(하는|하는)\s*(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미)/,
            /(어떤|무엇|뭐)\s*(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미)/
        ];
        
        // 취향을 묻는 패턴이 있으면 로맨스 점수 0 반환
        const isPreferenceQuestion = preferencePatterns.some(pattern => pattern.test(text));
        if (isPreferenceQuestion) {
            return 0;
        }
        
        const keywords = ['좋아해', '좋아', '조아한다', '조아해', '보고싶어', '사랑', '설레', '보고 싶', '너 생각', '그리워', '사랑해', '좋아한다', '마음', '심장', '떨려', '두근', '설렘', '행복', '기쁨', '웃음', '미소'];
        let score = 0;
        keywords.forEach(k => {
            if (text.includes(k)) score += 0.3;
        });
        if (text.endsWith('...') || text.endsWith('…')) score += 0.2;
        if (text.includes('❤') || text.includes('💕') || text.includes('💖')) score += 0.3;
        return Math.min(score, 1);
    };

    const detectComfortLevel = (text) => {
        if (!text) return 0;
        const keywords = ['괜찮아', '힘내', '위로', '안아', '따뜻', '포근', '편안', '안심', '걱정', '아픔', '아프', '아파', '슬퍼', '울어', '힘들어', '외로워', '지치', '피곤', '힘들', '지침'];
        let score = 0;
        keywords.forEach(k => {
            if (text.includes(k)) {
                if (k === '지치' || k === '피곤' || k === '힘들' || k === '지침') {
                    score += 0.4;
                } else {
                    score += 0.3;
                }
            }
        });
        return Math.min(score, 1);
    };

    const detectConflictLevel = (text) => {
        if (!text) return 0;
        const conflictKeywords = ['화나', '싫어', '미워', '이해 못해', '짜증', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망'];
        const conflictWithTired = ['화나', '싫어', '미워', '짜증', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망', '답답'];
        
        let score = 0;
        const hasTired = text.includes('지치') || text.includes('피곤') || text.includes('힘들');
        
        conflictKeywords.forEach(k => {
            if (text.includes(k)) {
                score += 0.3;
            }
        });
        
        if (hasTired) {
            const hasConflictWithTired = conflictWithTired.some(k => text.includes(k));
            if (hasConflictWithTired) {
                score += 0.2;
            }
        }
        
        if (text.includes('답답')) {
            if (hasTired) {
                score += 0.2;
            } else {
                score += 0.3;
            }
        }
        
        return Math.min(score, 1);
    };

    const detectConfession = (text) => {
        if (!text) return false;
        const worryWords = ['말해도 될까', '고민', '어떡하지', '사실은', '말하고 싶', '고백', '진심', '솔직히', '말할게', '들어줘', '중요한', '말이 있어'];
        return worryWords.some(w => text.includes(w));
    };

    const getTimePhase = (messageCount) => {
        if (messageCount < 20) return 'day';
        if (messageCount < 50) return 'evening';
        return 'night';
    };

    const getPlaceholderByMood = (mood, userNickname) => {
        const placeholders = {
            romance: [
                "무슨 마음으로 이 밤을 보내고 있어?",
                "지금 가장 듣고 싶은 말이 있어?",
                "이 밤, 무슨 생각을 하고 있어?",
                "지금 내가 가장 궁금한 건 뭐야?"
            ],
            comfort: [
                "지금 가장 힘든 마음이 있다면?",
                "하고 싶은 말이 있지만 망설이는 중이라면?",
                "지금 가장 필요한 건 뭐야?",
                "마음이 무겁다면 여기서 말해봐"
            ],
            conflict: [
                "하고 싶은 말이 있지만 망설이는 중이라면?",
                "지금 가장 답답한 마음이 있다면?",
                "솔직하게 말하고 싶은 게 있어?",
                "지금 가장 힘든 건 뭐야?"
            ],
            neutral: [
                "이야기하고 싶은 게 있어?",
                "무슨 생각해?",
                "오늘 하루는 어땠어?",
                "지금 뭐해?"
            ]
        };
        
        const moodPlaceholders = placeholders[mood] || placeholders.neutral;
        const selected = moodPlaceholders[Math.floor(Math.random() * moodPlaceholders.length)];
        return selected.replace('서안', userNickname);
    };

    useEffect(() => {
        if (messages.length === 0) {
            setSceneState({
                timePhase: 'day',
                mood: 'neutral',
                spotlight: false,
                intensity: 0
            });
            return;
        }

        const userMessages = messages.filter(msg => msg.sender === 'user');
        if (userMessages.length === 0) {
            return;
        }

        const lastUserMessage = userMessages[userMessages.length - 1];
        const userText = lastUserMessage?.text || '';
        
        const romanceScore = detectRomanceLevel(userText);
        const conflictScore = detectConflictLevel(userText);
        const hasConfessionKeyword = detectConfession(userText);
        
        const userComfortScore = detectComfortLevel(userText);
        const aiMessages = messages.filter(msg => msg.sender === 'ai');
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        const aiMessageText = lastAiMessage?.text || '';
        const aiComfortScore = detectComfortLevel(aiMessageText);
        const comfortScore = Math.max(userComfortScore, aiComfortScore);
        
        const wasRomance = sceneState.mood === 'romance';
        const wasConfessionActive = sceneState.spotlight;
        
        let mood = 'neutral';
        let intensity = 0;
        
        const maxScore = Math.max(romanceScore, comfortScore, conflictScore);
        
        if (maxScore > 0.1) {
            // 로맨스는 명확한 로맨스 키워드가 있을 때만 인식
            // comfortScore가 높고 romanceScore가 낮으면 comfort로 인식
            if (romanceScore > 0.2 && comfortScore > 0.1 && romanceScore >= comfortScore) {
                mood = 'romance';
                intensity = Math.min(romanceScore * 1.5, 1);
            } else if (romanceScore > 0.2 && romanceScore === maxScore) {
                mood = 'romance';
                intensity = Math.min(romanceScore * 1.5, 1);
            } else if (comfortScore === maxScore) {
                mood = 'comfort';
                intensity = Math.min(comfortScore * 1.5, 1);
            } else if (conflictScore === maxScore) {
                mood = 'conflict';
                intensity = Math.min(conflictScore * 1.5, 1);
            } else {
                // 명확하지 않으면 neutral
                mood = 'neutral';
                intensity = 0;
            }
        } else {
            if (!wasConfessionActive) {
                mood = 'neutral';
                intensity = 0;
            }
        }
        
        let hasConfession = false;
        
        if (hasConfessionKeyword && (romanceScore > 0.15 || mood === 'romance' || wasRomance)) {
            hasConfession = true;
                mood = 'romance';
            intensity = Math.min(Math.max(romanceScore, 0.4) * 1.5, 1);
        }
        else if (wasConfessionActive) {
            if (romanceScore > 0.1 || mood === 'romance') {
                hasConfession = true;
                    mood = 'romance';
                intensity = Math.min(Math.max(romanceScore, 0.3) * 1.5, 1);
            } else {
            hasConfession = false;
            }
        }
        
        setSceneState({
            timePhase: getTimePhase(messages.length),
            mood: mood,
            spotlight: hasConfession,
            intensity: intensity
        });
    }, [messages]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'ko-KR';

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                // 모든 결과를 순회하면서 interim과 final을 구분
                for (let i = 0; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // 실시간으로 입력창에 표시 (interim 결과)
                if (interimTranscript) {
                    const previousInterim = interimTranscriptRef.current || '';
                    setInputText(prev => {
                        // 이전 interim 텍스트 제거
                        let baseText = prev;
                        if (previousInterim) {
                            baseText = baseText.replace(previousInterim, '');
                        }
                        // 새로운 interim 텍스트 추가
                        const newText = (baseText.trim() + (baseText.trim() ? ' ' : '') + interimTranscript).trim();
                        interimTranscriptRef.current = interimTranscript;
                        
                        // contentEditable div에도 실시간 반영
                        if (textareaRef && textareaRef.current && textareaRef.current.contentEditable === 'true') {
                            setTimeout(() => {
                                if (textareaRef.current) {
                                    const html = formatTextToHTML(newText);
                                    textareaRef.current.innerHTML = html;
                                    // 커서를 끝으로 이동
                                    const range = document.createRange();
                                    const selection = window.getSelection();
                                    range.selectNodeContents(textareaRef.current);
                                    range.collapse(false);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                            }, 0);
                        }
                        
                        return newText;
                    });
                }
                
                // 최종 결과 처리
                if (finalTranscript) {
                    let finalText = finalTranscript;
                    const emotion = voiceEmotionRef.current;
                    if (emotion && emotion.confidence > 0.6) {
                        const emotionEmoji = {
                            'excited': '😊',
                            'sad': '😢',
                            'happy': '😄',
                            'angry': '😠',
                            'neutral': ''
                        };
                        const emoji = emotionEmoji[emotion.emotion] || '';
                        if (emoji) {
                            finalText = finalTranscript + ' ' + emoji;
                        }
                    }
                    
                    setInputText(prev => {
                        // 이전 interim 텍스트 제거
                        let currentText = prev;
                        if (interimTranscriptRef.current) {
                            currentText = currentText.replace(interimTranscriptRef.current, '');
                        }
                        currentText = currentText.trim();
                        interimTranscriptRef.current = '';
                        
                        // 중복 방지: 마지막 단어가 같으면 제거
                        const words = currentText.split(/\s+/);
                        const finalWords = finalText.trim().split(/\s+/);
                        
                        if (words.length > 0 && finalWords.length > 0) {
                            const lastWord = words[words.length - 1];
                            const firstFinalWord = finalWords[0];
                            
                            // 마지막 단어와 첫 번째 final 단어가 같으면 중복 제거
                            if (lastWord === firstFinalWord) {
                                finalWords.shift();
                            }
                        }
                        
                        const newFinalText = finalWords.join(' ');
                        const resultText = currentText + (currentText && newFinalText ? ' ' : '') + newFinalText;
                        
                        // contentEditable div에도 반영
                        if (textareaRef && textareaRef.current && textareaRef.current.contentEditable === 'true') {
                            setTimeout(() => {
                                if (textareaRef.current) {
                                    const html = formatTextToHTML(resultText);
                                    textareaRef.current.innerHTML = html;
                                    // 커서를 끝으로 이동
                                    const range = document.createRange();
                                    const selection = window.getSelection();
                                    range.selectNodeContents(textareaRef.current);
                                    range.collapse(false);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                            }, 0);
                        }
                        
                        return resultText;
                    });
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('음성 인식 오류:', event.error);
                setIsRecording(false);
                if (event.error === 'no-speech') {
                    alert('음성이 감지되지 않았습니다. 다시 시도해주세요.');
                } else if (event.error === 'not-allowed') {
                    alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
                }
            };

            recognitionRef.current.onend = () => {
                if (interimTranscriptRef.current) {
                    setInputText(prev => {
                        const currentText = prev.replace(interimTranscriptRef.current, '').trim();
                        const finalText = interimTranscriptRef.current;
                        
                        let textToAdd = finalText;
                        const emotion = voiceEmotionRef.current;
                        if (emotion && emotion.confidence > 0.6) {
                            const emotionEmoji = {
                                'excited': '😊',
                                'sad': '😢',
                                'happy': '😄',
                                'angry': '😠',
                                'neutral': ''
                            };
                            const emoji = emotionEmoji[emotion.emotion] || '';
                            if (emoji) {
                                textToAdd = finalText + ' ' + emoji;
                            }
                        }
                        
                        interimTranscriptRef.current = '';
                        return currentText + (currentText ? ' ' : '') + textToAdd;
                    });
                }
                setIsRecording(false);
                voiceEmotionRef.current = null;
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setInputText]);

    const analyzeVoiceToneRealtime = () => {
        if (!analyserRef.current) return null;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);
        const timeData = new Uint8Array(bufferLength);
        
        analyserRef.current.getByteFrequencyData(frequencyData);
        analyserRef.current.getByteTimeDomainData(timeData);
        
        let peak = 0;
        for (let i = 0; i < bufferLength; i++) {
            if (frequencyData[i] > peak) peak = frequencyData[i];
        }
        
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
            const normalized = (timeData[i] - 128) / 128;
            sumSquares += normalized * normalized;
        }
        const volume = Math.sqrt(sumSquares / bufferLength);
        
        let emotion = 'neutral';
        let confidence = 0.5;
        
        if (peak > 150 && volume > 0.3) {
            emotion = 'excited';
            confidence = Math.min(0.9, (peak / 255 + volume) / 2);
        }
        else if (peak < 80 && volume < 0.2) {
            emotion = 'sad';
            confidence = Math.min(0.9, (1 - peak / 255 + 1 - volume) / 2);
        }
        else if (peak > 100 && peak < 150 && volume > 0.25) {
            emotion = 'happy';
            confidence = Math.min(0.85, (peak / 255 + volume) / 2);
        }
        else if (peak < 100 && volume > 0.25) {
            emotion = 'angry';
            confidence = Math.min(0.8, (1 - peak / 255 + volume) / 2);
        }
        
        return { emotion, confidence, peak, volume };
    };
    const handleVoiceInput = async () => {
        if (!recognitionRef.current) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return;
        }

        if (isRecording) {
            // 음성 인식 중지
            recognitionRef.current.stop();
            
            if (interimTranscriptRef.current) {
                setInputText(prev => {
                    const currentText = prev.replace(interimTranscriptRef.current, '').trim();
                    const finalText = interimTranscriptRef.current;
                    
                    let textToAdd = finalText;
                    const emotion = voiceEmotionRef.current;
                    if (emotion && emotion.confidence > 0.6) {
                        const emotionEmoji = {
                            'excited': '😊',
                            'sad': '😢',
                            'happy': '😄',
                            'angry': '😠',
                            'neutral': ''
                        };
                        const emoji = emotionEmoji[emotion.emotion] || '';
                        if (emoji) {
                            textToAdd = finalText + ' ' + emoji;
                        }
                    }
                    
                    interimTranscriptRef.current = '';
                    return currentText + (currentText ? ' ' : '') + textToAdd;
                });
            }
            
            setIsRecording(false);
            voiceEmotionRef.current = null;
            
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        } else {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 2048;
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);
                
                const analyzeInterval = setInterval(() => {
                    if (isRecording && analyserRef.current) {
                        voiceEmotionRef.current = analyzeVoiceToneRealtime();
                    } else {
                        clearInterval(analyzeInterval);
                    }
                }, 500);
                
                recognitionRef.current.onend = () => {
                    clearInterval(analyzeInterval);
                    stream.getTracks().forEach(track => track.stop());
                    if (audioContextRef.current) {
                        audioContextRef.current.close();
                        audioContextRef.current = null;
                    }
                };
                
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error('음성 인식 시작 실패:', error);
                setIsRecording(false);
                if (error.name === 'NotAllowedError') {
                    alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
                }
            }
        }
    };

    const handleCaptureSelected = async () => {
        if (selectedMessages.length !== 2) {
            alert('시작 메시지와 끝 메시지를 선택해주세요.');
            return;
        }

        const startIdx = Math.min(selectedMessages[0], selectedMessages[1]);
        const endIdx = Math.max(selectedMessages[0], selectedMessages[1]);
        const selectedRange = messages.slice(startIdx, endIdx + 1);

        if (selectedRange.length === 0) {
            alert('선택된 메시지가 없습니다.');
            return;
        }

        // 선택된 메시지만 렌더링할 임시 컨테이너 생성 (헤더 없이)
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = captureRef.current?.offsetWidth ? `${captureRef.current.offsetWidth}px` : '600px';
        tempContainer.style.background = '#F5F1EB';
        tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif';
        tempContainer.style.textRendering = 'optimizeLegibility';
        tempContainer.style.webkitFontSmoothing = 'antialiased';
        tempContainer.style.mozOsxFontSmoothing = 'grayscale';
        tempContainer.className = 'capture-container';

        const messageListClone = document.createElement('div');
        messageListClone.className = 'message-list';
        messageListClone.style.padding = '20px 16px';
        messageListClone.style.background = '#F5F1EB';
        messageListClone.style.minHeight = 'auto';
        messageListClone.style.display = 'flex';
        messageListClone.style.flexDirection = 'column';
        messageListClone.style.gap = '24px';

        selectedRange.forEach((msg, idx) => {
            const msgElement = captureRef.current.children[startIdx + idx];
            if (msgElement) {
                const clonedMsg = msgElement.cloneNode(true);
                
                clonedMsg.classList.remove('selected-for-capture', 'selectable', 'out-of-range', 'in-range-for-capture');
                
                clonedMsg.style.opacity = '1';
                clonedMsg.style.filter = 'none';
                
                const allChildElements = clonedMsg.querySelectorAll('*');
                allChildElements.forEach(el => {
                    const computedStyle = window.getComputedStyle(el);
                    if (computedStyle.opacity !== '1') {
                        el.style.opacity = '1';
                    }
                    if (computedStyle.filter !== 'none') {
                        el.style.filter = 'none';
                    }
                    if (computedStyle.backdropFilter && computedStyle.backdropFilter !== 'none') {
                        el.style.backdropFilter = 'none';
                    }
                    // 색상 관련 스타일 명시적으로 복원
                    if (computedStyle.color) {
                        el.style.color = computedStyle.color;
                    }
                    if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && computedStyle.backgroundColor !== 'transparent') {
                        el.style.backgroundColor = computedStyle.backgroundColor;
                    }
                });
                
                messageListClone.appendChild(clonedMsg);
            }
        });

        tempContainer.appendChild(messageListClone);
        document.body.appendChild(tempContainer);

        // 선택된 메시지 캡처
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(tempContainer, {
                    backgroundColor: '#F5F1EB',
                    scale: 3,
                    logging: false,
                    useCORS: true,
                    allowTaint: false,
                    width: tempContainer.offsetWidth,
                    height: tempContainer.offsetHeight,
                    windowWidth: tempContainer.offsetWidth,
                    windowHeight: tempContainer.offsetHeight,
                    removeContainer: false,
                    imageTimeout: 15000,
                    pixelRatio: Math.max(window.devicePixelRatio || 2, 2),
                    foreignObjectRendering: false,
                    ignoreElements: (element) => {
                        return element.classList && element.classList.contains('capture-controls');
                    },
                    onclone: (clonedDoc) => {
                        // 모든 요소의 색상과 스타일 명시적으로 복원
                        const clonedDocElements = clonedDoc.querySelectorAll('*');
                        clonedDocElements.forEach(el => {
                            // 투명도 및 필터 복원
                            el.style.opacity = '1';
                            el.style.filter = 'none';
                            if (el.style.backdropFilter) {
                                el.style.backdropFilter = 'none';
                            }
                            
                            // 텍스트 렌더링 설정
                                el.style.textRendering = 'optimizeLegibility';
                            el.style.webkitFontSmoothing = 'antialiased';
                            el.style.mozOsxFontSmoothing = 'grayscale';
                            
                            // 메시지 버블 배경색 명시적으로 설정
                            if (el.classList && el.classList.contains('message-bubble')) {
                                if (el.classList.contains('ai')) {
                                    el.style.backgroundColor = '#FFFFFF';
                                } else if (el.classList.contains('user')) {
                                    el.style.backgroundColor = '#E8D5C4';
                                }
                            }
                            
                            // 텍스트 색상 명시적으로 설정
                            if (el.classList && (el.classList.contains('message-text') || el.classList.contains('message-bubble'))) {
                                const computedStyle = window.getComputedStyle(el);
                                if (computedStyle.color) {
                                    el.style.color = computedStyle.color;
                                }
                            }
                        });
                        
                        // 배경색 명시적으로 설정
                        const body = clonedDoc.body;
                        if (body) {
                            body.style.backgroundColor = '#F5F1EB';
                        }
                        const html = clonedDoc.documentElement;
                        if (html) {
                            html.style.backgroundColor = '#F5F1EB';
                        }
                        
                        // 컨테이너 배경색 명시적으로 설정
                        const container = clonedDoc.querySelector('.capture-container');
                        if (container) {
                            container.style.backgroundColor = '#F5F1EB';
                        }
                        const messageList = clonedDoc.querySelector('.message-list');
                        if (messageList) {
                            messageList.style.backgroundColor = '#F5F1EB';
                        }
                    }
                });

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `대화_${new Date().toISOString().split('T')[0]}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 'image/png', 1.0);

                document.body.removeChild(tempContainer);
                setCaptureMode(false);
                setSelectedMessages([]);
            } catch (error) {
                console.error('캡쳐 실패:', error);
                alert('캡쳐 중 오류가 발생했습니다.');
                if (document.body.contains(tempContainer)) {
                    document.body.removeChild(tempContainer);
                }
            }
        }, 100);
    };

    useEffect(() => {
        const adjustHeaderNames = () => {
            const charGroup = document.querySelector('.char-group');
            if (!charGroup) return;
            
            const nameElements = charGroup.querySelectorAll('.char-name');
            if (nameElements.length === 0) return;
            
            const header = charGroup.closest('.chat-header');
            if (!header) return;
            
            const backButton = header.querySelector('.back-button');
            const headerActions = header.querySelector('.header-actions');
            const backButtonWidth = backButton ? backButton.offsetWidth + 8 : 0;
            const actionsWidth = headerActions ? headerActions.offsetWidth + 8 : 0;
            const headerInfo = header.querySelector('.header-info');
            const headerInfoLeftPadding = 4;
            const headerInfoRightPadding = 12;
            const headerPadding = 12;
            const availableWidth = header.offsetWidth - backButtonWidth - actionsWidth - headerPadding * 2 - headerInfoLeftPadding - headerInfoRightPadding;
            
            const avatars = charGroup.querySelectorAll('.header-avatar');
            const dividers = charGroup.querySelectorAll('.divider');
            let usedWidth = 0;
            avatars.forEach(avatar => {
                usedWidth += avatar.offsetWidth + 4;
            });
            dividers.forEach(divider => {
                usedWidth += divider.offsetWidth + 4;
            });
            
            const maxNamesWidth = availableWidth - usedWidth - 4;
            const baseFontSize = isMultiChatLocal ? 16.8 : 19.2;
            
            const findOptimalFontSize = () => {
                let fontSize = baseFontSize;
                let minFontSize = 9;
                
                nameElements.forEach(el => {
                    el.style.fontSize = `${fontSize}px`;
                });
                
                const measureTotalWidth = () => {
                    let total = 0;
                    nameElements.forEach((el, index) => {
                        const originalDisplay = el.style.display;
                        el.style.display = 'inline-block';
                        total += el.scrollWidth;
                        el.style.display = originalDisplay;
                        
                        if (index < nameElements.length - 1) {
                            total += 4;
                        }
                    });
                    return total;
                };
                
                let currentFontSize = fontSize;
                while (measureTotalWidth() > maxNamesWidth && currentFontSize > minFontSize) {
                    currentFontSize -= 0.3;
                    const fontSizeToApply = currentFontSize;
                    for (let i = 0; i < nameElements.length; i++) {
                        nameElements[i].style.fontSize = `${fontSizeToApply}px`;
                    }
                }
                
                return currentFontSize;
            };
            
            const optimalFontSize = findOptimalFontSize();
            
            nameElements.forEach(el => {
                el.style.fontSize = `${optimalFontSize}px`;
            });
        };

        const timer1 = setTimeout(adjustHeaderNames, 0);
        const timer2 = setTimeout(adjustHeaderNames, 50);
        const timer3 = setTimeout(adjustHeaderNames, 100);
        
        window.addEventListener('resize', adjustHeaderNames);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            window.removeEventListener('resize', adjustHeaderNames);
        };
    }, [selectedChars, isMultiChatLocal]);

    useEffect(() => {
        if (messageListRef.current) {
            const element = messageListRef.current;
            
            // 타이핑 중에는 smooth 스크롤 비활성화하여 튕김 방지
            const originalScrollBehavior = element.style.scrollBehavior;
            element.style.scrollBehavior = 'auto';
            
            const scrollToBottom = () => {
                if (messageListRef.current) {
                    const el = messageListRef.current;
                    // 즉시 스크롤 (smooth 없이)
                    el.scrollTop = el.scrollHeight;
                }
            };
            
            // DOM 변경 감지하여 자동 스크롤
            const observer = new MutationObserver(() => {
                scrollToBottom();
            });
            
            observer.observe(element, {
                childList: true,
                subtree: true,
                characterData: true
            });
            
            // 초기 스크롤
            requestAnimationFrame(() => {
                scrollToBottom();
                requestAnimationFrame(() => {
                    scrollToBottom();
                });
            });
            
            const timer1 = setTimeout(scrollToBottom, 0);
            const timer2 = setTimeout(scrollToBottom, 10);
            const timer3 = setTimeout(scrollToBottom, 50);
            
            return () => {
                observer.disconnect();
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
                element.style.scrollBehavior = originalScrollBehavior;
            };
        }
    }, [messages, messageListRef]);

    const renderHeader = () => {
        // 토론 모드일 때는 "토론 모드" 표시
        if (debateMode) {
            return (
                <div className="header-info">
                    <div className="char-group single">
                        <h2 className="char-name">
                            토론 모드
                        </h2>
                    </div>
                </div>
            );
        }
        
        // 일반 모드일 때는 캐릭터 이름 표시
        if (isMultiChatLocal) {
            return (
                <div className="header-info">
                    <div className="char-group">
                        <div className="header-avatar">
                            <img src={charA.image} alt={charA.name} />
                        </div>
                        <h2 
                            className="char-name"
                            ref={el => headerNameRefs.current['charA'] = el}
                        >
                            {charA.name.split(' (')[0]}
                        </h2>
                        <span className="divider">&</span>
                        <div className="header-avatar">
                            <img src={charB.image} alt={charB.name} />
                        </div>
                        <h2 
                            className="char-name"
                            ref={el => headerNameRefs.current['charB'] = el}
                        >
                            {charB.name.split(' (')[0]}
                        </h2>
                    </div>
                </div>
            );
        } else {
            return (
                    <div className="header-info">
                    <div className="char-group single">
                    <div className="header-avatar">
                        <img src={charA.image} alt={charA.name} />
                    </div>
                        <h2 
                            className="char-name"
                            ref={el => headerNameRefs.current['charA'] = el}
                        >
                            {charA.name.split(' (')[0]}
                        </h2>
                    </div>
                </div>
            );
        }
    };

    return (
        <div 
            className={`chat-container ${settings?.background ? 'has-custom-background' : ''} ${debateMode ? '' : `mood-${sceneState.mood} ${sceneState.spotlight ? 'confession-scene' : ''}`}`} 
            style={settings?.background ? { 
                backgroundImage: `url(${settings.background})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent'
            } : {}}
        >
            {showDebateIntervention && !isInterventionPanelHidden && (
                <div className="debate-intervention-panel">
                    <div className="debate-intervention-header">
                        <div className="debate-intervention-title">어떤 의견에 더 공감하시나요?</div>
                        <button 
                            className="debate-intervention-hide-btn"
                            onClick={() => setIsInterventionPanelHidden(true)}
                            title="잠시 숨기기"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="debate-intervention-buttons">
                        <button 
                            className="debate-intervention-btn intervention-a"
                            onClick={() => {
                                const text = `${characterData && selectedCharIds[0] && characterData[selectedCharIds[0]] ? characterData[selectedCharIds[0]].name.split(' (')[0] : '첫 번째'} 말이 훨씬 마음에 와닿았어`;
                                handleDebateIntervention('a', text);
                            }}
                        >
                            <span className="intervention-number">1</span>
                            <span className="intervention-text">{characterData && selectedCharIds[0] && characterData[selectedCharIds[0]] ? characterData[selectedCharIds[0]].name.split(' (')[0] : '첫 번째'} 말이 훨씬 마음에 와닿았어</span>
                        </button>
                        <button 
                            className="debate-intervention-btn intervention-b"
                            onClick={() => {
                                const text = `난 ${characterData && selectedCharIds[1] && characterData[selectedCharIds[1]] ? characterData[selectedCharIds[1]].name.split(' (')[0] : '두 번째'} 쪽 생각이 더 설득력 있어 보여`;
                                handleDebateIntervention('b', text);
                            }}
                        >
                            <span className="intervention-number">2</span>
                            <span className="intervention-text">난 {characterData && selectedCharIds[1] && characterData[selectedCharIds[1]] ? characterData[selectedCharIds[1]].name.split(' (')[0] : '두 번째'} 쪽 생각이 더 설득력 있어 보여</span>
                        </button>
                        <button 
                            className="debate-intervention-btn intervention-neutral"
                            onClick={() => {
                                const text = '둘 다 일리가 있어서 좀 더 듣고 싶어';
                                handleDebateIntervention('neutral', text);
                            }}
                        >
                            <span className="intervention-number">3</span>
                            <span className="intervention-text">둘 다 일리가 있어서 좀 더 듣고 싶어</span>
                        </button>
                    </div>
                </div>
            )}
            {showDebateIntervention && isInterventionPanelHidden && (
                <div className="debate-intervention-show-btn-container">
                    <button 
                        className="debate-intervention-show-btn"
                        onClick={() => setIsInterventionPanelHidden(false)}
                    >
                        💭 선택지 다시 보기
                    </button>
                </div>
            )}
            <header className="chat-header">
                <button className="back-button" onClick={onBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                        <path d="M17 18l-8-6 8-6"/>
                    </svg>
                </button>
                {renderHeader()}
                <div className="header-actions">
                    {debateMode && (
                        <button 
                            className="debate-end-button"
                            title="토론 종료"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (window.confirm('토론을 종료하시겠습니까?')) {
                                    endDebate();
                                }
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            토론 종료
                        </button>
                    )}
                    <div 
                        className="header-menu-container"
                        ref={headerMenuRef}
                    >
                    <button 
                            className="header-icon-button" 
                            title="메뉴"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowHeaderMenu(!showHeaderMenu);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        {showHeaderMenu && (
                            <div className="header-menu-dropdown">
                                <div 
                                    className="header-menu-item"
                        onClick={() => {
                            setCaptureMode(!captureMode);
                            if (captureMode) {
                                setSelectedMessages([]);
                            }
                                        setShowHeaderMenu(false);
                        }} 
                    >
                                    <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                        <path d="M21 19V8a2 2 0 0 0-2-2h-4l-2-3H9L7 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"></path>
                                        <circle cx="11.0" cy="13" r="4"></circle>
                        </svg>
                                    <span>{captureMode ? "캡쳐 모드 종료" : "대화 캡쳐"}</span>
                                </div>
                                <div 
                                    className="header-menu-item"
                                    onClick={() => {
                                        onExport();
                                        setShowHeaderMenu(false);
                                    }}
                                >
                                    <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                                    <span>채팅 형식 저장</span>
                                </div>
                                {onExportNovel && (
                                    <div 
                                        className="header-menu-item"
                                        onClick={() => {
                                            if (!isExportingNovel) {
                                                onExportNovel();
                                                setShowHeaderMenu(false);
                                            }
                                        }}
                                        style={{ 
                                            opacity: isExportingNovel ? 0.6 : 1,
                                            cursor: isExportingNovel ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="9" y1="13" x2="15" y2="13"></line>
                                            <line x1="9" y1="17" x2="15" y2="17"></line>
                                            <line x1="9" y1="9" x2="15" y2="9"></line>
                        </svg>
                                        <span>소설 형식 저장</span>
                                    </div>
                                )}
                                <div 
                                    className="header-menu-item"
                                    onClick={() => {
                                        onSave();
                                        setShowHeaderMenu(false);
                                    }}
                                >
                                    <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    <span>서버에 저장</span>
                                </div>
                                <div 
                                    className="header-menu-item"
                                    onClick={() => {
                                        onShowReport();
                                        setShowHeaderMenu(false);
                                    }}
                                >
                                    <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                    <span>심리 리포트</span>
                                </div>
                                {isMultiChatLocal && onStartDebate && (
                                    <div 
                                        className="header-menu-item"
                                        onClick={() => {
                                            onStartDebate();
                                            setShowHeaderMenu(false);
                                        }}
                                    >
                                        <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <span>토론 모드</span>
                                    </div>
                                )}
                                {onShowArchetype && (
                                    <div 
                                        className="header-menu-item"
                                        onClick={() => {
                                            onShowArchetype();
                                            setShowHeaderMenu(false);
                                        }}
                                    >
                                        <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="m21 21-4.35-4.35"></path>
                                        </svg>
                                        <span>성향 지도</span>
                                    </div>
                                )}
                                {onShowDiary && (
                                    <div 
                                        className="header-menu-item"
                                        onClick={() => {
                                            onShowDiary();
                                            setShowHeaderMenu(false);
                                        }}
                                    >
                                        <svg className="header-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                            <line x1="8" y1="7" x2="16" y2="7"></line>
                                            <line x1="8" y1="11" x2="16" y2="11"></line>
                                            <line x1="8" y1="15" x2="12" y2="15"></line>
                                        </svg>
                                        <span>마음 기록 노트</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>
            {debateMode && debateTopic && (
                <div className="debate-topic-panel">
                    <div className="debate-topic-panel-content">
                        <span className="debate-topic-text">💬 {debateTopic}</span>
                    </div>
                </div>
            )}
            <main className={`chat-window ${debateMode ? 'debate-mode' : ''}`} ref={messageListRef}>
                <div className={`message-list ${captureMode && selectedMessages.length >= 1 ? 'capture-mode-active' : ''}`} ref={captureRef}>
                    {messages.map((msg, index) => {
                        let aiTurnClass = '';
                        if (msg.sender === 'ai') {
                            if (msg.characterId === charA.id) aiTurnClass = 'ai-a';
                            else if (isMultiChatLocal && msg.characterId === charB.id) aiTurnClass = 'ai-b';
                        }

                        // 선택된 메시지 범위 계산
                        const startIdx = selectedMessages.length > 0 ? Math.min(...selectedMessages) : -1;
                        const endIdx = selectedMessages.length > 1 ? Math.max(...selectedMessages) : -1;
                        
                        let isInRange = false;
                        if (captureMode && selectedMessages.length === 1) {
                            // 단일 메시지 선택: 해당 메시지만 하이라이트
                            isInRange = index === startIdx;
                        } else if (captureMode && selectedMessages.length === 2) {
                            // 범위 선택: 시작과 끝 사이의 모든 메시지 하이라이트
                            isInRange = index >= startIdx && index <= endIdx;
                        }

                        const handleMessageClick = (e) => {
                            if (!captureMode) return;
                            e.stopPropagation();
                            
                            if (selectedMessages.length === 0) {
                                setSelectedMessages([index]);
                            } else if (selectedMessages.length === 1) {
                                const firstIdx = selectedMessages[0];
                                if (firstIdx === index) {
                                    // 동일 메시지 재클릭 시 선택 해제
                                    setSelectedMessages([]);
                                } else {
                                    setSelectedMessages([firstIdx, index]);
                                }
                            } else {
                                setSelectedMessages([index]);
                            }
                        };

                        // 메시지 더블클릭 핸들러 (AI 메시지만 저장/취소)
                        const handleMessageDoubleClick = async (e) => {
                            if (msg.sender !== 'ai' || !msg.characterId) return;
                            e.stopPropagation();
                            
                            // 이미 좋아요한 메시지인지 확인
                            const isLiked = likedMessages.has(msg.id);
                            
                            if (!isLiked) {
                                // 하트 클릭 애니메이션
                                const messageElement = e.currentTarget;
                                messageElement.classList.add('heart-clicked');
                                setLikedMessages(prev => new Set([...prev, msg.id]));
                                
                                setTimeout(() => {
                                    messageElement.classList.remove('heart-clicked');
                                }, 600);
                                
                                // 대사 저장 및 전체 대화 자동 저장
                                if (token) {
                                    try {
                                        // 단일 대사 저장
                                        const charName = characterData[msg.characterId]?.name.split(' (')[0] || '캐릭터';
                                        const quoteData = {
                                            title: `${charName}의 대사`,
                                            character_ids: [msg.characterId],
                                            messages: [{
                                                id: msg.id,
                                                sender: msg.sender,
                                                text: msg.text,
                                                characterId: msg.characterId,
                                                timestamp: msg.timestamp || new Date()
                                            }],
                                            is_manual_quote: 1
                                        };
                                        await api.saveChat(quoteData);
                                        
                                        // 전체 대화 자동 저장 (대화 흐름 추적용)
                                        const charIds = messages
                                            .filter(m => m.characterId || m.sender === 'user')
                                            .map(m => m.characterId || m.sender)
                                            .filter((id, index, self) => self.indexOf(id) === index && id)
                                            .filter(id => id && id !== 'user');
                                        const charNames = charIds.map(id => characterData[id]?.name.split(' (')[0]).filter(Boolean);
                                        const fullChatData = {
                                            title: charNames.length > 0 ? joinNamesWithJosa(charNames, '의 대화') : '대화',
                                            character_ids: charIds,
                                            messages: messages.map(m => ({
                                                sender: m.sender,
                                                text: m.text,
                                                characterId: m.characterId,
                                                timestamp: m.timestamp || m.date || new Date(),
                                                id: m.id
                                            })),
                                            is_manual_quote: 1,
                                            quote_message_id: msg.id
                                        };
                                        await api.saveChat(fullChatData);
                                        
                                        setHistoryRefreshTrigger(prev => prev + 1);
                                    } catch (error) {
                                        console.error('메시지 저장 오류:', error);
                                        setLikedMessages(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(msg.id);
                                            return newSet;
                                        });
                                    }
                                }
                            } else {
                                const heartElement = e.currentTarget.querySelector(`[data-message-id="${msg.id}"]`);
                                if (heartElement) {
                                    heartElement.classList.add('removing');
                                }
                                
                                setTimeout(() => {
                                    setLikedMessages(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(msg.id);
                                        return newSet;
                                    });
                                    
                                    if (token) {
                                        deleteSavedQuote(msg);
                                    }
                                }, 400);
                            }
                        };
                        
                        // 저장된 대사 삭제
                        const deleteSavedQuote = async (message) => {
                            try {
                                const quotes = await api.getSavedQuotes();
                                const matchingQuote = quotes.quotes?.find(quote => {
                                    const quoteMsg = quote.message;
                                    return quoteMsg && 
                                           quoteMsg.text === message.text && 
                                           quote.character_ids && 
                                           quote.character_ids.length > 0 &&
                                           quote.character_ids[0] === message.characterId;
                                });
                                
                                if (matchingQuote) {
                                    await api.deleteChatHistory(matchingQuote.id);
                                    setHistoryRefreshTrigger(prev => prev + 1);
                                }
                            } catch (error) {
                                console.error('대사 삭제 오류:', error);
                            }
                        };
                        
                        const handleHeartClick = async (e) => {
                            if (msg.sender !== 'ai' || !msg.characterId) return;
                            e.stopPropagation();
                            
                            const heartElement = e.currentTarget;
                            heartElement.classList.add('removing');
                            
                            setTimeout(() => {
                                setLikedMessages(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(msg.id);
                                    return newSet;
                                });
                                
                                if (token) {
                                    deleteSavedQuote(msg);
                                }
                            }, 400);
                        };

                        // 시스템 메시지 처리
                        if (msg.sender === 'system') {
                            return (
                                <div key={msg.id} className="system-message">
                                    {msg.text}
                                </div>
                            );
                        }

                        // 시간 포맷팅 (카카오톡 스타일)
                        const formatTime = (timestamp) => {
                            if (!timestamp) return '';
                            const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
                            const now = new Date();
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                            
                            const hours = date.getHours();
                            const minutes = date.getMinutes();
                            
                            // 오늘 메시지: 시간만 표시
                            if (msgDate.getTime() === today.getTime()) {
                                const period = hours < 12 ? '오전' : '오후';
                                const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
                                return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
                            }
                            
                            // 어제 메시지: "어제" + 시간 표시
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);
                            if (msgDate.getTime() === yesterday.getTime()) {
                                const period = hours < 12 ? '오전' : '오후';
                                const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
                                return `어제 ${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
                            }
                            
                            // 그 외: 날짜와 시간 표시
                            const month = date.getMonth() + 1;
                            const day = date.getDate();
                            const period = hours < 12 ? '오전' : '오후';
                            const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
                            return `${month}/${day} ${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
                        };

                        // 메시지 시간 표시 (카카오톡 스타일)
                        const showTime = true;

                        // 멀티채팅에서 캐릭터 이름 표시
                        const showName = settings.showNameInMultiChat && 
                            msg.sender === 'ai' &&
                            (index === 0 || messages[index - 1].sender !== 'ai' || messages[index - 1].characterId !== msg.characterId);

                        // 토론 모드에서 캐릭터 위치 (왼쪽/오른쪽)
                        const debatePosition = debateMode && msg.sender === 'ai' && msg.characterId 
                            ? (debateCharPositions[msg.characterId] === 'left' ? 'debate-left' : 'debate-right')
                            : '';
                        
                        const isLiked = likedMessages.has(msg.id);
                        
                        return (
                            <div 
                                key={msg.id} 
                                data-message-id={msg.id}
                                className={`message-bubble ${msg.sender} ${aiTurnClass} ${debatePosition} ${captureMode ? 'selectable' : ''} ${isInRange ? 'in-range-for-capture' : ''} ${captureMode && selectedMessages.length >= 1 && !isInRange ? 'out-of-range' : ''} ${isLiked ? 'liked' : ''}`}
                                onClick={handleMessageClick}
                                onDoubleClick={handleMessageDoubleClick}
                            >
                                {msg.sender === 'ai' && (
                                    <>
                                    <div className="avatar">
                                        <img src={characterData && msg.characterId && characterData[msg.characterId] ? characterData[msg.characterId].image : ''} alt={characterData && msg.characterId && characterData[msg.characterId] ? characterData[msg.characterId].name : 'AI'} />
                                        </div>
                                        {showName && characterData && msg.characterId && characterData[msg.characterId] && (
                                            <div className="message-name">
                                                {characterData[msg.characterId].name.split(' (')[0]}
                                    </div>
                                )}
                                    </>
                                )}
                                <div className="message-content">
                                    {msg.image && msg.text && (
                                        <div className="message-image">
                                            <img src={msg.image} alt="Uploaded" />
                                        </div>
                                    )}
                                    {msg.text && (
                                <div className="message-text">
                                    {typingEffect && msg.sender === 'ai' && msg.isTyping ? (
                                        <TypingText text={msg.text} />
                                            ) : msg.sender === 'user' && msg.messageLines ? (
                                                // 줄 단위로 타입에 따라 스타일 적용
                                                msg.messageLines.map((line, idx) => {
                                                    if (line.type === '행동') {
                                                        // 행동 부분: 괄호 안의 텍스트만 기울임체로 표시
                                                        const actionText = line.text;
                                                        // 괄호 제거하고 내용만 표시
                                                        const content = actionText.replace(/^\(|\)$/g, '');
                                                        return (
                                                            <span key={idx}>
                                                                <span className="message-action-line">({content})</span>
                                                                {idx < msg.messageLines.length - 1 && <br />}
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span key={idx}>
                                                                {line.text}
                                                                {idx < msg.messageLines.length - 1 && <br />}
                                                            </span>
                                                        );
                                                    }
                                                })
                                    ) : (
                                        msg.text
                                    )}
                                        </div>
                                    )}
                                    <div className="message-meta">
                                        {showTime && msg.timestamp && (
                                            <span className="message-time">{formatTime(msg.timestamp)}</span>
                                        )}
                                    </div>
                                    {/* 하트 뱃지 - 말풍선 우측 하단 */}
                                    {msg.sender === 'ai' && isLiked && (
                                        <div 
                                            className="message-heart-badge" 
                                            onClick={handleHeartClick} 
                                            key={`heart-${msg.id}`}
                                            data-message-id={msg.id}
                                        >
                                            ❤️
                                        </div>
                                    )}
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="avatar">
                                        <img src={userProfile.profilePic} alt={userProfile.nickname} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isLoading && (
                        <div className="message-bubble ai loading">
                            <div className="avatar">
                                <img src={characterData && charA && charA.id && characterData[charA.id] ? characterData[charA.id].image : ''} alt="Loading" />
                            </div>
                            <div className="message-text">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {captureMode && selectedMessages.length === 2 && (
                <div className="capture-controls">
                    <button className="capture-button" onClick={handleCaptureSelected}>
                        선택한 대화 캡쳐
                    </button>
                    <button className="cancel-capture-button" onClick={() => {
                        setCaptureMode(false);
                        setSelectedMessages([]);
                    }} title="취소">
                    </button>
                </div>
            )}
            {isExportingNovel && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #8D6E63 0%, #6B4E3D 100%)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    소설 형식 저장 중...
                </div>
            )}
            <footer className={`input-area ${(!debateMode && currentTurn !== 'USER') || captureMode ? 'disabled' : ''}`}>
                <button
                    onClick={handleVoiceInput}
                    disabled={(!debateMode && currentTurn !== 'USER') || captureMode}
                    className={`voice-button ${isRecording ? 'recording' : ''}`}
                    title={
                        isRecording 
                            ? voiceEmotionRef.current 
                                ? `음성 감정: ${voiceEmotionRef.current.emotion} (${Math.round(voiceEmotionRef.current.confidence * 100)}%)`
                                : "음성 입력 중지"
                            : "음성으로 입력하기 (톤 분석 포함)"
                    }
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                </button>
                <button
                    className={`action-toggle-btn ${messageType === '행동' ? 'active' : ''}`}
                    onClick={() => {
                        if (!textareaRef.current) return;
                        
                        const textarea = textareaRef.current;
                        if (!textarea) return;
                        
                        const selection = window.getSelection();
                        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                        const currentText = textarea.innerText || textarea.textContent || inputText;
                        const cursorPos = range ? getCaretPosition(textarea) : currentText.length;
                        
                            const beforeCursor = currentText.substring(0, cursorPos);
                            const afterCursor = currentText.substring(cursorPos);
                            
                        // 현재 커서 위치에서 행동 모드인지 확인 (더 정확한 로직)
                        const isInAction = isCursorInAction(currentText, cursorPos);
                        
                        let newText;
                        let newMessageType;
                        if (isInAction) {
                            // 행동 모드 종료: ) 삽입
                            newText = beforeCursor + ')' + afterCursor;
                            newMessageType = '말';
                        } else {
                            // 행동 모드 시작: ( 삽입
                            newText = beforeCursor + '(' + afterCursor;
                            newMessageType = '행동';
                        }
                        
                        // 버튼 클릭으로 인한 변경임을 표시 (onInput에서 messageType 업데이트 방지)
                        textarea._isButtonToggle = true;
                        
                        // messageType을 먼저 설정
                        setMessageType(newMessageType);
                            setInputText(newText);
                            
                            setTimeout(() => {
                            textarea.focus();
                            const html = formatTextToHTML(newText);
                            textarea.innerHTML = html;
                            const newCursorPos = cursorPos + 1;
                            const textNode = getTextNodeAtPosition(textarea, newCursorPos);
                            if (textNode) {
                                const newRange = document.createRange();
                                const offset = Math.min(newCursorPos, textNode.textContent.length);
                                newRange.setStart(textNode, offset);
                                newRange.setEnd(textNode, offset);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                            }
                            // 플래그 제거
                            setTimeout(() => {
                                textarea._isButtonToggle = false;
                            }, 100);
                        }, 0);
                    }}
                    disabled={(!debateMode && currentTurn !== 'USER') || captureMode}
                    title={messageType === '행동' ? '행동 모드 종료 (대사로 전환)' : '행동 모드 시작'}
                >
                    <img 
                        src={messageType === '행동' ? '/action-bulb.png' : '/lightbulb.png'} 
                        alt="행동 모드" 
                        style={{ width: '20px', height: '20px', objectFit: 'contain', display: 'block', transform: 'translateY(-2px)' }}
                    />
                </button>
                <div
                    ref={textareaRef}
                    contentEditable
                    suppressContentEditableWarning
                    onCompositionStart={(e) => {
                        // 한글 입력 시작 (조합 시작)
                        e.target._isComposing = true;
                    }}
                    onCompositionUpdate={(e) => {
                        // 한글 입력 중 (조합 중)
                        e.target._isComposing = true;
                    }}
                    onCompositionEnd={(e) => {
                        // 한글 입력 완료 (조합 종료)
                        const element = e.target;
                        element._isComposing = false;
                        
                        // 조합 종료 후 약간의 지연을 두고 HTML 업데이트
                        const newText = element.innerText || element.textContent || '';
                        const selection = window.getSelection();
                        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                        
                        let savedCursorPos = 0;
                        if (range && range.commonAncestorContainer) {
                            const tempRange = range.cloneRange();
                            tempRange.selectNodeContents(element);
                            tempRange.setEnd(range.endContainer, range.endOffset);
                            savedCursorPos = tempRange.toString().length;
                        }
                        
                        // 텍스트 상태 업데이트
                        if (newText !== inputText) {
                            setInputText(newText);
                        }
                        
                        // 조합 종료 후 HTML 업데이트 (지연을 두어 안정적으로)
                        setTimeout(() => {
                            if (!element._isComposing && element.innerText === newText) {
                                updateHTMLWithCursorRestore(element, newText, savedCursorPos);
                            }
                        }, 50);
                    }}
                    onInput={(e) => {
                        const element = e.target;
                        
                        // 버튼 클릭으로 인한 변경이면 messageType 업데이트 건너뛰기
                        if (element._isButtonToggle) {
                            const newText = element.innerText || element.textContent || '';
                            if (newText !== inputText) {
                                setInputText(newText);
                            }
                            // 높이만 조정
                            element.style.height = 'auto';
                            element.style.height = `${element.scrollHeight}px`;
                            return;
                        }
                        
                        // 한글 입력 중(조합 중)이면 텍스트만 업데이트하고 HTML 업데이트는 건너뛰기
                        if (element._isComposing) {
                            const newText = element.innerText || element.textContent || '';
                            if (newText !== inputText) {
                                setInputText(newText);
                            }
                            // 높이만 조정
                            element.style.height = 'auto';
                            element.style.height = `${element.scrollHeight}px`;
                            return;
                        }
                        
                        const selection = window.getSelection();
                        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                        
                        // 커서 위치 저장 (HTML 업데이트 전)
                        let savedCursorPos = 0;
                        if (range && range.commonAncestorContainer) {
                            const tempRange = range.cloneRange();
                            tempRange.selectNodeContents(element);
                            tempRange.setEnd(range.endContainer, range.endOffset);
                            savedCursorPos = tempRange.toString().length;
                        }
                        
                        const newText = element.innerText || element.textContent || '';
                        
                        // 텍스트 변경 감지
                        if (newText !== inputText) {
                            setInputText(newText);
                        }
                        
                        // 괄호 위치로 행동/말 구분 (더 정확한 로직)
                        const isInAction = isCursorInAction(newText, savedCursorPos);
                        const newMessageType = isInAction ? '행동' : '말';
                        
                        if (newMessageType !== messageType) {
                            setMessageType(newMessageType);
                        }
                        
                        // HTML 포맷팅 및 커서 위치 복원
                        // 한글 입력이 아니고 버튼 클릭이 아닐 때는 즉시 업데이트 (지연 없음)
                        clearTimeout(element._inputUpdateTimeout);
                        if (!element._isComposing && !element._isButtonToggle) {
                            // 즉시 HTML 업데이트 (지연 없음)
                            updateHTMLWithCursorRestoreImmediate(element, newText, savedCursorPos);
                        }
                        
                        // 높이 조정
                        element.style.height = 'auto';
                        element.style.height = `${element.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleKeyPress(e);
                        }
                    }}
                    data-placeholder={captureMode ? "캡쳐 모드: 메시지를 선택하세요" : (currentTurn === 'USER' ? (sceneState.mood !== 'neutral' ? getPlaceholderByMood(sceneState.mood, userProfile.nickname) : (randomPlaceholder ? randomPlaceholder.replace('서안', userProfile.nickname) : "이야기하고 싶은 게 있어?")) : "")}
                    style={{
                        flex: 1,
                        border: '2px solid #D7CCC8',
                        borderRadius: '20px',
                        padding: '10px 16px',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        minHeight: '44px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        transition: 'all 0.2s',
                        background: '#F5F1EB',
                        minWidth: 0,
                        boxShadow: 'none',
                        alignSelf: 'center',
                        outline: 'none',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                    }}
                    className={(!debateMode && currentTurn !== 'USER') || captureMode ? 'disabled' : ''}
                />
                <button 
                    onClick={handleSend} 
                    disabled={(!debateMode && currentTurn !== 'USER') || (debateMode && !waitingForUserInput && currentTurn !== 'USER') || !inputText.trim() || captureMode}
                    className="send-button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </footer>
        </div>
    );
};


// 통계 화면
const analyzeEmotion = (text) => {
    if (!text) return {
        hesitation: false,
        anxiety: false,
        avoidance: false,
        introspection: false,
        empathy: false
    };

    return {
        hesitation: /(…|\.\.|\.\.\.)/.test(text),
        anxiety: /(사실은|어떡하지|괜찮아|걱정|불안|두려워|무서워)/.test(text),
        avoidance: text.length < 8,
        introspection: /(나는|내가|나도|나를|내|나의)/.test(text),
        empathy: /(너는|너도|너를|괜찮니|어떻게|어떤|어떠니)/.test(text)
    };
};

// SceneState 감정 분석 함수들 (리포트용)
const detectRomanceLevel = (text) => {
    if (!text) return 0;
    
    // 취향을 묻는 패턴 감지 (로맨스가 아닌 경우)
    const preferencePatterns = [
        /어떤\s+\w+\s*(좋아|조아|선호|취향)/,
        /무엇(을|를)\s*(좋아|조아|선호)/,
        /뭐\s*(좋아|조아|선호)/,
        /\w+\s*(좋아|조아|선호|취향)\s*(해|해요|하세요|하나|하니|하냐)/,
        /\w+\s*(종류|맛|스타일|스타일|타입)\s*(좋아|조아|선호)/,
        /(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미|취향|선호)\s*(좋아|조아|선호)/,
        /(좋아|조아|선호)\s*(하는|하는)\s*(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미)/,
        /(어떤|무엇|뭐)\s*(커피|차|음식|음료|음악|영화|책|색깔|색|드라마|게임|스포츠|운동|취미)/
    ];
    
    // 취향을 묻는 패턴이 있으면 로맨스 점수 0 반환
    const isPreferenceQuestion = preferencePatterns.some(pattern => pattern.test(text));
    if (isPreferenceQuestion) {
        return 0;
    }
    
    const keywords = ['좋아해', '좋아', '사랑', '설레', '보고 싶', '너 생각', '그리워', '사랑해', '좋아한다', '마음', '심장', '떨려', '두근', '설렘', '행복', '기쁨', '웃음', '미소'];
    let score = 0;
    keywords.forEach(k => {
        if (text.includes(k)) score += 0.3;
    });
    if (text.endsWith('...') || text.endsWith('…')) score += 0.2;
    if (text.includes('❤') || text.includes('💕') || text.includes('💖')) score += 0.3;
    return Math.min(score, 1);
};

const detectComfortLevel = (text) => {
    if (!text) return 0;
    // 위로가 필요한 키워드: 힘들고 지친 감정 표현
    const keywords = ['괜찮아', '힘내', '위로', '안아', '따뜻', '포근', '편안', '안심', '걱정', '아픔', '아프', '아파', '슬퍼', '울어', '힘들어', '외로워', '지치', '피곤', '힘들', '지침'];
    let score = 0;
    keywords.forEach(k => {
        if (text.includes(k)) {
            // "지치", "피곤", "힘들"은 위로가 필요한 감정이므로 점수 높게
            if (k === '지치' || k === '피곤' || k === '힘들' || k === '지침') {
                score += 0.4;
            } else {
                score += 0.3;
            }
        }
    });
    return Math.min(score, 1);
};

const detectConflictLevel = (text) => {
    if (!text) return 0;
    // 갈등 키워드: 화나고 섭섭한 감정 표현
    const conflictKeywords = ['화나', '싫어', '미워', '이해 못해', '짜증', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망'];
    // "지친다"와 함께 갈등으로 판단할 키워드
    const conflictWithTired = ['화나', '싫어', '미워', '짜증', '화', '분노', '실망', '아쉬워', '서운', '섭섭', '억울', '원망', '답답'];
    
    let score = 0;
    const hasTired = text.includes('지치') || text.includes('피곤') || text.includes('힘들');
    
    conflictKeywords.forEach(k => {
        if (text.includes(k)) {
            score += 0.3;
        }
    });
    
    // "지친다"만 있으면 갈등으로 판단하지 않음
    // "지친다" + 화나고 섭섭한 키워드가 함께 있을 때만 갈등 점수 추가
    if (hasTired) {
        const hasConflictWithTired = conflictWithTired.some(k => text.includes(k));
        if (hasConflictWithTired) {
            score += 0.2; // 갈등 점수 추가
        }
    }
    
    // "답답"은 "지친다"와 함께 있을 때만 갈등으로 판단
    if (text.includes('답답')) {
        if (hasTired) {
            score += 0.2; // "지친다" + "답답" = 갈등
        } else {
            score += 0.3; // "답답"만 있어도 갈등
        }
    }
    
    return Math.min(score, 1);
};

const detectConfession = (text) => {
    if (!text) return false;
    const worryWords = ['말해도 될까', '고민', '어떡하지', '사실은', '말하고 싶', '고백', '진심', '솔직히', '말할게', '들어줘', '중요한', '말이 있어'];
    return worryWords.some(w => text.includes(w)) || text.endsWith('..') || text.endsWith('...') || text.endsWith('…');
};

// 키워드 추출 함수 (핵심 단어만 추출)
const extractKeywords = (messages, limit = 5) => {
    const wordCount = {};
    
    // 핵심 단어만 추출하기 위한 감정/행동/주제 관련 키워드 패턴
    const meaningfulPatterns = [
        // 감정 관련
        /(사랑|좋아|그리워|보고싶|설레|떨려|두근|행복|기쁨|슬픔|외로움|그리움|사랑해|좋아해|미워|화나|답답|걱정|불안|슬퍼|기뻐|행복해)/g,
        // 행동/상황 관련
        /(만나|보고|안아|키스|포옹|데이트|약속|선물|고백|말해|들어|이야기|대화|대답|질문|만날|보고싶어|만나고|만나서)/g,
        // 심리/상태 관련
        /(마음|심장|감정|느낌|생각|고민|걱정|불안|고민|걱정|걱정|걱정|걱정|걱정|걱정|걱정)/g,
        // 관계 관련
        /(친구|연인|사람|너|나|우리|너희|그|그녀|사람들|당신|자기)/g,
        // 시간/상황 관련
        /(오늘|어제|내일|밤|낮|아침|저녁|시간|순간|때|지금|그때|오늘밤|오늘밤|오늘밤)/g
    ];
    
    // 불용어 목록 (조사, 접속사, 일반 동사 등)
    const stopWords = [
        '그리고', '그런데', '그래서', '하지만', '그러나', '그럼', '그러면', '그래도',
        '이렇게', '저렇게', '어떻게', '이런', '저런', '어떤',
        '또', '또한', '또는', '아주', '매우', '너무', '정말', '진짜', '완전', '엄청',
        '잘', '많이', '조금', '항상', '자주', '가끔', '지금', '여기', '저기', '거기',
        '있다', '없다', '되다', '하다', '있어', '없어', '되어', '해',
        '은', '는', '이', '가', '을', '를', '에', '에서', '에게', '와', '과', '도', '만',
        '그래', '그렇구나', '그렇군', '그렇네', '같아', '같은', '처럼', '만큼',
        '것', '거', '게', '건', '걸', '껄', '거야', '거예요', '거지', '거네'
    ];
    
    messages.forEach(msg => {
        const text = msg.text || '';
        
        // 의미 있는 패턴으로 단어 추출
        meaningfulPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // 조사 제거
                    const cleanWord = match.replace(/[이가을를은는와과도만까지부터에서에게]$/, '');
                    if (cleanWord.length >= 2 && !stopWords.includes(cleanWord) && !stopWords.includes(match)) {
                        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
                    }
                });
            }
        });
        
        // 2글자 이상의 명사/형용사 추출 (감정/행동 관련)
        const words = text.match(/[가-힣]{2,}/g) || [];
        words.forEach(word => {
            if (!stopWords.includes(word) && word.length >= 2) {
                const cleanWord = word.replace(/[이가을를은는와과도만까지부터에서에게]$/, '');
                if (cleanWord.length >= 2 && !stopWords.includes(cleanWord)) {
                    // 일반적인 단어 제외
                    if (!['것', '거', '게', '건', '걸', '껄', '거야', '거예요', '거지', '거네'].includes(cleanWord)) {
                    wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
                    }
                }
            }
        });
    });
    
    // 빈도수 기준으로 정렬하고 상위 N개만 반환 (최소 2번 이상 사용된 단어만)
    return Object.entries(wordCount)
        .filter(([word, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word, count]) => ({ word, count }));
};

// 메시지 소리 재생 함수 (오디오 파일 사용)
const playMessageSound = () => {
    try {
        const audio = new Audio('/message-sound.wav');
        audio.volume = 0.7; // 볼륨 조절 (0.0 ~ 1.0)
        audio.play().catch(() => {});
    } catch (error) {
        // 소리 재생 실패 시 무시
    }
};

// 랜덤 placeholder 텍스트
const randomPlaceholders = [
    "서안을 기다리고 있어…",
    "오늘 마음은 어때?",
    "네가 듣고 싶은 말이 있어.",
    "무슨 생각해?",
    "오늘 하루는 어땠어?",
    "뭐 하고 있어?",
    "지금 뭐해?",
    "오늘 날씨 좋지 않아?",
    "기분이 어때?",
    "무슨 일 있어?",
    "오늘은 어떤 이야기를 하고 싶어?",
    "조금 늦었네… 기다리고 있었어.",
    "마음속 이야기를 꺼내볼래?",
    "뭐해? 기다리고 있었는데.",
    "오늘, 네가 가장 많이 생각한 건 뭐야?"
];

// 메인 App 컴포넌트
function App() {
    const [selectedCharIds, setSelectedCharIds] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentTurn, setCurrentTurn] = useState('USER');
    const [currentChatId, setCurrentChatId] = useState(null);
    const [settings, setSettings] = useState({
        timeOfDay: 'current',
        mood: 'normal',
        typingEffect: false,
        showNameInMultiChat: true,
        soundEnabled: true,
        background: null
    });
    const [randomPlaceholder, setRandomPlaceholder] = useState(randomPlaceholders[0]);
    const [messageType, setMessageType] = useState('말'); // '말' 또는 '행동'
    const textareaRef = useRef(null);
    
    const messageListRef = useRef(null);

    const defaultProfilePic = "https://placehold.co/100x100/bcaaa4/795548?text=User";
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userProfile, setUserProfile] = useState({
        nickname: "사용자",
        profilePic: defaultProfilePic,
    });
    
    const [showMyPage, setShowMyPage] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTemplate, setShowTemplate] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showGift, setShowGift] = useState(false);
    const [currentGift, setCurrentGift] = useState(null);
    const [showArchetype, setShowArchetype] = useState(false);
    const [archetypeData, setArchetypeData] = useState(null);
    const [isLoadingArchetype, setIsLoadingArchetype] = useState(false);
    const [showDiary, setShowDiary] = useState(false);
    const [diaryData, setDiaryData] = useState(null);
    const [diaryList, setDiaryList] = useState([]);
    const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);
    const [isExportingNovel, setIsExportingNovel] = useState(false);
    const [showDebate, setShowDebate] = useState(false);
    const [debateTopic, setDebateTopic] = useState('');
    const [debateMode, setDebateMode] = useState(false); // 토론 모드 활성화 여부
    const [debateRound, setDebateRound] = useState(0); // 현재 토론 라운드
    const [waitingForUserInput, setWaitingForUserInput] = useState(false); // 사용자 입력 대기 중
    const [debateCharPositions, setDebateCharPositions] = useState({}); // 토론 모드 캐릭터 위치 (left/right)
    const [showDebateIntervention, setShowDebateIntervention] = useState(false); // 사용자 개입 선택지 표시
    const [isInterventionPanelHidden, setIsInterventionPanelHidden] = useState(false); // 개입 패널 숨김 상태
    const [debateStyle, setDebateStyle] = useState('aggressive'); // 토론 스타일: aggressive, calm, playful, balanced
    const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
    const [likedMessages, setLikedMessages] = useState(new Set()); // 좋아요한 메시지 ID 저장
    const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);

    // 로그인 상태 확인
    useEffect(() => {
        const savedToken = auth.getToken();
        const savedUser = auth.getUser();
        
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(savedUser);
            setUserProfile({
                nickname: savedUser.nickname || "사용자",
                profilePic: savedUser.profile_pic || defaultProfilePic,
            });
            
            // 토큰 유효성 확인
            api.getCurrentUser().catch(() => {
                auth.clear();
                setToken(null);
                setUser(null);
            });
        } else {
            setShowAuth(true);
        }
    }, []);

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        setToken(auth.getToken());
        setUserProfile({
            nickname: userData.nickname || "사용자",
            profilePic: userData.profile_pic || defaultProfilePic,
        });
    };

    const selectedChars = selectedCharIds.map(id => characterData[id]);

    // 대화 저장 (서버에 저장)
    const handleSaveChat = async () => {
        if (!token) {
            alert('로그인이 필요합니다.');
            setShowAuth(true);
            return;
        }
        
        if (messages.length === 0) {
            alert('저장할 대화가 없습니다.');
            return;
        }
        
        const charNames = selectedChars.map(c => c.name.split(' (')[0]);
        const title = prompt('대화 제목을 입력하세요:', 
            joinNamesWithJosa(charNames, '의 대화'));
        if (!title) return;

        try {
            // 모든 메시지를 그대로 저장 (필터링하지 않음)
            const messagesToSave = messages.map(msg => ({
                ...msg,
                sender: msg.sender || (msg.characterId ? 'ai' : 'user'),
                text: msg.text || '',
                timestamp: msg.timestamp || new Date().toISOString(),
                id: msg.id || Date.now() + Math.random()
            }));
            
            const data = await api.saveChat({
                    title,
                    character_ids: selectedCharIds,
                    messages: messagesToSave,
                    is_manual: 1,
                    is_manual_quote: 0
            });
            setCurrentChatId(data.id);
            setHistoryRefreshTrigger(prev => prev + 1);
            alert('대화가 저장되었습니다.');
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    // 대화 기록 불러오기 (서버에서)
    // eslint-disable-next-line no-unused-vars
    const loadChatHistories = async () => {
        if (!token) return [];
        
        try {
            const response = await fetch(`${API_BASE_URL}/chat/histories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) return [];
            
            return await response.json();
        } catch (error) {
            return [];
        }
    };

    const handleLoadChat = (history, scrollToMessageText = null) => {
        try {
            if (debateMode) {
                endDebate();
            }
            
            // character_ids 파싱
            let charIds = [];
            if (history.character_ids) {
                if (typeof history.character_ids === 'string') {
                    try {
                        charIds = JSON.parse(history.character_ids);
                    } catch {
                        charIds = [];
                    }
                } else if (Array.isArray(history.character_ids)) {
                    charIds = history.character_ids;
                }
            } else if (history.characterIds) {
                charIds = Array.isArray(history.characterIds) ? history.characterIds : [];
            }
            setSelectedCharIds(charIds);
            
            // messages 파싱 및 처리
            let loadedMessages = [];
            if (history.messages) {
                if (typeof history.messages === 'string') {
                    try {
                        loadedMessages = JSON.parse(history.messages);
                    } catch (e) {
                        console.error('메시지 파싱 오류:', e);
                        loadedMessages = [];
                    }
                } else if (Array.isArray(history.messages)) {
                    loadedMessages = history.messages;
                }
            }
            
            // 메시지 형식 검증 및 정규화
            let targetMessageId = null;
            loadedMessages = loadedMessages.map((msg, index) => {
                // sender가 없으면 기본값 설정 (user 또는 ai)
                if (!msg.sender) {
                    // text가 있으면 user로, 없으면 ai로 추정
                    // 또는 이전 메시지의 sender를 반대로 설정
                    if (index > 0 && loadedMessages[index - 1] && loadedMessages[index - 1].sender) {
                        msg.sender = loadedMessages[index - 1].sender === 'user' ? 'ai' : 'user';
                    } else {
                        msg.sender = msg.text ? 'user' : 'ai';
                    }
                }
                
                // timestamp가 문자열인 경우 Date 객체로 변환
                if (msg.timestamp && typeof msg.timestamp === 'string') {
                    msg.timestamp = new Date(msg.timestamp);
                } else if (!msg.timestamp) {
                    // timestamp가 없으면 현재 시간으로 설정
                    msg.timestamp = new Date();
                }
                
                // id가 없으면 생성
                if (!msg.id) {
                    msg.id = Date.now() + Math.random() + index;
                }
                
                // 스크롤할 메시지 찾기
                if (scrollToMessageText && msg.text === scrollToMessageText && !targetMessageId) {
                    targetMessageId = msg.id;
                }
                
                return msg;
            }).filter(msg => msg !== null && msg.text); // null과 text가 없는 메시지 제거
            
            setMessages(loadedMessages);
            
            // userProfile과 settings는 선택적으로 로드
            if (history.userProfile) {
                setUserProfile(history.userProfile);
            }
            if (history.settings) {
                setSettings(history.settings);
            }
            
        setCurrentChatId(history.id);
        setShowHistory(false);
            
            // 특정 메시지로 스크롤
            if (targetMessageId) {
                setTimeout(() => {
                    const messageElement = document.querySelector(`[data-message-id="${targetMessageId}"]`);
                    if (messageElement) {
                        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 하이라이트 효과 (Glow 효과)
                        messageElement.classList.add('saved-line');
                        setTimeout(() => {
                            messageElement.classList.remove('saved-line');
                        }, 2000);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('대화 불러오기 오류:', error);
            alert('대화를 불러오는 중 오류가 발생했습니다.');
        }
    };

    // 대화 삭제
    const deleteChatHistory = (chatId) => {
        chatHistoryStorage.delete(chatId);
        setHistoryRefreshTrigger(prev => prev + 1);
    };

    // 대화 내보내기 (채팅 형식)
    // 선물 확인 함수
    const checkForGift = async (characterId) => {
        if (!token) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/gifts/check?character_id=${characterId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.has_gift) {
                    setCurrentGift(data.gift);
                    setShowGift(true);
                }
            }
        } catch (error) {
            console.error('선물 확인 오류:', error);
        }
    };
    
    
    // 토론 시작 핸들러
    const handleStartDebate = async () => {
        if (selectedCharIds.length !== 2 || !debateTopic.trim()) {
            alert('토론 모드는 정확히 2명의 캐릭터와 주제가 필요합니다.');
            return;
        }
        
        // 캐릭터 위치 설정 (왼쪽/오른쪽)
        setDebateCharPositions({
            [selectedCharIds[0]]: 'left',
            [selectedCharIds[1]]: 'right'
        });
        
        const entranceScene = {
            id: Date.now(),
            sender: 'system',
            text: `🎬 두 인물이 마주 앉았다. 분위기는 얼어있다.`,
            timestamp: new Date(),
            read: false
        };
        
            const cleanTopic = debateTopic.replace(/\.\.\./g, '').replace(/…/g, '');
            const debateStartMessage = {
                id: Date.now() + 1,
                sender: 'system',
                text: `토론이 시작되었습니다: "${cleanTopic}"`,
                timestamp: new Date(),
                read: false
            };
        
        setMessages(prev => [...prev, entranceScene, debateStartMessage]);
        
        setDebateMode(true);
        setDebateRound(1);
        setShowDebate(false);
        setWaitingForUserInput(false);
        setShowDebateIntervention(false);
        
        setTimeout(() => {
            continueDebateRound(1);
        }, 2000);
    };
    
    // 토론 라운드 계속하기
    const continueDebateRound = async (round) => {
        if (!debateMode) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setWaitingForUserInput(false);
        
        try {
            // 토론 시작 메시지 이후의 메시지만 필터링
            const debateStartIndex = messages.findIndex(msg => 
                msg.sender === 'system' && msg.text && msg.text.includes('토론이 시작되었습니다')
            );
            
            const messagesAfterDebateStart = debateStartIndex >= 0 
                ? messages.slice(debateStartIndex)
                : messages;
            
            const debateMessages = messagesAfterDebateStart.filter(msg => {
                if (debateStartIndex < 0) {
                    if (msg.sender === 'system') {
                        if (msg.text && (
                            msg.text.includes('토론이 시작되었습니다') ||
                            msg.text.includes('두 인물이 마주 앉았다') ||
                            msg.text.includes('토론 결론') ||
                            msg.text.includes('토론이 종료되었습니다') ||
                            msg.text.includes('어떤 의견에 더 공감')
                        )) {
                            return true;
                        }
                        return false;
                    }
                    // 사용자 메시지는 모두 포함
                    if (msg.sender === 'user') return true;
                    // AI 메시지는 토론 중인 캐릭터의 메시지만 포함
                    if (msg.sender === 'ai') {
                        if (msg.characterId && selectedCharIds.includes(msg.characterId)) {
                            return true;
                        }
                        return false;
                    }
                    return false;
                }
                
                // 토론 시작 메시지가 있는 경우 (정상적인 토론 진행)
                // 토론 시작 관련 시스템 메시지는 포함
                if (msg.sender === 'system') {
                    // 토론 시작 메시지 또는 토론 관련 시스템 메시지만 포함
                    if (msg.text && (
                        msg.text.includes('토론이 시작되었습니다') ||
                        msg.text.includes('두 인물이 마주 앉았다') ||
                        msg.text.includes('토론 결론') ||
                        msg.text.includes('토론이 종료되었습니다') ||
                        msg.text.includes('어떤 의견에 더 공감')
                    )) {
                        return true;
                    }
                    // 다른 시스템 메시지는 제외 (일반 채팅 시스템 메시지)
                    return false;
                }
                // 사용자 메시지는 모두 포함 (토론 중 사용자 입력)
                if (msg.sender === 'user') return true;
                // AI 메시지는 토론 중인 캐릭터의 메시지만 포함
                if (msg.sender === 'ai') {
                    // 토론 중인 캐릭터의 메시지인지 확인
                    if (msg.characterId && selectedCharIds.includes(msg.characterId)) {
                        return true;
                    }
                    // characterId가 없으면 제외 (일반 채팅 메시지일 수 있음)
                    return false;
                }
                return false;
            });
            
            const response = await fetch(`${API_BASE_URL}/chat/debate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    character_ids: selectedCharIds,
                    topic: debateTopic,
                    user_nickname: userProfile.nickname,
                    chat_history: debateMessages.map(msg => ({
                        id: msg.id || Date.now() + Math.random(),
                        sender: msg.sender,
                        text: msg.text,
                        characterId: msg.characterId || null
                    })),
                    round: round,
                    style: debateStyle,
                    settings: settings || {}
                })
            });
            
            if (!response.ok) {
                let errorMessage = '토론 생성 실패';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `서버 오류 (HTTP ${response.status})`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (data && data.responses && Array.isArray(data.responses)) {
                for (const res of data.responses) {
                    if (res.texts && Array.isArray(res.texts)) {
                        for (const text of res.texts) {
                            const debateMessage = {
                                id: Date.now() + Math.random(),
                                sender: 'ai',
                                text: text,
                                characterId: res.id,
                                timestamp: new Date(),
                                read: false
                            };
                            setMessages(prev => [...prev, debateMessage]);
                        }
                    }
                }
                
                // 다음 라운드 진행
                const nextRound = round + 1;
                
                if (round === 1) {
                    // 라운드 1: 자동으로 라운드 2 진행 (두 번 주고받기)
                    setDebateRound(nextRound);
                    setTimeout(() => {
                        continueDebateRound(nextRound);
                    }, 2000);
                } else {
                    // 라운드 2 이상: 사용자 입력 가능 (한 번씩만 주고받기)
                    setDebateRound(nextRound);
                    setWaitingForUserInput(true);
                    setShowDebateIntervention(true);
                    setIsInterventionPanelHidden(false);
                    // 사용자 입력창 활성화 (토론 계속 가능)
                    setCurrentTurn('USER');
                    const userInputPrompt = {
                        id: Date.now() + 1,
                        sender: 'system',
                        text: '💬 어떤 의견에 더 공감하시나요?',
                        timestamp: new Date(),
                        read: false
                    };
                    setMessages(prev => [...prev, userInputPrompt]);
                }
            } else {
                throw new Error('토론 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('토론 오류:', error);
            let errorMessage = '토론 생성 중 오류가 발생했습니다.';
            
            if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
            } else if (error && typeof error === 'object') {
                if (error.message) {
                    errorMessage = error.message;
                } else if (error.detail) {
                    errorMessage = error.detail;
                } else {
                    try {
                        errorMessage = JSON.stringify(error);
                    } catch (e) {
                        errorMessage = String(error);
                    }
                }
            } else if (error && typeof error === 'string') {
                errorMessage = error;
            }
            
            // 에러 메시지 표시
            const errorMsg = {
                id: Date.now(),
                sender: 'system',
                text: `⚠️ ${errorMessage}`,
                timestamp: new Date(),
                read: false
            };
            setMessages(prev => [...prev, errorMsg]);
            
            // 토론 모드 종료하지 않고 계속 진행 가능하도록
            // 사용자에게 재시도 옵션 제공
            if (round <= 3) {
                // 초기 라운드에서는 자동 재시도
                setTimeout(() => {
                    continueDebateRound(round);
                }, 3000);
            } else {
                // 이후 라운드에서는 사용자 입력 대기
                setWaitingForUserInput(true);
                setShowDebateIntervention(true);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    // 토론 종료
    const endDebate = async () => {
        setDebateMode(false);
        setDebateRound(0);
        setWaitingForUserInput(false);
        setShowDebateIntervention(false);
        
        // 토론 결론 요약 중 표시
        const loadingMessage = {
            id: Date.now(),
            sender: 'system',
            text: '📋 토론 결론 요약 중...',
            timestamp: new Date(),
            read: false
        };
        setMessages(prev => [...prev, loadingMessage]);
        setIsLoading(true);
        
        // 토론 요약 요청
        try {
            const response = await fetch(`${API_BASE_URL}/chat/debate/summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    character_ids: selectedCharIds,
                    topic: debateTopic,
                    messages: messages.filter(m => m.sender !== 'system').map(msg => ({
                        sender: msg.sender,
                        text: msg.text,
                        characterId: msg.characterId
                    }))
                })
            });
            
            if (response.ok) {
                const summaryData = await response.json();
                
                // 로딩 메시지 제거
                setMessages(prev => prev.filter(msg => msg.text !== '📋 토론 결론 요약 중...'));
                
                // 토론 요약을 시스템 메시지로 표시
                if (summaryData.summary) {
                    const summaryMessage = {
                        id: Date.now(),
                        sender: 'system',
                        text: `📋 토론 요약\n\n${summaryData.summary}`,
                        timestamp: new Date(),
                        read: false
                    };
                    setMessages(prev => [...prev, summaryMessage]);
                }
                
                // 사용자가 직접 입력한 메시지 확인 (💭로 시작하지 않는 사용자 메시지)
                const directUserMessages = messages
                    .filter(msg => msg.sender === 'user' && !msg.text.startsWith('💭'))
                    .map(msg => msg.text);
                
                // 사용자가 직접 입력한 의견이 있으면 캐릭터 감상평 요청
                if (directUserMessages.length > 0) {
                    try {
                        const commentsResponse = await fetch(`${API_BASE_URL}/chat/debate/comments`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token ? `Bearer ${token}` : ''
                            },
                            body: JSON.stringify({
                                character_ids: selectedCharIds,
                                topic: debateTopic,
                                messages: messages.filter(m => m.sender !== 'system').map(msg => ({
                                    sender: msg.sender,
                                    text: msg.text,
                                    characterId: msg.characterId
                                })),
                                user_inputs: directUserMessages
                            })
                        });
                        
                        if (commentsResponse.ok) {
                            const commentsData = await commentsResponse.json();
                            
                            // 각 캐릭터의 감상평을 메시지로 추가
                            if (commentsData.comments && commentsData.comments.length > 0) {
                                for (const comment of commentsData.comments) {
                                    if (comment.comment && comment.comment.trim()) {
                                        const commentMessage = {
                                            id: Date.now() + Math.random(),
                                            sender: 'ai',
                                            text: comment.comment,
                                            characterId: comment.character_id,
                                            timestamp: new Date(),
                                            read: false
                                        };
                                        setMessages(prev => [...prev, commentMessage]);
                                    }
                                }
                            }
                        }
                    } catch (commentsError) {
                        console.error('감상평 생성 오류:', commentsError);
                        // 오류 발생해도 계속 진행
                    }
                }
            }
        } catch (error) {
            // 로딩 메시지 제거
            setMessages(prev => prev.filter(msg => msg.text !== '📋 토론 결론 요약 중...'));
            console.error('토론 요약 오류:', error);
            const debateEndMessage = {
                id: Date.now(),
                sender: 'system',
                text: '🎤 토론이 종료되었습니다.',
                timestamp: new Date(),
                read: false
            };
            setMessages(prev => [...prev, debateEndMessage]);
            
            // 오류 발생 시 기본 종료 메시지 표시
            const errorMessage = {
                id: Date.now() + 1,
                sender: 'system',
                text: '토론 요약 생성 중 오류가 발생했습니다.',
                timestamp: new Date(),
                read: false
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setCurrentTurn('USER'); // 입력창 잠금 해제
            
            // 토론 종료 후 일반 채팅으로 자연스럽게 전환
            // 토론 종료 메시지 추가 (중복 체크)
            setMessages(prev => {
                const hasEndMessage = prev.some(msg => msg.text === '🎤 토론이 종료되었습니다.');
                if (!hasEndMessage) {
                    const debateEndTransition = {
                        id: Date.now() + 1000,
                        sender: 'system',
                        text: '🎤 토론이 종료되었습니다.',
                        timestamp: new Date(),
                        read: false
                    };
                    return [...prev, debateEndTransition];
                }
                return prev;
            });
        }
    };
    
    // 사용자 개입 선택지 핸들러
    const handleDebateIntervention = async (choice, interventionText) => {
        setShowDebateIntervention(false);
        setIsInterventionPanelHidden(true);
        setWaitingForUserInput(false);
        
        const cleanText = interventionText.trim();
        
        const interventionMessage = {
            id: Date.now(),
            sender: 'user',
            text: `💭 ${cleanText}`,
            timestamp: new Date(),
            read: false
        };
        setMessages(prev => [...prev, interventionMessage]);
        
        // 라운드 1이 아닌 경우에만 토론 계속 (한 번씩만 주고받기)
        // 라운드 1은 이미 두 번 주고받았으므로 사용자 입력 대기
        if (debateRound > 1) {
            // 다음 라운드로 토론 계속 (한 번씩만)
        setTimeout(() => {
            continueDebateRound(debateRound);
        }, 1000);
        }
    };
    
    // 사용자 입력 후 토론 계속
    const handleContinueDebate = async () => {
        if (waitingForUserInput && inputText.trim()) {
            return;
        } else {
            continueDebateRound(debateRound);
        }
    };
    
    // 성향 지도 조회
    const handleShowArchetype = async () => {
        if (!token) {
            alert('로그인이 필요합니다.');
            setShowAuth(true);
            return;
        }
        
        setShowArchetype(true);
        setArchetypeData(null);
        setIsLoadingArchetype(true);
        
        try {
            // 미리 계산된 성향 지도 데이터 조회
            const charIds = selectedCharIds.length > 0 ? selectedCharIds : Object.keys(characterData);
            const queryParams = new URLSearchParams({
                character_ids: JSON.stringify(charIds)
            });
            
            const response = await fetch(`${API_BASE_URL}/archetype/map?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.characters && data.characters.length > 0) {
                    setArchetypeData(data);
                } else {
                    setArchetypeData({ characters: [] }); // 빈 데이터로 설정하여 에러 메시지 표시
                }
            } else {
                const errorData = await response.json().catch(() => ({ detail: '성향 지도 조회 실패' }));
                alert(errorData.detail || '성향 지도 조회에 실패했습니다.');
                setShowArchetype(false);
            }
        } catch (error) {
            console.error('성향 지도 오류:', error);
            alert('성향 지도 조회 중 오류가 발생했습니다: ' + error.message);
            setShowArchetype(false);
        } finally {
            setIsLoadingArchetype(false);
        }
    };

    const handleShowDiary = async () => {
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        setShowDiary(true);
        setDiaryData(null); // 초기화
        
        try {
            // 일기 목록 먼저 가져오기
            const listResponse = await fetch(`${API_BASE_URL}/diary/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (listResponse.ok) {
                const listData = await listResponse.json();
                // 백엔드가 배열을 직접 반환하거나 {diaries: [...]} 형식으로 반환할 수 있음
                setDiaryList(Array.isArray(listData) ? listData : (listData.diaries || []));
            }
        } catch (error) {
            console.error('일기 목록 조회 오류:', error);
        }
    };

    const handleGenerateDiary = async () => {
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        if (messages.length === 0) {
            alert('일기를 생성하려면 대화 내용이 필요합니다.');
            return;
        }
        
        setIsGeneratingDiary(true);
        try {
            const response = await fetch(`${API_BASE_URL}/diary/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: messages.map(msg => ({
                        sender: msg.sender,
                        text: msg.text,
                        characterId: msg.characterId || null
                    })),
                    character_ids: selectedCharIds || []
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const diaryData = data.diary || data;
                
                if (diaryData && diaryData.id) {
                    setDiaryData({
                        id: diaryData.id,
                        title: diaryData.title,
                        content: diaryData.content,
                        date: diaryData.date,
                        emotions: diaryData.emotions || {}
                    });
                    
                    // 일기 목록 새로고침
                    try {
                        const listResponse = await fetch(`${API_BASE_URL}/diary/list`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (listResponse.ok) {
                            const listData = await listResponse.json();
                            setDiaryList(listData.diaries || listData || []);
                        }
                    } catch (listError) {
                        console.error('일기 목록 새로고침 오류:', listError);
                    }
                } else {
                    console.error('일기 데이터가 없습니다:', data);
                    alert('일기 생성은 성공했지만 데이터를 받지 못했습니다. 콘솔을 확인해주세요.');
                }
                
                // 목록 새로고침
                try {
                    const listResponse = await fetch(`${API_BASE_URL}/diary/list`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (listResponse.ok) {
                        const listData = await listResponse.json();
                        setDiaryList(listData.diaries || []);
                    }
                } catch (listError) {
                    console.error('일기 목록 새로고침 오류:', listError);
                }
            } else {
                let errorMessage = '일기 생성 중 오류가 발생했습니다.';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorMessage = typeof errorData.detail === 'string' 
                            ? errorData.detail 
                            : JSON.stringify(errorData.detail);
                    }
                } catch (e) {
                    errorMessage = `서버 오류 (HTTP ${response.status})`;
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('일기 생성 오류:', error);
            alert(`일기 생성 중 오류가 발생했습니다: ${error.message || error}`);
        } finally {
            setIsGeneratingDiary(false);
        }
    };

    const handleExportChat = () => {
        if (messages.length === 0) {
            alert('내보낼 대화가 없습니다.');
            return;
        }
        
        const exportText = messages.map(msg => {
            let sender;
            if (msg.sender === 'user') {
                sender = userProfile.nickname;
            } else {
                const charName = characterData[msg.characterId]?.name || 'AI';
                // 배우 이름 제거 (예: "황용식 (강하늘)" -> "황용식")
                sender = charName.split(' (')[0];
            }
            return `[${sender}]: ${msg.text}`;
        }).join('\n\n');
        
        const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `대화_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 소설 형식으로 변환 및 저장
    const handleExportNovel = async () => {
        if (messages.length === 0) {
            alert('변환할 대화가 없습니다.');
            return;
        }
        
        setIsExportingNovel(true);
        try {
            // 캐릭터 이름 매핑 생성
            const characterNames = {};
            selectedCharIds.forEach(id => {
                const char = characterData[id];
                if (char) {
                    characterNames[id] = char.name.split(' (')[0];
                }
            });
            
            // 메시지 형식 변환 (백엔드가 기대하는 형식)
            const formattedMessages = messages.map(msg => ({
                sender: msg.sender,
                text: msg.text,
                characterId: msg.characterId || (msg.sender === 'ai' ? selectedCharIds[0] : null),
                timestamp: msg.timestamp
            }));
            
            const response = await fetch(`${API_BASE_URL}/chat/convert-to-novel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: formattedMessages,
                    character_names: characterNames,
                    user_nickname: userProfile.nickname || "서안",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: '알 수 없는 오류' }));
                throw new Error(errorData.detail || `서버 오류 (${response.status})`);
            }
            
            const data = await response.json();
            
            if (!data.novel_text || data.novel_text.trim().length === 0) {
                throw new Error('소설 변환 결과가 비어있습니다.');
            }
            
            const novelText = data.novel_text;
            
            // txt 파일로 다운로드
            const blob = new Blob([novelText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            const charNames = selectedCharIds.map(id => {
                const char = characterData[id];
                return char ? char.name.split(' (')[0] : '';
            }).filter(Boolean).join('_');
            a.download = `소설_${charNames}_${dateStr}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('소설 형식으로 변환되어 저장되었습니다!');
        } catch (error) {
            console.error('소설 변환 오류:', error);
            const errorMessage = error.message || '소설 변환 중 오류가 발생했습니다.';
            alert(`소설 변환 실패: ${errorMessage}\n\n백엔드 서버가 실행 중인지 확인해주세요.`);
        } finally {
            setIsExportingNovel(false);
        }
    };

    // 템플릿 적용
    const handleSelectTemplate = (template) => {
        if (template.messages.length > 0) {
            setInputText(template.messages[0]);
        }
        setShowTemplate(false);
    };

    // 메시지 전송 (타이핑 효과 포함)
    const handleSend = async () => {
        // contentEditable div에서 텍스트 가져오기
        let currentText = inputText;
        if (textareaRef && textareaRef.current && textareaRef.current.contentEditable === 'true') {
            currentText = textareaRef.current.innerText || textareaRef.current.textContent || '';
        }
        
        if (!currentText.trim()) return;
        
        // 토론 모드일 때는 토론 계속 로직으로 처리
        if (debateMode) {
            // 사용자 메시지 추가
            const userMessage = { 
                id: Date.now(), 
                sender: 'user', 
                text: currentText.trim(),
                timestamp: new Date(),
                read: false
            };
            setMessages(prev => [...prev, userMessage]);
            setInputText('');
            
            // contentEditable div 초기화
            if (textareaRef && textareaRef.current && textareaRef.current.contentEditable === 'true') {
                textareaRef.current.innerHTML = '';
                textareaRef.current.style.height = 'auto';
            } else {
                const textarea = document.querySelector('.input-area textarea');
                if (textarea) textarea.style.height = 'auto';
            }
            
            // 토론 계속
            setWaitingForUserInput(false);
            setTimeout(() => {
                continueDebateRound(debateRound);
            }, 500);
            return;
        }
        
        // 일반 채팅 모드
        if (currentTurn !== 'USER') return;

        // 열린 괄호가 있으면 닫기
        let finalText = currentText;
        const openCount = (finalText.match(/\(/g) || []).length;
        const closeCount = (finalText.match(/\)/g) || []).length;
        if (openCount > closeCount) {
            finalText = finalText + ')';
        }
        
        // 대사/행동 부분 구분 (괄호로 구분)
        const segments = parseTextToSegments(finalText);
        const messageLines = [];
        
        segments.forEach(segment => {
            if (segment.type === '행동') {
                // 행동 부분은 괄호 포함하여 저장
                messageLines.push({
                    text: segment.text,
                    type: '행동'
                });
            } else if (segment.text.trim()) {
                // 대사 부분
                const lines = segment.text.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        messageLines.push({
                            text: line,
                            type: '말'
                        });
                    }
                });
            }
        });
        
        // messageLines가 비어있으면 기본 메시지로 추가
        if (messageLines.length === 0 && finalText.trim()) {
            messageLines.push({
                text: finalText,
                type: '말'
            });
        }
        
        const userMessage = { 
            id: Date.now(), 
            sender: 'user', 
            text: finalText,
            messageType: messageType, // 전체 메시지 타입
            messageLines: messageLines, // 줄 단위 타입 정보
            timestamp: new Date(),
            read: false
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        // eslint-disable-next-line no-unused-vars
        const messageText = finalText;
        setInputText('');
        setMessageType('말'); // 전송 후 기본 대사 모드로 리셋

        // contentEditable div 초기화
        if (textareaRef && textareaRef.current && textareaRef.current.contentEditable === 'true') {
            textareaRef.current.innerHTML = '';
            textareaRef.current.style.height = 'auto';
        } else {
        const textarea = document.querySelector('.input-area textarea');
        if (textarea) textarea.style.height = 'auto';
        }
        
        setIsLoading(true);
        setCurrentTurn('AI');

        try {
            const requestUrl = `${API_BASE_URL}/chat`;
            const requestBody = {
                character_ids: selectedCharIds,
                user_nickname: userProfile.nickname,
                chat_history: newMessages.map(msg => ({
                    id: msg.id,
                    sender: msg.sender,
                    text: msg.text,
                    characterId: msg.characterId || null
                })),
                settings: settings || {},
                current_chat_id: currentChatId || null,  // 현재 대화 세션 ID 전달
            };
            
            const response = await fetch(requestUrl, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server error response:', errorData);
                throw new Error(`백엔드 서버 오류 (HTTP ${response.status}): ${errorData}`);
            }
            
            const data = await response.json(); 
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            setIsLoading(false);

            // 사용자 메시지를 읽음으로 표시
            setMessages(prev => prev.map(msg => 
                msg.sender === 'user' && !msg.read ? { ...msg, read: true } : msg
            ));

            for (const res of data.responses) {
                for (let i = 0; i < res.texts.length; i++) {
                    const textChunk = res.texts[i];
                    const aiMessageChunk = {
                        id: Date.now() + Math.random() + i,
                        sender: 'ai',
                        text: textChunk,
                        characterId: res.id,
                        isTyping: settings.typingEffect,
                        timestamp: new Date(),
                        read: false
                    };
                    
                    // 메시지 소리 재생 (첫 번째 메시지만)
                    if (settings.soundEnabled && i === 0 && res === data.responses[0]) {
                        playMessageSound();
                    }
                    
                    setMessages(prev => [...prev, aiMessageChunk]);
                    
                    // 메시지 추가 후 자동 스크롤 (부드럽게, 튕김 없이)
                    const scrollToBottom = () => {
                        if (messageListRef.current) {
                            const element = messageListRef.current;
                            // 즉시 스크롤 (튕김 방지)
                            const originalBehavior = element.style.scrollBehavior;
                            element.style.scrollBehavior = 'auto';
                            element.scrollTop = element.scrollHeight;
                            requestAnimationFrame(() => {
                                element.style.scrollBehavior = originalBehavior;
                            });
                        }
                    };
                    
                    // 메시지 추가 후 자동 스크롤
                    requestAnimationFrame(() => {
                        scrollToBottom();
                        requestAnimationFrame(() => {
                            scrollToBottom();
                        });
                    });
                    
                    // 다음 말풍선 표시 전 대기
                    if (settings.typingEffect) {
                        // 타이핑 효과: 텍스트 길이에 비례한 대기 시간
                        const waitTime = 100 + textChunk.length * 30;
                        const scrollInterval = setInterval(scrollToBottom, 50);
                        await wait(waitTime);
                        clearInterval(scrollInterval);
                        scrollToBottom();
                    } else {
                        // 타이핑 효과 없음: 말풍선 완성 대기
                        const waitTime = 800 + textChunk.length * 20;
                        const scrollInterval = setInterval(scrollToBottom, 100);
                        await wait(waitTime);
                        clearInterval(scrollInterval);
                        scrollToBottom();
                    }
                }
            }

        } catch (error) {
            console.error("Error fetching AI response:", error);
            setIsLoading(false); 
            
            // 에러 메시지 개선
            let errorText = '서버 연결 실패';
            if (error.message === 'Failed to fetch' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
                errorText = `백엔드 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요. (${API_BASE_URL})`;
            } else if (error.message) {
                errorText = error.message;
            }
            
            const errorMsg = {
                id: Date.now() + Math.random(),
                sender: 'ai',
                text: `AI 응답 오류: ${errorText}`,
                characterId: selectedCharIds[0] 
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            // 토론 모드에서 사용자 입력 후 토론 계속
            if (debateMode) {
                // 토론 모드에서는 항상 사용자 입력 가능하도록 설정
                setCurrentTurn('USER');
                // 라운드 2 이상에서는 사용자 입력 후 자동으로 토론 계속 (한 번씩만)
                // 라운드 1은 이미 두 번 주고받았으므로 제외
                if (debateRound > 1) {
                setWaitingForUserInput(false);
                setTimeout(() => {
                    continueDebateRound(debateRound);
                }, 1500);
                } else {
                    // 라운드 1에서는 사용자 입력 대기하지 않음 (이미 자동으로 라운드 2 진행)
                    setWaitingForUserInput(false);
                }
            } else {
                setCurrentTurn('USER');
            }
            
            // 선물 확인 (단일 캐릭터 대화, 로그인 상태, 토론 모드 아님)
            if (token && selectedCharIds.length === 1 && !debateMode) {
                checkForGift(selectedCharIds[0]);
            }
            
            // 모든 메시지 완성 후 최종 스크롤
            setTimeout(() => {
                if (messageListRef.current) {
                    const element = messageListRef.current;
                    const originalBehavior = element.style.scrollBehavior;
                    element.style.scrollBehavior = 'auto';
                    element.scrollTop = element.scrollHeight;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            element.scrollTop = element.scrollHeight;
                            element.style.scrollBehavior = originalBehavior;
                        });
                    });
                }
            }, 100);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };


    // 텍스트에서 커서 위치가 () 안인지 밖인지 확인하는 함수
    const isCursorInAction = (text, cursorPos) => {
        let depth = 0;
        let inAction = false;
        for (let i = 0; i < cursorPos; i++) {
            if (text[i] === '(') {
                depth++;
                inAction = true;
            } else if (text[i] === ')') {
                depth--;
                if (depth === 0) {
                    inAction = false;
                }
            }
        }
        return inAction && depth > 0;
    };

    // 텍스트를 파싱해서 대사/행동 부분을 구분하는 함수
    const parseTextToSegments = (text) => {
        const segments = [];
        let currentSegment = { type: '말', text: '', start: 0 };
        let depth = 0;

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '(') {
                if (depth === 0) {
                    // 대사 부분 저장 (괄호 제외)
                    if (currentSegment.text.trim()) {
                        currentSegment.end = i;
                        segments.push({ ...currentSegment });
                    }
                    // 행동 부분 시작 (괄호 포함)
                    currentSegment = { type: '행동', text: '(', start: i };
                } else {
                    currentSegment.text += text[i];
                }
                depth++;
            } else if (text[i] === ')') {
                currentSegment.text += text[i];
                depth--;
                if (depth === 0) {
                    // 행동 부분 완료 (괄호 포함)
                    currentSegment.end = i + 1;
                    segments.push({ ...currentSegment });
                    // 대사 부분 시작
                    currentSegment = { type: '말', text: '', start: i + 1 };
                }
            } else {
                currentSegment.text += text[i];
            }
        }

        // 마지막 세그먼트 저장
        if (currentSegment.text.trim() || depth > 0) {
            if (depth > 0) {
                currentSegment.type = '행동';
            }
            if (currentSegment.text.trim()) {
                currentSegment.end = text.length;
                segments.push({ ...currentSegment });
            }
        }

        return segments;
    };

    const handleInput = (e) => {
        // contentEditable div는 onInput에서 처리
        // 이 함수는 호환성을 위해 유지
    };

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);


    const renderScreen = () => {
        if (showMyPage) {
            return (
                <MyPageScreen
                    userProfile={userProfile}
                    onClose={() => setShowMyPage(false)}
                    onSave={(newProfile) => {
                        if (!newProfile.profilePic || !newProfile.profilePic.trim()) {
                            newProfile.profilePic = defaultProfilePic;
                        }
                        setUserProfile(newProfile);
                        if (user) {
                            const updatedUser = { ...user, nickname: newProfile.nickname, profile_pic: newProfile.profilePic };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            setUser(updatedUser);
                        }
                    }}
                    token={token}
                />
            );
        }

        if (showHistory) {
            return (
                <HistoryScreen
                    onClose={() => setShowHistory(false)}
                    onLoadChat={handleLoadChat}
                    onDeleteChat={deleteChatHistory}
                    token={token}
                    refreshTrigger={historyRefreshTrigger}
                />
            );
        }

        if (showStats) {
            return <StatsScreen onClose={() => setShowStats(false)} messages={messages} token={token} onDeleteChat={deleteChatHistory} refreshTrigger={historyRefreshTrigger} onShowWeeklyRecap={() => { setShowStats(false); setShowWeeklyRecap(true); }} onLoadChat={handleLoadChat} />;
        }

        if (showWeeklyRecap) {
            return <WeeklyRecapScreen onClose={() => { setShowWeeklyRecap(false); setShowStats(true); }} token={token} refreshTrigger={historyRefreshTrigger} />;
        }

        if (showReport) {
            return <ReportScreen onClose={() => setShowReport(false)} messages={messages} userProfile={userProfile} />;
        }

        if (showSettings) {
            return (
                <SettingsScreen
                    onClose={() => setShowSettings(false)}
                    settings={settings}
                    onSave={setSettings}
                />
            );
        }

        if (showTemplate) {
            return (
                <TemplateScreen
                    onClose={() => setShowTemplate(false)}
                    onSelectTemplate={handleSelectTemplate}
                />
            );
        }

        if (showGift && currentGift) {
            return (
                <GiftModal
                    gift={currentGift}
                    onClose={() => {
                        setShowGift(false);
                        setCurrentGift(null);
                    }}
                />
            );
        }

        if (showDebate) {
            return (
                <DebateModal
                    selectedCharIds={selectedCharIds}
                    characterData={characterData}
                    debateTopic={debateTopic}
                    setDebateTopic={setDebateTopic}
                    debateStyle={debateStyle}
                    setDebateStyle={setDebateStyle}
                    onStart={handleStartDebate}
                    onClose={() => {
                        setShowDebate(false);
                        setDebateTopic('');
                        setDebateMode(false);
                        setDebateRound(0);
                        setWaitingForUserInput(false);
                    }}
                />
            );
        }

        if (showArchetype) {
            return (
                <ArchetypeMapModal
                    data={archetypeData}
                    characterData={characterData}
                    isLoading={isLoadingArchetype}
                    onClose={() => {
                        setShowArchetype(false);
                        setArchetypeData(null);
                        setIsLoadingArchetype(false);
                    }}
                />
            );
        }

        if (showDiary) {
            return (
                <DiaryModal
                    diaryData={diaryData}
                    diaryList={diaryList}
                    isGenerating={isGeneratingDiary}
                    onGenerate={handleGenerateDiary}
                    onClose={() => {
                        setShowDiary(false);
                        setDiaryData(null);
                    }}
                    token={token}
                    onDiarySelect={async (diaryId) => {
                        if (!diaryId) {
                            setDiaryData(null);
                            return;
                        }
                        try {
                            const response = await fetch(`${API_BASE_URL}/diary/${diaryId}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (response.ok) {
                                const data = await response.json();
                                setDiaryData(data);
                            } else {
                                let errorMessage = '일기를 불러오는데 실패했습니다.';
                                try {
                                    const errorData = await response.json();
                                    if (errorData.detail) {
                                        errorMessage = typeof errorData.detail === 'string' 
                                            ? errorData.detail 
                                            : JSON.stringify(errorData.detail);
                                    }
                                } catch (e) {
                                    errorMessage = `서버 오류 (HTTP ${response.status})`;
                                }
                                console.error('일기 조회 실패:', response.status, errorMessage);
                                alert(errorMessage);
                            }
                        } catch (error) {
                            console.error('일기 조회 오류:', error);
                            alert(`일기 조회 중 오류가 발생했습니다: ${error.message || error}`);
                        }
                    }}
                    onDeleteDiary={async (diaryId) => {
                        if (!token) {
                            alert('로그인이 필요합니다.');
                            return;
                        }
                        try {
                            const response = await fetch(`${API_BASE_URL}/diary/${diaryId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (response.ok) {
                                alert('일기가 삭제되었습니다.');
                                setDiaryData(null);
                            } else {
                                const errorData = await response.json();
                                alert(errorData.detail || '일기 삭제에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('일기 삭제 오류:', error);
                            alert('일기 삭제 중 오류가 발생했습니다.');
                        }
                    }}
                    onRefreshList={async () => {
                        if (!token) return;
                        try {
                            const listResponse = await fetch(`${API_BASE_URL}/diary/list`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (listResponse.ok) {
                                const listData = await listResponse.json();
                                setDiaryList(listData.diaries || []);
                            }
                        } catch (error) {
                            console.error('일기 목록 새로고침 오류:', error);
                        }
                    }}
                />
            );
        }

        if (selectedChars.length > 0) {
            return (
                <ChatScreen
                    selectedChars={selectedChars} 
                    messages={messages}
                    inputText={inputText}
                    setInputText={setInputText}
                    handleSend={handleSend}
                    handleKeyPress={handleKeyPress}
                    handleInput={handleInput}
                    isLoading={isLoading}
                    messageListRef={messageListRef}
                    messageType={messageType}
                    setMessageType={setMessageType}
                    textareaRef={textareaRef}
                    isCursorInAction={isCursorInAction}
                    onBack={() => {
                        // 토론 모드일 때 자동으로 종료
                        if (debateMode) {
                            endDebate();
                        }
                        setSelectedCharIds([]); 
                        setMessages([]); 
                        setCurrentTurn('USER'); 
                        setCurrentChatId(null);
                    }}
                    userProfile={userProfile} 
                    currentTurn={currentTurn}
                    onExport={handleExportChat}
                    onExportNovel={handleExportNovel}
                    isExportingNovel={isExportingNovel}
                    onSave={handleSaveChat}
                    typingEffect={settings.typingEffect}
                    settings={settings}
                    randomPlaceholder={randomPlaceholder}
                    playMessageSound={playMessageSound}
                    onShowReport={() => setShowReport(true)}
                    isMultiChat={selectedChars.length > 1}
                    onStartDebate={() => setShowDebate(true)}
                    onShowArchetype={handleShowArchetype}
                    onShowDiary={handleShowDiary}
                    debateMode={debateMode}
                    waitingForUserInput={waitingForUserInput}
                    handleContinueDebate={handleContinueDebate}
                    debateCharPositions={debateCharPositions}
                    selectedCharIds={selectedCharIds}
                    characterData={characterData}
                    showDebateIntervention={showDebateIntervention}
                    isInterventionPanelHidden={isInterventionPanelHidden}
                    setIsInterventionPanelHidden={setIsInterventionPanelHidden}
                    handleDebateIntervention={handleDebateIntervention}
                    endDebate={endDebate}
                    debateTopic={debateTopic}
                    likedMessages={likedMessages}
                    setLikedMessages={setLikedMessages}
                    token={token}
                    setHistoryRefreshTrigger={setHistoryRefreshTrigger}
                />
            );
        }

        return (
            <CharacterSelectScreen
                onStartChat={(ids) => {
                    // 토론 모드일 때 자동으로 종료
                    if (debateMode) {
                        endDebate();
                    }
                    setSelectedCharIds(ids); 
                    setCurrentTurn('USER'); 
                    setCurrentChatId(null);
                    // 시스템 메시지 추가
                    const systemMessages = [];
                    if (ids.length === 1) {
                        const char = characterData[ids[0]];
                        systemMessages.push({
                            id: Date.now(),
                            sender: 'system',
                            text: `${char.name.split(' (')[0]}님이 대화에 참여했습니다.`,
                            timestamp: new Date()
                        });
                    } else if (ids.length === 2) {
                        const char1 = characterData[ids[0]];
                        const char2 = characterData[ids[1]];
                        systemMessages.push({
                            id: Date.now(),
                            sender: 'system',
                            text: `${char1.name.split(' (')[0]}님과 ${char2.name.split(' (')[0]}님이 대화에 참여했습니다.`,
                            timestamp: new Date()
                        });
                    }
                    setMessages(systemMessages);
                    // 랜덤 placeholder 변경
                    setRandomPlaceholder(randomPlaceholders[Math.floor(Math.random() * randomPlaceholders.length)]);
                }}
                onMyPageClick={() => setShowMyPage(true)}
                onHistoryClick={() => setShowHistory(true)}
                onStatsClick={() => setShowStats(true)}
                onShowDiary={handleShowDiary}
                userProfile={userProfile}
            />
        );
    };

    return (
        <div className="app-container">
            {showAuth && !token && (
                <AuthModal 
                    onClose={() => {
                        if (token) setShowAuth(false);
                    }}
                    onSuccess={handleAuthSuccess}
                />
            )}
            {renderScreen()}
            {selectedChars.length > 0 && (
                <button 
                    className="settings-button"
                    onClick={() => setShowSettings(true)}
                    title="설정"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <circle cx="12" cy="5" r="1.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                        <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                </button>
            )}
            {selectedChars.length > 0 && messages.length === 0 && (
                <button 
                    className="template-button"
                    onClick={() => setShowTemplate(true)}
                    title="템플릿"
                >
                    📝
                </button>
            )}
        </div>
    );
}

export default App;
