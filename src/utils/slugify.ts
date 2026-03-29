export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // 공백을 -로 변경
    .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣-]+/g, '') // 특수문자 제거 (한글/영문/숫자/- 제외)
    .replace(/--+/g, '-')   // 여러 개의 -를 하나로 변경
    .replace(/^-+/, '')       // 앞쪽 - 제거
    .replace(/-+$/, '');      // 뒤쪽 - 제거
}
