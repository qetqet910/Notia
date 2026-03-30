import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Folder, Note } from '@/types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();
const mockIsTauri = vi.fn();
const mockLoad = vi.fn().mockResolvedValue({
  execute: mockExecute,
  select: mockSelect,
});

vi.mock('@/utils/isTauri', () => ({
  isTauri: () => mockIsTauri(),
}));

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: (...args: unknown[]) => mockLoad(...args),
  },
}));

type StoreSchema = {
  keyPath?: string;
  autoIncrement?: boolean;
  records: Map<string, unknown>;
  counter: number;
  indexes: Map<string, string>;
};

type DBEntry = {
  version: number;
  objectStoreNames: { contains: (name: string) => boolean };
  createObjectStore: (name: string, options?: { keyPath?: string; autoIncrement?: boolean }) => void;
  deleteObjectStore: (name: string) => void;
  transaction: (storeName: string, _mode: IDBTransactionMode) => {
    objectStore: (name: string) => {
      keyPath?: string | string[];
      indexNames: { contains: (name: string) => boolean };
      createIndex: (name: string, keyPath: string) => unknown;
      getAll: () => IDBRequest;
      put: (value: unknown) => IDBRequest;
      delete: (key: string) => IDBRequest;
    };
  };
  stores: Map<string, StoreSchema>;
};

function createIndexedDBMock(): IDBFactory {
  const dbRegistry = new Map<string, DBEntry>();

  const createRequest = () => ({
    onsuccess: null as ((this: IDBRequest, ev: Event) => unknown) | null,
    onerror: null as ((this: IDBRequest, ev: Event) => unknown) | null,
    result: undefined as unknown,
    error: null as DOMException | null,
  });

  const createDBEntry = (version: number): DBEntry => {
    const stores = new Map<string, StoreSchema>();

    const entry: DBEntry = {
      version,
      stores,
      objectStoreNames: {
        contains: (storeName: string) => stores.has(storeName),
      },
      createObjectStore: (storeName: string, options?: { keyPath?: string; autoIncrement?: boolean }) => {
        if (stores.has(storeName)) return;
        stores.set(storeName, {
          keyPath: options?.keyPath,
          autoIncrement: options?.autoIncrement,
          records: new Map<string, unknown>(),
          counter: 0,
          indexes: new Map<string, string>(),
        });
      },
      deleteObjectStore: (storeName: string) => {
        stores.delete(storeName);
      },
  transaction: (storeName: string, mode: IDBTransactionMode) => {
        void mode;
        return {
          objectStore: (requestedStoreName: string) => {
          const schema = stores.get(requestedStoreName ?? storeName);
          if (!schema) {
            throw new Error(`Object store does not exist: ${requestedStoreName}`);
          }

          const fireSuccess = (idbRequest: IDBRequest, result: unknown) => {
            queueMicrotask(() => {
              (idbRequest as unknown as { result: unknown }).result = result;
              idbRequest.onsuccess?.call(idbRequest, { target: idbRequest } as unknown as Event);
            });
          };

          return {
            keyPath: schema.keyPath,
            indexNames: {
              contains: (indexName: string) => schema.indexes.has(indexName),
            },
            createIndex: (indexName: string, keyPath: string) => {
              schema.indexes.set(indexName, keyPath);
              return {};
            },
            getAll: () => {
              const idbRequest = createRequest() as unknown as IDBRequest;
              fireSuccess(idbRequest, Array.from(schema.records.values()));
              return idbRequest;
            },
            put: (value: unknown) => {
              const idbRequest = createRequest() as unknown as IDBRequest;
              const keyPath = schema.keyPath;

              if (keyPath && typeof value === 'object' && value !== null && keyPath in (value as Record<string, unknown>)) {
                const key = String((value as Record<string, unknown>)[keyPath]);
                schema.records.set(key, value);
              } else if (schema.autoIncrement) {
                schema.counter += 1;
                schema.records.set(String(schema.counter), value);
              } else {
                throw new Error('Missing keyPath value and no autoIncrement configured');
              }

              fireSuccess(idbRequest, undefined);
              return idbRequest;
            },
            delete: (key: string) => {
              const idbRequest = createRequest() as unknown as IDBRequest;
              schema.records.delete(String(key));
              fireSuccess(idbRequest, undefined);
              return idbRequest;
            },
          };
        },
        };
      },
    };

    return entry;
  };

  const factory: Partial<IDBFactory> = {
    open: ((name: string, version?: number) => {
      const request = createRequest() as unknown as IDBOpenDBRequest;

      queueMicrotask(() => {
        let dbEntry = dbRegistry.get(name);
        const requestedVersion = version ?? 1;
        const isNew = !dbEntry;

        if (!dbEntry) {
          dbEntry = createDBEntry(0);
          dbRegistry.set(name, dbEntry);
        }

        const shouldUpgrade = isNew || requestedVersion > dbEntry.version;

        (request as unknown as { result: unknown }).result = dbEntry as unknown as IDBDatabase;

        if (shouldUpgrade && request.onupgradeneeded) {
          (request as unknown as { transaction: unknown }).transaction = dbEntry.transaction('', 'versionchange');
          request.onupgradeneeded.call(request, { target: request } as unknown as Event);
          dbEntry.version = requestedVersion;
        }

        request.onsuccess?.call(request, { target: request } as unknown as Event);
      });

      return request;
    }) as IDBFactory['open'],
    cmp: (() => 0) as IDBFactory['cmp'],
    databases: (async () => []) as IDBFactory['databases'],
    deleteDatabase: (() => createRequest() as unknown as IDBOpenDBRequest) as unknown as IDBFactory['deleteDatabase'],
  };

  return factory as IDBFactory;
}

