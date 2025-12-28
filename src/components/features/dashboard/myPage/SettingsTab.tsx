import React, { useState, useEffect, useCallback } from 'react';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Download from 'lucide-react/dist/esm/icons/download';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Palette from 'lucide-react/dist/esm/icons/palette';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Goal from 'lucide-react/dist/esm/icons/goal';
import Save from 'lucide-react/dist/esm/icons/save';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Send from 'lucide-react/dist/esm/icons/send';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { SettingSwitchItem } from '@/components/features/dashboard/myPage/SettingSwitchItem';
import { SettingActionItem } from '@/components/features/dashboard/myPage/SettingActionItem';
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
import { useNavigate } from 'react-router-dom';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useNotes } from '@/hooks/useNotes';
import Info from 'lucide-react/dist/esm/icons/info';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { checkForUpdates, installUpdate } from '@/utils/updater';
import { isTauri } from '@/utils/isTauri';
import { sendNotification } from '@/utils/notification';

export const SettingsTab: React.FC = React.memo(() => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut, user, deleteAccount } = useAuthStore();
  const { notes, createNote } = useDataStore();
  const { theme, setTheme } = useThemeStore();
  const { goalStats, updateUserGoals } = useNotes();
  const { permission, requestPermission } = useNotificationPermission();

  const [updateStatus, setUpdateStatus] = useState<{
    checking: boolean;
    available: boolean;
    manifest?: { version: string; body: string; date: string };
  }>({ checking: false, available: false });

  const handleCheckUpdate = useCallback(async () => {
    setUpdateStatus(prev => ({ ...prev, checking: true }));
    try {
      const result = await checkForUpdates();
      if (result.shouldUpdate) {
        setUpdateStatus({
          checking: false,
          available: true,
          manifest: result.manifest,
        });
        toast({
          title: '업데이트 가능',
          description: `새 버전(${result.manifest?.version})이 있습니다.`,
        });
      } else {
        setUpdateStatus(prev => ({ ...prev, checking: false, available: false }));
        toast({
          title: '최신 버전',
          description: '현재 최신 버전을 사용 중입니다.',
        });
      }
    } catch {
      setUpdateStatus(prev => ({ ...prev, checking: false }));
      toast({
        title: '확인 실패',
        description: '업데이트 정보를 가져오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleInstallUpdate = useCallback(async () => {
    try {
      await installUpdate();
    } catch {
      toast({
        title: '설치 실패',
        description: '업데이트 설치 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false); // New state for delete account loading

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

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true); // Set loading true
    try {
      const { success, error } = await deleteAccount();
      if (success) {
        toast({
          title: '삭제 완료',
          description: '계정과 모든 데이터가 영구적으로 삭제되었습니다.',
        });
      } else {
        toast({
          title: '삭제 실패',
          description: error?.message || '계정 삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
      setShowDeleteDialog(false);
    } finally {
      setIsDeletingAccount(false); // Set loading false
    }
  }, [deleteAccount, toast]);

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
      // const err = error as Error; // Remove this if err is not used or use error directly
      toast({
        title: '목표 저장 실패',
        description: `목표 저장 중 오류가 발생했습니다: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsGoalSaving(false);
    }
  }, [weeklyNoteGoal, weeklyReminderGoal, updateUserGoals, toast]);

  const getNotificationDescription = () => {
    switch (permission) {
      case 'granted':
        return '알림이 활성화되었습니다.';
      case 'denied':
        return '알림이 차단되었습니다. 브라우저 설정에서 권한을 변경해주세요.';
      default:
        return '리마인더 및 중요 업데이트에 대한 알림을 받습니다.';
    }
  };

  const handleTestNotification = async () => {
    try {
      if (permission !== 'granted') {
        const result = await requestPermission();
        if (result !== 'granted') {
          toast({
            title: '알림 권한 필요',
            description: '알림을 테스트하려면 먼저 권한을 허용해주세요.',
            variant: 'destructive',
          });
          return;
        }
      }

      await sendNotification('Notia', '테스트 알림입니다! 🎉');

      toast({
        title: '알림 전송됨',
        description: '테스트 알림을 성공적으로 보냈습니다.',
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      toast({
        title: '알림 오류',
        description: '알림을 표시하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 bg-background">
      <Card>
        <CardHeader>
          <CardTitle>일반</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingSwitchItem
            id="notifications"
            label="푸시 알림"
            description={getNotificationDescription()}
            checked={permission === 'granted'}
            disabled={permission !== 'default'}
            onCheckedChange={requestPermission}
            icon={<Bell />}
          />
          <SettingActionItem
            id="test-notification"
            label="알림 테스트"
            description="푸시 알림이 제대로 동작하는지 테스트합니다."
            buttonText="보내기"
            onAction={handleTestNotification}
            icon={<Send />}
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

      {isTauri() && (
        <Card>
          <CardHeader>
            <CardTitle>정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Info className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">현재 버전</p>
                  <p className="text-sm text-muted-foreground">v{import.meta.env.PACKAGE_VERSION || '1.0.0'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {updateStatus.available ? (
                   <Button onClick={handleInstallUpdate} size="sm">
                     <Download className="h-4 w-4 mr-2" />
                     업데이트 설치
                   </Button>
                ) : (
                   <Button variant="outline" size="sm" onClick={handleCheckUpdate} disabled={updateStatus.checking}>
                     <RefreshCw className={`h-4 w-4 mr-2 ${updateStatus.checking ? 'animate-spin' : ''}`} />
                     업데이트 확인
                   </Button>
                )}
              </div>
            </div>
            {updateStatus.available && updateStatus.manifest && (
              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                <p className="font-bold mb-1">v{updateStatus.manifest.version} 변경사항:</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{updateStatus.manifest.body}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={handleSignOut}
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
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
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
