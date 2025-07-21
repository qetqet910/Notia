import React, { useState, useEffect, useCallback } from 'react';
import { useTeamStore } from '@/stores/teamStore';
import { useNotes } from '@/hooks/useNotes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Team } from '@/types';

interface ShareNoteDialogProps {
  noteId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type AccessLevel = 'read' | 'write' | 'admin';

export const ShareNoteDialog: React.FC<ShareNoteDialogProps> = ({
  noteId,
  isOpen,
  onOpenChange,
}) => {
  const { teams, fetchTeams } = useTeamStore();
  const { shareNoteWithTeam, unshareNoteWithTeam, getTeamsWithAccess } =
    useNotes();
  const { toast } = useToast();

  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('read');
  const [sharedWith, setSharedWith] = useState<
    { teamId: string; teamName: string; accessLevel: AccessLevel }[]
  >([]);

  const loadSharedTeams = useCallback(async () => {
    if (!noteId) return;
    const teamsWithAccess = await getTeamsWithAccess(noteId);
    setSharedWith(
      teamsWithAccess.map((t) => ({
        teamId: t.teamId,
        teamName: t.teamName?.name || 'Unknown Team',
        accessLevel: t.accessLevel as AccessLevel,
      })),
    );
  }, [noteId, getTeamsWithAccess]);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      loadSharedTeams();
    }
  }, [isOpen, fetchTeams, loadSharedTeams]);

  const handleShare = async () => {
    if (!selectedTeam) {
      toast({
        title: '오류',
        description: '공유할 팀을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    const success = await shareNoteWithTeam(noteId, selectedTeam, accessLevel);
    if (success) {
      toast({ title: '성공', description: '노트가 팀과 공유되었습니다.' });
      loadSharedTeams();
      setSelectedTeam('');
    } else {
      toast({
        title: '오류',
        description: '노트 공유에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleUnshare = async (teamId: string) => {
    const success = await unshareNoteWithTeam(noteId, teamId);
    if (success) {
      toast({ title: '성공', description: '노트 공유가 취소되었습니다.' });
      loadSharedTeams();
    } else {
      toast({
        title: '오류',
        description: '노트 공유 취소에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>노트 공유</DialogTitle>
          <DialogDescription>
            팀과 노트를 공유하고 권한을 설정하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>공유된 팀</Label>
            <div className="space-y-2 mt-2">
              {sharedWith.length > 0 ? (
                sharedWith.map((team) => (
                  <div
                    key={team.teamId}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <span>{team.teamName} ({team.accessLevel})</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnshare(team.teamId)}
                    >
                      공유 취소
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  아직 공유된 팀이 없습니다.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="team-select">팀 선택</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="팀 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team: Team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="access-level">권한</Label>
              <Select
                value={accessLevel}
                onValueChange={(v) => setAccessLevel(v as AccessLevel)}
              >
                <SelectTrigger id="access-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">읽기</SelectItem>
                  <SelectItem value="write">쓰기</SelectItem>
                  <SelectItem value="admin">관리</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleShare}>공유하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
