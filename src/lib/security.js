// 금융 API 보안 유틸리티

import crypto from 'crypto';

// Rate Limiting을 위한 간단한 메모리 저장소 (프로덕션에서는 Redis 사용 권장)
const rateLimitStore = new Map();

/**
 * Rate Limiting 체크
 * @param {string} identifier - IP 주소 또는 사용자 ID
 * @param {number} maxRequests - 최대 요청 수
 * @param {number} windowMs - 시간 윈도우 (밀리초)
 * @returns {boolean} - 요청 허용 여부
 */
export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const record = rateLimitStore.get(key);
  
  // 시간 윈도우가 지났으면 리셋
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }
  
  // 요청 수 초과
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Rate Limit 정보 가져오기
 */
export function getRateLimitInfo(identifier) {
  const record = rateLimitStore.get(identifier);
  if (!record) return null;
  
  return {
    remaining: Math.max(0, 10 - record.count),
    resetTime: record.resetTime
  };
}

/**
 * Rate Limit 저장소 정리 (메모리 누수 방지)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 주기적으로 정리 (5분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * 안전한 랜덤 문자열 생성 (crypto 사용)
 */
export function generateSecureRandomString(length = 32) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * State 값 암호화 (HMAC)
 */
export function generateSecureState(secret, data) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * State 값 검증
 */
export function verifyState(secret, data, signature) {
  const expectedSignature = generateSecureState(secret, data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * 입력 값 sanitization (XSS 방지)
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .trim()
    .slice(0, 1000); // 최대 길이 제한
}

/**
 * 은행 코드 검증
 */
const VALID_BANK_CODES = [
  '001', '002', '003', '004', '011', '020', '023', '027', '032', '034',
  '037', '039', '045', '047', '048', '050', '054', '055', '056', '057',
  '059', '060', '061', '062', '063', '064', '065', '071', '081', '088',
  '089', '090', '092', '093', '094', '095', '096', '097', '098', '099',
  '102', '103', '104', '105', '270', '278', '287'
];

export function validateBankCode(bankCode) {
  if (!bankCode || typeof bankCode !== 'string') {
    return false;
  }
  return VALID_BANK_CODES.includes(bankCode.trim());
}

/**
 * URL 검증 (리다이렉트 URI)
 */
export function validateRedirectUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(uri);
    
    // HTTPS만 허용 (프로덕션)
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return false;
    }
    
    // 허용된 도메인 목록 확인 (환경 변수에서 설정)
    const allowedDomains = process.env.ALLOWED_REDIRECT_DOMAINS?.split(',') || [];
    if (allowedDomains.length > 0 && !allowedDomains.includes(url.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * 날짜 형식 검증 (YYYYMMDD)
 */
export function validateDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  if (!/^\d{8}$/.test(dateString)) {
    return false;
  }
  
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10);
  const day = parseInt(dateString.substring(6, 8), 10);
  
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return false;
  }
  
  // 과거 날짜만 허용 (미래 날짜 제한)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return false;
  }
  
  return true;
}

/**
 * 날짜 범위 검증 (최대 조회 기간 제한)
 */
export function validateDateRange(startDate, endDate, maxDays = 90) {
  if (!validateDate(startDate) || !validateDate(endDate)) {
    return false;
  }
  
  const start = new Date(
    parseInt(startDate.substring(0, 4), 10),
    parseInt(startDate.substring(4, 6), 10) - 1,
    parseInt(startDate.substring(6, 8), 10)
  );
  
  const end = new Date(
    parseInt(endDate.substring(0, 4), 10),
    parseInt(endDate.substring(4, 6), 10) - 1,
    parseInt(endDate.substring(6, 8), 10)
  );
  
  if (start > end) {
    return false;
  }
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= maxDays;
}

/**
 * 계좌 ID 검증
 */
