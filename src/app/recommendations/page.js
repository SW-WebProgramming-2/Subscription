'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecommedPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRecommendationData();
    }, []);

    const fetchRecommendationData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: '',
                    userId: '1'
                })
            });

            if (!response.ok) {
                throw new Error('데이터를 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            
            if (data.success) {
                setCategories(data.categories || []);
                setRecommendations(data.recommendations || []);
            } else {
                throw new Error(data.error || '데이터 처리 중 오류가 발생했습니다.');
            }
        } catch (err) {
            console.error('추천 데이터 로딩 오류:', err);
            setError(err.message);
        } finally {
            setLoading(false);
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

            {/* 본문 영역 */}
            <main style={{
                flex: 1,
                padding: '2rem',
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto'
            }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        데이터를 불러오는 중...
                    </div>
                )}

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '2rem',
                        color: '#dc2626'
                    }}>
                        오류: {error}
                        <button
                            onClick={fetchRecommendationData}
                            style={{
                                marginLeft: '1rem',
                                padding: '0.5rem 1rem',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* 카테고리 분석 섹션 */}
                        <section style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            marginBottom: '2rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                                color: '#1f2937'
                            }}>
                                카테고리 분석
                            </h2>
                            
                            {categories.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {categories.map((item, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: '#f9fafb',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                                                    {item.label}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                    {item.count}개 서비스
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '600', color: '#667eea', marginBottom: '0.25rem' }}>
                                                    {item.percentage}%
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                    월 {item.price.toLocaleString()}원
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                                    분석할 카테고리 데이터가 없습니다.
                                </div>
                            )}
                        </section>

                        {/* 추천 구독 서비스 섹션 */}
                        <section style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            marginBottom: '2rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                                color: '#1f2937'
                            }}>
                                추천 구독 서비스
                            </h2>
                            
                            {recommendations.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {recommendations.map((rec, index) => (
                                        <div key={index} style={{
                                            padding: '1.5rem',
                                            background: '#f9fafb',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{
                                                fontSize: '1.125rem',
                                                fontWeight: '600',
                                                color: '#1f2937',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {rec.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginBottom: '0.75rem'
                                            }}>
                                                {rec.description}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: '1rem',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid #e5e7eb'
                                            }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    background: '#667eea',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {rec.category}
                                                </span>
                                                <span style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    color: '#1f2937'
                                                }}>
                                                    월 {rec.price.toLocaleString()}원
                                                </span>
                                            </div>
                                            {rec.reason && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#9ca3af',
                                                    marginTop: '0.5rem',
                                                    fontStyle: 'italic'
                                                }}>
                                                    {rec.reason}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                                    추천할 구독 서비스가 없습니다.
                                </div>
                            )}
                        </section>

                        {/* 설문 기반 개인 선호도 그래프 영역 */}
                        <section style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            marginBottom: '2rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                                color: '#1f2937'
                            }}>
                                설문 기반 개인 선호도
                            </h2>
                            <div style={{
                                minHeight: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '2px dashed #d1d5db',
                                color: '#9ca3af',
                                fontSize: '1.125rem'
                            }}>
                                그래프가 들어갈 자리
                            </div>
                        </section>

                        {/* QnA 페이지 이동 버튼 */}
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button
                                onClick={() => router.push('/questions')}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
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
                                AI 질문하러 가기
                            </button>
                        </div>
                    </>
                )}
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