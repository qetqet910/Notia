export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}