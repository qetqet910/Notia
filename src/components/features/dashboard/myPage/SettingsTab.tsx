import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import Type from 'lucide-react/dist/esm/icons/type';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNavigate } from 'react-router-dom';
import { loadFont } from '@/utils/fontLoader';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useNotes } from '@/hooks/useNotes';
import Info from 'lucide-react/dist/esm/icons/info';
import Clock from 'lucide-react/dist/esm/icons/clock';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { checkForUpdates, installUpdate } from '@/utils/updater';
import { isTauri } from '@/utils/isTauri';
import { sendNotification } from '@/utils/notification';

import { Badge } from '@/components/ui/badge';
import X from 'lucide-react/dist/esm/icons/x';
import Plus from 'lucide-react/dist/esm/icons/plus';

const FONT_OPTIONS = [
  { value: 'Noto Sans KR', label: 'Noto Sans KR (기본)', family: 'Noto Sans KR, sans-serif' },
  { value: 'S-CoreDream', label: '눈누(에스코어드)', family: 'S-CoreDream, sans-serif' },
  { value: 'ChosunGulim', label: '눈누(조선굴림체)', family: 'ChosunGulim, sans-serif' },
  { value: 'Nanum Gothic', label: '눈누(나눔고딕)', family: 'Nanum Gothic, sans-serif' },
  { value: 'ISaManRu', label: '눈누(이사만루)', family: 'ISaManRu, sans-serif' },
  { value: 'Keris Kedu', label: '눈누(케리스 케듀체)', family: 'Keris Kedu, sans-serif' },
];

const NOTIFICATION_OFFSET_PRESETS = [
  { value: 1, label: '1분 전' },
  { value: 5, label: '5분 전' },
  { value: 10, label: '10분 전' },
  { value: 30, label: '30분 전' },
  { value: 60, label: '1시간 전' },
];

