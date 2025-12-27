import { describe, it, expect, vi, beforeEach } from 'vitest';
import { localDB } from '../services/localDB';
import * as isTauriModule from '../utils/isTauri';

// Mock Tauri SQL Plugin
const mockExecute = vi.fn();
const mockSelect = vi.fn();
const mockLoad = vi.fn().mockResolvedValue({
  execute: mockExecute,
  select: mockSelect,
});

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: (...args: unknown[]) => mockLoad(...args),
  },
}));

describe('LocalDB Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tauri Environment', () => {
    beforeEach(() => {
      vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(true);
    });

    it('should initialize SQLite DB', async () => {
      await localDB.init();
      expect(mockLoad).toHaveBeenCalledWith('sqlite:notia.db');
      expect(mockExecute).toHaveBeenCalled(); // Should call create table queries
    });

    it('upsertNote should execute insert query', async () => {
      await localDB.init();
      const mockNote = {
        id: '1',
        owner_id: 'user1',
        title: 'Test Note',
        content: 'Content',
        tags: ['tag1'],
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        reminders: [],
      };

      await localDB.upsertNote(mockNote as unknown as Note);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notes'),
        expect.arrayContaining(['1', 'user1', 'Test Note'])
      );
    });

    it('getNotes should select from notes and reminders', async () => {
      await localDB.init();
      mockSelect.mockResolvedValueOnce([
        { id: '1', title: 'Note 1', tags: '[]', reminders: [] }
      ]); // Notes result
      mockSelect.mockResolvedValueOnce([]); // Reminders result

      const notes = await localDB.getNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('1');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM notes'));
    });
  });
});
