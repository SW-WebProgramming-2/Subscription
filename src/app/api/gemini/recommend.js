/**
 * 구독 서비스 추천 알고리즘
 * 사용자의 현재 구독 서비스를 기반으로 추가 추천 서비스를 생성합니다.
 */

/**
 * 카테고리별 추천 서비스 더미 데이터
 * 실제 프로덕션에서는 데이터베이스나 외부 API에서 가져올 수 있습니다.
 */
export const RECOMMENDATION_DATABASE = {
  '스트리밍': [
    { name: 'Netflix', price: 13500, description: '다양한 영화와 시리즈를 제공하는 글로벌 스트리밍 서비스' },
    { name: 'Disney+', price: 9900, description: '디즈니, 마블, 스타워즈 콘텐츠 전문 스트리밍 서비스' },
    { name: 'YouTube Premium', price: 11900, description: '광고 없는 YouTube와 YouTube Music 제공' },
    { name: 'Apple TV+', price: 6500, description: '애플 오리지널 콘텐츠 스트리밍 서비스' },
    { name: 'Amazon Prime Video', price: 4900, description: '아마존 프라임 멤버십 포함 스트리밍 서비스' },
    { name: 'Watcha', price: 7900, description: '국내 최대 OTT 서비스' },
    { name: 'Wavve', price: 10900, description: 'KBS, MBC, SBS 콘텐츠 전문 스트리밍 서비스' },
  ],
  '음악': [
    { name: 'Spotify Premium', price: 10900, description: '세계 최대 음악 스트리밍 서비스' },
    { name: 'Apple Music', price: 10900, description: '애플 생태계 최적화 음악 서비스' },
    { name: 'YouTube Music', price: 11900, description: 'YouTube Premium 포함 음악 서비스' },
    { name: 'Melon', price: 8900, description: '국내 최대 음원 스트리밍 서비스' },
    { name: 'Genie Music', price: 7900, description: 'KT 기반 음악 스트리밍 서비스' },
  ],
  '소프트웨어': [
    { name: 'Adobe Creative Cloud', price: 59000, description: '포토샵, 일러스트레이터 등 크리에이티브 툴 모음' },
    { name: 'Microsoft 365', price: 10900, description: 'Office 제품군 및 클라우드 스토리지' },
    { name: 'Notion', price: 8000, description: '올인원 워크스페이스 및 노트 앱' },
    { name: 'Figma', price: 12000, description: '협업 디자인 툴' },
    { name: 'Canva Pro', price: 12900, description: '온라인 그래픽 디자인 플랫폼' },
    { name: 'Grammarly Premium', price: 12000, description: '영문 문법 및 작성 도우미' },
  ],
  '게임': [
    { name: 'Xbox Game Pass', price: 12900, description: '마이크로소프트 게임 구독 서비스' },
    { name: 'PlayStation Plus', price: 10900, description: '플레이스테이션 온라인 멀티플레이 및 무료 게임' },
    { name: 'Nintendo Switch Online', price: 2400, description: '닌텐도 스위치 온라인 서비스' },
    { name: 'Steam', price: 0, description: 'PC 게임 플랫폼 (무료, 게임 구매 별도)' },
    { name: 'Epic Games Store', price: 0, description: '에픽게임즈 게임 플랫폼 (무료, 게임 구매 별도)' },
  ],
  '클라우드': [
    { name: 'AWS', price: 15000, description: '아마존 웹 서비스 클라우드 플랫폼' },
    { name: 'Google Cloud Platform', price: 12000, description: '구글 클라우드 서비스' },
    { name: 'Microsoft Azure', price: 13000, description: '마이크로소프트 클라우드 플랫폼' },
    { name: 'Dropbox', price: 12000, description: '클라우드 파일 저장 및 공유 서비스' },
    { name: 'Google Drive', price: 2400, description: '구글 클라우드 스토리지' },
    { name: 'iCloud+', price: 1200, description: '애플 클라우드 스토리지' },
  ],
  '뉴스/잡지': [
    { name: 'The New York Times', price: 5000, description: '뉴욕타임스 디지털 구독' },
    { name: 'The Wall Street Journal', price: 8000, description: '월스트리트저널 디지털 구독' },
    { name: 'The Economist', price: 12000, description: '이코노미스트 디지털 구독' },
    { name: 'Medium', price: 5000, description: '프리미엄 아티클 읽기' },
    { name: '블로터', price: 3000, description: '국내 IT 뉴스 전문 매체' },
  ],
  '피트니스': [
    { name: 'Peloton', price: 39000, description: '홈 피트니스 및 사이클 클래스' },
    { name: 'Apple Fitness+', price: 4000, description: '애플 피트니스 클래스 서비스' },
    { name: 'Nike Training Club', price: 0, description: '나이키 트레이닝 앱 (무료)' },
    { name: 'Strava', price: 7000, description: '러닝 및 사이클 트래킹 앱' },
    { name: 'MyFitnessPal', price: 5000, description: '칼로리 및 영양 추적 앱' },
  ],
  '교육': [
    { name: 'Coursera Plus', price: 49000, description: '온라인 강의 플랫폼' },
    { name: 'Udemy', price: 0, description: '온라인 강의 플랫폼 (강의별 구매)' },
    { name: 'MasterClass', price: 15000, description: '세계적 전문가 강의 플랫폼' },
    { name: 'Skillshare', price: 12000, description: '크리에이티브 스킬 학습 플랫폼' },
    { name: 'LinkedIn Learning', price: 20000, description: '비즈니스 및 기술 스킬 학습' },
  ],
  '기타': [
    { name: 'Audible', price: 14000, description: '아마존 오디오북 서비스' },
    { name: 'Kindle Unlimited', price: 9900, description: '아마존 전자책 무제한 구독' },
    { name: 'Headspace', price: 12000, description: '명상 및 마음챙김 앱' },
    { name: 'Calm', price: 10000, description: '수면 및 명상 앱' },
  ],
};

