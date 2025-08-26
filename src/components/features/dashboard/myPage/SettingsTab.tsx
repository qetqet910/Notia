import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Trash2,
  Download,
  Upload,
  Palette,
  LogOut,
  Goal,
  Save,
  Loader2,
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
import { Note } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useNotes } from '@/hooks/useNotes';

export const SettingsTab: React.FC = React.memo(() => {
  const { toast } = useToast();
  const { signOut, user } = useAuthStore();
  const { notes, createNote } = useDataStore();
  const { theme, setTheme } = useThemeStore();
  const { goalStats, updateUserGoals } = useNotes();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const [isGoalSaving, setIsGoalSaving] = useState(false);
  const [weeklyNoteGoal, setWeeklyNoteGoal] = useState(
    goalStats.weeklyNote.goal,
  );
  const [weeklyReminderGoal, setWeeklyReminderGoal] = useState(
    goalStats.weeklyReminder.goal,
  );

  useEffect(() => {
    setWeeklyNoteGoal(goalStats.weeklyNote.goal);
    setWeeklyReminderGoal(goalStats.weeklyReminder.goal);
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
    toast({
      title: '성공',
      description: '모든 노트가 JSON 파일로 내보내졌습니다.',
    });
    setShowExportDialog(false);
  }, [notes, toast]);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          if (typeof content !== 'string') throw new Error('파일 형식 오류');
          const importedData = JSON.parse(content);

          if (importedData && importedData.notes) {
            const notesToImport: Note[] = Object.values(importedData.notes);
            let successCount = 0;
            let errorCount = 0;

            for (const note of notesToImport) {
              const newNoteData = {
                owner_id: user.id, // 현재 사용자의 ID로 설정
                title: note.title,
                content: note.content || '',
                tags: note.tags || [],
                reminders: (note.reminders || []).map((r) => ({
                  text: r.reminder_text,
                  date: new Date(r.reminder_time),
                  completed: r.completed,
                  original_text: r.original_text,
                  enabled: r.enabled,
                })),
              };

              try {
                const result = await createNote(newNoteData);
                if (result) {
                  successCount++;
                } else {
                  errorCount++;
                }
              } catch (err) {
                console.error('노트 가져오기 오류:', err);
                errorCount++;
              }
            }

            toast({
              title: '가져오기 완료',
              description: `성공: ${successCount}개, 실패: ${errorCount}개`,
            });
          } else {
            throw new Error('지원하지 않는 파일 형식입니다.');
          }
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
    [user, createNote, toast],
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
    setIsGoalSaving(true);
    try {
      await updateUserGoals({
        noteGoal: weeklyNoteGoal,
        reminderGoal: weeklyReminderGoal,
      });
      toast({
        title: '목표 저장됨',
        description: '주간 목표가 성공적으로 업데이트되었습니다.',
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: '목표 저장 실패',
        description: `목표 저장 중 오류가 발생했습니다: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsGoalSaving(false);
    }
  }, [weeklyNoteGoal, weeklyReminderGoal, updateUserGoals, toast]);

  return (
    <div
      className="space-y-8 custom-scrollbar"
      style={{ maxHeight: 'calc(100vh - 200px)', paddingRight: '1rem' }}
    >
      <Card>
        <CardHeader>
          <CardTitle>일반</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>테마</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="theme-select" className="font-medium">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="flex items-center">
            <Goal className="h-5 w-5 mr-2" />
            주간 목표 설정
          </CardTitle>
          <Button onClick={handleSaveGoals} disabled={isGoalSaving}>
            {isGoalSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>주간 노트 작성 목표</Label>
              <span className="font-bold text-lg text-primary">
                {weeklyNoteGoal}개
              </span>
            </div>
            <Slider
              value={[weeklyNoteGoal]}
              onValueChange={(value) => setWeeklyNoteGoal(value[0])}
              max={50}
              step={1}
              disabled={isGoalSaving}
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>주간 리마인더 완료 목표</Label>
              <span className="font-bold text-lg text-primary">
                {weeklyReminderGoal}개
              </span>
            </div>
            <Slider
              value={[weeklyReminderGoal]}
              onValueChange={(value) => setWeeklyReminderGoal(value[0])}
              max={50}
              step={1}
              disabled={isGoalSaving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>데이터 관리</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            모든 노트 내보내기
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            노트 가져오기
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-center"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            계정 삭제
          </Button>
        </CardContent>
      </Card>

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
              모든 노트를 JSON 파일로 다운로드합니다. 이 파일에는 노트의
              <br /> 전체 내용이 포함되므로, 민감한 정보가 있을 경우 안전하게
              보관하세요.
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
    </div>
  );
});
SettingsTab.displayName = 'SettingsTab';
