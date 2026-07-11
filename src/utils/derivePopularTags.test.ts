import { describe, it, expect } from 'vitest';
import type { Note } from '@/types';
import { derivePopularTags } from './derivePopularTags';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    title: 'Note',
    content: '',
    tags: [],
    reminders: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    owner_id: 'user-1',
    is_public: false,
    content_preview: '',
    ...overrides,
  };
}

describe('derivePopularTags', () => {
  it('returns an empty array for empty/invalid input', () => {
    expect(derivePopularTags([])).toEqual([]);
    expect(derivePopularTags(null as unknown as Note[])).toEqual([]);
  });

  it('counts tag occurrences across notes', () => {
    const notes = [
      makeNote({ tags: ['a', 'b'] }),
      makeNote({ tags: ['a'] }),
      makeNote({ tags: ['b', 'c'] }),
    ];

    expect(derivePopularTags(notes)).toEqual([
      { tag: 'a', count: 2 },
      { tag: 'b', count: 2 },
      { tag: 'c', count: 1 },
    ]);
  });

  it('sorts by descending count', () => {
    const notes = [
      makeNote({ tags: ['rare'] }),
      makeNote({ tags: ['common'] }),
      makeNote({ tags: ['common'] }),
      makeNote({ tags: ['common'] }),
    ];

    const result = derivePopularTags(notes);
    expect(result[0]).toEqual({ tag: 'common', count: 3 });
    expect(result[1]).toEqual({ tag: 'rare', count: 1 });
  });

  it('limits results to the top 5 by default', () => {
    const notes = Array.from({ length: 8 }, (_, i) =>
      makeNote({ tags: [`tag${i}`] }),
    );
    expect(derivePopularTags(notes)).toHaveLength(5);
  });

  it('respects a custom limit', () => {
    const notes = [
      makeNote({ tags: ['a'] }),
      makeNote({ tags: ['b'] }),
      makeNote({ tags: ['c'] }),
    ];
    expect(derivePopularTags(notes, 2)).toHaveLength(2);
  });

  it('ignores notes with missing or malformed tags', () => {
    const notes = [
      makeNote({ tags: undefined as unknown as string[] }),
      makeNote({ tags: ['valid'] }),
      { ...makeNote(), tags: [123 as unknown as string, 'valid2'] },
    ];
    expect(derivePopularTags(notes)).toEqual(
      expect.arrayContaining([
        { tag: 'valid', count: 1 },
        { tag: 'valid2', count: 1 },
      ]),
    );
  });

  it('ignores malformed note entries', () => {
    const notes = [null, undefined, makeNote({ tags: ['ok'] })] as unknown as Note[];
    expect(derivePopularTags(notes)).toEqual([{ tag: 'ok', count: 1 }]);
  });
});
