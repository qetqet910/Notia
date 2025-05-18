import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { CreateTeamDialog } from '@/components/features/dashboard/teamDialog';

export const TeamSpaceList = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  // 사용자의 팀 목록 가져오기
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // 사용자가 속한 그룹 가져오기
        const { data, error } = await supabase
          .from('group_members')
          .select(
            `
            group_id,
            user_id
          `,
          )
          .eq('user_id', user.id);

        if (error) throw error;

        // 데이터 형식 변환
        const formattedTeams = data.map((item) => ({
          id: item.user_groups?.id,
          name: item.user_groups?.name,
        }));

        setTeams(formattedTeams);
      } catch (err) {
        console.error('팀 로드 중 오류 발생:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [user]);

  // 새 팀 생성 다이얼로그 상태
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  return (
    <div className="space-y-1">
      {isLoading ? (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {teams.map((team) => (
            <Button
              key={team.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                // 팀 스페이스로 이동하는 로직
                // 예: setActiveTeam(team.id);
              }}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-sm bg-primary/20 flex items-center justify-center mr-2">
                  <span className="text-[10px] font-bold">
                    {team.name.charAt(0)}
                  </span>
                </div>
                <span className="truncate">{team.name}</span>
              </div>
            </Button>
          ))}

          {/* 새 팀 생성 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setIsCreateTeamOpen(true)}
          >
            <PlusCircle className="mr-2 h-3 w-3" />새 팀 만들기
          </Button>

          {/* 팀 생성 다이얼로그 */}
          <CreateTeamDialog
            open={isCreateTeamOpen}
            onOpenChange={setIsCreateTeamOpen}
            onTeamCreated={(newTeam) => {
              setTeams((prev) => [...prev, newTeam]);
            }}
          />
        </>
      )}
    </div>
  );
};
