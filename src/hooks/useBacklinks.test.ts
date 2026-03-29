import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Note } from '@/types';
import { useBacklinks } from './useBacklinks';

const createNote = (overrides: Partial<Note>): Note => ({
  id: overrides.id || 'note-id',
  title: overrides.title || '제목 없음',
  content: overrides.content || '',
  owner_id: overrides.owner_id || 'owner-1',
  is_public: overrides.is_public ?? false,
  tags: overrides.tags || [],
  created_at: overrides.created_at || '2026-01-01T00:00:00.000Z',
  updated_at: overrides.updated_at || '2026-01-01T00:00:00.000Z',
  createdAt: overrides.createdAt || new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: overrides.updatedAt || new Date('2026-01-01T00:00:00.000Z'),
  reminders: overrides.reminders || [],
  content_preview: overrides.content_preview || '',
  folder_path: overrides.folder_path,
  parent_id: overrides.parent_id,
  note_type: overrides.note_type,
  deleted_at: overrides.deleted_at,
  is_pinned: overrides.is_pinned,
});

describe('useBacklinks', () => {
  it('finds backlinks by case-insensitive wiki title and excludes self', () => {
    const target = createNote({ id: 'target', title: 'Project Plan', content: 'target body' });
    const source = createNote({
      id: 'source',
      title: 'Weekly Log',
      content: '이번 주 정리 [[ project plan ]] 마무리',
    });

    const { result } = renderHook(() => useBacklinks(target, [target, source]));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('source');
    expect(result.current[0].title).toBe('Weekly Log');
    expect(result.current[0].context).toContain('[[ project plan ]]');
  });

  it('ignores wiki links inside fenced code blocks', () => {
    const target = createNote({ id: 'target', title: 'Roadmap' });
    const source = createNote({
      id: 'source',
      title: 'Dev Notes',
      content: '```md\n[[Roadmap]]\n```\n코드블록 밖에는 링크 없음',
    });

    const { result } = renderHook(() => useBacklinks(target, [target, source]));

    expect(result.current).toHaveLength(0);
  });
});
