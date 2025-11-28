/**
 * 구독 서비스 카테고리 분석 및 파이 차트 데이터 변환 함수
 */

/**
 * 구독 서비스 목록을 카테고리별로 분석합니다.
 * 
 * @param {Array} subscriptions - 구독 서비스 목록
 * @returns {Object} 카테고리별 개수 및 통계
 */
export function analyzeCategories(subscriptions) {
  if (!subscriptions || subscriptions.length === 0) {
    return {
      categoryCounts: {},
      totalCount: 0,
      totalPrice: 0,
      categoryPrices: {},
    };
  }

  // 카테고리 목록 (정의된 카테고리)
  const validCategories = [
    '스트리밍',
    '음악',
    '소프트웨어',
    '게임',
    '클라우드',
    '뉴스/잡지',
    '피트니스',
    '교육',
    '기타',
  ];

  // 카테고리별 개수 및 가격 집계
  const categoryCounts = {};
  const categoryPrices = {};
  let totalPrice = 0;

  // 초기화
  validCategories.forEach(category => {
    categoryCounts[category] = 0;
    categoryPrices[category] = 0;
  });

  // 구독 서비스 분석
  subscriptions.forEach(subscription => {
    const category = subscription.category || '기타';
    const price = subscription.price || 0;

    // 유효한 카테고리인지 확인
    const normalizedCategory = validCategories.includes(category) ? category : '기타';

    categoryCounts[normalizedCategory] = (categoryCounts[normalizedCategory] || 0) + 1;
    categoryPrices[normalizedCategory] = (categoryPrices[normalizedCategory] || 0) + price;
    totalPrice += price;
  });

  return {
    categoryCounts,
    totalCount: subscriptions.length,
    totalPrice,
    categoryPrices,
  };
}

/**
 * 파이 차트용 데이터 형식으로 변환합니다.
 * 
 * @param {Array} subscriptions - 구독 서비스 목록
 * @returns {Array} 파이 차트 데이터 배열 [{ label, value, count, price }]
 */
export function convertToPieChartData(subscriptions) {
  const analysis = analyzeCategories(subscriptions);
  const { categoryCounts, categoryPrices } = analysis;

  const pieChartData = [];

  Object.keys(categoryCounts).forEach(category => {
    const count = categoryCounts[category];
    const price = categoryPrices[category] || 0;

    if (count > 0) {
      pieChartData.push({
        label: category,
        value: count, // 개수 기준
        count: count,
        price: price,
        percentage: 0, // 나중에 계산
      });
    }
  });

  // 비율 계산
  const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
  pieChartData.forEach(item => {
    item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
  });

  // 개수 기준으로 정렬 (내림차순)
  pieChartData.sort((a, b) => b.value - a.value);

  return pieChartData;
}

/**
 * 가격 기준 파이 차트 데이터로 변환합니다.
 * 
 * @param {Array} subscriptions - 구독 서비스 목록
 * @returns {Array} 가격 기준 파이 차트 데이터
 */
export function convertToPricePieChartData(subscriptions) {
  const analysis = analyzeCategories(subscriptions);
  const { categoryCounts, categoryPrices, totalPrice } = analysis;

  const pieChartData = [];

  Object.keys(categoryPrices).forEach(category => {
    const price = categoryPrices[category] || 0;
    const count = categoryCounts[category] || 0;

    if (price > 0) {
      pieChartData.push({
        label: category,
        value: price, // 가격 기준
        count: count,
        price: price,
        percentage: totalPrice > 0 ? Math.round((price / totalPrice) * 100) : 0,
      });
    }
  });

  // 가격 기준으로 정렬 (내림차순)
  pieChartData.sort((a, b) => b.value - a.value);

  return pieChartData;
}