export function validateAccountId(accountId) {
  if (!accountId || typeof accountId !== 'string') {
    return false;
  }
  
  // 계좌 ID는 영문자, 숫자, 하이픈만 허용
  if (!/^[A-Za-z0-9\-]+$/.test(accountId)) {
    return false;
  }
  
  // 길이 제한
  if (accountId.length < 5 || accountId.length > 50) {
    return false;
  }
  
  return true;
}

/**
 * 환경 변수 검증
 */
export function validateEnvironmentVariables() {
  const required = [
    'OPENBANKING_CLIENT_ID',
    'OPENBANKING_CLIENT_SECRET'
  ];
  
  const missing = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`필수 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}`);
  }
  
  return true;
}

/**
 * 클라이언트 IP 주소 추출
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * 안전한 에러 메시지 생성 (민감 정보 제거)
 */
export function createSafeErrorMessage(error, isDevelopment = false) {
  if (isDevelopment) {
    return {
      error: error.message || '알 수 없는 오류',
      stack: error.stack
    };
  }
  
  // 프로덕션에서는 일반적인 에러 메시지만 반환
  return {
    error: '요청 처리 중 오류가 발생했습니다.'
  };
}

/**
 * 토큰 마스킹 (로깅용)
 */
export function maskToken(token) {
  if (!token || typeof token !== 'string') {
    return '***';
  }
  
  if (token.length <= 8) {
    return '***';
  }
  
  return token.substring(0, 4) + '***' + token.substring(token.length - 4);
}

/**
 * 민감 정보 제거 (로깅용)
 */
export function sanitizeForLogging(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = ['accessToken', 'access_token', 'refreshToken', 'refresh_token', 
                         'clientSecret', 'client_secret', 'password', 'code', 'state'];
  
  const sanitized = { ...data };
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = maskToken(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * HTTPS 강제 (프로덕션)
 */
export function enforceHttps(request) {
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 
                    (request.url.startsWith('https://') ? 'https' : 'http');
    
    if (protocol !== 'https') {
      throw new Error('HTTPS 연결이 필요합니다.');
    }
  }
}

/**
 * 토큰 암호화 (AES-256-GCM)
 */
export function encryptToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('암호화할 토큰이 필요합니다.');
  }

  const algorithm = 'aes-256-gcm';
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.OPENBANKING_CLIENT_SECRET;
  
  if (!encryptionKey) {
    throw new Error('암호화 키가 설정되지 않았습니다.');
  }

  // 키를 32바이트로 변환 (SHA-256 해시 사용)
  const key = crypto.createHash('sha256').update(encryptionKey).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // IV와 AuthTag를 포함하여 반환
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * 토큰 복호화 (AES-256-GCM)
 */
export function decryptToken(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'object') {
    throw new Error('복호화할 데이터가 필요합니다.');
  }

  const algorithm = 'aes-256-gcm';
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.OPENBANKING_CLIENT_SECRET;
  
  if (!encryptionKey) {
    throw new Error('암호화 키가 설정되지 않았습니다.');
  }

  const key = crypto.createHash('sha256').update(encryptionKey).digest();
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 암호화된 토큰을 문자열로 직렬화
 */
export function serializeEncryptedToken(encryptedData) {
  return JSON.stringify(encryptedData);
}

/**
 * 문자열에서 암호화된 토큰 역직렬화
 */
export function deserializeEncryptedToken(serialized) {
  try {
    return JSON.parse(serialized);
  } catch {
    throw new Error('잘못된 암호화 토큰 형식입니다.');
  }
}

/**
 * 보안 헤더 생성
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

/**
 * 요청 본문 크기 제한 검증
 */
export function validateRequestSize(contentLength, maxSize = 1024 * 1024) { // 기본 1MB
  if (!contentLength) {
    return true; // Content-Length가 없으면 검증 건너뛰기
  }
  
  const size = parseInt(contentLength, 10);
  return size <= maxSize && size > 0;
}

/**
 * Origin 검증 (CORS)
 */
