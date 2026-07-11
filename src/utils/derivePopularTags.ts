import type { Note } from '@/types';

export interface PopularTag {
  tag: string;
  count: number;
}

/**
 * 노트 목록에서 태그 사용 빈도를 집계해 상위 N개를 내림차순으로 반환합니다.
 */
export function derivePopularTags(notes: Note[], limit = 5): PopularTag[] {
  if (!notes || !Array.isArray(notes)) return [];

  const tagCount: Record<string, number> = {};
  notes
    .filter((note) => note && typeof note === 'object')
    .forEach((note) => {
      const tags = note.tags;
      if (tags && Array.isArray(tags)) {
        tags
          .filter((tag) => typeof tag === 'string')
          .forEach((tag) => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
      }
    });

  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
