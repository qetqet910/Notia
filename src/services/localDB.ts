import Database from '@tauri-apps/plugin-sql';
import type { Folder, Note } from '@/types';
import { isTauri } from '@/utils/isTauri';

interface SqliteNoteRow {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  folder_path?: string | null;
  parent_id?: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_pinned: number;
}

interface SqliteReminderRow {
  id: string;
  note_id: string;
  owner_id: string;
  reminder_text: string;
  reminder_time: string;
  completed: number;
  enabled: number;
  created_at: string;
  updated_at: string;
  original_text: string;
}

interface SqliteFolderRow {
  id: string;
  owner_id: string;
  path: string;
  name: string;
  parent_path: string | null;
  sort_index: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// DB 이름 설정
const DB_NAME = 'notia.db';

// 웹 환경을 위한 IndexedDB 래퍼 (간단한 구현)
class WebDB {
  private dbName = 'NotiaWebDB';
  private version = 4;
  private foldersStoreName = 'folders_v4';
  private legacyFoldersStoreName = 'folders';
  private db: IDBDatabase | null = null;

  private getFoldersStoreName() {
    if (!this.db) {
      return this.foldersStoreName;
    }

    if (this.db.objectStoreNames.contains(this.foldersStoreName)) {
      return this.foldersStoreName;
    }

    return this.legacyFoldersStoreName;
  }

  async init() {
    if (this.db) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const openRequest = event.target as IDBOpenDBRequest;
        const db = openRequest.result;
        const upgradeTransaction = openRequest.transaction;

        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }

        const notesStore = upgradeTransaction?.objectStore('notes');
        if (notesStore && !notesStore.indexNames.contains('owner_id')) {
          notesStore.createIndex('owner_id', 'owner_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.foldersStoreName)) {
          db.createObjectStore(this.foldersStoreName, { keyPath: 'owner_path' });
        }

        const hasLegacyFolders = db.objectStoreNames.contains(this.legacyFoldersStoreName);
        const legacyFoldersStore = hasLegacyFolders
          ? upgradeTransaction?.objectStore(this.legacyFoldersStoreName)
          : undefined;
        const migratedFoldersStore = upgradeTransaction?.objectStore(this.foldersStoreName);

        if (legacyFoldersStore && migratedFoldersStore) {
          const getAllRequest = legacyFoldersStore.getAll();
          getAllRequest.onsuccess = () => {
            const legacyFolders = (getAllRequest.result as Folder[] | undefined) ?? [];
            for (const folder of legacyFolders) {
              const ownerId = folder.owner_id || '__legacy__';
              migratedFoldersStore.put({
                ...folder,
                owner_id: ownerId,
                owner_path: `${ownerId}:${folder.path}`,
              });
            }
          };
        }

        if (!db.objectStoreNames.contains('pending_changes')) {
          db.createObjectStore('pending_changes', { autoIncrement: true });
        }
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_query: string, _values?: unknown[]) {
    console.warn('WebDB execute is not fully implemented for raw SQL. Use dedicated methods.');
    return [];
  }
  