export const SettingsTab: React.FC = React.memo(() => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut, user, deleteAccount } = useAuthStore();
  const rawNotes = useDataStore(state => state.notes);
  const notes = useMemo(() => Array.isArray(rawNotes) ? rawNotes : Object.values(rawNotes || {}), [rawNotes]);
  const createNote = useDataStore(state => state.createNote);
  const { 
    theme, 
    setTheme, 
    fontFamily, 
    setFontFamily, 
    notificationOffsets, 
    setNotificationOffsets 
  } = useThemeStore();
  const { goalStats, updateUserGoals } = useNotes();
  const { permission, requestPermission } = useNotificationPermission();
  
  const [fontLoading, setFontLoading] = useState(false);
  const [customOffset, setCustomOffset] = useState('');

  useEffect(() => {
    Promise.all(FONT_OPTIONS.map((option) => loadFont(option.value))).catch((error) => {
      console.warn(error);
    });
  }, []);

  const handleFontChange = async (value: string) => {
    setFontLoading(true);
    try {
      await setFontFamily(value);
      toast({
        title: '폰트 변경됨',
        description: `폰트가 '${value}'(으)로 변경되었습니다.`,
      });
    } catch {
       toast({
        title: '변경 실패',
        description: '폰트 설정을 저장하지 못했습니다.',
        variant: 'destructive',
      });
    } finally {
      setFontLoading(false);
    }
  };

  const handleAddOffset = async (value: number) => {
    if (notificationOffsets.includes(value)) {
      toast({
        title: '이미 존재하는 시간',
        description: '동일한 알림 시간이 이미 설정되어 있습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    if (notificationOffsets.length >= 10) {
      toast({
        title: '최대 개수 도달',
        description: '알림 시간은 최대 10개까지 설정할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }

    const newOffsets = [...notificationOffsets, value].sort((a, b) => a - b);
    try {
      await setNotificationOffsets(newOffsets);
      setCustomOffset('');
    } catch {
      toast({
        title: '저장 실패',
        description: '알림 설정을 저장하지 못했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveOffset = async (value: number) => {
    const newOffsets = notificationOffsets.filter(offset => offset !== value);
    try {
      await setNotificationOffsets(newOffsets);
    } catch {
      toast({
        title: '삭제 실패',
        description: '알림 설정을 저장하지 못했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCustomOffsetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customOffset);
    if (isNaN(val) || val <= 0) {
      toast({
        title: '잘못된 입력',
        description: '1분 이상의 정수를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    if (val > 43200) { // 1개월
      toast({
        title: '너무 큰 시간',
        description: '알림 시간은 최대 1개월(43,200분)까지 가능합니다.',
        variant: 'destructive',
      });
      return;
    }
    handleAddOffset(val);
  };

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
    // notes는 Record<string, Note> 이므로 배열로 변환하여 내보냄
    const notesArray = Object.values(notes);
    const dataStr = JSON.stringify({ notes: notesArray }, null, 2);
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
            // 가져온 데이터가 배열인지 객체인지 확인하여 안전하게 변환
            const notesToImport: Note[] = Array.isArray(importedData.notes) 
              ? importedData.notes 
              : Object.values(importedData.notes);
            
            let successCount = 0;
            let errorCount = 0;

            for (const note of notesToImport) {
              const newNoteData = {
                owner_id: user.id,
                title: note.title || '가져온 노트',
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
              } catch {
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
    try {
      const result = await signOut();
      if (result.success) {
        toast({
          title: '로그아웃 성공',
          description: '성공적으로 로그아웃되었습니다.',
        });
        // 테마를 라이트 모드로 초기화 (선택 사항)
        setTheme('light');
        navigate(isTauri() ? '/' : '/login');
      } else {
        throw result.error || new Error('로그아웃 실패');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast({
        title: '로그아웃 실패',
        description: error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      // 실패하더라도 로그인 페이지로 이동 시도
      setTimeout(() => {
        navigate(isTauri() ? '/' : '/login');
      }, 100);
    }
  }, [signOut, navigate, toast, setTheme]);

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
        <CardContent className="space-y-4">
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Type className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="font-select" className="font-medium">
                글꼴 선택
              </Label>
            </div>
            <Select value={fontFamily} onValueChange={handleFontChange} disabled={fontLoading}>
              <SelectTrigger className="w-[180px]">
                {fontLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                <SelectValue placeholder="글꼴 선택" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    style={{ fontFamily: option.family }}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <Label className="font-medium">사전 알림 시간</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-8">
              리마인더 시간 전에 미리 알림을 받을 시간을 설정하세요.
            </p>
            
            {/* 현재 설정된 알림 리스트 (배지 형태) */}
            <div className="ml-8 flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="px-3 py-1.5 bg-notia-primary/20 text-notia-primary border-notia-primary/30 hover:bg-notia-primary/20">
                정시 (0분)
              </Badge>
              {notificationOffsets.map((offset) => (
                <Badge 
                  key={offset} 
                  variant="outline" 
                  className="px-3 py-1.5 flex items-center gap-1.5 bg-background group"
                >
                  {offset >= 60 ? `${Math.floor(offset/60)}시간 전` : `${offset}분 전`}
                  <button 
                    onClick={() => handleRemoveOffset(offset)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* 알림 추가 UI */}
            <div className="ml-8 space-y-4">
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_OFFSET_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={notificationOffsets.includes(preset.value)}
                    onClick={() => handleAddOffset(preset.value)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {preset.label}
                  </Button>
                ))}
              </div>

              <form onSubmit={handleCustomOffsetSubmit} className="flex items-center gap-2 max-w-xs">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="직접 입력 (분)"
                    value={customOffset}
                    onChange={(e) => setCustomOffset(e.target.value)}
                    className="h-9 pr-8"
                    min="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">분</span>
                </div>
                <Button type="submit" size="sm" className="h-9">추가</Button>
              </form>
            </div>
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
