export interface Plan {
  id: number;
  title: string;
  tasks: Task[];
  startDate: string;
  endDate?: string;
  category?: string;
}

export interface Task {
  id: number;
  content: string;
  completed: boolean;
  dueDate?: string;
} 