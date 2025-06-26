import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { sendReminderNotification } from '@/utils/notification';
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
import { SettingSwitchItem } from '@/components/ui/myPage/SettingSwitchItem';

interface SettingsTabProps {
  user: any; // Consider a more specific user type if available
  handleLogout: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user,
  handleLogout,
}) => {
  const { toast } = useToast();
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] =
    useState(true);

  const [dailyGoal, setDailyGoal] = useState('5');
  const [weeklyGoal, setWeeklyGoal] = useState('10');
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const { permission, requestPermission } = useNotificationPermission();

  useEffect(() => {
    // 초기 로드 시 현재 알림 권한 상태를 반영
    if (permission === 'denied') {
      setReminderNotifications(false);
    }
  }, [permission]);

  const handleReminderToggle = useCallback(
    async (checked: boolean) => {
      // 사용자가 알림을 끄는 경우
      if (!checked) {
        setReminderNotifications(false);
        return;
      }

      // 사용자가 알림을 켜는 경우
      if (permission === 'default') {
        // 권한이 'default' 상태일 때만 요청
        const result = await requestPermission();
        if (result === 'granted') {
          setReminderNotifications(true);
          toast({
            title: '알림 권한 허용됨',
            description: '리마인더 알림을 받을 수 있습니다.',
          });
        } else if (result === 'denied') {
          setReminderNotifications(false);
          setShowPermissionDialog(true); // 거부된 경우 설정 안내 다이얼로그 표시
        }
      } else if (permission === 'denied') {
        // 권한이 'denied' 상태일 경우 즉시 설정 안내 다이얼로그 표시
        setReminderNotifications(false);
        setShowPermissionDialog(true);
      } else if (permission === 'granted') {
        // 권한이 'granted' 상태일 경우, 단순히 스위치 상태만 변경
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
      // TODO: 목표 저장 API 연동 (실제 API 호출로 교체)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: '목표 저장됨',
        description: '새로운 목표가 성공적으로 저장되었습니다.',
      });
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '목표 저장 중 오류 발생',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGoals(false);
    }
  }, [dailyGoal, weeklyGoal, toast]);

  const handleExportData = useCallback(() => {
    // TODO: 데이터 내보내기 로직 구현 (JSON, CSV 등)
    toast({
      title: '기능 준비 중',
      description: '데이터 내보내기 기능은 현재 준비 중입니다.',
    });
  }, [toast]);

  return (
    <div className="space-y-6">
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
                      // 사용자가 직접 브라우저 설정으로 이동하도록 안내 후 페이지 새로고침 유도
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

      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            목표 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">일일 목표 (리마인더 완료 수)</Label>
            <Input
              id="dailyGoal"
              type="number"
              placeholder="5"
              min="1"
              max="50"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyGoal">주간 목표 (노트 작성 수)</Label>
            <Input
              id="weeklyGoal"
              type="number"
              placeholder="10"
              min="1"
              max="100"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
            />
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
