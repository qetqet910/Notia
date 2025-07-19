import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider'; // Slider 임포트
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/useToast';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { sendReminderNotification } from '@/utils/browserNotification';
import {
  Bell,
  Calendar,
  LogOut,
  Save,
  Shield,
  Target,
  Trophy,
  Loader2,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SettingSwitchItem } from '@/components/features/dashboard/myPage/SettingSwitchItem';
import { useNotes } from '@/hooks/useNotes'; // HIGHLIGHT: useNotes 훅 임포트
import { User } from '@supabase/supabase-js'; // HIGHLIGHT: 더 구체적인 타입 사용

interface SettingsTabProps {
  user: User | null; // any 대신 Supabase의 User 타입 사용
  handleLogout: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user,
  handleLogout,
}) => {
  const { toast } = useToast();
  const { notes, updateUserGoals } = useNotes(); // HIGHLIGHT: 훅에서 필요한 데이터와 함수 가져오기

  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] =
    useState(true);

  // HIGHLIGHT: user.user_metadata에서 초기값 설정
  const [dailyGoal, setDailyGoal] = useState(
    user?.user_metadata?.reminderGoal?.toString() ?? '5',
  );
  const [weeklyGoal, setWeeklyGoal] = useState(
    user?.user_metadata?.noteGoal?.toString() ?? '10',
  );
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const { permission, requestPermission } = useNotificationPermission();

  useEffect(() => {
    setReminderNotifications(permission === 'granted');
  }, [permission]);

  const handleReminderToggle = useCallback(
    async (checked: boolean) => {
      if (!checked) {
        setReminderNotifications(false);
        return;
      }

      if (permission === 'default') {
        const result = await requestPermission();
        if (result === 'granted') {
          setReminderNotifications(true);
          toast({
            title: '알림 권한 허용됨',
            description: '리마인더 알림을 받을 수 있습니다.',
          });
        } else if (result === 'denied') {
          setReminderNotifications(false);
          setShowPermissionDialog(true);
        }
      } else if (permission === 'denied') {
        setReminderNotifications(false);
        setShowPermissionDialog(true);
      } else if (permission === 'granted') {
        setReminderNotifications(true);
      }
    },
    [permission, requestPermission, toast],
  );

  const handleTestNotification = useCallback(() => {
    if (permission !== 'granted') {
      toast({
        title: '알림 권한 필요',
        description:
          '테스트 알림을 보내려면 브라우저 알림 권한을 먼저 허용해주세요.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '🔔 테스트 알림',
      description:
        '알림이 이렇게 표시됩니다. 브라우저 밖 알림도 표시되는지 확인해주세요.',
      duration: 5000,
    });

    sendReminderNotification(
      'TEST ALARM',
      '테스트 알림입니다. 리마인더가 성공적으로 작동합니다.',
    );
  }, [toast, permission]);

  const handleSaveGoals = useCallback(async () => {
    setIsSavingGoals(true);
    try {
      const newDailyGoal = parseInt(dailyGoal, 10);
      const newWeeklyGoal = parseInt(weeklyGoal, 10);

      if (
        isNaN(newDailyGoal) ||
        isNaN(newWeeklyGoal) ||
        newDailyGoal <= 0 ||
        newWeeklyGoal <= 0
      ) {
        throw new Error('목표 값은 0보다 큰 숫자여야 합니다.');
      }
      await updateUserGoals({
        reminderGoal: newDailyGoal,
        noteGoal: newWeeklyGoal,
      });

      toast({
        title: '목표 저장됨',
        description: '새로운 목표가 성공적으로 저장되었습니다.',
      });
    } catch (error: any) {
      toast({
        title: '저장 실패',
        description: error.message || '목표 저장 중 오류 발생',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGoals(false);
    }
  }, [dailyGoal, weeklyGoal, toast, updateUserGoals]);

  const handleExportData = useCallback(() => {
    if (!notes || notes.length === 0) {
      toast({
        title: '내보낼 데이터 없음',
        description: '내보낼 노트가 없습니다.',
      });
      return;
    }

    const jsonString = JSON.stringify(notes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.download = `notes-export-${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: '데이터 내보내기 성공',
      description: '모든 노트가 JSON 파일로 저장되었습니다.',
    });
  }, [notes, toast]);

  return (
    <div className="space-y-6">
      {/* 알림 설정 카드 */}
      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog
            open={showPermissionDialog}
            onOpenChange={setShowPermissionDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>알림 권한 설정</DialogTitle>
                <DialogDescription>
                  브라우저에서 알림이 차단되어 있습니다. 리마인더 알림을
                  받으려면 브라우저 설정을 변경해주세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="font-medium mb-2">설정 방법:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Chrome: 주소창 왼쪽 자물쇠 → 알림 허용</li>
                    <li>• Firefox: 주소창 왼쪽 방패 → 알림 허용</li>
                    <li>• Safari: Safari 메뉴 → 설정 → 웹사이트 → 알림</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPermissionDialog(false)}
                  >
                    닫기
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPermissionDialog(false);
                      window.location.reload();
                    }}
                  >
                    설정 완료 (새로고침)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <SettingSwitchItem
            id="reminder-noti"
            label="리마인더 알림"
            description={
              permission === 'denied'
                ? '브라우저 알림이 차단되어 있습니다'
                : '리마인더 시간에 알림을 받습니다'
            }
            checked={reminderNotifications}
            onCheckedChange={handleReminderToggle}
            icon={<Calendar />}
          />
          <SettingSwitchItem
            id="achievement-noti"
            label="업적 알림"
            description="새로운 업적 달성 시 알림을 받습니다"
            checked={achievementNotifications}
            onCheckedChange={setAchievementNotifications}
            icon={<Trophy />}
          />
          <Separator />
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTestNotification}
            >
              <Bell className="h-4 w-4 mr-2" />
              테스트 알림 보내기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 목표 설정 카드 */}
      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            목표 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="dailyGoal">리마인더 완료 수 (주간)</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="dailyGoal"
                min={1}
                max={30}
                step={1}
                // 변경점: Slider의 value는 배열 형태여야 합니다.
                // dailyGoal이 문자열일 수 있으니 숫자로 변환합니다.
                value={[parseInt(dailyGoal, 10)]}
                // 변경점: onValueChange는 값 배열을 반환합니다.
                onValueChange={(value) => setDailyGoal(String(value[0]))}
                className="flex-1 cursor-pointer"
              />
              {/* 추가: 현재 값을 시각적으로 표시 */}
              <div className="w-12 text-center">
                <span className="font-bold text-lg text-primary">
                  {dailyGoal}
                </span>
                <span className="text-sm text-muted-foreground">개</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="weeklyGoal">노트 작성 수 (주간)</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="weeklyGoal"
                min={1}
                max={14}
                step={1}
                value={[parseInt(weeklyGoal, 10)]}
                onValueChange={(value) => setWeeklyGoal(String(value[0]))}
                className="flex-1 cursor-pointer"
              />
              <div className="w-12 text-center">
                <span className="font-bold text-lg text-primary">
                  {weeklyGoal}
                </span>
                <span className="text-sm text-muted-foreground">개</span>
              </div>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={handleSaveGoals}
            disabled={isSavingGoals}
          >
            {isSavingGoals ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            목표 저장
          </Button>
        </CardContent>
      </Card>

      {/* 계정 관리 카드 */}
      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            계정 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>가입일</Label>
              <Input
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('ko-KR')
                    : ''
                }
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>마지막 로그인</Label>
              <Input
                value={
                  user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString('ko-KR')
                    : ''
                }
                disabled
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-destructive">위험 구역</h3>
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg space-y-4">
              <p className="text-sm text-destructive">
                이 작업들은 되돌릴 수 없으니 신중하게 진행해주세요.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExportData}>
                  <Package className="h-4 w-4 mr-2" />
                  데이터 내보내기
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        로그아웃 하시겠습니까?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        현재 세션에서 로그아웃됩니다. 저장되지 않은 변경사항은
                        손실될 수 있습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>
                        로그아웃
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      계정 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        정말로 계정을 삭제하시겠습니까?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 회원님의 모든 노트와 활동
                        기록이 영구적으로 삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        삭제하기
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