  // IndexedDB 헬퍼 메서드들...
  async getAllNotes(): Promise<Note[]> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const tx = this.db.transaction('notes', 'readonly');
          const store = tx.objectStore('notes');
          const getAll = store.getAll();
          getAll.onsuccess = () => resolve(getAll.result);
          getAll.onerror = () => reject(getAll.error);
      });
  }

  async getNotesByOwner(ownerId: string): Promise<Note[]> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const tx = this.db.transaction('notes', 'readonly');
          const store = tx.objectStore('notes');
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            const notes = (getAll.result as Note[]).filter((note) => note.owner_id === ownerId);
            resolve(notes);
          };
          getAll.onerror = () => reject(getAll.error);
      });
  }

  async saveNote(note: Note): Promise<void> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const tx = this.db.transaction('notes', 'readwrite');
          const store = tx.objectStore('notes');
          const put = store.put(note);
          put.onsuccess = () => resolve();
          put.onerror = () => reject(put.error);
      });
  }
  
  async deleteNote(id: string): Promise<void> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const tx = this.db.transaction('notes', 'readwrite');
          const store = tx.objectStore('notes');
          const del = store.delete(id);
          del.onsuccess = () => resolve();
          del.onerror = () => reject(del.error);
      });
  }

  async getAllFolders(): Promise<Folder[]> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const foldersStoreName = this.getFoldersStoreName();
          const tx = this.db.transaction(foldersStoreName, 'readonly');
          const store = tx.objectStore(foldersStoreName);
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            // Drop owner_path from resulting Folder objects to avoid unused var lint error
            const folders = (getAll.result as Array<Folder & { owner_path?: string }>).map(({ owner_path, ...folder }) => folder);
            resolve(folders);
          };
          getAll.onerror = () => reject(getAll.error);
      });
  }

  async getFoldersByOwner(ownerId: string): Promise<Folder[]> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const foldersStoreName = this.getFoldersStoreName();
          const tx = this.db.transaction(foldersStoreName, 'readonly');
          const store = tx.objectStore(foldersStoreName);
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            const folders = (getAll.result as Array<Folder & { owner_path?: string }>)
              .filter((folder) => folder.owner_id === ownerId)
              .map(({ owner_path, ...folder }) => folder);
            resolve(folders);
          };
          getAll.onerror = () => reject(getAll.error);
      });
  }

  async saveFolder(folder: Folder): Promise<void> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const foldersStoreName = this.getFoldersStoreName();
          const tx = this.db.transaction(foldersStoreName, 'readwrite');
          const store = tx.objectStore(foldersStoreName);
          const put = store.put({
            ...folder,
            owner_path: `${folder.owner_id}:${folder.path}`,
          });
          put.onsuccess = () => resolve();
          put.onerror = () => reject(put.error);
      });
  }

  async deleteFolder(ownerId: string, path: string): Promise<void> {
      await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject(new Error("DB not initialized"));
          const foldersStoreName = this.getFoldersStoreName();
          const tx = this.db.transaction(foldersStoreName, 'readwrite');
          const store = tx.objectStore(foldersStoreName);
          const keyPath = Array.isArray(store.keyPath) ? store.keyPath[0] : store.keyPath;
          const delKey = keyPath === 'path' ? path : `${ownerId}:${path}`;
          const del = store.delete(delKey);
          del.onsuccess = () => resolve();
          del.onerror = () => reject(del.error);
      });
  }
}

class LocalDBService {
  private db: Database | null = null;
  private webDb: WebDB | null = null;
  private isReady = false;

  async init() {
    if (this.isReady) return;

    if (isTauri()) {
      try {
        this.db = await Database.load(`sqlite:${DB_NAME}`);
        await this.initTables();
        this.isReady = true;
        console.log('Local SQLite DB initialized');
        return; // Success, return early
      } catch (error) {
        console.error('Failed to init SQLite, falling back to WebDB:', error);
        // Fallback to WebDB continues below
      }
    }

    // WebDB initialization (Fallback or default)
    this.webDb = new WebDB();
    await this.webDb.init();
    this.isReady = true;
    console.log('Local IndexedDB initialized');
  }

