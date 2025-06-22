export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_keys: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          key: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          key?: string;
          created_at?: string;
          is_active?: boolean;
        };
      };
      user_groups: {
        Row: {
          id: string;
          name: string;
          key: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          key: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          key?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          // ... 기존 notes 필드
        }
        Insert: {
          // ...
        }
        Update: {
          // ...
        }
        Relationships: []
      }
      reminders: {
        Row: {
          // ... 기존 reminders 필드
        }
        Insert: {
          // ...
        }
        Update: {
          // ...
        }
        Relationships: []
      }
      scheduled_notifications: { // 새로 추가된 테이블
        Row: {
          id: string
          user_id: string
          note_id: string
          reminder_id: string
          title: string
          body: string
          scheduled_time: string // ISO string
          type: 'at_time' | 'before_20m' | 'before_10m'
          sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          note_id: string
          reminder_id: string
          title: string
          body: string
          scheduled_time: string
          type: 'at_time' | 'before_20m' | 'before_10m'
          sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          note_id?: string
          reminder_id?: string
          title?: string
          body?: string
          scheduled_time?: string
          type?: 'at_time' | 'before_20m' | 'before_10m'
          sent?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_scheduled_notifications_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_scheduled_notifications_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_scheduled_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // ... 기존 함수들
      // get_pending_notifications 함수는 더 이상 필요하지 않으므로 제거하거나 사용하지 않습니다.
      // 대신 scheduled_notifications 테이블에서 직접 쿼리합니다.
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never