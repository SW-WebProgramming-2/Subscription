'use client';

import { useState } from 'react';
import styles from './SubscriptionCard.css';

export default function SubscriptionCard({ subscription }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(subscription);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // 구독 정보 업데이트 로직
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(subscription);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('정말로 이 구독을 삭제하시겠습니까?')) {
      // 구독 삭제 로직
      console.log('구독 삭제:', subscription.id);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const getNextPaymentDays = () => {
    const today = new Date();
    const paymentDate = new Date(subscription.nextPayment);
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const paymentDays = getNextPaymentDays();
  const isPaymentSoon = paymentDays <= 3 && paymentDays >= 0;

  return (
    <div className={`${styles.card} ${isPaymentSoon ? styles.paymentSoon : ''}`}>
      {/* 서비스 로고 및 기본 정보 */}
      <div className={styles.cardHeader}>
        <div className={styles.serviceInfo}>
          <img 
            src={subscription.logo || '/images/default-service.png'} 
            alt={subscription.serviceName}
            className={styles.serviceLogo}
          />
          <div className={styles.serviceDetails}>
            <h3 className={styles.serviceName}>{subscription.serviceName}</h3>
            <span 
              className={styles.category}
              style={{ backgroundColor: getCategoryColor(subscription.category) }}
            >
              {subscription.category}
            </span>
          </div>
        </div>
        
        <div className={styles.cardActions}>
          <button 
            className={styles.actionButton}
            onClick={handleEdit}
            title="편집"
          >
            ✏️
          </button>
          <button 
            className={styles.actionButton}
            onClick={handleDelete}
            title="삭제"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 가격 및 결제 정보 */}
      <div className={styles.priceSection}>
        <div className={styles.price}>
          {formatPrice(subscription.monthlyPrice)}
          <span className={styles.period}>/월</span>
        </div>
        {subscription.yearlyPrice && (
          <div className={styles.yearlyPrice}>
            연간: {formatPrice(subscription.yearlyPrice)} (월 {formatPrice(subscription.yearlyPrice / 12)})
          </div>
        )}
      </div>

      {/* 결제일 정보 */}
      <div className={styles.paymentInfo}>
        <div className={styles.paymentDate}>
          <span className={styles.label}>다음 결제일:</span>
          <span className={styles.date}>{formatDate(subscription.nextPayment)}</span>
        </div>
        <div className={styles.paymentDays}>
          {paymentDays > 0 ? (
            <span className={isPaymentSoon ? styles.warning : styles.normal}>
              {paymentDays}일 후
            </span>
          ) : paymentDays === 0 ? (
            <span className={styles.today}>오늘</span>
          ) : (
            <span className={styles.overdue}>만료됨</span>
          )}
        </div>
      </div>

      {/* 사용률 표시 */}
      {subscription.usage && (
        <div className={styles.usageSection}>
          <div className={styles.usageHeader}>
            <span className={styles.label}>사용률</span>
            <span className={styles.usagePercent}>
              {subscription.usage.percentage}%
            </span>
          </div>
          <div className={styles.usageBar}>
            <div 
              className={styles.usageProgress}
              style={{ width: `${subscription.usage.percentage}%` }}
            ></div>
          </div>
          <div className={styles.usageDetails}>
            <span>사용: {subscription.usage.used}</span>
            <span>제한: {subscription.usage.limit}</span>
          </div>
        </div>
      )}

      {/* 편집 모드 */}
      {isEditing && (
        <div className={styles.editForm}>
          <div className={styles.formRow}>
            <label>서비스명</label>
            <input
              type="text"
              value={editData.serviceName}
              onChange={(e) => setEditData({...editData, serviceName: e.target.value})}
            />
          </div>
          
          <div className={styles.formRow}>
            <label>월 요금</label>
            <input
              type="number"
              value={editData.monthlyPrice}
              onChange={(e) => setEditData({...editData, monthlyPrice: parseInt(e.target.value)})}
            />
          </div>
          
          <div className={styles.formRow}>
            <label>카테고리</label>
            <select
              value={editData.category}
              onChange={(e) => setEditData({...editData, category: e.target.value})}
            >
              <option value="OTT">OTT</option>
              <option value="음악">음악</option>
              <option value="게임">게임</option>
              <option value="뉴스">뉴스</option>
              <option value="도구">도구</option>
              <option value="기타">기타</option>
            </select>
          </div>
          
          <div className={styles.formRow}>
            <label>다음 결제일</label>
            <input
              type="date"
              value={editData.nextPayment}
              onChange={(e) => setEditData({...editData, nextPayment: e.target.value})}
            />
          </div>

          <div className={styles.editActions}>
            <button className={styles.saveButton} onClick={handleSave}>
              저장
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 권장사항 */}
      {subscription.recommendation && (
        <div className={styles.recommendation}>
          <div className={styles.recommendationHeader}>
            <span className={styles.recommendationIcon}>💡</span>
            <span className={styles.recommendationTitle}>AI 추천</span>
          </div>
          <p className={styles.recommendationText}>
            {subscription.recommendation}
          </p>
          <button className={styles.recommendationButton}>
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
