import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import { localDB } from '@/services/localDB';
import { supabase } from '@/services/supabaseClient';
import type { ActivityData, EditorReminder, Folder, Note, Reminder } from '@/types';
import { isTauri } from '@/utils/isTauri';

interface CalculationResult {
  jobId?: number; // 워커에서만 사용, Rust invoke에서는 없음
  stats: {
    totalNotes: number;
    totalReminders: number;
    completedReminders: number;
    completionRate: number;
    tagsUsed: number;
  };
  activityData: ActivityData[];
}

interface FolderTreeNode {
  path: string;
  name: string;
  children: FolderTreeNode[];
  noteIds: string[];
}

interface DataState {
  notes: Record<string, Note>;
  folders: Record<string, Folder>;
  currentUserId: string | null;
  isInitialized: boolean;
  channels: RealtimeChannel[];
  activityCache: CalculationResult | null;
  isCalculating: boolean;
  initialize: (userId: string) => Promise<void>;
  unsubscribeAll: () => Promise<void>;
  createNote: (
    noteData: Pick<Note, 'owner_id' | 'title' | 'content' | 'tags'> & {
      reminders?: Omit<EditorReminder, 'id'>[];
    },
  ) => Promise<Note | null>;
  updateNoteState: (updatedNote: Note) => void;
  updateReminderState: (
    reminderId: string,
    updates: Partial<Reminder>,
  ) => void;
  createFolder: (path: string) => string;
  moveNote: (noteId: string, newPath: string) => Promise<void>;
  renameFolder: (oldPath: string, newPath: string) => Promise<void>;
  deleteFolder: (path: string) => Promise<void>;
  getNotesByFolder: (path: string, opts?: { recursive?: boolean }) => Note[];
  getFolderTree: () => FolderTreeNode;
  addNoteState: (newNote: Note) => void;
  removeNoteState: (noteId: string) => void;
  togglePinNote: (noteId: string) => Promise<void>;
  softDeleteNote: (noteId: string) => Promise<void>;
  restoreNote: (noteId: string) => Promise<void>;
  permanentlyDeleteNote: (noteId: string) => Promise<void>;
  calculateActivityData: (notes: Note[]) => Promise<void>;
}

let worker: Worker | null = null;
let currentJobId = 0;

// --- Folder path utilities ---

function normalizeFolderPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, '/');
  const withoutTrailingSlash = collapsed.replace(/\/+$/g, '');

  return withoutTrailingSlash || '/';
}

function doesPathMatch(targetPath: string, basePath: string): boolean {
  if (basePath === '/') {
    return true;
  }
  return targetPath === basePath || targetPath.startsWith(`${basePath}/`);
}

function getParentPath(path: string): string | null {
  const normalizedPath = normalizeFolderPath(path);
  if (normalizedPath === '/') {
    return null;
  }

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  if (lastSlashIndex <= 0) {
    return '/';
  }

  return normalizeFolderPath(normalizedPath.slice(0, lastSlashIndex));
}

function getFolderName(path: string): string {
  const normalizedPath = normalizeFolderPath(path);
  if (normalizedPath === '/') {
    return '/';
  }

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  return normalizedPath.slice(lastSlashIndex + 1);
}

function getAncestorPaths(path: string): string[] {
  const normalizedPath = normalizeFolderPath(path);
  if (normalizedPath === '/') {
    return [];
  }

  const segments = normalizedPath.slice(1).split('/').filter(Boolean);
  const result: string[] = [];
  let current = '';

  for (const segment of segments) {
    current = `${current}/${segment}`;
    result.push(normalizeFolderPath(current));
  }

  return result;
}

function remapFolderPath(path: string, oldBase: string, newBase: string): string {
  const normalizedPath = normalizeFolderPath(path);
  const normalizedOldBase = normalizeFolderPath(oldBase);
  const normalizedNewBase = normalizeFolderPath(newBase);

  if (!doesPathMatch(normalizedPath, normalizedOldBase)) {
    return normalizedPath;
  }

  const suffix =
    normalizedOldBase === '/' ? normalizedPath : normalizedPath.slice(normalizedOldBase.length);
  return normalizeFolderPath(`${normalizedNewBase}${suffix}`);
}

