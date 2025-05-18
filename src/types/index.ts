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
  tags: string; // 문자열로 저장된 태그 (쉼표로 구분)
  // 클라이언트 측 변환 속성
  createdAt: Date;
  updatedAt: Date;
  parsedTags: string[]; // 파싱된 태그 배열
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