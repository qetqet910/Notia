import { useState, useEffect } from 'react';
import { useTeamStore } from '@/stores/teamStore';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export const ShareNoteDialog = ({
  open,
  onOpenChange,
  note,
  onShare
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
  onShare: (noteId: string, teamId: string, accessLevel: 'read' | 'write' | 'admin') => Promise<boolean>;
}) => {
  const { teams } = useTeamStore();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<'read' | 'write' | 'admin'>('read');
  const [isLoading, setIsLoading] = useState(false);
  const [sharedTeams, setSharedTeams] = useState<{teamId: string, teamName: string, accessLevel: string}[]>([]);
  const { getTeamsWithAccess, unshareNoteWithTeam } = useNotes();
  
  // 노트가 공유된 팀 목록 로드
  useEffect(() => {
    if (open && note) {
      const loadSharedTeams = async () => {
        const teams = await getTeamsWithAccess(note.id);
        setSharedTeams(teams);
      };
      
      loadSharedTeams();
    }
  }, [open, note, getTeamsWithAccess]);
  
  const handleShare = async () => {
    if (!selectedTeam || !note) return;
    
    try {
      setIsLoading(true);
      const success = await onShare(note.id, selectedTeam, accessLevel);
      
      if (success) {
        // 공유 목록 업데이트
        const team = teams.find(t => t.id === selectedTeam);
        if (team) {
          setSharedTeams(prev => [
            ...prev.filter(t => t.teamId !== selectedTeam),
            { teamId: selectedTeam, teamName: team.name, accessLevel }
          ]);
        }
        
        // 입력 초기화
        setSelectedTeam('');
      }
    } catch (err) {
      console.error('노트 공유 중 오류 발생:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUnshare = async (teamId: string) => {
    try {
      setIsLoading(true);
      const success = await unshareNoteWithTeam(note.id, teamId);
      
      if (success) {
        setSharedTeams(prev => prev.filter(t => t.teamId !== teamId));
      }
    } catch (err) {
      console.error('노트 공유 취소 중 오류 발생:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>노트 공유하기</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* 현재 공유된 팀 목록 */}
          {sharedTeams.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">공유된 팀</h3>
              <div className="space-y-1">
                {sharedTeams.map(team => (
                  <div key={team.teamId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center mr-2">
                        <span className="text-xs font-bold">{team.teamName.charAt(0)}</span>
                      </div>
                      <span>{team.teamName}</span>
                      <Badge variant="outline" className="ml-2">
                        {team.accessLevel === 'read' ? '읽기' : 
                         team.accessLevel === 'write' ? '쓰기' : '관리자'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnshare(team.teamId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 팀 선택 */}
          <div className="grid gap-2">
            <Label htmlFor="team">팀 선택</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="공유할 팀 선택" />
              </SelectTrigger>
              <SelectContent>
                {teams
                  .filter(team => !sharedTeams.some(st => st.teamId === team.id))
                  .map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 접근 레벨 선택 */}
          <div className="grid gap-2">
            <Label htmlFor="access-level">접근 권한</Label>
            <Select value={accessLevel} onValueChange={(value: any) => setAccessLevel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">읽기 전용</SelectItem>
                <SelectItem value="write">읽기 및 수정</SelectItem>
                <SelectItem value="admin">관리자 권한</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleShare}
            disabled={isLoading || !selectedTeam}
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-background rounded-full border-t-transparent"></div>
            ) : (
              '공유하기'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};