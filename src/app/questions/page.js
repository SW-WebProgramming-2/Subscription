'use client';

import { useState, useRef, useEffect } from 'react';

export default function QnAPage() {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!question.trim() || loading) return;

        const userQuestion = question.trim();
        setQuestion('');
        setLoading(true);
        setError(null);

        // 사용자 메시지 추가
        const userMessage = {
            type: 'user',
            text: userQuestion,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // 대화 히스토리 구성 (API 요청용)
        const conversationHistory = messages
            .filter(msg => msg.type === 'user' || msg.type === 'ai')
            .map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                text: msg.text
            }));

        try {
            const response = await fetch('/api/gemini/qna', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: userQuestion,
                    userId: '1',
                    conversationHistory: conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error('질문 처리에 실패했습니다.');
            }

            const data = await response.json();

            if (data.success) {
                // AI 답변 추가 (JSON 부분 제거)
                let answerText = data.answer || '답변을 생성할 수 없습니다.';
                
                // JSON 블록 제거 (사용자에게는 보이지 않도록)
                answerText = answerText.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
                answerText = answerText.replace(/\{[\s\S]*"recommendations"[\s\S]*\}/g, '').trim();
                
                const aiMessage = {
                    type: 'ai',
                    text: answerText,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);

                // 추천 서비스 업데이트 (모든 대화에서 추천된 서비스를 누적하여 표시)
                if (data.recommendations && data.recommendations.length > 0) {
                    setRecommendations(prev => {
                        // 기존 추천 서비스와 새 추천 서비스를 합치되, 중복 제거 (이름 기준)
                        const existingNames = new Set(prev.map(rec => rec.name.toLowerCase()));
                        const newRecommendations = data.recommendations.filter(
                            rec => !existingNames.has(rec.name.toLowerCase())
                        );
                        return [...prev, ...newRecommendations];
                    });
                }
            } else {
                throw new Error(data.error || '답변 생성 중 오류가 발생했습니다.');
            }
        } catch (err) {
            console.error('QnA 오류:', err);
            setError(err.message);
            
            // 오류 메시지 추가
            const errorMessage = {
                type: 'ai',
                text: `죄송합니다. 질문에 대한 답변을 생성하는 중 오류가 발생했습니다.`,
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* 네비게이션 바 */}
            <nav style={{
                background: 'white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                padding: '0 2rem',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                    }}>
                        S
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>SubManager</span>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>구독 조회</a>
                    <a href="/recommendations" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>AI 추천</a>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{
                        background: 'transparent',
                        color: '#6b7280',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}>
                        로그인
                    </button>
                    <button style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}>
                        회원가입
                    </button>
                </div>
            </nav>

            {/* 본문 영역 - 좌우 2분할 레이아웃 */}
            <main style={{
                flex: 1,
                display: 'flex',
                gap: '1rem',
                padding: '2rem',
                maxWidth: '1400px',
                width: '100%',
                margin: '0 auto',
                height: 'calc(100vh - 70px - 200px)'
            }}>
                {/* 왼쪽 영역 - 추천 결과 요약 */}
                <aside style={{
                    width: '350px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        color: '#1f2937'
                    }}>
                        추천 구독 서비스 목록
                    </h2>
                    
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        {recommendations.length > 0 ? (
                            recommendations.map((rec, index) => (
                                <div key={index} style={{
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                >
                                    <div style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {rec.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: '#6b7280',
                                        marginBottom: '0.5rem',
                                        lineHeight: 1.5
                                    }}>
                                        {rec.description}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '0.75rem',
                                        paddingTop: '0.75rem',
                                        borderTop: '1px solid #e5e7eb'
                                    }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#667eea',
                                            color: 'white',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500'
                                        }}>
                                            {rec.category}
                                        </span>
                                        <span style={{
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: '#1f2937'
                                        }}>
                                            월 {rec.price.toLocaleString()}원
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                color: '#9ca3af',
                                textAlign: 'center',
                                padding: '2rem',
                                fontSize: '0.875rem'
                            }}>
                                질문 하시면 AI가 추천 서비스를 제공합니다.
                            </div>
                        )}
                    </div>
                </aside>

                {/* 오른쪽 영역 - AI QnA 공간 */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    {/* 상단 - 채팅 메시지 표시 영역 */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        background: '#f9fafb'
                    }}>
                        {messages.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                color: '#9ca3af',
                                padding: '3rem',
                                fontSize: '0.875rem'
                            }}>
                                질문을 입력하고 AI에게 물어보세요!
                            </div>
                        )}
                        
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                <div style={{
                                    maxWidth: '70%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: msg.type === 'user' 
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : msg.isError
                                        ? '#fee2e2'
                                        : 'white',
                                    color: msg.type === 'user' 
                                        ? 'white'
                                        : msg.isError
                                        ? '#dc2626'
                                        : '#1f2937',
                                    boxShadow: msg.type === 'user' 
                                        ? '0 2px 4px rgba(102, 126, 234, 0.2)'
                                        : '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.6
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        
                        {loading && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start'
                            }}>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: 'white',
                                    color: '#6b7280',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                                }}>
                                    답변을 생성하는 중...
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 하단 - 입력창 영역 */}
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid #e5e7eb',
                        background: 'white'
                    }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
                            <textarea
                                ref={textareaRef}
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="질문을 입력해주세요..."
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    minHeight: '60px',
                                    maxHeight: '120px',
                                    outline: 'none'
                                }}
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={!question.trim() || loading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: loading || !question.trim()
                                        ? '#d1d5db'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                                    transition: 'opacity 0.2s',
                                    alignSelf: 'flex-end'
                                }}
                            >
                                전송
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* 푸터 */}
            <footer style={{
                background: '#1f2937',
                color: 'white',
                padding: '3rem 2rem 2rem 2rem',
                marginTop: '4rem'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        gap: '3rem',
                        marginBottom: '2rem'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem'
                                }}>
                                    S
                                </div>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SubManager</span>
                            </div>
                            <p style={{ color: '#d1d5db', lineHeight: 1.6, marginBottom: '2rem' }}>
                                모든 구독 서비스를 한 곳에서 관리하고, 스마트한 소비를 위한 AI 추천 서비스를 제공합니다.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {['📘', '🐦', '📷', '💼'].map((icon, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        background: '#374151',
                                        borderRadius: '50%',
                                        cursor: 'pointer'
                                    }}>
                                        {icon}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>서비스</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {['구독 관리', '대시보드', 'AI 추천', '지출 분석'].map((item, index) => (
                                    <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>지원</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {['도움말', '자주 묻는 질문', '문의하기', '서비스 상태'].map((item, index) => (
                                    <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>법적 정보</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {['개인정보처리방침', '이용약관', '쿠키 정책', '보안'].map((item, index) => (
                                    <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        borderTop: '1px solid #374151',
                        paddingTop: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <p style={{ margin: '0.25rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                                &copy; 2024 SubManager. All rights reserved.
                            </p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                                구독 관리 서비스로 스마트한 소비를 시작하세요.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { icon: '🔒', text: 'SSL 보안' },
                                { icon: '🛡️', text: '데이터 보호' },
                                { icon: '⚡', text: '빠른 처리' }
                            ].map((badge, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: '#374151',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    color: '#d1d5db'
                                }}>
                                    <span>{badge.icon}</span>
                                    <span>{badge.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}