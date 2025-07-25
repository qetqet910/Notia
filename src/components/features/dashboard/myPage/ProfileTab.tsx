import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabaseClient';
import {
  User,
  Settings,
  BarChart3,
  Save,
  Camera,
  Award,
  TrendingUp,
  CheckCircle,
  Flame,
  Trophy,
  Loader2,
} from 'lucide-react';
import { StatItem } from '@/components/features/dashboard/myPage/StatItem';
import { Achievement, UserProfile } from '@/types/index';

interface ProfileTabProps {
  stats: {
    totalNotes: number;
    completedReminders: number;
    completionRate: number;
    streak: number;
    todayCompleted: number;
    weeklyAverage: number;
    tagsUsed: number;
  };
  achievements: Achievement[];
}

export const ProfileTab: React.FC<ProfileTabProps> = React.memo(
  ({ stats, achievements }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { user, userProfile, fetchUserProfile } = useAuthStore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState('');
    const [tempAvatarUrl, setTempAvatarUrl] = useState('');
    const [dbAvatarUrl, setDbAvatarUrl] = useState('');

    useEffect(() => {
      if (user) {
        const profileName =
          userProfile?.display_name ||
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          '사용자';
        const profileAvatar =
          userProfile?.avatar_url || user.user_metadata?.avatar_url || '';
        setDisplayName(profileName);
        setTempAvatarUrl(profileAvatar);
        setDbAvatarUrl(profileAvatar);
      }
    }, [user, userProfile]);

    const displayEmail = useMemo(() => {
      if (!user) return <Loader2 className="h-4 w-4 animate-spin" />;
      return user.email?.startsWith('anon_')
        ? '익명 사용자는 이메일이 없습니다.'
        : user.email;
    }, [user]);

    const isProvider = useMemo(() => {
      return (
        user?.app_metadata?.provider &&
        user.app_metadata.provider !== 'email' &&
        !user?.email?.startsWith('anon_')
      );
    }, [user]);

    const getInitials = useCallback(
      (name: string) =>
        name
          .split(' ')
          .map((word) => word.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2),
      [],
    );

    const onAvatarFileChange = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
          toast({
            title: '업로드 실패',
            description: '이미지 파일만 업로드 가능합니다.',
            variant: 'destructive',
          });
          return;
        }
        if (file.size >= 10485760) {
          // 10MB
          toast({
            title: '업로드 실패',
            description: '파일 크기가 너무 큽니다. 10MB 이하로 업로드해주세요.',
            variant: 'destructive',
          });
          return;
        }

        setIsSaving(true);
        try {
          const fileExt = file.name.split('.').pop();
          const newFileName = `${user.id}-${new Date().getTime()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('avatar')
            .upload(newFileName, file);
          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('avatar')
            .getPublicUrl(newFileName);
          setTempAvatarUrl(data.publicUrl);
          toast({
            title: '사진 업로드 완료',
            description:
              '새로운 아바타가 미리보기로 업로드되었습니다. 저장을 눌러 적용하세요.',
          });
        } catch (error) {
          const err = error as Error;
          toast({
            title: '사진 업로드 실패',
            description: `업로드를 실패하였습니다: ${err.message}`,
            variant: 'destructive',
          });
        } finally {
          setIsSaving(false);
        }
      },
      [user, toast],
    );

    const handleSaveProfile = useCallback(async () => {
      if (!user) return;
      setIsSaving(true);
      try {
        if (dbAvatarUrl && dbAvatarUrl !== tempAvatarUrl) {
          const oldFilePath = dbAvatarUrl.split('/avatar/')[1];
          if (oldFilePath) {
            await supabase.storage.from('avatar').remove([oldFilePath]);
          }
        }

        const updates: Partial<UserProfile> = {
          display_name: displayName,
          avatar_url: tempAvatarUrl,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);
        if (error) throw error;

        await fetchUserProfile(user.id); // 스토어의 프로필을 최신화
        toast({
          title: '프로필 저장됨',
          description: '프로필 정보가 성공적으로 업데이트되었습니다.',
        });
        setIsEditing(false);
      } catch (error) {
        const err = error as Error;
        toast({
          title: '저장 실패',
          description: `프로필 저장 중 오류가 발생했습니다: ${err.message}`,
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    }, [
      displayName,
      tempAvatarUrl,
      dbAvatarUrl,
      user,
      fetchUserProfile,
      toast,
    ]);

    const handleCancelEdit = useCallback(() => {
      setIsEditing(false);
      setDisplayName(
        userProfile?.display_name || user?.user_metadata.name || '사용자',
      );
      setTempAvatarUrl(dbAvatarUrl);
    }, [userProfile, user, dbAvatarUrl]);

    const handleAvatarChange = useCallback(() => {
      if (isEditing) fileInputRef.current?.click();
    }, [isEditing]);

    return (
      <div
        className="space-y-6 custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 200px)', paddingRight: '1rem' }}
      >
        <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
          <CardHeader className="flex justify-between items-center flex-row">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              프로필 정보
            </CardTitle>
            <div className="flex justify-end space-x-2">
              {isProvider ? (
                <p className="text-sm text-muted-foreground italic">
                  소셜 로그인 계정은 프로필을 편집할 수 없습니다.
                </p>
              ) : isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    취소
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    저장
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  편집
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={tempAvatarUrl} />
                  <AvatarFallback className="text-lg">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && !isProvider && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                    onClick={handleAvatarChange}
                    aria-label="사진 변경"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onAvatarFileChange}
                      accept="image/png, image/jpeg"
                      style={{ display: 'none' }}
                    />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="secondary" className="text-sm">
                    <Award className="h-3 w-3 mr-1" />
                    Level {Math.floor(stats.totalNotes / 10) + 1}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {stats.completedReminders} 포인트
                  </Badge>
                </div>
                {isEditing && !isProvider && (
                  <p className="text-sm text-muted-foreground">
                    사진 파일. 10MB 이하.
                  </p>
                )}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">표시 이름</Label>
                {isEditing && !isProvider ? (
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-lg font-medium pt-1">
                    {displayName || (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <p className="text-lg font-medium pt-1">{displayEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              업적
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.some((a) => a.unlocked) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      ach.unlocked
                        ? 'bg-muted/50 border-primary/20 hover:bg-muted/70'
                        : 'bg-muted/20 border-muted opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`p-1 rounded ${
                          ach.unlocked
                            ? `${ach.color} text-white`
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ach.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{ach.title}</h4>
                      </div>
                      {ach.unlocked && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ach.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="mx-auto h-12 w-12" />
                <p className="mt-4">아직 달성한 업적이 없습니다.</p>
                <p>노트 작성과 리마인더 완료를 통해 업적을 달성해보세요!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              빠른 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem
                icon={<Flame className="h-7 w-7" />}
                value={stats.streak}
                label="연속 일수"
                color="text-orange-500"
              />
              <StatItem
                icon={<CheckCircle className="h-7 w-7" />}
                value={stats.todayCompleted}
                label="오늘 완료"
                color="text-green-500"
              />
              <StatItem
                icon={<Award className="h-7 w-7" />}
                value={`${Math.round(stats.completionRate)}%`}
                label="완료율"
                color="text-yellow-500"
              />
              <StatItem
                icon={<TrendingUp className="h-7 w-7" />}
                value={stats.weeklyAverage}
                label="주간 평균"
                color="text-purple-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);
ProfileTab.displayName = 'ProfileTab';