async function getLocalDB() {
  const mod = await import('@/services/localDB');
  return mod.localDB;
}

describe('LocalDB Service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).indexedDB;
  });

  describe('Tauri Environment', () => {
    beforeEach(() => {
      mockIsTauri.mockReturnValue(true);
    });

    it('should initialize SQLite DB', async () => {
      const localDB = await getLocalDB();
      await localDB.init();

      expect(mockLoad).toHaveBeenCalledWith('sqlite:notia.db');
      expect(mockExecute).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS folders'));
    });

    it('upsertNote should execute insert query', async () => {
      const localDB = await getLocalDB();
      await localDB.init();

      const mockNote: Partial<Note> = {
        id: '1',
        owner_id: 'user1',
        title: 'Test Note',
        content: 'Content',
        tags: ['tag1'],
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        reminders: [],
      };

      await localDB.upsertNote(mockNote as Note);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notes'),
        expect.arrayContaining(['1', 'user1', 'Test Note']),
      );
    });

    it('getFolders should select non-deleted folders', async () => {
      const localDB = await getLocalDB();
      await localDB.init();
      mockSelect.mockResolvedValueOnce([
        {
          id: 'folder-1',
          owner_id: 'user1',
          path: '/work',
          name: 'work',
          parent_path: '/',
          sort_index: 2,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          deleted_at: null,
        },
      ]);

      const folders = await localDB.getFolders();

      expect(folders).toHaveLength(1);
      expect(folders[0].path).toBe('/work');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM folders WHERE deleted_at IS NULL'));
    });

    it('getFolders(ownerId) should scope by owner_id', async () => {
      const localDB = await getLocalDB();
      await localDB.init();
      mockSelect.mockResolvedValueOnce([
        {
          id: 'folder-a',
          owner_id: 'userA',
          path: '/a',
          name: 'A',
          parent_path: '/',
          sort_index: 0,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          deleted_at: null,
        },
      ]);

      const folders = await localDB.getFolders('userA');

      expect(folders).toHaveLength(1);
      expect(folders[0].owner_id).toBe('userA');
      expect(folders.some((folder) => folder.owner_id === 'userB')).toBe(false);
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM folders WHERE owner_id = ? AND deleted_at IS NULL'),
        ['userA'],
      );
    });

    it('getNotes(ownerId) should scope notes and reminders by owner_id', async () => {
      const localDB = await getLocalDB();
      await localDB.init();
      mockSelect
        .mockResolvedValueOnce([
          {
            id: 'note-a',
            owner_id: 'userA',
            title: 'A note',
            content: 'content',
            folder_path: '/',
            parent_id: null,
            tags: '[]',
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            deleted_at: null,
            is_pinned: 0,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'rem-a',
            note_id: 'note-a',
            owner_id: 'userA',
            reminder_text: 'reminder',
            reminder_time: '2023-01-01T10:00:00Z',
            completed: 0,
            enabled: 1,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            original_text: 'reminder',
          },
        ]);

      const notes = await localDB.getNotes('userA');

      expect(notes).toHaveLength(1);
      expect(notes[0].owner_id).toBe('userA');
      expect(notes.some((note) => note.owner_id === 'userB')).toBe(false);
      expect(mockSelect).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT * FROM notes WHERE owner_id = ? AND is_deleted = 0'),
        ['userA'],
      );
      expect(mockSelect).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM reminders WHERE owner_id = ?',
        ['userA'],
      );
    });

    it('upsertFolder should conflict on owner/path and update id', async () => {
      const localDB = await getLocalDB();
      await localDB.init();

      const folder: Folder = {
        id: 'folder-1',
        owner_id: 'user1',
        path: '/work',
        name: 'work',
        parent_path: '/',
        sort_index: 1,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      await localDB.upsertFolder(folder);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT(owner_id, path) DO UPDATE SET'),
        expect.arrayContaining(['folder-1', 'user1', '/work', 'work']),
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('id = excluded.id'),
        expect.arrayContaining(['folder-1', 'user1', '/work', 'work']),
      );

      await localDB.deleteFolder('user1', '/work');
      expect(mockExecute).toHaveBeenCalledWith('DELETE FROM folders WHERE owner_id = ? AND path = ?', ['user1', '/work']);
    });

    it('upsertFolders should batch upsert folder records', async () => {
      const localDB = await getLocalDB();
      await localDB.init();

      const folders: Folder[] = [
        {
          id: 'folder-1',
          owner_id: 'user1',
          path: '/work',
          name: 'work',
          parent_path: '/',
          sort_index: 1,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
        {
          id: 'folder-2',
          owner_id: 'user1',
          path: '/ideas',
          name: 'ideas',
          parent_path: '/',
          sort_index: 2,
          created_at: '2023-01-01',
          updated_at: '2023-01-02',
        },
      ];

      await localDB.upsertFolders(folders);

      expect(mockExecute).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT(owner_id, path) DO UPDATE SET'),
        expect.any(Array),
      );
      expect(mockExecute).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('WebDB fallback', () => {
    beforeEach(() => {
      mockIsTauri.mockReturnValue(false);
      (globalThis as Record<string, unknown>).indexedDB = createIndexedDBMock();
    });

    it('should persist folders in IndexedDB fallback', async () => {
      const localDB = await getLocalDB();
      const folder: Folder = {
        id: 'web-folder-1',
        owner_id: 'user-web',
        path: '/ideas',
        name: 'ideas',
        parent_path: '/',
        sort_index: 0,
        created_at: '2023-01-02',
        updated_at: '2023-01-02',
      };

      await localDB.upsertFolder(folder);
      expect(await localDB.getFolders(folder.owner_id)).toEqual([folder]);

      await localDB.deleteFolder(folder.owner_id, folder.path);
      expect(await localDB.getFolders()).toEqual([]);
    });

    it('should not leak legacy folders to real users in IndexedDB fallback', async () => {
      const localDB = await getLocalDB();

      await localDB.upsertFolder({
        id: 'legacy-folder',
        owner_id: '__legacy__',
        path: '/legacy',
        name: 'legacy',
        parent_path: '/',
        sort_index: 0,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      });

      await localDB.upsertFolder({
        id: 'real-folder',
        owner_id: 'user-real',
        path: '/real',
        name: 'real',
        parent_path: '/',
        sort_index: 0,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      });

      const realUserFolders = await localDB.getFolders('user-real');
      expect(realUserFolders).toHaveLength(1);
      expect(realUserFolders[0].path).toBe('/real');
      expect(realUserFolders.some((folder) => folder.path === '/legacy')).toBe(false);
    });
  });
});
