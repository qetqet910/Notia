/**
 * 리다이렉트 경로를 안전하게 sanitize합니다.
 * 오픈 리다이렉트 공격을 방지하기 위해 외부 URL을 차단합니다.
 */

/**
 * 리다이렉트 경로를 sanitize합니다.
 * @param path 리다이렉션 경로
 * @returns 안전하게 sanitize된 경로 (기본값: /dashboard)
 */
export const sanitizeRedirectPath = (path: string | null | undefined): string => {
  // null/undefined/빈 문자열은 기본값 반환
  if (!path || path.trim() === '') {
    return '/dashboard';
  }

  // 상대 경로만 허용 (/로 시작하면서 //로 시작하지 않음)
  if (path.startsWith('/') && !path.startsWith('//')) {
    // 추가 안전장치: URL-like 패턴이 포함되어 있는지 확인
    if (path.includes('://') || path.includes('//')) {
      return '/dashboard';
    }
    return path;
  }

  // 외부 URL (http://, https://) 또는 프로토콜 상대 URL (//) 차단
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('//')
  ) {
    console.warn('[safeRedirect] Blocked external redirect:', path);
    return '/dashboard';
  }

  // 그 외의 경우 기본값 반환
  return '/dashboard';
};