/**
 * 사용자의 현재 구독 서비스를 기반으로 추천 서비스를 생성합니다.
 * 
 * @param {Array} currentSubscriptions - 현재 구독 중인 서비스 목록
 * @param {Object} options - 추천 옵션
 * @param {number} options.maxRecommendations - 최대 추천 개수 (기본값: 5)
 * @param {boolean} options.includeOtherCategories - 다른 카테고리 포함 여부 (기본값: true)
 * @returns {Array} 추천 서비스 목록
 */
export function recommendSubscriptions(currentSubscriptions = [], options = {}) {
  const {
    maxRecommendations = 5,
    includeOtherCategories = true,
  } = options;

  if (!currentSubscriptions || currentSubscriptions.length === 0) {
    // 구독 서비스가 없으면 인기 서비스 추천
    return getPopularRecommendations(maxRecommendations);
  }

  // 현재 구독 중인 카테고리 추출
  const currentCategories = new Set(
    currentSubscriptions
      .map(sub => sub.category || '기타')
      .filter(cat => cat)
  );

  // 현재 구독 중인 서비스 이름 추출 (중복 추천 방지)
  const currentServiceNames = new Set(
    currentSubscriptions
      .map(sub => sub.name?.toLowerCase())
      .filter(name => name)
  );

  const recommendations = [];
  const addedServices = new Set();

  // 1. 현재 카테고리에서 아직 구독하지 않은 서비스 추천
  currentCategories.forEach(category => {
    const categoryServices = RECOMMENDATION_DATABASE[category] || [];
    
    categoryServices.forEach(service => {
      const serviceNameLower = service.name.toLowerCase();
      
      if (
        !currentServiceNames.has(serviceNameLower) &&
        !addedServices.has(serviceNameLower) &&
        recommendations.length < maxRecommendations
      ) {
        recommendations.push({
          ...service,
          category: category,
          reason: `현재 ${category} 카테고리를 이용 중이시네요. ${service.name}도 함께 이용해보세요.`,
        });
        addedServices.add(serviceNameLower);
      }
    });
  });

  // 2. 다른 카테고리에서도 추천 (옵션에 따라)
  if (includeOtherCategories && recommendations.length < maxRecommendations) {
    const allCategories = Object.keys(RECOMMENDATION_DATABASE);
    const otherCategories = allCategories.filter(cat => !currentCategories.has(cat));

    // 랜덤하게 다른 카테고리 선택
    const shuffled = otherCategories.sort(() => 0.5 - Math.random());
    
    for (const category of shuffled) {
      if (recommendations.length >= maxRecommendations) break;

      const categoryServices = RECOMMENDATION_DATABASE[category] || [];
      const randomService = categoryServices[Math.floor(Math.random() * categoryServices.length)];

      if (randomService && !addedServices.has(randomService.name.toLowerCase())) {
        recommendations.push({
          ...randomService,
          category: category,
          reason: `${category} 카테고리의 인기 서비스입니다.`,
        });
        addedServices.add(randomService.name.toLowerCase());
      }
    }
  }

  // 추천 개수가 부족하면 인기 서비스로 채우기
  if (recommendations.length < maxRecommendations) {
    const popular = getPopularRecommendations(maxRecommendations - recommendations.length);
    popular.forEach(service => {
      if (!addedServices.has(service.name.toLowerCase())) {
        recommendations.push(service);
        addedServices.add(service.name.toLowerCase());
      }
    });
  }

  return recommendations.slice(0, maxRecommendations);
}

/**
 * 인기 구독 서비스 목록을 반환합니다.
 * 
 * @param {number} count - 반환할 개수
 * @returns {Array} 인기 서비스 목록
 */
function getPopularRecommendations(count = 5) {
  const popularServices = [
    { name: 'Netflix', category: '스트리밍', price: 13500, description: '다양한 영화와 시리즈를 제공하는 글로벌 스트리밍 서비스' },
    { name: 'Spotify Premium', category: '음악', price: 10900, description: '세계 최대 음악 스트리밍 서비스' },
    { name: 'YouTube Premium', category: '스트리밍', price: 11900, description: '광고 없는 YouTube와 YouTube Music 제공' },
    { name: 'Microsoft 365', category: '소프트웨어', price: 10900, description: 'Office 제품군 및 클라우드 스토리지' },
    { name: 'Disney+', category: '스트리밍', price: 9900, description: '디즈니, 마블, 스타워즈 콘텐츠 전문 스트리밍 서비스' },
    { name: 'Notion', category: '소프트웨어', price: 8000, description: '올인원 워크스페이스 및 노트 앱' },
    { name: 'Xbox Game Pass', category: '게임', price: 12900, description: '마이크로소프트 게임 구독 서비스' },
  ];

  return popularServices.slice(0, count).map(service => ({
    ...service,
    reason: '인기 구독 서비스입니다.',
  }));
}

/**
 * 특정 카테고리의 추천 서비스를 반환합니다.
 * 
 * @param {string} category - 카테고리
 * @param {number} count - 반환할 개수
 * @returns {Array} 카테고리별 추천 서비스 목록
 */
export function getRecommendationsByCategory(category, count = 5) {
  const categoryServices = RECOMMENDATION_DATABASE[category] || [];
  return categoryServices.slice(0, count).map(service => ({
    ...service,
    category: category,
    reason: `${category} 카테고리의 추천 서비스입니다.`,
  }));
}

