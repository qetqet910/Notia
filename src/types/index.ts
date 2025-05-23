export interface Note {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  parent_id?: string;
  note_type?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  reminders?: Array<{
    text: string;
    date: Date;
    completed: boolean;
  }>;
}

export interface Reminder {
  id: string;
  noteId: string;
  noteTitle: string;
  noteContent: string;
  reminderText: string; // @내일, @3시 등의 원본 텍스트
  reminderTime: Date; // 파싱된 시간
  completed: boolean;
  enabled: boolean; // 알림 활성화 여부
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