// --- Local DB Write Batching/Debouncing ---
const pendingNoteWrites: Map<string, Note> = new Map();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DELAY_MS = 250; // 250ms debounce

async function flushPendingWrites() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  
  if (pendingNoteWrites.size === 0) return;
  
  const notesToWrite = Array.from(pendingNoteWrites.values());
  pendingNoteWrites.clear();
  
  try {
    await localDB.upsertNotes(notesToWrite);
  } catch (err) {
    console.error('Failed to flush pending note writes:', err);
  }
}

function enqueueLocalUpsert(note: Note) {
  pendingNoteWrites.set(note.id, note);
  
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(() => {
    flushPendingWrites();
  }, FLUSH_DELAY_MS);
}

// --- Store ---

export const useDataStore = create<DataState>((set, get) => ({
  notes: {},
  folders: {},
  currentUserId: null,
  isInitialized: false,
  channels: [],
  activityCache: null,
  isCalculating: false,

  // --- Folder Operations ---

  createFolder: (path: string) => {
    const normalizedPath = normalizeFolderPath(path);
    if (normalizedPath === '/') {
      return '/';
    }

    const now = new Date().toISOString();
    const ownerId = get().currentUserId ?? Object.values(get().notes)[0]?.owner_id ?? '';
    const foldersToEnsure = getAncestorPaths(normalizedPath);
    const existingFolders = get().folders;
    const createdFolders: Folder[] = [];

    for (const folderPath of foldersToEnsure) {
      if (existingFolders[folderPath]) {
        continue;
      }

      createdFolders.push({
        id: uuidv4(),
        owner_id: ownerId,
        path: folderPath,
        name: getFolderName(folderPath),
        parent_path: getParentPath(folderPath),
        sort_index: 0,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    }

    if (createdFolders.length > 0) {
      set((state) => {
        const nextFolders = { ...state.folders };
        for (const folder of createdFolders) {
          nextFolders[folder.path] = folder;
        }
        return { folders: nextFolders };
      });

      void (async () => {
        try {
          await localDB.upsertFolders(createdFolders);
        } catch (error) {
          console.error('Failed to persist folders locally:', error);
        }

        try {
          const { error } = await supabase.from('folders').insert(createdFolders);
          if (error) {
            throw error;
          }
        } catch (error) {
          console.error('Failed to sync folders to Supabase:', error);
        }
      })();
    }

    return normalizedPath;
  },

  moveNote: async (noteId: string, newPath: string) => {
    const { notes, folders, createFolder, updateNoteState } = get();
    const note = notes[noteId];
    if (!note) return;

    const normalizedPath = normalizeFolderPath(newPath);
    if (normalizedPath !== '/' && !folders[normalizedPath]) {
      createFolder(normalizedPath);
    }

    const updatedAt = new Date().toISOString();
    const updatedNote: Note = {
      ...note,
      folder_path: normalizedPath,
      updated_at: updatedAt,
      updatedAt: new Date(updatedAt),
    };

    updateNoteState(updatedNote);

    try {
      const { error } = await supabase
        .from('notes')
        .update({ folder_path: normalizedPath, updated_at: updatedAt })
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync move note to Supabase (Local DB is updated):', error);
      // 의도적 주석 처리: offline 상태이거나 Supabase 스키마에 folder_path가 없을 때
      // UI를 원복시키지 않고 로컬에서 그대로 진행되도록 롤백(updateNoteState(note))을 무시합니다.
    }
  },

  renameFolder: async (oldPath: string, newPath: string) => {
    const normalizedOldPath = normalizeFolderPath(oldPath);
    const normalizedNewPath = normalizeFolderPath(newPath);
    if (normalizedOldPath === normalizedNewPath || normalizedOldPath === '/') return;

    try {
      const { error } = await supabase.rpc('rename_folder', {
        old_path: normalizedOldPath,
        new_path: normalizedNewPath,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to rename folder:', error);
      throw error;
    }

    const state = get();
    const now = new Date().toISOString();
    const nextNotes = { ...state.notes };
    const changedNotes: Note[] = [];

    for (const note of Object.values(state.notes)) {
      const currentPath = normalizeFolderPath(note.folder_path ?? '/');
      if (!doesPathMatch(currentPath, normalizedOldPath)) {
        continue;
      }

      const nextPath = remapFolderPath(currentPath, normalizedOldPath, normalizedNewPath);
      const nextNote: Note = {
        ...note,
        folder_path: nextPath,
        updated_at: now,
        updatedAt: new Date(now),
      };
      nextNotes[note.id] = nextNote;
      changedNotes.push(nextNote);
    }

    const nextFolders: Record<string, Folder> = {};
    const movedFolders: Folder[] = [];
    const removedFolderPaths: string[] = [];

    for (const folder of Object.values(state.folders)) {
      const folderPath = normalizeFolderPath(folder.path);
      if (!doesPathMatch(folderPath, normalizedOldPath)) {
        nextFolders[folderPath] = folder;
        continue;
      }

      const nextPath = remapFolderPath(folderPath, normalizedOldPath, normalizedNewPath);
      removedFolderPaths.push(folderPath);

      const movedFolder: Folder = {
        ...folder,
        path: nextPath,
        name: getFolderName(nextPath),
        parent_path: getParentPath(nextPath),
        updated_at: now,
      };
      nextFolders[nextPath] = movedFolder;
      movedFolders.push(movedFolder);
    }

    set({ notes: nextNotes, folders: nextFolders, activityCache: null });

    if (changedNotes.length > 0) {
      await localDB.upsertNotes(changedNotes);
    }
    if (removedFolderPaths.length > 0) {
      const ownerId =
        state.currentUserId ??
        Object.values(state.notes)[0]?.owner_id ??
        Object.values(state.folders)[0]?.owner_id;
      await Promise.all(
        removedFolderPaths.map((folderPath) =>
          typeof ownerId === 'string' && ownerId.trim().length > 0
            ? localDB.deleteFolder(ownerId, folderPath)
            : localDB.deleteFolder(folderPath),
        ),
      );
    }
    if (movedFolders.length > 0) {
      await localDB.upsertFolders(movedFolders);
    }
  },

  deleteFolder: async (path: string) => {
    const normalizedPath = normalizeFolderPath(path);
    if (normalizedPath === '/') return;

    try {
      const { error } = await supabase.rpc('delete_folder', {
        path: normalizedPath,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }

    const state = get();
    const now = new Date().toISOString();
    const nextNotes = { ...state.notes };
    const changedNotes: Note[] = [];

    for (const note of Object.values(state.notes)) {
      const currentPath = normalizeFolderPath(note.folder_path ?? '/');
      if (!doesPathMatch(currentPath, normalizedPath)) {
        continue;
      }

      const nextNote: Note = {
        ...note,
        folder_path: '/',
        updated_at: now,
        updatedAt: new Date(now),
      };
      nextNotes[note.id] = nextNote;
      changedNotes.push(nextNote);
    }

    const nextFolders: Record<string, Folder> = {};
    const removedFolderPaths: string[] = [];
    for (const folder of Object.values(state.folders)) {
      const folderPath = normalizeFolderPath(folder.path);
      if (doesPathMatch(folderPath, normalizedPath)) {
        removedFolderPaths.push(folderPath);
        continue;
      }
      nextFolders[folderPath] = folder;
    }

    set({ notes: nextNotes, folders: nextFolders, activityCache: null });

    if (changedNotes.length > 0) {
      await localDB.upsertNotes(changedNotes);
    }
    if (removedFolderPaths.length > 0) {
      const ownerId =
        state.currentUserId ??
        Object.values(state.notes)[0]?.owner_id ??
        Object.values(state.folders)[0]?.owner_id;
      await Promise.all(
        removedFolderPaths.map((folderPath) =>
          typeof ownerId === 'string' && ownerId.trim().length > 0
            ? localDB.deleteFolder(ownerId, folderPath)
            : localDB.deleteFolder(folderPath),
        ),
      );
    }
  },

  getNotesByFolder: (path: string, opts?: { recursive?: boolean }) => {
    const normalizedPath = normalizeFolderPath(path);
    const recursive = opts?.recursive ?? false;
    const notes = Object.values(get().notes);

    return notes.filter((note) => {
      const notePath = normalizeFolderPath(note.folder_path ?? '/');
      if (recursive) {
        return doesPathMatch(notePath, normalizedPath);
      }
      return notePath === normalizedPath;
    });
  },

  getFolderTree: () => {
    const root: FolderTreeNode = { path: '/', name: '/', children: [], noteIds: [] };
    const nodeByPath = new Map<string, FolderTreeNode>([['/', root]]);

    const ensureNode = (path: string): FolderTreeNode => {
      const normalizedPath = normalizeFolderPath(path);
      const existing = nodeByPath.get(normalizedPath);
      if (existing) return existing;

      const lastSlashIndex = normalizedPath.lastIndexOf('/');
      const parentPath =
        lastSlashIndex <= 0 ? '/' : normalizeFolderPath(normalizedPath.slice(0, lastSlashIndex));
      const name = normalizedPath.slice(lastSlashIndex + 1);
      const parent = ensureNode(parentPath);

      const node: FolderTreeNode = {
        path: normalizedPath,
        name,
        children: [],
        noteIds: [],
      };

      parent.children.push(node);
      nodeByPath.set(normalizedPath, node);
      return node;
    };

    for (const folder of Object.values(get().folders)) {
      ensureNode(folder.path);
    }

    for (const note of Object.values(get().notes)) {
      const folderPath = normalizeFolderPath(note.folder_path ?? '/');
      const targetNode = ensureNode(folderPath);
      targetNode.noteIds.push(note.id);
    }

    const sortTree = (node: FolderTreeNode) => {
      node.children.sort((a, b) => a.path.localeCompare(b.path));
      node.noteIds.sort((a, b) => a.localeCompare(b));
      for (const child of node.children) {
        sortTree(child);
      }
    };

    sortTree(root);
    return root;
  },

  // --- Note CRUD ---

  togglePinNote: async (noteId: string) => {
    const { notes, updateNoteState } = get();
    const note = notes[noteId];
    if (!note) return;

    const newPinnedStatus = !note.is_pinned;
    const updatedNote = { ...note, is_pinned: newPinnedStatus, updated_at: new Date().toISOString() };
    
    // Optimistic Update
    updateNoteState(updatedNote);

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: newPinnedStatus, updated_at: updatedNote.updated_at })
        .eq('id', noteId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      updateNoteState(note); // Rollback
    }
  },

  softDeleteNote: async (noteId: string) => {
    const { notes, updateNoteState } = get();
    const note = notes[noteId];
    if (!note) return;

    const deletedAt = new Date().toISOString();
    const updatedNote = { ...note, deleted_at: deletedAt, updated_at: deletedAt };

    updateNoteState(updatedNote);

    try {
      const { error } = await supabase
        .from('notes')
        .update({ deleted_at: deletedAt, updated_at: deletedAt })
        .eq('id', noteId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to soft delete note:', error);
      updateNoteState(note);
    }
  },

  restoreNote: async (noteId: string) => {
    const { notes, updateNoteState } = get();
    const note = notes[noteId];
    if (!note) return;

    const updatedNote = { ...note, deleted_at: null, updated_at: new Date().toISOString() };

    updateNoteState(updatedNote);

    try {
      const { error } = await supabase
        .from('notes')
        .update({ deleted_at: null, updated_at: updatedNote.updated_at })
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to restore note:', error);
      updateNoteState(note);
    }
  },

  permanentlyDeleteNote: async (noteId: string) => {
    const { removeNoteState, addNoteState, notes } = get();
    
    // 백업: 롤백을 위해 노트 정보 저장
    const backupNote = notes[noteId];
    if (!backupNote) return; // 존재하지 않는 노트면 종료
    
    // Optimistic
    removeNoteState(noteId);

    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) throw error;
      await supabase.from('reminders').delete().eq('note_id', noteId);
    } catch (error) {
      console.error('Failed to permanently delete note:', error);
      // 롤백: 백업된 노트를 state에 복원
      addNoteState(backupNote);
    }
  },

  calculateActivityData: async (notes: Note[]) => {
    // 새 요청이 오면 이전 계산을 취소
    currentJobId++;
    const thisJobId = currentJobId;

    set({ isCalculating: true });

    if (isTauri()) {
      try {
        const result = await invoke<CalculationResult>('calculate_activity', { notes });
        // stale 체크
        if (thisJobId === currentJobId) {
          set({ activityCache: result, isCalculating: false });
        }
        return;
      } catch (err) {
        console.error('Rust calculation failed, falling back to worker:', err);
      }
    }

    // 기존 워커가 있으면 종료하고 새로 생성
    if (worker) {
      worker.terminate();
      worker = null;
    }

    try {
      worker = new Worker(
        new URL('../workers/activityCalculator.worker.ts', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = (event: MessageEvent<CalculationResult & { jobId: number }>) => {
        // stale 결과 무시
        if (event.data.jobId !== currentJobId) {
          return;
        }
        set({ activityCache: event.data, isCalculating: false });
        if (worker) {
          worker.terminate();
          worker = null;
        }
      };

      worker.onerror = (error) => {
        console.error('Web worker error:', error);
        if (thisJobId === currentJobId) {
          set({ isCalculating: false });
        }
        if (worker) {
          worker.terminate();
          worker = null;
        }
      };

      worker.postMessage({ jobId: thisJobId, notes });
    } catch (err) {
      console.error('Failed to create web worker:', err);
      if (thisJobId === currentJobId) {
        set({ isCalculating: false });
      }
    }
  },

  createNote: async (
    noteData: Pick<Note, 'owner_id' | 'title' | 'content' | 'tags'> & {
      reminders?: Omit<EditorReminder, 'id'>[];
    },
  ): Promise<Note | null> => {
    const { addNoteState } = get();
    const newNoteId = uuidv4();
    const now = new Date().toISOString();
    const nowDate = new Date(now);

    const newNote: Note = {
      id: newNoteId,
      owner_id: noteData.owner_id,
      title: noteData.title,
      content: noteData.content,
      folder_path: '/',
      parent_id: null,
      is_public: false,
      tags: noteData.tags || [],
      created_at: now,
      updated_at: now,
      createdAt: nowDate,
      updatedAt: nowDate,
      reminders: [],
      content_preview: '',
    };

    if (noteData.reminders && noteData.reminders.length > 0) {
      newNote.reminders = noteData.reminders
        .filter(reminder => reminder.date instanceof Date && !Number.isNaN(reminder.date.getTime()))
        .map(reminder => ({
          id: uuidv4(),
          note_id: newNoteId,
          owner_id: noteData.owner_id,
          reminder_text: reminder.text,
          reminder_time: reminder.date.toISOString(),
          completed: reminder.completed || false,
          enabled: reminder.enabled ?? true,
          original_text: reminder.original_text,
          created_at: now,
          updated_at: now,
        }));
    }

    // 1. Optimistic Update & Local DB Save
    addNoteState(newNote);
    await localDB.upsertNote(newNote, false);

    try {
      // 2. Sync to Supabase
      const { data: noteResult, error: noteError } = await supabase
        .from('notes')
        .insert([
          {
            id: newNoteId,
            owner_id: noteData.owner_id,
            title: noteData.title,
            content: noteData.content,
            folder_path: '/',
            parent_id: null,
            tags: noteData.tags,
          },
        ])
        .select()
        .single();

      if (noteError) throw noteError;

      if (newNote.reminders && newNote.reminders.length > 0) {
        const reminderInserts = newNote.reminders.map(r => ({
          id: r.id,
          note_id: noteResult.id,
          owner_id: noteData.owner_id,
          reminder_text: r.reminder_text,
          reminder_time: r.reminder_time,
          completed: r.completed,
          enabled: r.enabled,
          original_text: r.original_text,
        }));

        const { error: reminderError } = await supabase
          .from('reminders')
          .insert(reminderInserts);
        
        if (reminderError) {
          console.error('Failed to sync reminders to server:', reminderError);
        }
      }

      // Mark as synced in local DB
      await localDB.upsertNote(newNote, true);
      return newNote;
    } catch (err) {
      console.error('Failed to create note online, saving locally only:', err);
      return newNote;
    }
  },

  // --- State mutation helpers ---

  updateNoteState: (updatedNote: Note) => {
    set((state) => {
      const existingNote = state.notes[updatedNote.id];
      let mergedNote: Note;

      if (existingNote) {
        const existingDate = new Date(existingNote.updated_at).getTime();
        const newDate = new Date(updatedNote.updated_at).getTime();
        if (newDate >= existingDate) {
          // 병합: 기존 note와 updatedNote를 합침
          mergedNote = { ...existingNote, ...updatedNote };

          // updatedNote에 reminders 프로퍼티가 없으면 기존 reminders 유지
          if (!('reminders' in updatedNote) && existingNote.reminders) {
            mergedNote.reminders = existingNote.reminders;
          }
        } else {
          // 기존 데이터가 더 최신이면 변경하지 않음
          return state;
        }
      } else {
        // Realtime INSERT 이벤트 등으로 노트가 새로 추가될 때
        mergedNote = updatedNote;
      }

      // Sync to local DB (배칭)
      enqueueLocalUpsert(mergedNote);

      return {
        notes: {
          ...state.notes,
          [mergedNote.id]: mergedNote,
        },
        activityCache: null,
      };
    });
  },

  updateReminderState: (reminderId: string, updates: Partial<Reminder>) => {
    set((state) => {
      const newNotes = { ...state.notes };
      for (const noteId in newNotes) {
        const note = newNotes[noteId];
        const reminderIndex = (note.reminders || []).findIndex(
          (r) => r.id === reminderId,
        );
        if (reminderIndex > -1) {
          const newReminders = [...note.reminders];
          newReminders[reminderIndex] = {
            ...newReminders[reminderIndex],
            ...updates,
          };
          const updatedNote = { ...note, reminders: newReminders };
          newNotes[noteId] = updatedNote;

          // Sync to local DB (배칭)
          enqueueLocalUpsert(updatedNote);
          break;
        }
      }
      return { notes: newNotes, activityCache: null };
    });
  },

  addNoteState: (newNote: Note) => {
    enqueueLocalUpsert(newNote);
    set((state) => ({
      notes: {
        ...state.notes,
        [newNote.id]: newNote,
      },
      activityCache: null,
    }));
  },

  removeNoteState: (noteId: string) => {
    localDB.deleteNote(noteId);
    set((state) => {
      const newNotes = { ...state.notes };
      delete newNotes[noteId];
      return { notes: newNotes, activityCache: null };
    });
  },

  // --- Initialization & Realtime ---

  initialize: async (userId: string) => {
    const { isInitialized, currentUserId } = get();
    if (isInitialized && currentUserId === userId) return;

    await get().unsubscribeAll();

    if (currentUserId !== userId) {
      set({
        notes: {},
        folders: {},
        activityCache: null,
        channels: [],
      });
    }

    set({ isInitialized: true, currentUserId: userId });

    let formattedLocalNotes: Record<string, Note> = {};
    let formattedLocalFolders: Record<string, Folder> = {};

    // 1. Load from Local DB first (Fast!)
    try {
      const [localNotes, localFolders] = await Promise.all([
        localDB.getNotes(userId),
        localDB.getFolders(userId),
      ]);

      formattedLocalNotes = localNotes.reduce(
        (acc, note) => {
          acc[note.id] = note;
          return acc;
        },
        {} as Record<string, Note>,
      );

      formattedLocalFolders = localFolders.reduce(
        (acc, folder) => {
          const normalizedPath = normalizeFolderPath(folder.path);
          acc[normalizedPath] = {
            ...folder,
            path: normalizedPath,
            name: folder.name || getFolderName(normalizedPath),
            parent_path: folder.parent_path ? normalizeFolderPath(folder.parent_path) : getParentPath(normalizedPath),
            sort_index: folder.sort_index ?? 0,
          };
          return acc;
        },
        {} as Record<string, Folder>,
      );

      if (Object.keys(formattedLocalNotes).length > 0 || Object.keys(formattedLocalFolders).length > 0) {
        set({ notes: formattedLocalNotes, folders: formattedLocalFolders, activityCache: null });
        console.log('Loaded notes/folders from Local DB');
      }
    } catch (err) {
      console.error('Failed to load from local DB:', err);
    }

    // 2. Fetch from Supabase and sync
    try {
      const [{ data: noteData, error: notesError }, { data: folderData, error: foldersError }] =
        await Promise.all([
          supabase
            .from('notes')
            .select(
              'id, title, owner_id, is_public, note_type, tags, folder_path, parent_id, created_at, updated_at, deleted_at, is_pinned, content_preview, reminders(*)',
            )
            .eq('owner_id', userId),
          supabase
            .from('folders')
            .select('id, owner_id, path, name, parent_path, sort_index, created_at, updated_at, deleted_at')
            .eq('owner_id', userId),
        ]);

      if (notesError) throw notesError;
      if (foldersError) throw foldersError;

      const formattedNotes = (noteData ?? []).reduce(
        (acc, note) => {
          const formatted = {
            ...note,
            folder_path: note.folder_path ?? '/',
            parent_id: note.parent_id ?? null,
            createdAt: new Date(note.created_at),
            updatedAt: new Date(note.updated_at),
            reminders: note.reminders || [],
            is_pinned: note.is_pinned || false,
            deleted_at: note.deleted_at || null,
          };
          acc[note.id] = formatted;
          return acc;
        },
        {} as Record<string, Note>,
      );

      const formattedRemoteFolders = (folderData ?? []).reduce(
        (acc, folder) => {
          const normalizedPath = normalizeFolderPath(folder.path);
          acc[normalizedPath] = {
            ...folder,
            path: normalizedPath,
            name: folder.name || getFolderName(normalizedPath),
            parent_path: folder.parent_path
              ? normalizeFolderPath(folder.parent_path)
              : getParentPath(normalizedPath),
            sort_index: folder.sort_index ?? 0,
          } as Folder;
          return acc;
        },
        {} as Record<string, Folder>,
      );

      // Bulk sync fetched data to local DB
      await localDB.upsertNotes(Object.values(formattedNotes));
      await localDB.upsertFolders(Object.values(formattedRemoteFolders));

      set({
        notes: formattedNotes,
        folders: { ...formattedLocalFolders, ...formattedRemoteFolders },
        activityCache: null,
      });
    } catch (err) {
      console.error('Online initialization failed, running in offline mode:', err);
      set({ channels: [] });
      return; // 오프라인 모드에서는 리얼타임 구독 스킵
    }

    // 3. Setup Realtime subscriptions
    const handleNoteChange = (payload: RealtimePostgresChangesPayload<Note>) => {
      if (payload.eventType === 'INSERT') {
        get().addNoteState({ ...(payload.new as Note), reminders: [] });
      } else if (payload.eventType === 'UPDATE') {
        get().updateNoteState(payload.new as Note);
      } else if (payload.eventType === 'DELETE') {
        get().removeNoteState((payload.old as { id: string }).id);
      }
    };

    const notesChannel = supabase
      .channel(`notes-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `owner_id=eq.${userId}`,
        },
        handleNoteChange,
      )
      .subscribe();

    const remindersChannel = supabase
      .channel(`reminders-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reminders',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          const newReminder = payload.new as Reminder;
          const noteId = newReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              const updatedNote = {
                ...targetNote,
                reminders: [...(targetNote.reminders || []), newReminder],
              };
              enqueueLocalUpsert(updatedNote);
              return {
                notes: {
                  ...state.notes,
                  [noteId]: updatedNote,
                },
              };
            }
            return state;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reminders',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          const updatedReminder = payload.new as Reminder;
          const noteId = updatedReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              const updatedNote = {
                ...targetNote,
                reminders: (targetNote.reminders || []).map((r) =>
                  r.id === updatedReminder.id ? updatedReminder : r,
                ),
              };
              enqueueLocalUpsert(updatedNote);
              return {
                notes: {
                  ...state.notes,
                  [noteId]: updatedNote,
                },
              };
            }
            return state;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reminders',
          filter: `owner_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Note>) => {
          const oldReminder = payload.old as { id: string; note_id: string };
          const noteId = oldReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              const updatedNote = {
                ...targetNote,
                reminders: (targetNote.reminders || []).filter(
                  (r) => r.id !== oldReminder.id,
                ),
              };
              enqueueLocalUpsert(updatedNote);
              return {
                notes: {
                  ...state.notes,
                  [noteId]: updatedNote,
                },
              };
            }
            return state;
          });
        },
      )
      .subscribe();

    set({ channels: [notesChannel, remindersChannel] });
  },

  unsubscribeAll: async () => {
    if (worker) {
      worker.terminate();
      worker = null;
    }

    // 남은 배칭 쓰기 플러시
    await flushPendingWrites();

    const { channels } = get();
    if (channels.length > 0) {
      await Promise.all(channels.map((c) => c.unsubscribe()));
      set({ channels: [] });
    }
  },
}));