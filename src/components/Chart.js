'use client';

import { useState } from 'react';
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
import styles from './Chart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Chart({ data = [], preferences = null }) {
  const [chartType] = useState('category');

  // 카테고리 색상 매핑 (AI 추천 페이지와 동일한 색상 팔레트 사용)
  const getCategoryColor = (category) => {
    // 영어 카테고리를 한글로 변환
    const categoryMapping = {
      'streaming': '스트리밍',
      'music': '음악',
      'software': '소프트웨어',
      'cloud': '클라우드',
      'gaming': '게임',
      'game': '게임',
      'news': '뉴스/잡지',
      'fitness': '피트니스',
      'education': '교육',
      'other': '기타',
      'OTT': '스트리밍',
      '도구': '소프트웨어',
      '뉴스': '뉴스/잡지'
    };
    
    const normalizedCategory = categoryMapping[category] || category;
    
    const colorMap = {
      '스트리밍': { bg: 'rgba(102, 126, 234, 0.8)', border: 'rgba(102, 126, 234, 1)' },
      'OTT': { bg: 'rgba(102, 126, 234, 0.8)', border: 'rgba(102, 126, 234, 1)' },
      '음악': { bg: 'rgba(118, 75, 162, 0.8)', border: 'rgba(118, 75, 162, 1)' },
      '게임': { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
      '뉴스/잡지': { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgba(16, 185, 129, 1)' },
      '뉴스': { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgba(16, 185, 129, 1)' },
      '소프트웨어': { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' },
      '도구': { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' },
      '클라우드': { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgba(139, 92, 246, 1)' },
      '피트니스': { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 1)' },
      '교육': { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)' },
      '기타': { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)' }
    };
    
    return colorMap[normalizedCategory] || { bg: 'rgba(102, 126, 234, 0.8)', border: 'rgba(102, 126, 234, 1)' };
  };

  // 카테고리별 데이터 처리 (이미 필터링된 이번 달 구독 데이터 사용)
  const getCategoryData = () => {
    const categoryMap = {};

    // 설문 카테고리와 구독 카테고리 매핑
    const surveyCategoryMap = {
      'OTT': '스트리밍',
      '음악': '음악',
      '게임': '게임',
      '뉴스': '뉴스/잡지',
      '도구': '소프트웨어',
      '기타': '기타',
    };

    // data는 이미 메인 페이지에서 이번 달에 결제 예정인 구독만 필터링되어 전달됨
    data.forEach(subscription => {
      const category = subscription.category || '기타';
      if (!categoryMap[category]) {
        const colorInfo = getCategoryColor(category);
        categoryMap[category] = {
          total: 0,
          count: 0,
          backgroundColor: colorInfo.bg,
          borderColor: colorInfo.border
        };
      }
      categoryMap[category].total += subscription.monthlyPrice || 0;
      categoryMap[category].count += 1;
    });

    return Object.entries(categoryMap)
      .map(([name, data]) => {
        const surveyKey = surveyCategoryMap[name] || name;
        const preferenceScore =
          preferences && preferences[surveyKey] ? preferences[surveyKey] : null;

        return {
          name,
          value: data.total,
          count: data.count,
          backgroundColor: data.backgroundColor,
          borderColor: data.borderColor,
          preferenceScore,
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  // 월별 지출 데이터 처리
  const getMonthlyData = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('ko-KR', { month: 'short' });
      const year = date.getFullYear();
      
      months.push({
        month: `${year}년 ${monthName}`,
        value: Math.floor(Math.random() * 200000) + 100000, // 실제로는 실제 데이터를 사용
        color: '#667eea'
      });
    }
    
    return months;
  };

  const chartData = chartType === 'category' ? getCategoryData() : getMonthlyData();
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(item => item.value)) : 0;

  // chart.js용 차트 데이터 준비 (AI 추천 페이지와 동일한 색상 팔레트 사용)
  const prepareChartData = () => {
    if (chartType === 'category') {
      const labels = chartData.map(item => item.name);
      const values = chartData.map(item => item.value);
      
      // AI 추천 페이지와 동일한 색상 배열
      const colorPalette = {
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
        ]
      };
      
      // 카테고리별 고정 색상 사용 (없으면 순서대로 할당)
      const backgroundColor = chartData.map((item, index) => 
        item.backgroundColor || colorPalette.backgroundColor[index % colorPalette.backgroundColor.length]
      );
      
      const borderColor = chartData.map((item, index) => 
        item.borderColor || colorPalette.borderColor[index % colorPalette.borderColor.length]
      );
      
      return {
        labels,
        values,
        backgroundColor,
        borderColor,
      };
    }
    return null;
  };

  const categoryChartData = prepareChartData();

  // 바 차트 (월별)
  const BarChart = () => {
    return (
      <div className={styles.barChart}>
        <div className={styles.barContainer}>
          {chartData.length === 0 || maxValue === 0 ? (
            <div className={styles.emptyState}>
              데이터가 없습니다.
            </div>
          ) : (
            chartData.map((item, index) => {
              const height = (item.value / maxValue) * 100;
              return (
                <div key={index} className={styles.barWrapper}>
                  <div className={styles.bar}>
                    <div 
                      className={styles.barFill}
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <div className={styles.barLabel}>
                    {item.month}
                  </div>
                  <div className={styles.barValue}>
                    ₩{item.value.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // 카테고리별 선호도 라벨
  const getPreferenceLabel = (score) => {
    if (!score) return null;
    const labels = {
      1: '매우 낮음',
      2: '낮음',
      3: '보통',
      4: '높음',
      5: '매우 높음',
    };
    return labels[score] || null;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>

      {/* 차트 레이아웃 */}
      <div className={styles.chartArea}>
        {categoryChartData && chartData.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* 바 차트 */}
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>
                카테고리별 지출
              </h3>
              <div style={{ height: '300px' }}>
                <Bar
                  data={{
                    labels: categoryChartData.labels,
                    datasets: [{
                      label: '지출 금액',
                      data: categoryChartData.values,
                      backgroundColor: categoryChartData.backgroundColor,
                      borderColor: categoryChartData.borderColor,
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
                            const value = context.parsed.y;
                            const item = chartData[context.dataIndex];
                            let tooltip = `₩${value.toLocaleString()}`;
                            if (item.preferenceScore) {
                              tooltip += ` (선호도: ${getPreferenceLabel(item.preferenceScore)})`;
                            }
                            return tooltip;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₩' + value.toLocaleString();
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
                지출 분포
              </h3>
              <div style={{ height: '300px' }}>
                <Doughnut
                  data={{
                    labels: categoryChartData.labels,
                    datasets: [{
                      label: '지출 금액',
                      data: categoryChartData.values,
                      backgroundColor: categoryChartData.backgroundColor,
                      borderColor: categoryChartData.borderColor,
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
                          },
                          generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                              return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const item = chartData[i];
                                return {
                                  text: `${label}: ₩${value.toLocaleString()}${item.preferenceScore ? ` (선호도: ${getPreferenceLabel(item.preferenceScore)})` : ''}`,
                                  fillStyle: data.datasets[0].backgroundColor[i],
                                  strokeStyle: data.datasets[0].borderColor[i],
                                  lineWidth: data.datasets[0].borderWidth,
                                  hidden: false,
                                  index: i
                                };
                              });
                            }
                            return [];
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const value = context.parsed;
                            const item = chartData[context.dataIndex];
                            let tooltip = `${context.label}: ₩${value.toLocaleString()}`;
                            if (item.preferenceScore) {
                              tooltip += ` (선호도: ${getPreferenceLabel(item.preferenceScore)})`;
                            }
                            return tooltip;
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
            <div style={{ marginBottom: '0.5rem' }}>데이터가 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}
