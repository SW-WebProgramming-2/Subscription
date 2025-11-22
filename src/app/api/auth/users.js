// 사용자 데이터 저장소 (공통 모듈)
// 실제로는 데이터베이스로 교체 필요

// Next.js 서버리스 환경에서 모듈이 재로드될 수 있으므로 전역 변수 사용
// Node.js의 global 객체를 사용하여 데이터 유지
if (!global.users) {
  global.users = [];
}

const users = global.users;

export function addUser(user) {
  users.push(user);
}

export function getUserByEmail(email) {
  return users.find(user => user.email === email);
}

export function getUserByUsername(username) {
  return users.find(user => user.username === username);
}

export function getUserById(id) {
  // 타입 변환하여 비교 (문자열과 숫자 모두 지원)
  const userId = String(id);
  const found = users.find(user => String(user.id) === userId);
  console.log(`getUserById 호출: 찾는 ID=${userId}, 타입=${typeof id}, 결과=${found ? '찾음' : '없음'}`);
  return found;
}

export function getAllUsers() {
  return users.map(user => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  }));
}

export function getUsers() {
  return users;
}