  private async initTables() {
    if (!this.db) return;

    // 노트 테이블
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        owner_id TEXT,
        title TEXT,
        content TEXT,
        folder_path TEXT DEFAULT '/',
        parent_id TEXT,
        tags TEXT, -- JSON string array
        created_at TEXT,
        updated_at TEXT,
        is_synced INTEGER DEFAULT 1, -- 0: unsynced, 1: synced
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        is_pinned INTEGER DEFAULT 0
      )
    `);

    // Migration for existing tables
    try {
      await this.db.execute('ALTER TABLE notes ADD COLUMN deleted_at TEXT');
    } catch { /* ignore if exists */ }
    try {
      await this.db.execute('ALTER TABLE notes ADD COLUMN is_pinned INTEGER DEFAULT 0');
    } catch { /* ignore if exists */ }
    try {
      await this.db.execute("ALTER TABLE notes ADD COLUMN folder_path TEXT DEFAULT '/'");
    } catch { /* ignore if exists */ }
    try {
      await this.db.execute('ALTER TABLE notes ADD COLUMN parent_id TEXT');
    } catch { /* ignore if exists */ }

    // 리마인더 테이블
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        note_id TEXT,
        owner_id TEXT,
        reminder_text TEXT,
        reminder_time TEXT,
        completed INTEGER, -- 0 or 1
        enabled INTEGER, -- 0 or 1
        created_at TEXT,
        updated_at TEXT,
        original_text TEXT,
        FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);
    
    // 오프라인 변경 사항 큐 (단순화된 버전)
    await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT, -- 'CREATE', 'UPDATE', 'DELETE'
            table_name TEXT, -- 'notes', 'reminders'
            record_id TEXT,
            data TEXT, -- JSON string of the payload
            created_at TEXT
        )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        parent_path TEXT,
        sort_index INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        UNIQUE(owner_id, path)
      )
    `);

    try {
      await this.db.execute('ALTER TABLE folders ADD COLUMN parent_path TEXT');
    } catch { /* ignore if exists */ }
    try {
      await this.db.execute('ALTER TABLE folders ADD COLUMN sort_index INTEGER DEFAULT 0');
    } catch { /* ignore if exists */ }
    try {
      await this.db.execute('ALTER TABLE folders ADD COLUMN deleted_at TEXT');
    } catch { /* ignore if exists */ }
  }

  // --- Note Operations ---

  async upsertNotes(notes: Note[], isSynced: boolean = true) {
      await this.init();
      if (isTauri() && this.db) {
          try {
              await this.db.execute('BEGIN TRANSACTION');
              for (const note of notes) {
                  await this.upsertNote(note, isSynced); 
              }
              await this.db.execute('COMMIT');
          } catch (error) {
              await this.db.execute('ROLLBACK');
              console.error('Failed to batch upsert notes:', error);
              throw error;
          }
      } else if (this.webDb) {
          for (const note of notes) {
              await this.webDb.saveNote(note);
          }
      }
  }

  async upsertNote(note: Note, isSynced: boolean = true) {
    await this.init();
    
    if (isTauri() && this.db) {
      const tagsJson = JSON.stringify(note.tags || []);
      const syncedVal = isSynced ? 1 : 0;
      
      await this.db.execute(`
        INSERT INTO notes (id, owner_id, title, content, tags, created_at, updated_at, is_synced, deleted_at, is_pinned, folder_path, parent_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          tags = excluded.tags,
          updated_at = excluded.updated_at,
          is_synced = excluded.is_synced,
          deleted_at = excluded.deleted_at,
          is_pinned = excluded.is_pinned,
          folder_path = excluded.folder_path,
          parent_id = excluded.parent_id
      `, [
          note.id, note.owner_id, note.title, note.content || '', tagsJson, 
          note.created_at, note.updated_at, syncedVal, 
          note.deleted_at || null, note.is_pinned ? 1 : 0,
          note.folder_path || '/', note.parent_id ?? null
      ]);

      // Handle Reminders - 조건부로만 삭제/재삽입
      // 'reminders' 프로퍼티가 명시적으로 존재할 때만 로컬 reminders 테이블을 건드림
      // 이는 realtime UPDATE payload가 reminders를 포함하지 않을 때 데이터 손실을 방지
      if ('reminders' in note) {
        await this.db.execute('DELETE FROM reminders WHERE note_id = $1', [note.id]);
        
        if (note.reminders && note.reminders.length > 0) {
          for (const r of note.reminders) {
               await this.db.execute(`
                  INSERT INTO reminders (id, note_id, owner_id, reminder_text, reminder_time, completed, enabled, created_at, updated_at, original_text)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               `, [
                   r.id, r.note_id, r.owner_id, r.reminder_text, r.reminder_time, 
                   r.completed ? 1 : 0, r.enabled ? 1 : 0, 
                   r.created_at, r.updated_at, r.original_text
               ]);
          }
        }
        // reminders가 빈 배열이면 delete만 수행 (의도적 비우기)
      }
      // reminders 프로퍼티가 아예 없으면 로컬 reminders 테이블을 건드리지 않음

    } else if (this.webDb) {
      await this.webDb.saveNote(note);
    }
  }

  async getNotes(ownerId?: string): Promise<Note[]> {
    await this.init();

    if (isTauri() && this.db) {
      const notesResult = ownerId
        ? await this.db.select<SqliteNoteRow[]>(
          'SELECT * FROM notes WHERE owner_id = $1 AND is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC',
          [ownerId],
        )
        : await this.db.select<SqliteNoteRow[]>(
          'SELECT * FROM notes WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC',
        );
      
      if (notesResult.length === 0) return [];

      // Fetch all reminders in one go to avoid N+1
      const allReminders = ownerId
        ? await this.db.select<SqliteReminderRow[]>('SELECT * FROM reminders WHERE owner_id = $1', [ownerId])
        : await this.db.select<SqliteReminderRow[]>('SELECT * FROM reminders');
      const remindersMap = new Map<string, SqliteReminderRow[]>();
      
      for (const r of allReminders) {
          if (!remindersMap.has(r.note_id)) {
              remindersMap.set(r.note_id, []);
          }
          remindersMap.get(r.note_id)?.push(r);
      }

      const notes: Note[] = [];

      for (const row of notesResult) {
        const noteReminders = remindersMap.get(row.id) || [];
        
        notes.push({
          id: row.id,
          owner_id: row.owner_id,
          title: row.title,
          content: row.content,
          folder_path: row.folder_path || '/',
          parent_id: row.parent_id ?? null,
          tags: JSON.parse(row.tags),
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
          is_pinned: row.is_pinned === 1,
          reminders: noteReminders.map(r => ({
            id: r.id,
            note_id: r.note_id,
            owner_id: r.owner_id,
            reminder_text: r.reminder_text,
            reminder_time: r.reminder_time,
            completed: r.completed === 1,
            enabled: r.enabled === 1,
            created_at: r.created_at,
            updated_at: r.updated_at,
            original_text: r.original_text
          }))
        } as Note);
      }
      return notes;
    } else if (this.webDb) {
      return ownerId ? await this.webDb.getNotesByOwner(ownerId) : await this.webDb.getAllNotes();
    }
    return [];
  }

  async deleteNote(id: string) {
    await this.init();
    if (isTauri() && this.db) {
      await this.db.execute('DELETE FROM notes WHERE id = $1', [id]);
    } else if (this.webDb) {
      await this.webDb.deleteNote(id);
    }
  }

  // --- Folder Operations ---

  async getFolders(ownerId?: string): Promise<Folder[]> {
    await this.init();

    if (isTauri() && this.db) {
      const foldersResult = ownerId
        ? await this.db.select<SqliteFolderRow[]>(
          'SELECT * FROM folders WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY path ASC',
          [ownerId],
        )
        : await this.db.select<SqliteFolderRow[]>(
          'SELECT * FROM folders WHERE deleted_at IS NULL ORDER BY path ASC',
        );

      return foldersResult.map((row) => ({
        id: row.id,
        owner_id: row.owner_id,
        path: row.path,
        name: row.name,
        parent_path: row.parent_path,
        sort_index: row.sort_index ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
      }));
    }

    if (this.webDb) {
      return ownerId ? this.webDb.getFoldersByOwner(ownerId) : this.webDb.getAllFolders();
    }

    return [];
  }

  async upsertFolder(folder: Folder) {
    await this.init();

    if (isTauri() && this.db) {
      await this.db.execute(
        `
          INSERT INTO folders (id, owner_id, path, name, parent_path, sort_index, created_at, updated_at, deleted_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT(owner_id, path) DO UPDATE SET
            id = excluded.id,
            name = excluded.name,
            parent_path = excluded.parent_path,
            sort_index = excluded.sort_index,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            deleted_at = excluded.deleted_at
        `,
        [
          folder.id,
          folder.owner_id,
          folder.path,
          folder.name,
          folder.parent_path ?? null,
          folder.sort_index ?? 0,
          folder.created_at,
          folder.updated_at,
          folder.deleted_at ?? null,
        ],
      );
      return;
    }

    if (this.webDb) {
      await this.webDb.saveFolder(folder);
    }
  }

  async upsertFolders(folders: Folder[]) {
    await this.init();

    if (isTauri() && this.db) {
      try {
        await this.db.execute('BEGIN TRANSACTION');
        for (const folder of folders) {
          await this.upsertFolder(folder);
        }
        await this.db.execute('COMMIT');
      } catch (error) {
        await this.db.execute('ROLLBACK');
        console.error('Failed to batch upsert folders:', error);
        throw error;
      }
      return;
    }

    if (this.webDb) {
      for (const folder of folders) {
        await this.webDb.saveFolder(folder);
      }
    }
  }

  async deleteFolder(ownerId: string, path: string): Promise<void>;
  async deleteFolder(path: string): Promise<void>;
  async deleteFolder(ownerOrPath: string, path?: string) {
    await this.init();
    const hasOwner = typeof path === 'string';
    const ownerId = hasOwner ? ownerOrPath : undefined;
    const folderPath = hasOwner ? path : ownerOrPath;

    if (isTauri() && this.db) {
      if (ownerId) {
        await this.db.execute('DELETE FROM folders WHERE owner_id = $1 AND path = $2', [ownerId, folderPath]);
      } else {
        await this.db.execute('DELETE FROM folders WHERE path = $1', [folderPath]);
      }
      return;
    }

    if (this.webDb) {
      if (ownerId) {
        await this.webDb.deleteFolder(ownerId, folderPath);
      } else {
        const folders = await this.webDb.getAllFolders();
        const folder = folders.find((candidate) => candidate.path === folderPath);
        if (folder) {
          await this.webDb.deleteFolder(folder.owner_id, folderPath);
        }
      }
    }
  }
}

export const localDB = new LocalDBService();
