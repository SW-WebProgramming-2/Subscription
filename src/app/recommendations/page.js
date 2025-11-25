'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function RecommedPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [preferenceData, setPreferenceData] = useState(null);

    useEffect(() => {
        fetchRecommendationData();
        calculatePreferenceData();
    }, []);

    // 설문 결과를 기반으로 선호도 계산
    const calculatePreferenceData = () => {
        // 설문 데이터 조회 로직 (Django DB 미구현 상태이므로 주석 처리)
        /*
        try {
            const response = await fetch('/api/survey/get', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('설문 데이터를 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            if (data.success && data.surveyData) {
                const preferences = calculatePreferences(data.surveyData.answers);
                setPreferenceData(preferences);
            }
        } catch (error) {
            console.error('설문 데이터 로딩 오류:', error);
            // 오류 발생 시 더미 데이터 사용
            setPreferenceData(getDummyPreferenceData());
        }
        */

        // 임시로 로컬 스토리지에서 가져오기
        try {
            const savedData = localStorage.getItem('surveyAnswers');
            if (savedData) {
                const surveyData = JSON.parse(savedData);
                const preferences = calculatePreferences(surveyData.answers);
                setPreferenceData(preferences);
            } else {
                // 설문 데이터가 없으면 더미 데이터 사용
                setPreferenceData(getDummyPreferenceData());
            }
        } catch (error) {
            console.error('설문 데이터 로딩 오류:', error);
            setPreferenceData(getDummyPreferenceData());
        }
    };

    // 설문 답변을 기반으로 선호도 계산
    const calculatePreferences = (answers) => {
        const categoryMapping = {
            '스트리밍': 'streaming_preference',
            '음악': 'music_preference',
            '소프트웨어': 'software_preference',
            '게임': 'game_preference',
            '클라우드': 'cloud_preference',
            '뉴스/잡지': 'news_preference',
            '피트니스': 'fitness_preference',
            '교육': 'education_preference',
            '기타': 'preferred_category'
        };

        const preferenceScores = {
            '매우 높음': 5,
            '높음': 4,
            '보통': 3,
            '낮음': 2,
            '매우 낮음': 1
        };

        const preferences = {};
        const categories = Object.keys(categoryMapping);

        categories.forEach(category => {
            const questionId = categoryMapping[category];
            if (answers[questionId]) {
                const answer = answers[questionId];
                if (preferenceScores[answer] !== undefined) {
                    preferences[category] = preferenceScores[answer];
                } else if (answer === category) {
                    // preferred_category 질문의 경우
                    preferences[category] = 5;
                } else {
                    preferences[category] = 3; // 기본값
                }
            } else {
                preferences[category] = 3; // 기본값
            }
        });

        return preferences;
    };

    // 더미 선호도 데이터 생성
    const getDummyPreferenceData = () => {
        return {
            '스트리밍': 4,
            '음악': 3,
            '소프트웨어': 4,
            '게임': 2,
            '클라우드': 3,
            '뉴스/잡지': 2,
            '피트니스': 3,
            '교육': 4,
            '기타': 2
        };
    };

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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1.5rem',
                                    color: '#1f2937'
                                }}>
                                    설문 기반 개인 선호도
                                </h2>
                                <a
                                    href="/survey"
                                    style={{
                                        color: '#667eea',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        marginTop: '1rem'
                                    }}
                                >
                                    설문조사 참여하기 →
                                </a>
                            </div>

                            {preferenceData ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '2rem',
                                    marginBottom: '2rem'
                                }}>
                                    {/* 바 차트 */}
                                    <div>
                                        <h3 style={{
                                            fontSize: '1.125rem',
                                            fontWeight: '600',
                                            marginBottom: '1rem',
                                            color: '#1f2937'
                                        }}>
                                            카테고리별 선호도
                                        </h3>
                                        <div style={{ height: '300px' }}>
                                            <Bar
                                                data={{
                                                    labels: Object.keys(preferenceData),
                                                    datasets: [{
                                                        label: '선호도 점수',
                                                        data: Object.values(preferenceData),
                                                        backgroundColor: [
                                                            'rgba(102, 126, 234, 0.8)',
                                                            'rgba(118, 75, 162, 0.8)',
                                                            'rgba(59, 130, 246, 0.8)',
                                                            'rgba(16, 185, 129, 0.8)',
                                                            'rgba(245, 158, 11, 0.8)',
                                                            'rgba(239, 68, 68, 0.8)',
                                                            'rgba(139, 92, 246, 0.8)',
                                                            'rgba(236, 72, 153, 0.8)',
                                                            'rgba(34, 197, 94, 0.8)'
                                                        ],
                                                        borderColor: [
                                                            'rgba(102, 126, 234, 1)',
                                                            'rgba(118, 75, 162, 1)',
                                                            'rgba(59, 130, 246, 1)',
                                                            'rgba(16, 185, 129, 1)',
                                                            'rgba(245, 158, 11, 1)',
                                                            'rgba(239, 68, 68, 1)',
                                                            'rgba(139, 92, 246, 1)',
                                                            'rgba(236, 72, 153, 1)',
                                                            'rgba(34, 197, 94, 1)'
                                                        ],
                                                        borderWidth: 1
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: function(context) {
                                                                    const score = context.parsed.y;
                                                                    const labels = ['매우 낮음', '낮음', '보통', '높음', '매우 높음'];
                                                                    return `선호도: ${labels[score - 1]} (${score}/5)`;
                                                                }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 5,
                                                            ticks: {
                                                                stepSize: 1,
                                                                callback: function(value) {
                                                                    const labels = ['', '매우 낮음', '낮음', '보통', '높음', '매우 높음'];
                                                                    return labels[value] || '';
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* 도넛 차트 */}
                                    <div>
                                        <h3 style={{
                                            fontSize: '1.125rem',
                                            fontWeight: '600',
                                            marginBottom: '1rem',
                                            color: '#1f2937'
                                        }}>
                                            선호도 분포
                                        </h3>
                                        <div style={{ height: '300px' }}>
                                            <Doughnut
                                                data={{
                                                    labels: Object.keys(preferenceData),
                                                    datasets: [{
                                                        label: '선호도 점수',
                                                        data: Object.values(preferenceData),
                                                        backgroundColor: [
                                                            'rgba(102, 126, 234, 0.8)',
                                                            'rgba(118, 75, 162, 0.8)',
                                                            'rgba(59, 130, 246, 0.8)',
                                                            'rgba(16, 185, 129, 0.8)',
                                                            'rgba(245, 158, 11, 0.8)',
                                                            'rgba(239, 68, 68, 0.8)',
                                                            'rgba(139, 92, 246, 0.8)',
                                                            'rgba(236, 72, 153, 0.8)',
                                                            'rgba(34, 197, 94, 0.8)'
                                                        ],
                                                        borderColor: [
                                                            'rgba(102, 126, 234, 1)',
                                                            'rgba(118, 75, 162, 1)',
                                                            'rgba(59, 130, 246, 1)',
                                                            'rgba(16, 185, 129, 1)',
                                                            'rgba(245, 158, 11, 1)',
                                                            'rgba(239, 68, 68, 1)',
                                                            'rgba(139, 92, 246, 1)',
                                                            'rgba(236, 72, 153, 1)',
                                                            'rgba(34, 197, 94, 1)'
                                                        ],
                                                        borderWidth: 2
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'right',
                                                            labels: {
                                                                boxWidth: 12,
                                                                padding: 10,
                                                                font: {
                                                                    size: 11
                                                                }
                                                            }
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: function(context) {
                                                                    const score = context.parsed;
                                                                    const labels = ['매우 낮음', '낮음', '보통', '높음', '매우 높음'];
                                                                    return `${context.label}: ${labels[score - 1]} (${score}/5)`;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    minHeight: '300px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '2px dashed #d1d5db',
                                    color: '#9ca3af',
                                    fontSize: '1.125rem',
                                    padding: '2rem'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                                    <div style={{ marginBottom: '0.5rem' }}>설문 데이터가 없습니다.</div>
                                </div>
                            )}
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