// 키 포맷 함수
export function formatKey(key: string): string {
  // 4자리마다 하이픈 추가
  return key.replace(/(.{4})/g, '$1-').slice(0, -1);
}

// 랜덤 키 생성 함수
export function generateRandomKey(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
