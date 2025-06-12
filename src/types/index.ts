export interface Note {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  is_public: boolean;
  parent_id?: string;
  note_type?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  createdAt: Date;
  updatedAt: Date;
  reminders?: EditorReminder[]; // Editor 호환성을 위해
}

export interface EditorReminder {
  id: string;
  text: string; // reminderText (파싱된 할일 내용)
  date: Date; // parsedDate (파싱된 시간)
  completed: boolean;
  original_text: string;
}

export interface Reminder {
  id: string;
  note_id: string;
  owner_id: string;
  reminder_text: string;
  reminder_time: string; // ISO string
  completed: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  original_text: string; // 원본 텍스트 리마인더 삭제 이슈
}

export interface Team {
  id: string;
  name: string;
  key: string;
  owner_id: string;
  created_at: string;
  settings?: any;
  description?: string;
  icon?: string;
}

export interface TeamMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  created_at: string;
  joined_at: string;
  group_name?: string;
}
