import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/services/supabaseClient';

export const CreateTeamDialog = ({
  open,
  onOpenChange,
  onTeamCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: (team: { id: string; name: string }) => void;
}) => {
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;

    try {
      setIsLoading(true);

      // 1. 새 팀(그룹) 생성
      const { data: groupData, error: groupError } = await supabase
        .from('user_groups')
        .insert([
          {
            name: teamName.trim(),
            owner_id: user.id,
            key: Math.random().toString(36).substring(2, 10), // 간단한 랜덤 키 생성
          },
        ])
        .select();

      if (groupError) throw groupError;

      // 2. 생성자를 팀 멤버로 추가 (admin 권한)
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupData[0].id,
            user_id: user.id,
            role: 'admin',
            joined_at: new Date().toISOString(),
          },
        ]);

      if (memberError) throw memberError;

      // 성공 처리
      onTeamCreated({
        id: groupData[0].id,
        name: groupData[0].name,
      });

      // 다이얼로그 닫기
      onOpenChange(false);
      setTeamName('');
    } catch (err) {
      console.error('팀 생성 중 오류 발생:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 팀 만들기</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">팀 이름</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀 이름을 입력하세요"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreateTeam}
            disabled={isLoading || !teamName.trim()}
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-background rounded-full border-t-transparent"></div>
            ) : (
              '팀 만들기'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
