import { Note } from '@/types';

export type WikiLinkTitleResolution =
  | { type: 'none' }
  | { type: 'single'; note: Note }
  | { type: 'multiple'; candidates: Note[] };

const normalizeTitle = (title: string) => title.trim().toLowerCase();

export const sortWikiLinkCandidates = (notes: Note[]) => {
  return [...notes].sort((a, b) => {
    const updatedAtDiff =
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }

    return (a.folder_path || '').localeCompare(b.folder_path || '');
  });
};

export const resolveWikiLinkTitle = (
  notes: Note[],
  title: string,
): WikiLinkTitleResolution => {
  const normalizedTitle = normalizeTitle(title);
  const candidates = (notes || []).filter(
    (note) => normalizeTitle(note.title) === normalizedTitle,
  );

  if (candidates.length === 0) {
    return { type: 'none' };
  }

  if (candidates.length === 1) {
    return { type: 'single', note: candidates[0] };
  }

  return {
    type: 'multiple',
    candidates: sortWikiLinkCandidates(candidates),
  };
};
