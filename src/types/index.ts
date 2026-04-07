export interface Note {
  id: string;
  title: string;
  content?: string;
  folder_path?: string;
  parent_id?: string | null;
  owner_id: string;
  is_public: boolean;
  note_type?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_pinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
  reminders: Reminder[];
  content_preview: string;
  links?: string[];
}

export interface Folder {
  id: string;
  owner_id: string;
  path: string;
  name: string;
  parent_path: string | null;
  sort_index?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
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

export type ChangeCategory =
  | '✨ 기능'
  | '🐛 버그 수정'
  | '🚀 성능'
  | '💅 디자인'
  | '🔧 리팩토링'
  | '📝 문서'
  | '⚙️ 기타'
  | '🔔 알림'
  | '💾 데이터베이스'
  | '🛡️ 보안'
  | '🧪 테스트'
  | '🖥️ 데스크톱'
  | '📡 오프라인'
  | '🔄 업데이트'
  | '⚡ 성능'
  | '🎨 디자인'
  | '⚙️ 백엔드'
  | '💾 데이터베이스'; // Duplicate check - removing duplicate in next step if necessary

export interface ChangelogEntry {
  version: string;
  date: string;
  userChanges: {
    category: ChangeCategory;
    description: string;
  }[];
  devChanges: {
    category: ChangeCategory;
    description: string;
  }[];
}
