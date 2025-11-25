'use client';

import { useState } from 'react';
import { RECOMMENDATION_DATABASE } from '../api/gemini/recommend.js';

export default function survey() {
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 설문 문항 정의
    const questions = [
        {
            id: 'preferred_category',
            question: '가장 선호하는 구독 서비스 카테고리는 무엇인가요?',
            options: Object.keys(RECOMMENDATION_DATABASE),
            type: 'single'
        },
        {
            id: 'monthly_budget',
            question: '월 구독료 예산은 얼마인가요?',
            options: ['10,000원 이하', '10,000원 ~ 30,000원', '30,000원 ~ 50,000원', '50,000원 ~ 100,000원', '100,000원 이상'],
            type: 'single'
        },
        {
            id: 'streaming_preference',
            question: '스트리밍 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        },
        {
            id: 'music_preference',
            question: '음악 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        },
        {
            id: 'software_preference',
            question: '소프트웨어 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        },
        {
            id: 'game_preference',
            question: '게임 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        },
        {
            id: 'cloud_preference',
            question: '클라우드 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        },
        {
            id: 'news_preference',
            question: '뉴스/잡지 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        },
        {
            id: 'fitness_preference',
            question: '피트니스 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        },
        {
            id: 'education_preference',
            question: '교육 서비스에 대한 선호도는 어떠신가요?',
            options: ['매우 높음', '높음', '보통', '낮음', '매우 낮음'],
            type: 'single'
        }
    ];

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 모든 질문에 답변했는지 확인
        const allAnswered = questions.every(q => answers[q.id]);
        if (!allAnswered) {
            alert('모든 질문에 답변해주세요.');
            return;
        }

        // 설문 데이터 저장 로직 (Django DB 미구현 상태이므로 주석 처리)
        /*
        try {
            const response = await fetch('/api/survey/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: '1', // 실제로는 인증된 사용자 ID 사용
                    answers: answers,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('설문 저장에 실패했습니다.');
            }

            const data = await response.json();
            if (data.success) {
                setIsSubmitted(true);
            } else {
                throw new Error(data.error || '설문 저장 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('설문 저장 오류:', error);
            alert('설문 저장 중 오류가 발생했습니다: ' + error.message);
        }
        */

        // 임시로 로컬 스토리지에 저장
        try {
            localStorage.setItem('surveyAnswers', JSON.stringify({
                answers: answers,
                timestamp: new Date().toISOString()
            }));
            setIsSubmitted(true);
        } catch (error) {
            console.error('로컬 스토리지 저장 오류:', error);
            alert('설문 저장 중 오류가 발생했습니다.');
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

            {/* 설문조사 본문 */}
            {isSubmitted ? (
                /* 완료 메시지 */
                <main style={{
                    flex: 1,
                    padding: '2rem',
                    maxWidth: '800px',
                    width: '100%',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '3rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: '1rem'
                        }}>✅</div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem',
                            color: '#1f2937'
                        }}>
                            설문이 완료되었습니다!
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '2rem'
                        }}>
                            감사합니다. 설문 결과는 AI 추천 페이지에서 확인하실 수 있습니다.
                        </p>
                        <a
                            href="/recommendations"
                            style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
                            }}
                        >
                            AI 추천 페이지로 이동
                        </a>
                    </div>
                </main>
            ) : (
                <main style={{
                    flex: 1,
                    padding: '2rem',
                    maxWidth: '800px',
                    width: '100%',
                    margin: '0 auto'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        marginBottom: '2rem'
                    }}>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            color: '#1f2937'
                        }}>
                            구독 서비스 선호도 설문조사
                        </h1>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '2rem'
                        }}>
                            여러분의 구독 서비스 선호도를 파악하여 더 나은 추천을 제공하기 위한 설문입니다.
                        </p>

                        <form onSubmit={handleSubmit}>
                            {questions.map((q, index) => (
                                <div key={q.id} style={{
                                    marginBottom: '2rem',
                                    padding: '1.5rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{
                                        fontSize: '1.125rem',
                                        fontWeight: '600',
                                        marginBottom: '1rem',
                                        color: '#1f2937'
                                    }}>
                                        {index + 1}. {q.question}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}>
                                        {q.options.map((option) => (
                                            <label key={option} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '0.75rem',
                                                background: answers[q.id] === option ? '#ede9fe' : 'white',
                                                borderRadius: '6px',
                                                border: `2px solid ${answers[q.id] === option ? '#667eea' : '#e5e7eb'}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}>
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value={option}
                                                    checked={answers[q.id] === option}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    style={{
                                                        marginRight: '0.75rem',
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                <span style={{
                                                    color: '#1f2937',
                                                    fontSize: '0.95rem'
                                                }}>
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '1rem',
                                marginTop: '2rem'
                            }}>
                                <button
                                    type="submit"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.3)';
                                    }}
                                >
                                    설문 제출하기
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            )}

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
