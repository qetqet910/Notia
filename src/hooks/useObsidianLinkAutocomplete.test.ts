import { CompletionContext } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import type { Note } from '@/types';
import { createObsidianLinkCompletion } from './useObsidianLinkAutocomplete';

const createNote = (id: string, title: string): Note => ({
  id,
  title,
  content: '',
  owner_id: 'owner-1',
  is_public: false,
  tags: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  reminders: [],
  content_preview: '',
});

describe('createObsidianLinkCompletion', () => {
  it('returns options when content contains [[pr', async () => {
    const completion = createObsidianLinkCompletion([
      createNote('1', 'Project Plan'),
      createNote('2', '프로젝트 회고'),
      createNote('3', 'Personal'),
    ]);
    const state = EditorState.create({ doc: '[[pr' });
    const context = new CompletionContext(state, 4, false);

    const result = await completion(context);

    expect(result).not.toBeNull();
    expect(result?.from).toBe(2);
    expect(result?.options.map((option) => option.label)).toContain('Project Plan');
  });

  it('returns null when cursor is not inside wiki link', async () => {
    const completion = createObsidianLinkCompletion([
      createNote('1', 'Project Plan'),
      createNote('2', '프로젝트 회고'),
    ]);
    const state = EditorState.create({ doc: 'plain text pr' });
    const context = new CompletionContext(state, state.doc.length, false);

    const result = await completion(context);

    expect(result).toBeNull();
  });
});
