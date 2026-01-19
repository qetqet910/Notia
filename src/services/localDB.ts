import Database from '@tauri-apps/plugin-sql';
import { isTauri } from '@/utils/isTauri';
import { Note } from '@/types';

// DB 이름 설정
const DB_NAME = 'notia.db';

// 웹 환경을 위한 IndexedDB 래퍼 (간단한 구현)
class WebDB {
  private dbName = 'NotiaWebDB';
  private version = 1;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_changes')) {
          db.createObjectStore('pending_changes', { autoIncrement: true });
        }
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_query: string, _values?: unknown[]) {
    // 웹 환경에서는 SQL 쿼리 파싱이 복잡하므로, 
    // 실제 로직은 LocalDBService의 메서드 내에서 분기 처리하는 것이 좋습니다.
    // 여기서는 인터페이스 호환성을 위해 에러를 던지거나 더미를 반환합니다.
    console.warn('WebDB execute is not fully implemented for raw SQL. Use dedicated methods.');
    return [];
  }
  
  // IndexedDB 헬퍼 메서드들...
  async getAllNotes(): Promise<Note[]> {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.version);
          request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('notes', 'readonly');
              const store = tx.objectStore('notes');
              const getAll = store.getAll();
              getAll.onsuccess = () => resolve(getAll.result);
              getAll.onerror = () => reject(getAll.error);
          };
      });
  }

  async saveNote(note: Note): Promise<void> {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.version);
          request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('notes', 'readwrite');
              const store = tx.objectStore('notes');
              // Note: reminders 등 복잡한 객체는 그대로 저장 가능 (IndexedDB 장점)
              const put = store.put(note);
              put.onsuccess = () => resolve();
              put.onerror = () => reject(put.error);
          };
      });
  }
  
  async deleteNote(id: string): Promise<void> {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.version);
          request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('notes', 'readwrite');
              const store = tx.objectStore('notes');
              const del = store.delete(id);
              del.onsuccess = () => resolve();
              del.onerror = () => reject(del.error);
          };
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
  }

  // --- Note Operations ---

  async upsertNote(note: Note, isSynced: boolean = true) {
    await this.init();
    
    if (isTauri() && this.db) {
      const tagsJson = JSON.stringify(note.tags || []);
      const syncedVal = isSynced ? 1 : 0;
      
      await this.db.execute(`
        INSERT INTO notes (id, owner_id, title, content, tags, created_at, updated_at, is_synced, deleted_at, is_pinned)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          tags = excluded.tags,
          updated_at = excluded.updated_at,
          is_synced = excluded.is_synced,
          deleted_at = excluded.deleted_at,
          is_pinned = excluded.is_pinned
      `, [
          note.id, note.owner_id, note.title, note.content || '', tagsJson, 
          note.created_at, note.updated_at, syncedVal, 
          note.deleted_at || null, note.is_pinned ? 1 : 0
      ]);

      // Handle Reminders (Delete all and re-insert for simplicity in local DB)
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

    } else if (this.webDb) {
      await this.webDb.saveNote(note);
    }
  }

  async getNotes(): Promise<Note[]> {
    await this.init();

    if (isTauri() && this.db) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notesResult = await this.db.select<any[]>('SELECT * FROM notes WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC');
      const notes: Note[] = [];

      for (const row of notesResult) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const remindersResult = await this.db.select<any[]>('SELECT * FROM reminders WHERE note_id = $1', [row.id]);
        
        notes.push({
          id: row.id,
          owner_id: row.owner_id,
          title: row.title,
          content: row.content,
          tags: JSON.parse(row.tags),
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
          is_pinned: row.is_pinned === 1,
          reminders: remindersResult.map(r => ({
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
      return await this.webDb.getAllNotes();
    }
    return [];
  }

  async deleteNote(id: string) {
    await this.init();
    if (isTauri() && this.db) {
      // Soft delete locally, or hard delete if sync handling is sophisticated
      // For now, let's just delete to keep it simple, 
      // but in a real offline-first app, we might need soft delete to sync the deletion later.
      // We'll trust the Sync Queue to handle the upstream deletion.
      await this.db.execute('DELETE FROM notes WHERE id = $1', [id]);
    } else if (this.webDb) {
      await this.webDb.deleteNote(id);
    }
  }
}

export const localDB = new LocalDBService();
