export interface Note {
    id: number;
    title: string;
    content: string;
    tags: string[];
    date: string;
    syncStatus: 'synced' | 'pending' | 'failed';
  }