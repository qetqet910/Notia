import { useMemo } from 'react';
import { Note } from '@/types';
import { parseObsidianLinks } from '@/utils/obsidianLinks';

export interface BacklinkItem {
  id: string;
  title: string;
  context: string;
}

const normalizeTitle = (value: string): string => value.trim().toLowerCase();

const buildContext = (content: string, start: number, end: number): string => {
  const snippetStart = Math.max(0, start - 25);
  const snippetEnd = Math.min(content.length, end + 25);
  const prefix = snippetStart > 0 ? '...' : '';
  const suffix = snippetEnd < content.length ? '...' : '';

  return `${prefix}${content.slice(snippetStart, snippetEnd).trim()}${suffix}`;
};

export const useBacklinks = (note: Note | null, notes: Note[]): BacklinkItem[] => {
  return useMemo(() => {
    if (!note) return [];

    const normalizedTarget = normalizeTitle(note.title);
    const backlinks: BacklinkItem[] = [];

    for (const candidate of notes) {
      if (candidate.id === note.id) continue;

      const candidateContent = candidate.content || '';
      if (!candidateContent) continue;

      const matchedLink = parseObsidianLinks(candidateContent).find(
        (link) => normalizeTitle(link.target) === normalizedTarget,
      );

      if (!matchedLink) continue;

      backlinks.push({
        id: candidate.id,
        title: candidate.title,
        context: buildContext(candidateContent, matchedLink.start, matchedLink.end),
      });
    }

    return backlinks;
  }, [note, notes]);
};
