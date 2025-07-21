import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { Team, TeamMember } from '@/types';

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
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증된 사용자가 없습니다');

      const { data, error } = await supabase
        .from('group_members')
        .select('user_groups(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const teams = data.map((item) => item.user_groups).filter(Boolean) as unknown as Team[];
      set({ teams, isLoading: false });
    } catch (err) {
      console.error('팀 로드 중 오류 발생:', err);
      set({ error: err as Error, isLoading: false });
    }
  },

  setCurrentTeam: async (teamId) => {
    if (!teamId) {
      set({ currentTeam: null, teamMembers: [] });
      return;
    }

    set({ isLoading: true });
    try {
      const { teams } = get();
      const team = teams.find((t) => t.id === teamId);
      if (!team) throw new Error('팀을 찾을 수 없습니다');

      const { data, error } = await supabase
        .from('group_members')
        .select('*, user_profiles(display_name, avatar_url, email)')
        .eq('group_id', teamId);

      if (error) throw error;

      const members = data.map(item => ({
        ...item,
        userProfile: item.user_profiles ? {
          displayName: item.user_profiles.display_name,
          avatarUrl: item.user_profiles.avatar_url,
          email: item.user_profiles.email,
        } : undefined,
      })) as TeamMember[];

      set({ currentTeam: team, teamMembers: members, isLoading: false });
    } catch (err) {
      console.error('팀 설정 중 오류 발생:', err);
      set({ error: err as Error, isLoading: false });
    }
  },

  createTeam: async (name: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증된 사용자가 없습니다');

      const { data: newTeam, error } = await supabase
        .from('user_groups')
        .insert({ name, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('group_members').insert({
        group_id: newTeam.id,
        user_id: user.id,
        role: 'admin',
        group_name: name,
      });

      set((state) => ({ teams: [...state.teams, newTeam], isLoading: false }));
      return newTeam as Team;
    } catch (err) {
      console.error('팀 생성 중 오류 발생:', err);
      set({ error: err as Error, isLoading: false });
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