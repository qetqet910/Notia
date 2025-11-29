export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          owner_id: string;
          is_public: boolean;
          note_type: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
          content_preview: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          owner_id: string;
          is_public?: boolean;
          note_type?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          content_preview?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          owner_id?: string;
          is_public?: boolean;
          note_type?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          content_preview?: string | null;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
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
        };
        Insert: {
          id?: string;
          note_id: string;
          owner_id: string;
          reminder_text: string;
          reminder_time: string;
          completed?: boolean;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          original_text: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          owner_id?: string;
          reminder_text?: string;
          reminder_time?: string;
          completed?: boolean;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          original_text?: string;
        };
        Relationships: [];
      };
      scheduled_notifications: {
        Row: {
          id: string;
          user_id: string;
          note_id: string;
          reminder_id: string;
          title: string;
          body: string;
          scheduled_time: string;
          type: 'at_time' | 'before_20m' | 'before_10m';
          sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id: string;
          reminder_id: string;
          title: string;
          body: string;
          scheduled_time: string;
          type: 'at_time' | 'before_20m' | 'before_10m';
          sent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          note_id?: string;
          reminder_id?: string;
          title?: string;
          body?: string;
          scheduled_time?: string;
          type?: 'at_time' | 'before_20m' | 'before_10m';
          sent?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'public_scheduled_notifications_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_scheduled_notifications_reminder_id_fkey';
            columns: ['reminder_id'];
            isOneToOne: false;
            referencedRelation: 'reminders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_scheduled_notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_in in never]: never;
    };
    Functions: object;
    Enums: {
      [_in in never]: never;
    };
    CompositeTypes: {
      [_in in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
