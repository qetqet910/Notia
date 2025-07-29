export interface Note {
  id: string;
  title: string;
  content?: string;
  owner_id: string;
  is_public: boolean;
  parent_id?: string;
  note_type?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  createdAt: Date;
  updatedAt: Date;
  reminders: Reminder[];
  content_preview: string;
}

export interface EditorReminder {
  id: string;
  text: string;
  date: Date;
  completed: boolean;
  original_text: string;
  updated_at?: string;
  enabled?: boolean;
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
  terms_agreed: boolean;
  weekly_note_goal?: number;
  weekly_reminder_goal?: number;
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
  settings?: Record<string, unknown>;
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
  userProfile?: {
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  };
}