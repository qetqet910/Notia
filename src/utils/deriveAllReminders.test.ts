import { describe, it, expect } from 'vitest';
import type { Note } from '@/types';
import { deriveAllReminders } from './deriveAllReminders';

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

function makeReminder(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    note_id: 'note-1',
    owner_id: 'user-1',
    reminder_text: `Reminder ${id}`,
    original_text: `Reminder ${id}`,
    reminder_time: '2024-01-01T10:00:00.000Z',
    completed: false,
    enabled: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('deriveAllReminders', () => {
  it('returns an empty array for empty/invalid input', () => {
    expect(deriveAllReminders([])).toEqual([]);
    expect(deriveAllReminders(null as unknown as Note[])).toEqual([]);
  });

  it('flattens reminders across notes and enriches with note metadata', () => {
    const notes = [
      makeNote({
        id: 'n1',
        title: 'First',
        content_preview: 'preview text',
        reminders: [makeReminder('r1')],
      }),
      makeNote({
        id: 'n2',
        title: 'Second',
        reminders: [makeReminder('r2')],
      }),
    ];

    const result = deriveAllReminders(notes);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'r1',
      noteId: 'n1',
      noteTitle: 'First',
      noteContent: 'preview text',
    });
    expect(result[1]).toMatchObject({ id: 'r2', noteId: 'n2', noteTitle: 'Second' });
  });

  it('defaults noteTitle to "제목 없음" when the note has no title', () => {
    const notes = [makeNote({ title: '', reminders: [makeReminder('r1')] })];
    expect(deriveAllReminders(notes)[0].noteTitle).toBe('제목 없음');
  });

  it('truncates noteContent to 100 characters and defaults to empty string', () => {
    const long = 'x'.repeat(150);
    const notes = [makeNote({ content_preview: long, reminders: [makeReminder('r1')] })];
    expect(deriveAllReminders(notes)[0].noteContent).toBe(long.slice(0, 100));

    const notesNoPreview = [
      makeNote({ content_preview: undefined, reminders: [makeReminder('r2')] }),
    ];
    expect(deriveAllReminders(notesNoPreview)[0].noteContent).toBe('');
  });

  it('deduplicates reminders that share the same id across notes, keeping the first occurrence', () => {
    const notes = [
      makeNote({ id: 'n1', title: 'First', reminders: [makeReminder('shared')] }),
      makeNote({ id: 'n2', title: 'Second', reminders: [makeReminder('shared')] }),
    ];

    const result = deriveAllReminders(notes);

    expect(result).toHaveLength(1);
    expect(result[0].noteId).toBe('n1');
  });

  it('handles notes with no reminders array', () => {
    const notes = [makeNote({ reminders: undefined as unknown as [] })];
    expect(deriveAllReminders(notes)).toEqual([]);
  });
});
