import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDataStore } from './dataStore';
import { Note } from '@/types';

// Mock Supabase
const mockSupabaseFrom = vi.fn();
vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: (table: string) => {
        mockSupabaseFrom(table);
        return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
        };
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  },
}));

// Mock LocalDB
vi.mock('@/services/localDB', () => ({
  localDB: {
    upsertNote: vi.fn(),
    deleteNote: vi.fn(),
    getNotes: vi.fn().mockResolvedValue([]),
  },
}));

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Helper to create a dummy note
const createNote = (id: string, overrides: Partial<Note> = {}): Note => ({
  id,
  owner_id: 'user-1',
  title: 'Test Note',
  content: 'Content',
  tags: [],
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-01').toISOString(),
  is_pinned: false,
  deleted_at: null,
  reminders: [],
  content_preview: 'Content',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('dataStore - New Features', () => {
  beforeEach(() => {
    useDataStore.setState({ 
        notes: {}, 
        isInitialized: true, 
        channels: [], 
        activityCache: null 
    });
    vi.clearAllMocks();
  });

  it('togglePinNote should toggle is_pinned status', async () => {
    const note = createNote('note-1', { is_pinned: false });
    useDataStore.setState({ notes: { 'note-1': note } });

    await useDataStore.getState().togglePinNote('note-1');

    const updatedNote = useDataStore.getState().notes['note-1'];
    expect(updatedNote.is_pinned).toBe(true);
    // Should verify updated_at changed?
    // expect(updatedNote.updated_at).not.toBe(note.updated_at);
    
    // Toggle back
    await useDataStore.getState().togglePinNote('note-1');
    expect(useDataStore.getState().notes['note-1'].is_pinned).toBe(false);
  });

  it('softDeleteNote should set deleted_at', async () => {
    const note = createNote('note-1');
    useDataStore.setState({ notes: { 'note-1': note } });

    await useDataStore.getState().softDeleteNote('note-1');

    const updatedNote = useDataStore.getState().notes['note-1'];
    expect(updatedNote.deleted_at).not.toBeNull();
    expect(new Date(updatedNote.deleted_at!).getTime()).toBeGreaterThan(0);
  });

  it('restoreNote should clear deleted_at', async () => {
    const note = createNote('note-1', { deleted_at: new Date().toISOString() });
    useDataStore.setState({ notes: { 'note-1': note } });

    await useDataStore.getState().restoreNote('note-1');

    const updatedNote = useDataStore.getState().notes['note-1'];
    expect(updatedNote.deleted_at).toBeNull();
  });

  it('permanentlyDeleteNote should remove note from state', async () => {
    const note = createNote('note-1', { deleted_at: new Date().toISOString() });
    useDataStore.setState({ notes: { 'note-1': note } });

    await useDataStore.getState().permanentlyDeleteNote('note-1');

    const notes = useDataStore.getState().notes;
    expect(notes['note-1']).toBeUndefined();
  });
});
