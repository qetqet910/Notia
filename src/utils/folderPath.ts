/**
 * 폴더 경로 관련 순수 유틸리티.
 *
 * dataStore와 노트 트리 UI가 공유하던 로직을 한곳으로 통합한 모듈입니다.
 * 모든 함수는 부수효과가 없으며 정규화된 경로("/" 시작, 후행 슬래시 없음)를 다룹니다.
 */

/** 임의의 경로 문자열을 정규화합니다. (앞 슬래시 보장, 중복/후행 슬래시 제거) */
export function normalizeFolderPath(path: string | null | undefined): string {
  if (!path || typeof path !== 'string') return '/';

  const trimmed = path.trim();
  if (!trimmed || trimmed === '/' || trimmed === '.') {
    return '/';
  }

  // 앞뒤 슬래시 정리 및 중복 슬래시 제거
  let normalized = trimmed.replace(/\/+/g, '/');
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (normalized.endsWith('/') && normalized.length > 1) normalized = normalized.slice(0, -1);

  return normalized || '/';
}

/** targetPath가 basePath(자기 자신 포함)의 하위 경로인지 판정합니다. */
export function doesPathMatch(targetPath: string, basePath: string): boolean {
  if (basePath === '/') {
    return true;
  }
  return targetPath === basePath || targetPath.startsWith(`${basePath}/`);
}

/** 부모 경로를 반환합니다. 루트는 null. */
export function getParentPath(path: string): string | null {
  const normalizedPath = normalizeFolderPath(path);
  if (normalizedPath === '/') {
    return null;
  }

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  if (lastSlashIndex <= 0) {
    return '/';
  }

  return normalizeFolderPath(normalizedPath.slice(0, lastSlashIndex));
}

/** 마지막 세그먼트(폴더 이름)를 반환합니다. 루트는 "/". */
export function getFolderName(path: string): string {
  const normalizedPath = normalizeFolderPath(path);
  if (normalizedPath === '/') {
    return '/';
  }

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  return normalizedPath.slice(lastSlashIndex + 1);
}

/** 루트를 제외한 각 조상 경로를 위에서 아래로(자기 자신 포함) 반환합니다. */
export function getAncestorPaths(path: string): string[] {
  const normalizedPath = normalizeFolderPath(path);
  if (normalizedPath === '/') {
    return [];
  }

  const segments = normalizedPath.slice(1).split('/').filter(Boolean);
  const result: string[] = [];
  let current = '';

  for (const segment of segments) {
    current = `${current}/${segment}`;
    result.push(normalizeFolderPath(current));
  }

  return result;
}

/** path가 oldBase 하위이면 base 접두사를 newBase로 치환합니다. 아니면 그대로 반환. */
export function remapFolderPath(path: string, oldBase: string, newBase: string): string {
  const normalizedPath = normalizeFolderPath(path);
  const normalizedOldBase = normalizeFolderPath(oldBase);
  const normalizedNewBase = normalizeFolderPath(newBase);

  if (!doesPathMatch(normalizedPath, normalizedOldBase)) {
    return normalizedPath;
  }

  const suffix =
    normalizedOldBase === '/' ? normalizedPath : normalizedPath.slice(normalizedOldBase.length);
  return normalizeFolderPath(`${normalizedNewBase}${suffix}`);
}
