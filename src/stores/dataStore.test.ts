import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Folder, Note } from '@/types';

import { useDataStore } from './dataStore';

const {
  mockSupabaseFrom,
  mockSupabaseSelect,
  mockSupabaseEq,
  mockSupabaseInsert,
  mockSupabaseUpdate,
  mockSupabaseDelete,
  mockSupabaseSingle,
  mockSupabaseMaybeSingle,
  mockSupabaseRpc,
} = vi.hoisted(() => ({
  mockSupabaseFrom: vi.fn(),
  mockSupabaseSelect: vi.fn(),
  mockSupabaseEq: vi.fn(),
  mockSupabaseInsert: vi.fn(),
  mockSupabaseUpdate: vi.fn(),
  mockSupabaseDelete: vi.fn(),
  mockSupabaseSingle: vi.fn(),
  mockSupabaseMaybeSingle: vi.fn(),
  mockSupabaseRpc: vi.fn(),
}));

vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: (table: string) => {
      mockSupabaseFrom(table);
      const query = {
        select: mockSupabaseSelect.mockImplementation(() => query),
        eq: mockSupabaseEq.mockResolvedValue({ data: [], error: null }),
        insert: mockSupabaseInsert.mockImplementation(() => query),
        update: mockSupabaseUpdate.mockImplementation(() => query),
        delete: mockSupabaseDelete.mockImplementation(() => query),
        single: mockSupabaseSingle.mockResolvedValue({ data: {}, error: null }),
        maybeSingle: mockSupabaseMaybeSingle.mockResolvedValue({ data: {}, error: null }),
      };
      return query;
    },
    rpc: mockSupabaseRpc.mockResolvedValue({ data: null, error: null }),
    channel: vi.fn(() => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn().mockResolvedValue(undefined),
      };
      return channel;
    }),
  },
}));