export function validateOrigin(origin) {
  if (!origin) {
    return false;
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  // 개발 환경에서는 localhost 허용
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }

  return allowedOrigins.some(allowed => {
    try {
      const allowedUrl = new URL(allowed);
      const originUrl = new URL(origin);
      return allowedUrl.origin === originUrl.origin;
    } catch {
      return false;
    }
  });
}

// ==================== 추가 보안 기능 ====================

/**
 * 감사 로그 (Audit Logging)
 * 금융 API의 모든 접근을 기록 (민감 정보 제외)
 */
const auditLogs = []; // 프로덕션에서는 데이터베이스나 외부 로깅 서비스 사용 권장
const MAX_AUDIT_LOGS = 1000; // 메모리 보호를 위한 최대 로그 수

export function auditLog(event, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: sanitizeForLogging(details),
    // 민감 정보는 제외
  };

  auditLogs.push(logEntry);

  // 메모리 보호를 위해 오래된 로그 제거
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.shift();
  }

  // 프로덕션에서는 외부 로깅 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // 예: 외부 로깅 서비스로 전송
    // sendToLoggingService(logEntry);
  } else {
    console.log('[AUDIT]', logEntry);
  }

  return logEntry;
}

/**
 * 감사 로그 조회 (관리자용)
 */
export function getAuditLogs(limit = 100) {
  return auditLogs.slice(-limit).reverse();
}

/**
 * Replay Attack 방지 - Nonce 저장소
 */
const nonceStore = new Map();
const NONCE_EXPIRY = 5 * 60 * 1000; // 5분

/**
 * Nonce 생성 및 저장
 */
export function generateNonce() {
  const nonce = generateSecureRandomString(16);
  const expiry = Date.now() + NONCE_EXPIRY;
  nonceStore.set(nonce, { expiry, used: false });
  return nonce;
}

/**
 * Nonce 검증 (Replay Attack 방지)
 */
export function verifyNonce(nonce) {
  if (!nonce || typeof nonce !== 'string') {
    return false;
  }

  const nonceData = nonceStore.get(nonce);
  
  if (!nonceData) {
    return false; // 존재하지 않는 nonce
  }

  // 만료 확인
  if (Date.now() > nonceData.expiry) {
    nonceStore.delete(nonce);
    return false;
  }

  // 이미 사용된 nonce인지 확인
  if (nonceData.used) {
    return false; // Replay Attack 시도
  }

  // 사용 표시
  nonceData.used = true;
  
  // 사용된 nonce는 잠시 후 삭제
  setTimeout(() => {
    nonceStore.delete(nonce);
  }, 60000); // 1분 후 삭제

  return true;
}

/**
 * Nonce 저장소 정리
 */
function cleanupNonceStore() {
  const now = Date.now();
  for (const [nonce, data] of nonceStore.entries()) {
    if (now > data.expiry) {
      nonceStore.delete(nonce);
    }
  }
}

// 주기적으로 정리 (5분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupNonceStore, 5 * 60 * 1000);
}

/**
 * 요청 타임스탬프 검증 (Replay Attack 방지)
 */
export function validateTimestamp(timestamp, maxAge = 5 * 60 * 1000) { // 기본 5분
  if (!timestamp || typeof timestamp !== 'number') {
    return false;
  }

  const now = Date.now();
  const age = now - timestamp;

  // 너무 오래된 요청 거부
  if (age > maxAge) {
    return false;
  }

  // 미래의 타임스탬프 거부 (시계 불일치 허용 범위: 1분)
  if (age < -60000) {
    return false;
  }

  return true;
}

/**
 * 요청 서명 생성 (HMAC)
 */
export function signRequest(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const message = JSON.stringify(data);
  hmac.update(message);
  return hmac.digest('hex');
}

/**
 * 요청 서명 검증
 */
