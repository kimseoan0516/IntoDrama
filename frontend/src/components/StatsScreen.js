import React, { useState, useEffect, useRef } from 'react';
import { characterData } from '../constants/characterData';
import { api, API_BASE_URL } from '../utils/api';
import html2canvas from 'html2canvas';

// 포토카드 모달 컴포넌트
const PhotocardModal = ({ quote, character, onClose }) => {
    const photocardRef = useRef(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!photocardRef.current) return;
        
        setSaving(true);
        try {
            const canvas = await html2canvas(photocardRef.current, {
                backgroundColor: null,
                scale: 3,
                logging: false,
                useCORS: true,
                allowTaint: false,
                width: photocardRef.current.offsetWidth,
                height: photocardRef.current.offsetHeight,
                pixelRatio: Math.max(window.devicePixelRatio || 2, 2),
            });

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `포토카드_${character?.name?.split(' (')[0] || '캐릭터'}_${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSaving(false);
            }, 'image/png');
        } catch (error) {
            console.error('포토카드 저장 실패:', error);
            alert('포토카드 저장 중 오류가 발생했습니다.');
            setSaving(false);
        }
    };

    // 드라마별 그라데이션 배경색
    const getGradientByDrama = (dramaTitle) => {
        const gradients = {
            // 신비롭고 우아한 블루-그레이 (도깨비)
            '도깨비': 'linear-gradient(135deg, #2C3E50 0%, #34495E 50%, #5D6D7E 100%)',
            
            // 따뜻한 밀리터리 브라운-오렌지 (태양의 후예)
            '태양의 후예': 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
            
            // 활기찬 청춘 코랄-오렌지 (거침없이 하이킥)
            '거침없이 하이킥': 'linear-gradient(135deg, #E67E22 0%, #D35400 50%, #BA4A00 100%)',
            
            // 따뜻한 레트로 골드-베이지 (응답하라 1994)
            '응답하라 1994': 'linear-gradient(135deg, #D4A574 0%, #C19A6B 50%, #9B7E52 100%)',
            
            // 고급스러운 네이비-다크블루 (상속자들)
            '상속자들': 'linear-gradient(135deg, #1B1B2F 0%, #162447 50%, #1F4068 100%)',
            
            // 화려한 퍼플-핑크 (꽃보다 남자)
            '꽃보다 남자': 'linear-gradient(135deg, #6A1B9A 0%, #8E24AA 50%, #AB47BC 100%)',
            
            // 역사적 다크 브라운 (미스터 션샤인)
            '미스터 션샤인': 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #795548 100%)',
            
            // 청량한 스카이블루-민트 (선재 업고 튀어)
            '선재 업고 튀어': 'linear-gradient(135deg, #00ACC1 0%, #26C6DA 50%, #4DD0E1 100%)',
            
            // 열정적인 다크 레드-마룬 (이태원 클라쓰)
            '이태원 클라쓰': 'linear-gradient(135deg, #C0392B 0%, #922B21 50%, #7B241C 100%)',
            
            // 우아한 에메랄드 그린 (시크릿 가든)
            '시크릿 가든': 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)',
            
            // 자연스러운 포레스트 그린 (갯마을 차차차)
            '갯마을 차차차': 'linear-gradient(135deg, #4A5D4A 0%, #5C6F5C 50%, #7A8A7A 100%)',
            
            // 차분한 슬레이트 그레이-블루 (미생)
            '미생': 'linear-gradient(135deg, #37474F 0%, #455A64 50%, #546E7A 100%)',
            
            // 따뜻하고 부드러운 갈색 (나의 아저씨)
            '나의 아저씨': 'linear-gradient(135deg, #6B4E3D 0%, #8D6E63 50%, #A1887F 100%)',
            
            // 빈티지 세피아-브라운 (네 멋대로 해라)
            '네 멋대로 해라': 'linear-gradient(135deg, #6D4C41 0%, #8D6E63 50%, #A1887F 100%)',
            
            // 생기 넘치는 핑크-로즈 (스물다섯 스물하나)
            '스물다섯 스물하나': 'linear-gradient(135deg, #FF6B9D 0%, #C44569 50%, #8B3A62 100%)',
            
            // 따스한 올리브-베이지 (동백꽃 필 무렵)
            '동백꽃 필 무렵': 'linear-gradient(135deg, #827717 0%, #9E9D24 50%, #AFB42B 100%)',
            
            // 깊이 있는 틸-그린 (괜찮아 사랑이야)
            '괜찮아 사랑이야': 'linear-gradient(135deg, #00695C 0%, #00897B 50%, #26A69A 100%)',
            
            // 기본값
            '기본값': 'linear-gradient(135deg, #8B6F47 0%, #6B4E3D 50%, #5C4033 100%)'
        };
        return gradients[dramaTitle] || gradients['기본값'];
    };

    // 텍스트 길이에 따른 폰트 크기 계산
    const calculateFontSize = (text) => {
        const length = text.length;
        if (length < 50) return '1.5rem';
        if (length < 100) return '1.3rem';
        if (length < 150) return '1.1rem';
        if (length < 200) return '1rem';
        return '0.9rem';
    };

    const gradient = getGradientByDrama(character?.dramaTitle || '');
    const fontSize = calculateFontSize(quote.text);

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                maxWidth: '90vw',
                maxHeight: '90vh'
            }}>
                {/* 포토카드 미리보기 */}
                <div
                    ref={photocardRef}
                    style={{
                        width: '360px',
                        height: '640px',
                        background: gradient,
                        borderRadius: '20px',
                        padding: '50px 35px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {/* 배경 장식 */}
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        filter: 'blur(40px)'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-80px',
                        left: '-80px',
                        width: '250px',
                        height: '250px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        filter: 'blur(40px)'
                    }}></div>

                    {/* 명대사 텍스트 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1,
                        flex: 1,
                        padding: '40px 0'
                    }}>
                        {/* 큰 따옴표 장식 */}
                        <div style={{
                            fontSize: '3.5rem',
                            color: 'rgba(255, 255, 255, 0.2)',
                            fontFamily: 'Georgia, serif',
                            lineHeight: '1',
                            marginBottom: '20px',
                            fontWeight: '700'
                        }}>
                            ❝
                        </div>
                        
                        <div style={{
                            color: '#FFFFFF',
                            fontSize: fontSize,
                            lineHeight: '1.6',
                            fontWeight: '500',
                            wordBreak: 'keep-all',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
                            padding: '0 10px'
                        }}>
                            {quote.text}
                        </div>
                    </div>

                    {/* 하단 정보 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        position: 'relative',
                        zIndex: 1,
                        paddingTop: '30px'
                    }}>
                        {/* 캐릭터 이름 */}
                        <div style={{
                            color: '#FFFFFF',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            opacity: 0.95
                        }}>
                            {character?.name?.split(' (')[0] || '캐릭터'}
                        </div>

                        {/* 앱 로고/워터마크 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.75rem',
                            opacity: 0.8
                        }}>
                            <span>IntoDrama</span>
                            <span>•</span>
                            <span>드라마 속으로</span>
                        </div>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '360px',
                        padding: '16px 24px',
                        backgroundColor: saving ? '#A1887F' : '#FFFFFF',
                        color: saving ? '#FFFFFF' : '#4A3B32',
                        border: saving ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '16px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                        if (!saving) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.2)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!saving) {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
                        }
                    }}
                >
                    {saving ? (
                        <>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid #FFFFFF',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }}></div>
                            <span>저장 중...</span>
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>갤러리에 저장</span>
                        </>
                    )}
                </button>

                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export const StatsScreen = ({ onClose, token, messages, onDeleteChat, refreshTrigger, onShowWeeklyRecap, onLoadChat }) => {
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuotePage, setCurrentQuotePage] = useState(1);
    const quotesPerPage = 3;
    const [selectedPhotocard, setSelectedPhotocard] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [visibleQuotesCount, setVisibleQuotesCount] = useState(3);
    const loadMoreRef = useRef(null);
    
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const now = new Date();
            
            // 날짜만 비교하기 위해 시간을 00:00:00으로 설정
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            // 오늘인지 확인
            if (targetDate.getTime() === today.getTime()) {
                return '오늘';
            }
            
            // 어제인지 확인
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (targetDate.getTime() === yesterday.getTime()) {
                return '어제';
            }
            
            // 그 외에는 날짜 형식으로 표시 (MM/DD)
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}/${day}`;
        } catch {
            return dateString;
        }
    };

    // 모바일 감지
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 무한 스크롤을 위한 Intersection Observer
    useEffect(() => {
        if (!isMobile || !loadMoreRef.current || loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleQuotesCount < quotes.length) {
                    setVisibleQuotesCount(prev => Math.min(prev + 3, quotes.length));
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [isMobile, visibleQuotesCount, quotes.length, loading]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                // 주간 통계, 대사 목록을 동시에 가져오기
                const [statsData, quotesData] = await Promise.all([
                    api.getWeeklyStats(),
                    api.getSavedQuotes()
                ]);
                setWeeklyStats(statsData);
                setQuotes(quotesData.quotes || []);
                setCurrentQuotePage(1); // 데이터 새로고침 시 첫 페이지로
                setVisibleQuotesCount(3); // 모바일 무한 스크롤 초기화
                } catch (error) {
                    console.error('통계 불러오기 실패:', error);
            } finally {
            setLoading(false);
            }
        };
        fetchStats();
    }, [token, refreshTrigger]);

    const handleDelete = async (chatId) => {
        if (!window.confirm('이 대화를 삭제하시겠습니까?')) {
            return;
        }

        if (token) {
            try {
                await api.deleteChatHistory(chatId);
                setQuotes(prev => prev.filter(q => q.id !== chatId));
                    if (onDeleteChat) {
                        onDeleteChat(chatId);
                }
            } catch (error) {
                console.error('대화 삭제 실패:', error);
                alert('대화 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="stats-modal">
                <h2>대화 통계</h2>
                <button className="close-button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div className="stats-content">
                    {/* 주간 통계 섹션 */}
                    <div className="weekly-stats-header" style={{ marginBottom: '8px', textAlign: 'center', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#5D4037', marginBottom: '4px' }}>이번주 가장 많이 대화한 캐릭터</h3>
                        <p style={{ fontSize: '0.85rem', color: '#8D6E63', margin: 0 }}>가장 티키타카가 잘 맞는 파트너를 모았어요</p>
                    </div>
                    
                    {loading ? (
                        <div style={{ 
                            padding: '40px 20px', 
                            textAlign: 'center',
                            color: '#8D6E63',
                            fontSize: '0.95rem'
                        }}>
                            <p style={{ margin: 0, opacity: 0.7 }}>불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {!weeklyStats || weeklyStats.top_characters.length === 0 ? (
                                <div style={{ 
                                    padding: '40px 20px', 
                                    textAlign: 'center',
                                    color: '#8D6E63',
                                    fontSize: '0.95rem'
                                }}>
                                    <p style={{ margin: 0, opacity: 0.7 }}>이번주 대화 기록이 없습니다.</p>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>대화를 시작하고 저장하면 통계가 표시됩니다.</p>
                                </div>
                            ) : (
                                <>
                            {/* 상위 3명 캐릭터 카드 - 1위 위에, 2·3위 아래 가로로 */}
                            <div style={{ 
                                marginBottom: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '100%'
                            }}>
                                {/* 1위 카드 */}
                                {weeklyStats.top_characters[0] && (() => {
                                    const char = weeklyStats.top_characters[0];
                                    const charInfo = characterData && char.character_id ? characterData[char.character_id] : null;
                                    const charName = charInfo?.name?.split(' (')[0] || '알 수 없음';
                                    const charImage = charInfo?.image || '/default-character.png';
                                    
                                    // 캐릭터별 태그 목록 (2~3개 랜덤 선택)
                                    const getCharacterTags = (characterId) => {
                                        const characterTagsData = {
                                            'kim_shin': ['#수호신', '#운명적사랑', '#쓸쓸하고찬란하神', '#900살'],
                                            'yoo_sijin': ['#특전사대위', '#파트너', '#능글', '#플러팅'],
                                            'sun_jae': ['#구원자', '#짝사랑', '#순애보', '#첫사랑', '#톱스타'],
                                            'im_sol': ['#최애지킴이', '#인간비타민', '#무한긍정', '#소울메이트'],
                                            'jang_jaeyeol': ['#소울메이트', '#상처치유', '#인기작가', '#치유와_위로', '#지적', '#쿨함'],
                                            'yong_sik': ['#직진', '#지킴이', '#순박한_경찰', '#단순무식_솔직'],
                                            'kim_juwon': ['#츤데레', '#재벌', '#까칠한_재벌3세'],
                                            'goo_junpyo': ['#츤데레', '#순정파', '#F4리더', '#천상천하_유아독존', '#초딩'],
                                            'min_yong': ['#현실적', '#까칠_체육쌤', '#미친개'],
                                            'young_do': ['#상처', '#반항아', '#호텔상속자', '#짠내서브', '#초딩멘탈'],
                                            'goo_dongmae': ['#집착', '#순정마초', '#낭인', '#아픈손가락', '#연정', '#후회'],
                                            'sseuregi': ['#무심다정', '#현실오빠', '#츤데레', '#경상도_사투리'],
                                            'park_donghoon': ['#참어른', '#인생선배', '#묵묵한_위로', '#책임감', '#어른의무게', '#어른의_위로'],
                                            'oh_sangshik': ['#참리더', '#의리파_상사', '#워커홀릭', '#츤데레', '#책임감', '#직장_멘토'],
                                            'hong_banjang': ['#동네히어로', '#만능백수', '#츤데레', '#만능해결사'],
                                            'min_jeong': ['#허당', '#러블리', '#사랑스러움', '#꽈당민정', '#힐링', '#무한긍정', '#인간비타민', '#해피바이러스'],
                                            'park_saeroy': ['#신념', '#소신', '#단밤사장', '#소신과_패기', '#성장형_리더', '#밤톨머리', '#단단', '#돌덩이'],
                                            'eugene_choi': ['#이방인', '#애국심', '#합시다_러브', '#쓸쓸', '#고독'],
                                            'na_heedo': ['#무한열정', '#성장캐', '#명랑만화', '#청춘', '#꿈', '#에너지'],
                                            'kim_tan': ['#왕관의무게', '#직진', '#재벌상속자'],
                                            'go_boksu': ['#회개', '#순수영혼', '#밑바닥_인생', '#거칠지만_순수', '#진심']
                                        };
                                        
                                        const tags = characterTagsData[characterId] || ['#친구'];
                                        // 2~3개 랜덤 선택
                                        const numTags = Math.random() < 0.5 ? 2 : 3;
                                        const shuffled = [...tags].sort(() => Math.random() - 0.5);
                                        return shuffled.slice(0, Math.min(numTags, tags.length)).join(' ');
                                    };
                                    
                                    const characterTag = getCharacterTags(char.character_id);
                                    
                                    return (
                                        <div 
                                            key={char.character_id} 
                                            className="top-character-card"
                                            style={{
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                padding: '20px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(180deg, #FFFEF5 0%, #FFFFFF 100%)',
                                                border: '2px solid #D4AF37',
                                                marginBottom: '16px',
                                                maxWidth: '300px',
                                                width: '100%',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {/* MY SOULMATE 배너 */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '0',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                color: '#FFFFFF',
                                                padding: '4px 16px',
                                                borderRadius: '0 0 8px 8px',
                                                fontSize: '0.65rem',
                                                fontWeight: '700',
                                                letterSpacing: '1px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                zIndex: 5
                                            }}>
                                                MY SOULMATE
                                            </div>
                                            
                                            {/* 순위 뱃지 - 프로필 사진 살짝 겹치는 위치 */}
                                            <div 
                                                style={{
                                                    position: 'absolute',
                                                    top: '24px',
                                                    right: 'calc(50% - 50px)',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFB900 100%)', // 금색 메탈릭 그라데이션 (밝은 황금색 -> 진한 오렌지 골드)
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#FFFFFF',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                                                    zIndex: 10,
                                                    border: '2px solid #FFFFFF',
                                                    paddingTop: '2px',
                                                    paddingBottom: '2px'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.4rem', lineHeight: '1', fontWeight: 'bold', marginTop: '0px' }}>1</span>
                                                <span style={{ fontSize: '0.4rem', lineHeight: '0.9', marginTop: '0px', letterSpacing: '0.5px' }}>TOP</span>
                                            </div>
                                            
                                            {/* 캐릭터 이미지 */}
                                            <div 
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    marginTop: '20px',
                                                    marginBottom: '18px',
                                                    border: '3px solid #E8E0DB',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                }}
                                            >
                                                <img 
                                                    src={charImage} 
                                                    alt={charName}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                            
                                            {/* 캐릭터 이름 */}
                                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#5D4037', marginBottom: '6px', textAlign: 'center' }}>
                                                {charName}
                                            </div>
                                            
                                            {/* 태그 */}
                                            <div style={{ fontSize: '0.7rem', color: '#8D6E63', marginBottom: '10px', textAlign: 'center' }}>
                                                {characterTag}
                                            </div>
                                            
                                            {/* 통계 정보 - Chip/Tag 스타일 */}
                                            <div style={{ 
                                                display: 'inline-block',
                                                padding: '6px 12px',
                                                borderRadius: '16px',
                                                backgroundColor: '#F5F1EB',
                                                fontSize: '0.75rem',
                                                color: '#8D6E63',
                                                textAlign: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                대화 {char.chat_count}회 · 메시지 {char.message_count}개
                                            </div>
                                            
                                            {/* 평균 메시지 수 분석 (1위만) */}
                                            {(() => {
                                                const avgMessages = char.chat_count > 0 ? (char.message_count / char.chat_count).toFixed(1) : 0;
                                                return (
                                                    <div style={{ 
                                                        fontSize: '0.7rem', 
                                                        color: '#6B4E3D', 
                                                        textAlign: 'center',
                                                        marginTop: '4px',
                                                        opacity: 0.9
                                                    }}>
                                                        💬 대화당 평균 {avgMessages}개의 메시지를 주고받았어요.
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}
                                
                                {/* 2위, 3위 카드 - 가로로 나란히 */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '12px', 
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    flexWrap: 'wrap'
                                }}>
                                    {weeklyStats.top_characters.slice(1, 3).map((char, index) => {
                                        const charInfo = characterData && char.character_id ? characterData[char.character_id] : null;
                                        const charName = charInfo?.name?.split(' (')[0] || '알 수 없음';
                                        const charImage = charInfo?.image || '/default-character.png';
                                        const rank = index + 2; // 2 또는 3
                                        
                                        // 뱃지 색상 및 테두리 색상 (메탈릭 그라데이션 적용)
                                        const rankColors = {
                                            2: { 
                                                badge: 'linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%)', // 은색 메탈릭 그라데이션 (밝은 회색 -> 진한 은색)
                                                text: '#8B6F47',
                                                border: '#9E9E9E'
                                            },
                                            3: { 
                                                badge: 'linear-gradient(135deg, #DEA879 0%, #A0522D 100%)', // 동색 메탈릭 그라데이션 (밝은 구리색 -> 진한 갈색)
                                                text: '#8B5A2B',
                                                border: '#A0522D'
                                            }
                                        };
                                        
                                        const rankColor = rankColors[rank];
                                        
                                        // 캐릭터별 태그 목록 (2~3개 랜덤 선택)
                                        const getCharacterTags = (characterId) => {
                                            const characterTagsData = {
                                                'kim_shin': ['#수호신', '#운명적사랑', '#쓸쓸하고찬란하神', '#900살'],
                                                'yoo_sijin': ['#특전사대위', '#파트너', '#능글', '#플러팅'],
                                                'sun_jae': ['#구원자', '#짝사랑', '#순애보', '#첫사랑', '#톱스타'],
                                                'im_sol': ['#최애지킴이', '#인간비타민', '#무한긍정', '#소울메이트'],
                                                'jang_jaeyeol': ['#소울메이트', '#상처치유', '#인기작가', '#치유와_위로', '#지적', '#쿨함'],
                                                'yong_sik': ['#직진', '#지킴이', '#순박한_경찰', '#단순무식_솔직'],
                                                'kim_juwon': ['#츤데레', '#재벌', '#까칠한_재벌3세'],
                                                'goo_junpyo': ['#츤데레', '#순정파', '#F4리더', '#천상천하_유아독존', '#초딩'],
                                                'min_yong': ['#현실주의', '#까칠_체육쌤', '#미친개'],
                                                'young_do': ['#상처', '#반항아', '#호텔상속자', '#짠내서브', '#초딩멘탈'],
                                                'goo_dongmae': ['#집착', '#순정마초', '#낭인', '#아픈손가락', '#연정', '#후회'],
                                                'sseuregi': ['#무심다정', '#현실오빠', '#츤데레', '#경상도_츤데레'],
                                                'park_donghoon': ['#참어른', '#인생멘토', '#묵묵한_위로', '#성실', '#어른의무게', '#어른의_위로'],
                                                'oh_sangshik': ['#참리더', '#의리파_상사', '#워커홀릭', '#츤데레', '#책임감', '#직장_멘토'],
                                                'hong_banjang': ['#동네히어로', '#만능백수', '#츤데레', '#만능해결사'],
                                                'min_jeong': ['#허당', '#러블리', '#사랑스러움', '#꽈당민정', '#힐링', '#무한긍정', '#인간비타민', '#해피바이러스'],
                                                'park_saeroy': ['#신념', '#소신', '#단밤사장', '#소신과_패기', '#성장형_리더', '#밤톨머리', '#단단', '#돌덩이'],
                                                'eugene_choi': ['#이방인', '#애국심', '#합시다_러브', '#쓸쓸', '#고독'],
                                                'na_heedo': ['#무한열정', '#성장캐', '#명랑만화', '#청춘', '#꿈', '#에너지'],
                                                'kim_tan': ['#왕관의무게', '#직진', '#재벌상속자'],
                                                'go_boksu': ['#회개', '#순수영혼', '#밑바닥_인생', '#거칠지만_순수', '#진심']
                                            };
                                            
                                            const tags = characterTagsData[characterId] || ['#친구'];
                                            // 2~3개 랜덤 선택
                                            const numTags = Math.random() < 0.5 ? 2 : 3;
                                            const shuffled = [...tags].sort(() => Math.random() - 0.5);
                                            return shuffled.slice(0, Math.min(numTags, tags.length)).join(' ');
                                        };
                                        
                                        const characterTag = getCharacterTags(char.character_id);
                                        
                                        return (
                                            <div 
                                                key={char.character_id} 
                                                className="top-character-card"
                                                style={{
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '16px',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#FFFFFF',
                                                    border: `2px solid ${rankColor.border}`, // 2위/3위 카드 테두리 색상 다르게 유지
                                                    flex: '1',
                                                    maxWidth: '140px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {/* 순위 뱃지 */}
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        top: '16px',
                                                        right: 'calc(50% - 35px)',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: rankColor.badge,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#FFFFFF',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                                                        zIndex: 10,
                                                        border: '2px solid #FFFFFF',
                                                        paddingTop: '2px',
                                                        paddingBottom: '2px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.8rem', lineHeight: '1', fontWeight: 'bold', marginTop: '0px' }}>{rank}</span>
                                                    <span style={{ fontSize: '0.6rem', lineHeight: '0.9', marginTop: '0px', letterSpacing: '0.5px' }}>TOP</span>
                            </div>
                                                
                                                {/* 캐릭터 이미지 */}
                                                <div 
                                                    style={{
                                                        width: '70px',
                                                        height: '70px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        marginTop: '12px',
                                                        marginBottom: '14px',
                                                        border: '3px solid #E8E0DB',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                    }}
                                                >
                                                    <img 
                                                        src={charImage} 
                                                        alt={charName}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                            </div>
                                                
                                                {/* 캐릭터 이름 */}
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#5D4037', marginBottom: '4px', textAlign: 'center' }}>
                                                    {charName}
                                </div>
                                                
                                                {/* 태그 */}
                                                <div style={{ fontSize: '0.65rem', color: '#8D6E63', marginBottom: '8px', textAlign: 'center' }}>
                                                    {characterTag}
                                                </div>
                                                
                                                {/* 통계 정보 - Chip/Tag 스타일 (한 줄, 작은 글씨) */}
                                                <div style={{ 
                                                    display: 'inline-block',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#F5F1EB',
                                                    fontSize: '0.6rem',
                                                    color: '#8D6E63',
                                                    textAlign: 'center',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    대화 {char.chat_count}회 · 메시지 {char.message_count}개
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* 구분선 */}
                                <div style={{
                                    width: '100%',
                                    height: '1px',
                                    background: 'rgba(0, 0, 0, 0.08)',
                                    marginTop: '12px',
                                    marginBottom: '12px'
                                }}></div>
                            </div>
                            
                            {/* 총 통계 */}
                            <div className="total-stats-container" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '12px',
                                marginTop: '12px',
                                width: '100%',
                                maxWidth: '100%'
                            }}>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '10px',
                                    border: '1px solid #E8E0DB',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                        {weeklyStats?.total_chats || 0}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 대화 수</div>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '10px',
                                    border: '1px solid #E8E0DB',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                        {weeklyStats?.total_messages || 0}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 메시지 수</div>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '10px',
                                    border: '1px solid #E8E0DB',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                        {weeklyStats?.top_characters?.length || 0}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#8D6E63', lineHeight: '1.3' }}>
                                        대화한<br />캐릭터
                                    </div>
                                </div>
                            </div>
                                </>
                            )}
                            
                            {/* 총 통계 (데이터가 없을 때도 표시) */}
                            {(!weeklyStats || weeklyStats.top_characters.length === 0) && (
                                <div className="total-stats-container" style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(3, 1fr)', 
                                    gap: '12px',
                                    marginTop: '12px',
                                    width: '100%',
                                    maxWidth: '100%'
                                }}>
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '10px',
                                        border: '1px solid #E8E0DB',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                            0
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 대화 수</div>
                                    </div>
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '10px',
                                        border: '1px solid #E8E0DB',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                            0
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#8D6E63' }}>총 메시지 수</div>
                                    </div>
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '10px',
                                        border: '1px solid #E8E0DB',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#5D4037', marginBottom: '4px' }}>
                                            0
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#8D6E63', lineHeight: '1.3' }}>
                                            대화한<br />캐릭터
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Weekly Recap 박스 - 로딩 중이 아닐 때만 표시 */}
                    {!loading && onShowWeeklyRecap && (
                        <div className="weekly-recap-box" style={{ 
                            marginTop: '16px', 
                            display: 'flex', 
                            justifyContent: 'center', /* 가로 방향 중앙 정렬 */
                            alignItems: 'center', /* 세로 방향 중앙 정렬 */
                            width: '100%', /* 컨테이너는 전체 너비 */
                            boxSizing: 'border-box',
                            padding: '0' /* 패딩 제거 - 통계 카드와 동일한 너비를 위해 */
                        }}>
                            <div
                                onClick={onShowWeeklyRecap}
                                style={{
                                    padding: '16px 20px',
                                    background: 'linear-gradient(135deg, #E8DDD4 0%, #D7C5B8 50%, #C9B4A3 100%)',
                                    borderRadius: '16px',
                                    border: '2px solid #d1bdaa',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s',
                                    boxShadow: '0 4px 16px rgba(107, 78, 61, 0.3), 0 2px 6px rgba(0, 0, 0, 0.15)',
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'visible',
                                    width: 'calc(100% - 4px)', /* 통계 카드 3개 전체 폭보다 아주 살짝 작게 */
                                    maxWidth: '100%',
                                    boxSizing: 'border-box'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 78, 61, 0.4), 0 3px 8px rgba(0, 0, 0, 0.2)';
                                    e.currentTarget.style.borderColor = '#8D6E63';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #EDE1D5 0%, #DDCEC0 50%, #D0C0B0 100%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 78, 61, 0.3), 0 2px 6px rgba(0, 0, 0, 0.15)';
                                    e.currentTarget.style.borderColor = '#d1bdaa';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #E8DDD4 0%, #D7C5B8 50%, #C9B4A3 100%)';
                                }}
                            >
                                <div style={{
                                    fontSize: '1.45rem',
                                    fontWeight: '700',
                                    color: '#5D4037',
                                    letterSpacing: '1px',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    textAlign: 'center'
                                }}>
                                    Weekly Recap
                                </div>
                                <div style={{
                                    marginTop: '8px',
                                    fontSize: '0.85rem',
                                    color: '#8D6E63',
                                    opacity: 0.8,
                                    textAlign: 'center'
                                }}>
                                    주별 통계 보기
                                </div>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="#8D6E63" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    width="24" 
                                    height="24"
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0.6
                                                }}
                                            >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        </div>
                    )}
                    
                    {/* 저장한 대사 목록 - 항상 표시 */}
                    <div className="stats-quotes-list" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #E8E0DB', width: '100%' }}>
                        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#5D4037', margin: 0 }}>저장한 대사 목록</h3>
                                    </div>
                        {loading ? (
                            <div style={{ 
                                padding: '40px 20px', 
                                textAlign: 'center',
                                color: '#8D6E63',
                                fontSize: '0.95rem'
                            }}>
                                <p style={{ margin: 0, opacity: 0.7 }}>불러오는 중...</p>
                            </div>
                        ) : quotes.length === 0 ? (
                                <div style={{ 
                                    padding: '40px 20px', 
                                    textAlign: 'center',
                                    color: '#8D6E63',
                                    fontSize: '0.95rem'
                                }}>
                                    <p style={{ margin: 0, opacity: 0.7 }}>저장한 대사가 없습니다.</p>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>대화 중 마음에 드는 대사를 하트로 저장하면 여기에 표시됩니다.</p>
                                </div>
                            ) : (
                            <div className="stats-quotes-items">
                                {(() => {
                                    // 모바일일 때는 무한 스크롤, 데스크톱일 때는 페이지네이션
                                    const currentQuotes = isMobile 
                                        ? quotes.slice(0, visibleQuotesCount)
                                        : (() => {
                                            const totalPages = Math.ceil(quotes.length / quotesPerPage);
                                            const startIndex = (currentQuotePage - 1) * quotesPerPage;
                                            const endIndex = startIndex + quotesPerPage;
                                            return quotes.slice(startIndex, endIndex);
                                        })();
                                    
                                    return (
                                        <>
                                            {currentQuotes.map((quote) => {
                                    const charIds = quote.character_ids || [];
                                    const charInfo = charIds.length > 0 ? characterData[charIds[0]] : null;
                                    const charName = charInfo?.name.split(' (')[0] || '알 수 없음';
                                    const charImage = charInfo?.image || '/default-character.png';
                                    const quoteText = quote.message?.text || (typeof quote.message === 'string' ? quote.message : '');
                                    const date = quote.updated_at || quote.created_at || '';
                                    const messageId = quote.message_id || (quote.message?.id || (typeof quote.message === 'object' ? quote.message?.id : null));
                                    const fullChatHistoryId = quote.full_chat_history_id || null;
                                            
                                            return (
                                                <div 
                                            key={quote.id} 
                                            className="stats-quote-item"
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                gap: '12px',
                                                padding: '12px', 
                                                border: '1px solid #E8E0DB', 
                                                borderRadius: '8px', 
                                                marginBottom: '8px', 
                                                backgroundColor: '#FFFFFF'
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                border: '2px solid #E8E0DB'
                                            }}>
                                                <img 
                                                    src={charImage} 
                                                    alt={charName}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, position: 'relative', paddingRight: '8px' }}>
                                                {/* 캐릭터 이름과 날짜를 같은 줄에 배치 */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '4px' 
                                                }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#5D4037' }}>
                                                        {charName}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '0.75rem', 
                                                        color: '#b7a38f', 
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {formatDate(date)}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#3E2723', lineHeight: '1.6', marginBottom: '8px', paddingBottom: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>
                                                    {quoteText}
                                                    </div>
                                                {/* Footer - 버튼들만 배치 */}
                                                <div style={{ 
                                                    paddingTop: '8px',
                                                    marginTop: '6px',
                                                    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-start', // 왼쪽 정렬로 변경
                                                    gap: '8px',
                                                    padding: '6px 4px 6px 4px'
                                                }}>
                                                    {/* 카메라 아이콘 (포토카드 만들기) */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPhotocard({ 
                                                                quote: { text: quoteText, date: date }, 
                                                                character: charInfo 
                                                            });
                                                        }}
                                                        style={{
                                                            padding: '4px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            margin: 0,
                                                            color: '#8D6E63'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1.1)';
                                                            e.currentTarget.style.color = '#6B4E3D';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                            e.currentTarget.style.color = '#8D6E63';
                                                        }}
                                                        title="포토카드 만들기"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 19V8a2 2 0 0 0-2-2h-4l-2-3H9L7 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"></path>
                                                            <circle cx="11.0" cy="13" r="4"></circle>
                                                        </svg>
                                                    </button>
                                                    {/* 전체 맥락 열람하기 버튼 */}
                                                    <button 
                                                    onClick={async (e) => {
                                                                e.stopPropagation();
                                                        // 해당 대사가 포함된 전체 대화 찾기
                                                        try {
                                                            console.log('=== 전체 대화 찾기 시작 ===');
                                                            console.log('Quote object:', quote);
                                                            console.log('messageId:', messageId);
                                                            console.log('fullChatHistoryId:', fullChatHistoryId);
                                                            console.log('quoteText:', quoteText);
                                                            
                                                            // 전체 대화 찾기: 모든 히스토리 가져오기 (보관함용 + 자동 저장용 모두)
                                                            const allHistoriesResponse = await fetch(`${API_BASE_URL}/chat/histories/all`, {
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`
                                                                }
                                                            });
                                                            let allHistories = [];
                                                            if (allHistoriesResponse.ok) {
                                                                const allData = await allHistoriesResponse.json();
                                                                allHistories = allData.histories || allData;
                                                                } else {
                                                                // fallback: 기존 API 사용
                                                                const allHistoriesData = await api.getChatHistories();
                                                                allHistories = allHistoriesData.histories || allHistoriesData;
                                                            }
                                                            console.log('Total histories count:', allHistories?.length || 0);
                                                            
                                                            let fullChat = null;
                                                            
                                                            // 하트로 저장된 대화 또는 "서버에 저장" 버튼으로 저장한 대화 찾기 (is_manual = 1, is_manual_quote = 0)
                                                            if (Array.isArray(allHistories) && quoteText) {
                                                                console.log('Searching for saved chat with text:', quoteText.substring(0, 50));
                                                                fullChat = allHistories.find(h => {
                                                                    try {
                                                                        const msgs = typeof h.messages === 'string' ? JSON.parse(h.messages) : (h.messages || []);
                                                                        const isManual = (h.is_manual === 1 || h.is_manual === true);
                                                                        const isNotQuote = (h.is_manual_quote === 0 || h.is_manual_quote === false || h.is_manual_quote === null || h.is_manual_quote === undefined);
                                                                        const hasMultipleMsgs = msgs.length > 1;
                                                                        const hasMatchingText = msgs.some(m => {
                                                                            const msgText = typeof m === 'string' ? JSON.parse(m).text : (m.text || '');
                                                                            return msgText === quoteText || msgText.trim() === quoteText.trim();
                                                                        });
                                                                        
                                                                        const match = isManual && isNotQuote && hasMultipleMsgs && hasMatchingText;
                                                                        if (match) {
                                                                            console.log('✅ Found saved chat:', {
                                                                                id: h.id,
                                                                                title: h.title,
                                                                                msg_count: msgs.length
                                                                            });
                                                                        }
                                                                        return match;
                                                                    } catch (err) {
                                                                        console.error('Error in saved chat search:', err);
                                                                        return false;
                                                                    }
                                                                });
                                                                console.log('Search result:', fullChat ? '✅ Found' : '❌ Not found');
                                                            }
                                                            
                                                            if (fullChat && onLoadChat) {
                                                                console.log('✅ 전체 대화를 찾았습니다. 불러오는 중...');
                                                                // 대화 불러오기
                                                                onLoadChat(fullChat, quoteText);
                                                                onClose();
                                                                } else {
                                                                console.error('❌ 전체 대화를 찾을 수 없습니다.', {
                                                                    quote_id: quote.id,
                                                                    message_id: messageId,
                                                                    quoteText: quoteText?.substring(0, 50),
                                                                    histories_sample: allHistories?.slice(0, 3).map(h => ({
                                                                        id: h.id,
                                                                        is_manual: h.is_manual,
                                                                        is_manual_quote: h.is_manual_quote,
                                                                        msg_count: typeof h.messages === 'string' ? JSON.parse(h.messages).length : (h.messages?.length || 0)
                                                                    }))
                                                                });
                                                                alert('이 대사가 포함된 전체 대화를 찾을 수 없습니다.\n\n대화 흐름을 추적하려면 먼저 대화창에서 대사를 하트로 저장하거나 "서버에 저장" 버튼을 눌러 전체 대화를 저장해주세요.');
                                                            }
                                                        } catch (error) {
                                                            console.error('대화 불러오기 오류:', error);
                                                            alert('대화를 불러오는 중 오류가 발생했습니다: ' + error.message);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '8px 12px', /* 세로 패딩 증가 (6px -> 8px) */
                                                        fontSize: '0.7rem',
                                                        color: '#8D6E63',
                                                        background: '#F5F1EB',
                                                        border: '1px solid #E8E0DB',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center', /* 수직 중앙 정렬 */
                                                        justifyContent: 'center', /* 내부 요소 중앙 정렬 */
                                                        gap: '4px',
                                                        fontWeight: '500',
                                                        flexShrink: 0,
                                                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                                                        margin: 0, /* 마진 제거 */
                                                        lineHeight: 'normal' /* 버튼 내부 텍스트 중앙 정렬을 위해 normal로 설정 */
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#E8E0DB';
                                                        e.currentTarget.style.color = '#5D4037';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = '#F5F1EB';
                                                        e.currentTarget.style.color = '#8D6E63';
                                                    }}
                                                >
                                                    대화 흐름 추적하기
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{ marginLeft: '2px' }}>
                                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                                    </svg>
                                                </button>
                                                        </div>
                                                    </div>
                                                    <button 
                                                className="stats-quote-delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                    handleDelete(quote.id);
                                                        }}
                                                        title="삭제"
                                                style={{ 
                                                    background: 'transparent', 
                                                    border: 'none', 
                                                    cursor: 'pointer', 
                                                    padding: '4px',
                                                    color: '#D32F2F', /* 내 대화 보관함과 동일한 빨간색 */
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    alignSelf: 'flex-start',
                                                    transition: 'all 0.2s', /* 내 대화 보관함과 동일한 transition */
                                                    width: 'auto',
                                                    height: 'auto',
                                                    zIndex: 1
                                                }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                            
                                            {/* 무한 스크롤 트리거 (모바일 전용) */}
                                            {isMobile && visibleQuotesCount < quotes.length && (
                                                <div ref={loadMoreRef} style={{ 
                                                    height: '20px', 
                                                    marginTop: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#8D6E63',
                                                        opacity: 0.6
                                                    }}>
                                                        불러오는 중...
                                                    </div>
                                                </div>
                                            )}

                                            {/* 페이지네이션 (데스크톱 전용) */}
                                            {(() => {
                                                if (isMobile) return null; // 모바일에서는 페이지네이션 숨김
                                                const totalPages = Math.ceil(quotes.length / quotesPerPage);
                                                return totalPages > 1 ? (
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginTop: '20px',
                                                        paddingTop: '16px',
                                                        borderTop: '1px solid #E8E0DB'
                                                    }}>
                                                        <button
                                                            onClick={() => setCurrentQuotePage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentQuotePage === 1}
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '0.85rem',
                                                                color: currentQuotePage === 1 ? '#BDBDBD' : '#8D6E63',
                                                                background: currentQuotePage === 1 ? '#F5F5F5' : '#FFFFFF',
                                                                border: `1px solid ${currentQuotePage === 1 ? '#E0E0E0' : '#E8E0DB'}`,
                                                                borderRadius: '6px',
                                                                cursor: currentQuotePage === 1 ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            &lt;
                                                        </button>
                                                        
                                                        {(() => {
                                                            // 현재 페이지 주변 3개만 표시
                                                            const pagesToShow = [];
                                                            const maxPagesToShow = 3;
                                                            let startPage = Math.max(1, currentQuotePage - Math.floor(maxPagesToShow / 2));
                                                            let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                                                            
                                                            // 끝에서 시작하는 경우 조정
                                                            if (endPage - startPage < maxPagesToShow - 1) {
                                                                startPage = Math.max(1, endPage - maxPagesToShow + 1);
                                                            }
                                                            
                                                            for (let i = startPage; i <= endPage; i++) {
                                                                pagesToShow.push(i);
                                                            }
                                                            
                                                            return pagesToShow.map((pageNum) => (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => setCurrentQuotePage(pageNum)}
                                                                    style={{
                                                                        minWidth: '32px',
                                                                        height: '32px',
                                                                        padding: '0 8px',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: currentQuotePage === pageNum ? '600' : '400',
                                                                        color: currentQuotePage === pageNum ? '#FFFFFF' : '#8D6E63',
                                                                        background: currentQuotePage === pageNum ? '#8D6E63' : '#FFFFFF',
                                                                        border: `1px solid ${currentQuotePage === pageNum ? '#8D6E63' : '#E8E0DB'}`,
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            ));
                                                        })()}
                                                        
                                                        <button
                                                            onClick={() => setCurrentQuotePage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentQuotePage === totalPages}
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '0.85rem',
                                                                color: currentQuotePage === totalPages ? '#BDBDBD' : '#8D6E63',
                                                                background: currentQuotePage === totalPages ? '#F5F5F5' : '#FFFFFF',
                                                                border: `1px solid ${currentQuotePage === totalPages ? '#E0E0E0' : '#E8E0DB'}`,
                                                                borderRadius: '6px',
                                                                cursor: currentQuotePage === totalPages ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            &gt;
                                    </button>
                                </div>
                                                ) : null;
                                            })()}
                        </>
                                    );
                                })()}
                            </div>
                    )}
                    </div>
                </div>
            </div>
            
            {/* 포토카드 모달 */}
            {selectedPhotocard && (
                <PhotocardModal
                    quote={selectedPhotocard.quote}
                    character={selectedPhotocard.character}
                    onClose={() => setSelectedPhotocard(null)}
                />
            )}
        </div>
    );
};

