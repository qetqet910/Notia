import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Note } from '@/types';
import { useWikiLinkNavigation } from './useWikiLinkNavigation';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    title: 'Target',
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

describe('useWikiLinkNavigation', () => {
  let handleSelectNote: ReturnType<typeof vi.fn<(note: Note) => void>>;
  let selectNewlyCreatedNote: ReturnType<typeof vi.fn<(note: Note) => void>>;
  let setActiveTab: ReturnType<typeof vi.fn<(tab: string) => void>>;
  let addNote: ReturnType<
    typeof vi.fn<
      (note: { title: string; content: string; tags: string[] }) => Promise<Note | null>
    >
  >;
  let toast: ReturnType<typeof vi.fn<(props: Record<string, unknown>) => void>>;

  beforeEach(() => {
    handleSelectNote = vi.fn();
    selectNewlyCreatedNote = vi.fn();
    setActiveTab = vi.fn();
    addNote = vi.fn();
    toast = vi.fn();
  });

  function setup(notes: Note[], options: { sessionUserId?: string } = {}) {
    const sessionUserId = 'sessionUserId' in options ? options.sessionUserId : 'user-1';
    return renderHook(() =>
      useWikiLinkNavigation({
        notes,
        sessionUserId,
        addNote,
        toast,
        setActiveTab,
        handleSelectNote,
        selectNewlyCreatedNote,
      }),
    );
  }

  it('opens the note directly when exactly one match exists', () => {
    const note = makeNote({ title: 'Meeting Notes' });
    const { result } = setup([note]);

    act(() => {
      result.current.openNoteByTitle('meeting notes');
    });

    expect(setActiveTab).toHaveBeenCalledWith('notes');
    expect(handleSelectNote).toHaveBeenCalledWith(note);
    expect(result.current.isWikiLinkDialogOpen).toBe(false);
  });

  it('shows a toast with a create action when no match exists', () => {
    const { result } = setup([]);

    act(() => {
      result.current.openNoteByTitle('Nonexistent');
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '노트를 찾을 수 없어요',
        variant: 'destructive',
      }),
    );
    expect(handleSelectNote).not.toHaveBeenCalled();
    expect(result.current.isWikiLinkDialogOpen).toBe(false);
  });

  it('opens the disambiguation dialog when multiple notes share the title', () => {
    const noteA = makeNote({ id: 'a', title: 'Dup', updated_at: '2024-02-01T00:00:00.000Z' });
    const noteB = makeNote({ id: 'b', title: 'Dup', updated_at: '2024-01-01T00:00:00.000Z' });
    const { result } = setup([noteA, noteB]);

    act(() => {
      result.current.openNoteByTitle('Dup');
    });

    expect(result.current.isWikiLinkDialogOpen).toBe(true);
    expect(result.current.wikiLinkTargetTitle).toBe('Dup');
    expect(result.current.wikiLinkCandidates.map((n) => n.id)).toEqual(['a', 'b']);
    expect(handleSelectNote).not.toHaveBeenCalled();
  });

  it('selecting a candidate opens the note and resets dialog state', () => {
    const noteA = makeNote({ id: 'a', title: 'Dup' });
    const noteB = makeNote({ id: 'b', title: 'Dup' });
    const { result } = setup([noteA, noteB]);

    act(() => {
      result.current.openNoteByTitle('Dup');
    });
    act(() => {
      result.current.selectWikiLinkCandidate(noteB);
    });

    expect(setActiveTab).toHaveBeenCalledWith('notes');
    expect(handleSelectNote).toHaveBeenCalledWith(noteB);
    expect(result.current.isWikiLinkDialogOpen).toBe(false);
    expect(result.current.wikiLinkCandidates).toEqual([]);
    expect(result.current.wikiLinkTargetTitle).toBe('');
  });

  it('closing the dialog resets candidate state', () => {
    const noteA = makeNote({ id: 'a', title: 'Dup' });
    const noteB = makeNote({ id: 'b', title: 'Dup' });
    const { result } = setup([noteA, noteB]);

    act(() => {
      result.current.openNoteByTitle('Dup');
    });
    act(() => {
      result.current.closeWikiLinkDialog();
    });

    expect(result.current.isWikiLinkDialogOpen).toBe(false);
    expect(result.current.wikiLinkCandidates).toEqual([]);
    expect(result.current.wikiLinkTargetTitle).toBe('');
  });

  it('creates and opens a new note when there is no session user id, it no-ops', async () => {
    const { result } = setup([], { sessionUserId: undefined });

    await act(async () => {
      await result.current.createAndOpenNoteFromWikiLink('New Title');
    });

    expect(addNote).not.toHaveBeenCalled();
  });

  it('creates and opens a new note using the given title, defaulting when blank', async () => {
    const newNote = makeNote({ id: 'new-1', title: '새로운 노트' });
    addNote.mockResolvedValue(newNote);
    const { result } = setup([]);

    await act(async () => {
      await result.current.createAndOpenNoteFromWikiLink('   ');
    });

    expect(addNote).toHaveBeenCalledWith({
      title: '새로운 노트',
      content: '',
      tags: [],
    });
    expect(setActiveTab).toHaveBeenCalledWith('notes');
    expect(selectNewlyCreatedNote).toHaveBeenCalledWith(newNote);
    expect(handleSelectNote).not.toHaveBeenCalled();
  });

  it('shows a failure toast when note creation fails', async () => {
    addNote.mockResolvedValue(null);
    const { result } = setup([]);

    await act(async () => {
      await result.current.createAndOpenNoteFromWikiLink('Title');
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '노트 생성에 실패했어요',
        variant: 'destructive',
      }),
    );
    expect(handleSelectNote).not.toHaveBeenCalled();
  });
});
