'use client';

import { useState, useEffect } from 'react';
import styles from './Chart.css';

export default function Chart({ data = [] }) {
  const [chartType, setChartType] = useState('category');
  const [timeRange, setTimeRange] = useState('monthly');

  // 카테고리별 데이터 처리
  const getCategoryData = () => {
    const categoryMap = {};
    
    data.forEach(subscription => {
      const category = subscription.category || '기타';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          total: 0,
          count: 0,
          color: getCategoryColor(category)
        };
      }
      categoryMap[category].total += subscription.monthlyPrice || 0;
      categoryMap[category].count += 1;
    });

    return Object.entries(categoryMap).map(([name, data]) => ({
      name,
      value: data.total,
      count: data.count,
      color: data.color
    })).sort((a, b) => b.value - a.value);
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

  // 카테고리 색상 매핑
  const getCategoryColor = (category) => {
    const colors = {
      'OTT': '#ff6b6b',
      '음악': '#4ecdc4',
      '게임': '#45b7d1',
      '뉴스': '#96ceb4',
      '도구': '#ffeaa7',
      '기타': '#dda0dd'
    };
    return colors[category] || '#dda0dd';
  };

  const chartData = chartType === 'category' ? getCategoryData() : getMonthlyData();
  const maxValue = Math.max(...chartData.map(item => item.value));

  // 도넛 차트 (카테고리별)
  const DonutChart = () => {
    let cumulativePercentage = 0;
    
    return (
      <div className={styles.donutChart}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {chartData.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -cumulativePercentage;
            
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx="100"
                cy="100"
                r="80"
                fill="transparent"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 100 100)"
                className={styles.chartSegment}
              />
            );
          })}
        </svg>
        <div className={styles.donutCenter}>
          <div className={styles.centerValue}>
            ₩{chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
          </div>
          <div className={styles.centerLabel}>총 지출</div>
        </div>
      </div>
    );
  };

  // 바 차트 (월별)
  const BarChart = () => {
    return (
      <div className={styles.barChart}>
        <div className={styles.barContainer}>
          {chartData.map((item, index) => {
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
          })}
        </div>
      </div>
    );
  };

  // 카테고리별 범례
  const CategoryLegend = () => {
    return (
      <div className={styles.legend}>
        {chartData.map((item, index) => (
          <div key={index} className={styles.legendItem}>
            <div 
              className={styles.legendColor}
              style={{ backgroundColor: item.color }}
            />
            <div className={styles.legendInfo}>
              <span className={styles.legendName}>{item.name}</span>
              <span className={styles.legendValue}>
                ₩{item.value.toLocaleString()} ({item.count}개)
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.chartContainer}>
      {/* 차트 컨트롤 */}
      <div className={styles.chartControls}>
        <div className={styles.chartTypeSelector}>
          <button 
            className={`${styles.controlButton} ${chartType === 'category' ? styles.active : ''}`}
            onClick={() => setChartType('category')}
          >
            카테고리별
          </button>
          <button 
            className={`${styles.controlButton} ${chartType === 'monthly' ? styles.active : ''}`}
            onClick={() => setChartType('monthly')}
          >
            월별 지출
          </button>
        </div>
        
        {chartType === 'monthly' && (
          <div className={styles.timeRangeSelector}>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className={styles.timeSelect}
            >
              <option value="monthly">월별</option>
              <option value="yearly">년별</option>
            </select>
          </div>
        )}
      </div>

      {/* 차트 영역 */}
      <div className={styles.chartArea}>
        {chartType === 'category' ? (
          <div className={styles.donutContainer}>
            <DonutChart />
            <CategoryLegend />
          </div>
        ) : (
          <BarChart />
        )}
      </div>

      {/* 통계 요약 */}
      <div className={styles.statsSummary}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>평균 월 지출</div>
          <div className={styles.statValue}>
            ₩{Math.round(chartData.reduce((sum, item) => sum + item.value, 0) / Math.max(chartData.length, 1)).toLocaleString()}
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>가장 많이 쓰는 카테고리</div>
          <div className={styles.statValue}>
            {chartData[0]?.name || '없음'}
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>총 구독 서비스</div>
          <div className={styles.statValue}>
            {data.length}개
          </div>
        </div>
      </div>

      {/* 절약 추천 */}
      <div className={styles.savingsRecommendation}>
        <div className={styles.recommendationHeader}>
          <span className={styles.recommendationIcon}>💰</span>
          <h3>절약 추천</h3>
        </div>
        <div className={styles.recommendationContent}>
          {chartData.length > 0 && chartData[0].value > 50000 && (
            <p>
              <strong>{chartData[0].name}</strong> 카테고리에서 
              월 <strong>₩{Math.round(chartData[0].value * 0.2).toLocaleString()}</strong> 
              절약할 수 있습니다.
            </p>
          )}
          <button className={styles.recommendationButton}>
            AI 추천 받기
          </button>
        </div>
      </div>
    </div>
  );
}
