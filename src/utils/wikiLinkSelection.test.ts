import { describe, expect, it } from 'vitest';
import { Note } from '@/types';
import { resolveWikiLinkTitle } from '@/utils/wikiLinkSelection';

const makeNote = (
  id: string,
  title: string,
  updatedAt: string,
  folderPath?: string,
): Note => ({
  id,
  title,
  content: '',
  folder_path: folderPath,
  parent_id: null,
  owner_id: 'owner',
  is_public: false,
  note_type: 'normal',
  tags: [],
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: updatedAt,
  deleted_at: null,
  is_pinned: false,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date(updatedAt),
  reminders: [],
  content_preview: '',
});

describe('resolveWikiLinkTitle', () => {
  it('returns single match when exactly one title matches', () => {
    const notes = [
      makeNote('n1', 'Daily', '2025-02-01T09:00:00.000Z', '/a'),
      makeNote('n2', 'Other', '2025-02-01T09:00:00.000Z', '/b'),
    ];

    const result = resolveWikiLinkTitle(notes, '  daily ');

    expect(result.type).toBe('single');
    if (result.type === 'single') {
      expect(result.note.id).toBe('n1');
    }
  });

  it('returns none when no title matches', () => {
    const notes = [makeNote('n1', 'Daily', '2025-02-01T09:00:00.000Z', '/a')];

    const result = resolveWikiLinkTitle(notes, 'Missing');

    expect(result).toEqual({ type: 'none' });
  });

  it('returns deterministically sorted candidates when multiple titles match', () => {
    const notes = [
      makeNote('n1', 'Daily', '2025-02-02T10:00:00.000Z', '/zeta'),
      makeNote('n2', 'daily', '2025-02-03T10:00:00.000Z', '/b'),
      makeNote('n3', 'DAILY', '2025-02-03T10:00:00.000Z', '/a'),
      makeNote('n4', 'Other', '2025-02-04T10:00:00.000Z', '/a'),
    ];

    const result = resolveWikiLinkTitle(notes, 'daily');

    expect(result.type).toBe('multiple');
    if (result.type === 'multiple') {
      expect(result.candidates.map((candidate) => candidate.id)).toEqual([
        'n3',
        'n2',
        'n1',
      ]);
    }
  });
});
