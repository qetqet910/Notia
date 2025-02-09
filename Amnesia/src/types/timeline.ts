export type TimelineViewType = 'day' | 'week' | 'month' | 'year';

export interface TimelineItem {
  id: number;
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
  completed: boolean;
  dependencies?: number[];
  progress: number;
} 