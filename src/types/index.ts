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
  reminders?: EditorReminder[];
  content_preview: string;
}

export interface EditorReminder {
  id: string;
  text: string;
  date: Date;
  completed: boolean;
  original_text: string;
}

export interface Reminder {
  id: string;
  note_id: string;
  owner_id: string;
  reminder_text: string;
  reminder_time: string;
  completed: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  original_text: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  key?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface ActivityData {
  date: string;
  count: number;
  level: number;
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
