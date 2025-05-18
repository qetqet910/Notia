import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';

interface Team {
  id: string;
  name: string;
  key: string;
  owner_id: string;
  created_at: string;
  settings?: any;
  description?: string;
  icon?: string;
}

interface TeamMember {
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

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: Error | null;

  // 액션
  fetchTeams: () => Promise<void>;
  setCurrentTeam: (teamId: string | null) => Promise<void>;
  createTeam: (name: string) => Promise<Team | null>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<boolean>;
  deleteTeam: (id: string) => Promise<boolean>;
  inviteMember: (
    teamId: string,
    email: string,
    role?: string,
  ) => Promise<boolean>;
  removeMember: (teamId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (
    teamId: string,
    userId: string,
    role: string,
  ) => Promise<boolean>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  currentTeam: null,
  teamMembers: [],
  isLoading: false,
  error: null,

  fetchTeams: async () => {
    try {
      set({ isLoading: true });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('인증된 사용자가 없습니다');

      // 사용자가 속한 그룹 가져오기
      const { data, error } = await supabase
        .from('group_members')
        .select(
          `
          group_id,
          user_groups:group_id(id, name, key, description, icon, owner_id, created_at, settings)
        `,
        )
        .eq('user_id', user.id);

      if (error) throw error;

      const teams = data.map((item) => ({
        id: item.user_groups.id,
        name: item.user_groups.name,
        key: item.user_groups.key,
        owner_id: item.user_groups.owner_id,
        created_at: item.user_groups.created_at,
        settings: item.user_groups.settings,
        description: item.user_groups.description,
        icon: item.user_groups.icon,
      }));

      set({ teams, isLoading: false });
    } catch (err) {
      console.error('팀 로드 중 오류 발생:', err);
      set({ error: err as Error, isLoading: false });
    }
  },

  setCurrentTeam: async (teamId) => {
    try {
      if (!teamId) {
        set({ currentTeam: null, teamMembers: [] });
        return;
      }

      const { teams } = get();
      const team = teams.find((t) => t.id === teamId);

      if (!team) throw new Error('팀을 찾을 수 없습니다');

      // 팀 멤버 로드
      const { data, error } = await supabase
        .from('group_members')
        .select(
          `
          id,
          user_id,
          group_id,
          role,
          joined_at,
          created_at,
          group_name
        `,
        )
        .eq('group_id', teamId);

      if (error) throw error;

      // 사용자 프로필 정보 가져오기 (별도 쿼리)
      const userIds = data.map((member) => member.user_id);
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profile')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profileError) console.warn('사용자 프로필 로드 오류:', profileError);

      const members = data.map((item) => {
        const profile = userProfiles?.find((p) => p.user_id === item.user_id);

        return {
          id: item.id,
          user_id: item.user_id,
          group_id: item.group_id,
          role: item.role,
          joined_at: item.joined_at,
          created_at: item.created_at,
          group_name: item.group_name,
          userProfile: profile
            ? {
                displayName: profile.display_name,
                avatarUrl: profile.avatar_url,
              }
            : undefined,
        };
      });

      set({ currentTeam: team, teamMembers: members });
    } catch (err) {
      console.error('팀 설정 중 오류 발생:', err);
      set({ error: err as Error });
    }
  },

  createTeam: async (name) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('인증된 사용자가 없습니다');

      // 랜덤 키 생성
      const key = Math.random().toString(36).substring(2, 10);

      // 팀 생성
      const { data, error } = await supabase
        .from('user_groups')
        .insert([
          {
            name,
            owner_id: user.id,
            key,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      // 생성자를 멤버로 추가
      await supabase.from('group_members').insert([
        {
          group_id: data[0].id,
          user_id: user.id,
          role: 'admin',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          group_name: name,
        },
      ]);

      const newTeam = {
        id: data[0].id,
        name: data[0].name,
        key: data[0].key,
        owner_id: data[0].owner_id,
        created_at: data[0].created_at,
      };

      set((state) => ({ teams: [...state.teams, newTeam] }));
      return newTeam;
    } catch (err) {
      console.error('팀 생성 중 오류 발생:', err);
      set({ error: err as Error });
      return null;
    }
  },

  // 나머지 메서드들은 필요에 따라 구현...
  updateTeam: async () => false,
  deleteTeam: async () => false,
  inviteMember: async () => false,
  removeMember: async () => false,
  updateMemberRole: async () => false,
}));
