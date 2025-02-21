import Dexie, { Table } from 'dexie';
import type { Note } from '../types';
import type { Plan } from '../types/plan';

class MemoDB extends Dexie {
  notes!: Table<Note>;
  plans!: Table<Plan>;

  constructor() {
    super('[M]MemoDB');
    
    this.version(1).stores({
      notes: 'id',
      plans: 'id',
      markdown: 'id'
    });
  }

  // Notes 관련 메서드
  async getAllNotes(): Promise<Note[]> {
    return await this.notes.toArray();
  }

  async saveNote(note: Note): Promise<void> {
    await this.notes.put(note);
  }

  async deleteNote(id: number): Promise<void> {
    await this.notes.delete(id);
  }

  // Plans 관련 메서드
  async savePlan(plan: Plan): Promise<void> {
    await this.plans.put(plan);
  }

  async getPlans(): Promise<Plan[]> {
    return await this.plans.toArray();
  }
}

export const db = new MemoDB();