export function verifyRequestSignature(data, signature, secret) {
  const expectedSignature = signRequest(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * IP 화이트리스트 검증
 */
export function isIpWhitelisted(ip) {
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  
  if (whitelist.length === 0) {
    return true; // 화이트리스트가 없으면 모든 IP 허용
  }

  return whitelist.some(allowedIp => {
    // 정확한 IP 매칭 또는 CIDR 표기법 지원
    if (allowedIp === ip) {
      return true;
    }
    // CIDR 표기법 처리 (간단한 버전)
    if (allowedIp.includes('/')) {
      // 실제 구현 시 CIDR 라이브러리 사용 권장
      return ip.startsWith(allowedIp.split('/')[0].slice(0, -1));
    }
    return false;
  });
}

/**
 * IP 블랙리스트 검증
 */
export function isIpBlacklisted(ip) {
  const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
  
  return blacklist.some(blockedIp => {
    if (blockedIp === ip) {
      return true;
    }
    // CIDR 표기법 처리
    if (blockedIp.includes('/')) {
      return ip.startsWith(blockedIp.split('/')[0].slice(0, -1));
    }
    return false;
  });
}

/**
 * 요청 ID 생성 (추적용)
 */
export function generateRequestId() {
  const timestamp = Date.now();
  const random = generateSecureRandomString(8);
  return `req_${timestamp}_${random}`;
}

/**
 * 토큰 만료 시간 검증
 */
export function validateTokenExpiry(tokenData) {
  if (!tokenData || typeof tokenData !== 'object') {
    return false;
  }

  // 토큰에 만료 시간이 포함된 경우
  if (tokenData.expires_at || tokenData.expires_in) {
    const expiresAt = tokenData.expires_at 
      ? new Date(tokenData.expires_at).getTime()
      : Date.now() + (tokenData.expires_in * 1000);

    if (Date.now() >= expiresAt) {
      return false; // 만료됨
    }
  }

  // 토큰 생성 시간 확인 (최대 24시간)
  if (tokenData.created_at) {
    const createdAt = new Date(tokenData.created_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    if (Date.now() - createdAt > maxAge) {
      return false; // 너무 오래된 토큰
    }
  }

  return true;
}

/**
 * 비정상 행위 탐지 (간단한 버전)
 */
const suspiciousActivityStore = new Map();
const SUSPICIOUS_THRESHOLD = 10; // 10회 이상 실패 시 의심

export function detectSuspiciousActivity(ip, isSuccess) {
  if (!suspiciousActivityStore.has(ip)) {
    suspiciousActivityStore.set(ip, { failures: 0, lastActivity: Date.now() });
  }

  const activity = suspiciousActivityStore.get(ip);

  if (isSuccess) {
    // 성공 시 실패 카운트 감소
    activity.failures = Math.max(0, activity.failures - 1);
  } else {
    // 실패 시 카운트 증가
    activity.failures++;
  }

  activity.lastActivity = Date.now();

  // 의심스러운 활동 감지
  if (activity.failures >= SUSPICIOUS_THRESHOLD) {
    auditLog('SUSPICIOUS_ACTIVITY_DETECTED', {
      ip,
      failureCount: activity.failures
    });
    return true;
  }

  return false;
}

/**
 * 의심스러운 IP 조회
 */
export function getSuspiciousIps() {
  const suspicious = [];
  for (const [ip, activity] of suspiciousActivityStore.entries()) {
    if (activity.failures >= SUSPICIOUS_THRESHOLD) {
      suspicious.push({ ip, failures: activity.failures, lastActivity: activity.lastActivity });
    }
  }
  return suspicious;
}

/**
 * 요청 타임아웃 설정 (fetch 래퍼)
 */
export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('요청 시간 초과');
    }
    throw error;
  }
}

/**
 * 메모리에서 민감 정보 제거 (보안 강화)
 */
export function clearSensitiveData(data) {
  if (typeof data === 'string') {
    return '';
  }
  if (typeof data === 'object' && data !== null) {
    const cleared = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'code', 'state'];
    for (const key of sensitiveKeys) {
      if (key in cleared) {
        delete cleared[key];
      }
    }
    return cleared;
  }
  return data;
}