vi.mock('@/services/localDB', () => ({
  localDB: {
    upsertNote: vi.fn(),
    upsertNotes: vi.fn(),
    upsertFolders: vi.fn(),
    upsertFolder: vi.fn(),
    deleteNote: vi.fn(),
    deleteFolder: vi.fn(),
    getNotes: vi.fn().mockResolvedValue([]),
    getFolders: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const createNote = (id: string, overrides: Partial<Note> = {}): Note => ({
  id,
  owner_id: 'user-1',
  is_public: false,
  title: 'Test Note',
  content: 'Content',
  folder_path: '/',
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

const createFolder = (path: string, overrides: Partial<Folder> = {}): Folder => ({
  id: `folder-${path}`,
  owner_id: 'user-1',
  path,
  name: path.split('/').filter(Boolean).pop() || '/',
  parent_path: path === '/' ? null : `/${path.split('/').filter(Boolean).slice(0, -1).join('/')}`,
  sort_index: 0,
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-01').toISOString(),
  deleted_at: null,
  ...overrides,
});

describe('dataStore - New Features', () => {
  beforeEach(() => {
    useDataStore.setState({
      notes: {},
      folders: {},
      currentUserId: 'user-1',
      isInitialized: true,
      channels: [],
      activityCache: null,
      isCalculating: false,
    });
    vi.clearAllMocks();
  });

  it('togglePinNote should toggle is_pinned status', async () => {
    const note = createNote('note-1', { is_pinned: false });
    useDataStore.setState({ notes: { 'note-1': note } });

    await useDataStore.getState().togglePinNote('note-1');

    const updatedNote = useDataStore.getState().notes['note-1'];
    expect(updatedNote.is_pinned).toBe(true);

    await useDataStore.getState().togglePinNote('note-1');
    expect(useDataStore.getState().notes['note-1'].is_pinned).toBe(false);
  });

  it('softDeleteNote should set deleted_at', async () => {
    const note = createNote('note-1');
    useDataStore.setState({ notes: { 'note-1': note } });

    await useDataStore.getState().softDeleteNote('note-1');

    const updatedNote = useDataStore.getState().notes['note-1'];
    expect(updatedNote.deleted_at).not.toBeNull();
    expect(new Date(updatedNote.deleted_at ?? '').getTime()).toBeGreaterThan(0);
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

  it('updateNoteState should preserve reminders when not provided in update (regression guard)', async () => {
    const noteWithReminders = createNote('note-1', {
      reminders: [
        {
          id: 'reminder-1',
          note_id: 'note-1',
          owner_id: 'user-1',
          reminder_text: 'Test Reminder',
          reminder_time: new Date('2024-02-01').toISOString(),
          completed: false,
          enabled: true,
          created_at: new Date('2024-01-01').toISOString(),
          updated_at: new Date('2024-01-01').toISOString(),
          original_text: 'Test Reminder',
        },
      ],
    });
    useDataStore.setState({ notes: { 'note-1': noteWithReminders } });

    const { localDB } = await import('@/services/localDB');
    const upsertNoteSpy = vi.mocked(localDB.upsertNote);
    upsertNoteSpy.mockClear();

    useDataStore.getState().updateNoteState({
      id: 'note-1',
      owner_id: 'user-1',
      title: 'Updated Title',
      content: 'Content',
      folder_path: '/',
      tags: [],
      created_at: noteWithReminders.created_at,
      updated_at: new Date('2024-01-02').toISOString(),
      is_pinned: false,
      deleted_at: null,
    } as Note);

    const updatedNote = useDataStore.getState().notes['note-1'];
    expect(updatedNote.reminders).toHaveLength(1);
    expect(updatedNote.reminders?.[0]?.id).toBe('reminder-1');

    expect(upsertNoteSpy).toHaveBeenCalled();
    const savedNote = upsertNoteSpy.mock.calls[0][0];
    expect(savedNote.reminders).toHaveLength(1);
    expect(savedNote.reminders?.[0]?.id).toBe('reminder-1');
  });

  it('createFolder/getNotesByFolder should normalize folder paths', () => {
    useDataStore.setState({
      notes: {
        'note-1': createNote('note-1', { folder_path: '/work/project' }),
      },
      folders: {},
    });

    const created = useDataStore.getState().createFolder('  //work//project//  ');
    const notesInFolder = useDataStore.getState().getNotesByFolder('work///project/');

    expect(created).toBe('/work/project');
    expect(notesInFolder.map((note) => note.id)).toEqual(['note-1']);
  });

  it('getFolderTree should build root and nested folder nodes', () => {
    useDataStore.setState({
      notes: {
        'note-root': createNote('note-root', { folder_path: '/' }),
        'note-work': createNote('note-work', { folder_path: '/work' }),
        'note-project': createNote('note-project', { folder_path: '/work/project' }),
        'note-personal': createNote('note-personal', { folder_path: '/personal' }),
      },
      folders: {},
    });

    const tree = useDataStore.getState().getFolderTree();

    expect(tree.path).toBe('/');
    expect(tree.noteIds).toEqual(['note-root']);

    const workNode = tree.children.find((child) => child.path === '/work');
    expect(workNode).toBeDefined();
    expect(workNode?.noteIds).toEqual(['note-work']);

    const projectNode = workNode?.children.find((child) => child.path === '/work/project');
    expect(projectNode).toBeDefined();
    expect(projectNode?.noteIds).toEqual(['note-project']);

    const personalNode = tree.children.find((child) => child.path === '/personal');
    expect(personalNode).toBeDefined();
    expect(personalNode?.noteIds).toEqual(['note-personal']);
  });

  it('moveNote should update folder_path in state and call supabase update', async () => {
    const { localDB } = await import('@/services/localDB');
    const upsertFoldersSpy = vi.mocked(localDB.upsertFolders);

    useDataStore.setState({
      notes: {
        'note-1': createNote('note-1', { folder_path: '/' }),
      },
      folders: {},
    });

    await useDataStore.getState().moveNote('note-1', '  //work//ideas//  ');

    const moved = useDataStore.getState().notes['note-1'];
    const folders = useDataStore.getState().folders;

    expect(moved.folder_path).toBe('/work/ideas');
    expect(folders['/work']).toBeDefined();
    expect(folders['/work/ideas']).toBeDefined();
    expect(mockSupabaseFrom).toHaveBeenCalledWith('notes');
    expect(mockSupabaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ folder_path: '/work/ideas' }),
    );
    expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'note-1');
    expect(upsertFoldersSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ path: '/work' }),
        expect.objectContaining({ path: '/work/ideas' }),
      ]),
    );
  });

  it('initialize should preserve and default folder_path/parent_id from Supabase notes', async () => {
    mockSupabaseEq.mockResolvedValueOnce({
      data: [
        {
          id: 'note-with-folder',
          owner_id: 'user-1',
          title: 'With Folder',
          content: 'A',
          is_public: false,
          note_type: 'note',
          tags: [],
          folder_path: '/work',
          parent_id: 'parent-1',
          created_at: new Date('2024-01-01').toISOString(),
          updated_at: new Date('2024-01-02').toISOString(),
          deleted_at: null,
          is_pinned: false,
          content_preview: 'A',
          reminders: [],
        },
        {
          id: 'note-default-folder',
          owner_id: 'user-1',
          title: 'Default Folder',
          content: 'B',
          is_public: false,
          note_type: 'note',
          tags: [],
          created_at: new Date('2024-01-03').toISOString(),
          updated_at: new Date('2024-01-04').toISOString(),
          deleted_at: null,
          is_pinned: false,
          content_preview: 'B',
          reminders: [],
        },
      ],
      error: null,
    });

    useDataStore.setState({
      notes: {},
      folders: {},
      currentUserId: null,
      isInitialized: false,
      channels: [],
      activityCache: null,
      isCalculating: false,
    });

    await useDataStore.getState().initialize('user-1');

    const notes = useDataStore.getState().notes;
    expect(notes['note-with-folder']?.folder_path).toBe('/work');
    expect(notes['note-with-folder']?.parent_id).toBe('parent-1');
    expect(notes['note-default-folder']?.folder_path).toBe('/');
    expect(notes['note-default-folder']?.parent_id).toBeNull();
  });

  it('initialize should replace state when switching users without leaking prior user data', async () => {
    const { localDB } = await import('@/services/localDB');
    const getNotesSpy = vi.mocked(localDB.getNotes);
    const getFoldersSpy = vi.mocked(localDB.getFolders);

    getNotesSpy.mockImplementation(async (ownerId?: string) => {
      if (ownerId === 'user-a') {
        return [createNote('note-a', { owner_id: 'user-a', title: 'A note' })];
      }
      if (ownerId === 'user-b') {
        return [createNote('note-b', { owner_id: 'user-b', title: 'B note' })];
      }
      return [];
    });

    getFoldersSpy.mockImplementation(async (ownerId?: string) => {
      if (ownerId === 'user-a') {
        return [createFolder('/a', { owner_id: 'user-a' })];
      }
      if (ownerId === 'user-b') {
        return [createFolder('/b', { owner_id: 'user-b' })];
      }
      return [];
    });

    mockSupabaseEq.mockReset();
    mockSupabaseEq
      .mockResolvedValueOnce({
        data: [
          {
            id: 'note-a',
            owner_id: 'user-a',
            title: 'A note',
            content: 'A',
            is_public: false,
            note_type: 'note',
            tags: [],
            folder_path: '/a',
            parent_id: null,
            created_at: new Date('2024-01-01').toISOString(),
            updated_at: new Date('2024-01-01').toISOString(),
            deleted_at: null,
            is_pinned: false,
            content_preview: 'A',
            reminders: [],
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [createFolder('/a', { owner_id: 'user-a' })],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'note-b',
            owner_id: 'user-b',
            title: 'B note',
            content: 'B',
            is_public: false,
            note_type: 'note',
            tags: [],
            folder_path: '/b',
            parent_id: null,
            created_at: new Date('2024-01-01').toISOString(),
            updated_at: new Date('2024-01-01').toISOString(),
            deleted_at: null,
            is_pinned: false,
            content_preview: 'B',
            reminders: [],
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [createFolder('/b', { owner_id: 'user-b' })],
        error: null,
      });

    useDataStore.setState({
      notes: { stale: createNote('stale', { owner_id: 'stale-user' }) },
      folders: { '/stale': createFolder('/stale', { owner_id: 'stale-user' }) },
      currentUserId: null,
      isInitialized: false,
      channels: [],
      activityCache: null,
      isCalculating: false,
    });

    await useDataStore.getState().initialize('user-a');
    expect(Object.keys(useDataStore.getState().notes)).toEqual(['note-a']);
    expect(Object.keys(useDataStore.getState().folders)).toEqual(['/a']);
    expect(useDataStore.getState().currentUserId).toBe('user-a');

    await useDataStore.getState().initialize('user-b');
    expect(Object.keys(useDataStore.getState().notes)).toEqual(['note-b']);
    expect(Object.keys(useDataStore.getState().folders)).toEqual(['/b']);
    expect(useDataStore.getState().notes['note-a']).toBeUndefined();
    expect(useDataStore.getState().folders['/a']).toBeUndefined();
    expect(useDataStore.getState().currentUserId).toBe('user-b');

    expect(getNotesSpy).toHaveBeenNthCalledWith(1, 'user-a');
    expect(getNotesSpy).toHaveBeenNthCalledWith(2, 'user-b');
    expect(getFoldersSpy).toHaveBeenNthCalledWith(1, 'user-a');
    expect(getFoldersSpy).toHaveBeenNthCalledWith(2, 'user-b');
  });

  it('initialize should remain idempotent when called repeatedly for the same user', async () => {
    const { localDB } = await import('@/services/localDB');
    const getNotesSpy = vi.mocked(localDB.getNotes);
    const getFoldersSpy = vi.mocked(localDB.getFolders);

    getNotesSpy.mockResolvedValue([createNote('note-same', { owner_id: 'user-same' })]);
    getFoldersSpy.mockResolvedValue([createFolder('/same', { owner_id: 'user-same' })]);
    mockSupabaseEq.mockReset();
    mockSupabaseEq
      .mockResolvedValueOnce({
        data: [
          {
            id: 'note-same',
            owner_id: 'user-same',
            title: 'Same note',
            content: 'S',
            is_public: false,
            note_type: 'note',
            tags: [],
            folder_path: '/same',
            parent_id: null,
            created_at: new Date('2024-01-01').toISOString(),
            updated_at: new Date('2024-01-01').toISOString(),
            deleted_at: null,
            is_pinned: false,
            content_preview: 'S',
            reminders: [],
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [createFolder('/same', { owner_id: 'user-same' })],
        error: null,
      });

    useDataStore.setState({
      notes: {},
      folders: {},
      currentUserId: null,
      isInitialized: false,
      channels: [],
      activityCache: null,
      isCalculating: false,
    });

    await useDataStore.getState().initialize('user-same');
    await useDataStore.getState().initialize('user-same');

    expect(getNotesSpy).toHaveBeenCalledTimes(1);
    expect(getFoldersSpy).toHaveBeenCalledTimes(1);
    expect(mockSupabaseEq).toHaveBeenCalledTimes(2);
    expect(getNotesSpy).toHaveBeenCalledWith('user-same');
    expect(getFoldersSpy).toHaveBeenCalledWith('user-same');
    expect(useDataStore.getState().notes['note-same']).toBeDefined();
    expect(useDataStore.getState().folders['/same']).toBeDefined();
  });

  it('getFolderTree should include empty folder nodes from explicit folders state', () => {
    useDataStore.setState({
      notes: {},
      folders: {
        '/work': createFolder('/work'),
      },
    });

    const tree = useDataStore.getState().getFolderTree();
    const workNode = tree.children.find((child) => child.path === '/work');

    expect(workNode).toBeDefined();
    expect(workNode?.noteIds).toEqual([]);
  });

  it('getFolderTree should include implicit folder nodes from notes when folder rows are missing', () => {
    useDataStore.setState({
      notes: {
        'note-1': createNote('note-1', { folder_path: '/missing/path' }),
      },
      folders: {},
    });

    const tree = useDataStore.getState().getFolderTree();
    const missingNode = tree.children.find((child) => child.path === '/missing');
    const pathNode = missingNode?.children.find((child) => child.path === '/missing/path');

    expect(missingNode).toBeDefined();
    expect(pathNode).toBeDefined();
    expect(pathNode?.noteIds).toEqual(['note-1']);
  });

  it("createFolder('/work') should result in empty folder node in tree", () => {
    useDataStore.setState({ notes: {}, folders: {}, currentUserId: 'user-1' });

    const normalized = useDataStore.getState().createFolder('/work');
    const tree = useDataStore.getState().getFolderTree();
    const workNode = tree.children.find((child) => child.path === '/work');

    expect(normalized).toBe('/work');
    expect(workNode).toBeDefined();
    expect(workNode?.noteIds).toEqual([]);
  });
});
