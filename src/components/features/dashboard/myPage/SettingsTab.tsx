import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Trash2,
  Download,
  Upload,
  Palette,
  LogOut,
  BarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { SettingSwitchItem } from '@/components/features/dashboard/myPage/SettingSwitchItem';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useThemeStore } from '@/stores/themeStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotes } from '@/hooks/useNotes';

export const SettingsTab: React.FC = React.memo(() => {
  const { toast } = useToast();
  const { signOut } = useAuthStore();
  const { notes } = useDataStore();
  const { theme, setTheme } = useThemeStore();
  const { goalStats, updateUserGoals } = useNotes();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  const [noteGoal, setNoteGoal] = useState(goalStats.weeklyNote.goal);
  const [reminderGoal, setReminderGoal] = useState(
    goalStats.weeklyReminder.goal,
  );

  useEffect(() => {
    setNoteGoal(goalStats.weeklyNote.goal);
    setReminderGoal(goalStats.weeklyReminder.goal);
  }, [goalStats]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify({ notes }, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `Notia_backup_${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: '성공', description: '모든 노트가 JSON 파일로 내보내졌습니다.' });
    setShowExportDialog(false);
  }, [notes, toast]);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          if (typeof content !== 'string') throw new Error('파일 형식 오류');
          const importedData = JSON.parse(content);
          // TODO: Import logic
          console.log(importedData);
          toast({
            title: '성공',
            description: '노트를 성공적으로 가져왔습니다.',
          });
        } catch {
          toast({
            title: '오류',
            description: '파일을 가져오는 중 오류가 발생했습니다.',
            variant: 'destructive',
          });
        } finally {
          setShowImportDialog(false);
        }
      };
      reader.readAsText(file);
    },
    [toast],
  );

  const handleDeleteAccount = useCallback(async () => {
    // TODO: Delete account logic
    toast({
      title: '요청됨',
      description: '계정 삭제 절차가 시작되었습니다.',
    });
    setShowDeleteDialog(false);
  }, [toast]);

  const handleSaveGoals = useCallback(async () => {
    try {
      await updateUserGoals({ noteGoal, reminderGoal });
      toast({ title: '성공', description: '목표가 업데이트되었습니다.' });
      setShowGoalDialog(false);
    } catch {
      toast({
        title: '오류',
        description: '목표 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }, [noteGoal, reminderGoal, updateUserGoals, toast]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">일반</h3>
      <div className="space-y-2">
        <SettingSwitchItem
          id="notifications"
          label="푸시 알림"
          description="리마인더 및 중요 업데이트에 대한 알림을 받습니다."
          checked
          onCheckedChange={() => {
            /* Logic */
          }}
          icon={<Bell />}
        />
      </div>

      <h3 className="text-lg font-medium">테마</h3>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-3">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="theme-select" className="text-base font-medium">
            테마 선택
          </Label>
        </div>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="테마 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">라이트</SelectItem>
            <SelectItem value="dark">다크</SelectItem>
            <SelectItem value="deepdark">딥다크</SelectItem>
            <SelectItem value="system">시스템 설정</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <h3 className="text-lg font-medium">데이터 관리</h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setShowExportDialog(true)}
        >
          <Download className="h-4 w-4 mr-2" />
          모든 노트 내보내기
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setShowImportDialog(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          노트 가져오기
        </Button>
      </div>

      <h3 className="text-lg font-medium">목표 설정</h3>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setShowGoalDialog(true)}
      >
        <BarChart className="h-4 w-4 mr-2" />
        주간 목표 설정
      </Button>

      <h3 className="text-lg font-medium">계정</h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-start"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          계정 삭제
        </Button>
      </div>

      {/* Dialogs */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말로 계정을 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 모든 노트와 데이터가 영구적으로
              삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>노트 내보내기</DialogTitle>
            <DialogDescription>
              모든 노트를 JSON 파일로 다운로드합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleExport}>내보내기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>노트 가져오기</DialogTitle>
            <DialogDescription>
              JSON 파일을 선택하여 노트를 가져옵니다.
            </DialogDescription>
          </DialogHeader>
          <Input type="file" accept=".json" onChange={handleImport} />
        </DialogContent>
      </Dialog>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주간 목표 설정</DialogTitle>
            <DialogDescription>
              이번 주에 달성할 목표를 설정하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note-goal" className="text-right">
                노트 작성
              </Label>
              <Input
                id="note-goal"
                type="number"
                value={noteGoal}
                onChange={(e) => setNoteGoal(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reminder-goal" className="text-right">
                리마인더 완료
              </Label>
              <Input
                id="reminder-goal"
                type="number"
                value={reminderGoal}
                onChange={(e) => setReminderGoal(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSaveGoals}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
SettingsTab.displayName = 'SettingsTab';