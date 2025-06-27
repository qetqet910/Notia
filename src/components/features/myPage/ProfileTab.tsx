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
  BarChart3, // Not used in ProfileTab, can be removed
  Save,
  Camera,
  Award,
  TrendingUp, // Not used in ProfileTab, can be removed
  CheckCircle,
  Flame,
  Trophy,
  Loader2,
} from 'lucide-react';
import { StatItem } from '@/components/ui/myPage/StatItem'; // Assuming this is defined elsewhere
import { Achievement } from '@/types/index'; // Assuming Achievement is defined in types/index.ts

// users 테이블의 user_profile 데이터 구조에 맞게 인터페이스 정의
interface UserProfileData {
  id: string; // uuid
  created_at: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  key: string | null; // 'key' 필드 추가
  updated_at: string | null;
}

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

export const ProfileTab: React.FC<ProfileTabProps> = ({
  stats,
  achievements,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, fetchUserProfile: fetchAuthUserProfile } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 'users' 테이블에서 가져올 실제 사용자 프로필 데이터를 위한 상태
  const [currentProfile, setCurrentProfile] = useState<UserProfileData | null>(
    null,
  );

  // 입력 필드 상태는 currentProfile에서 초기화
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // 컴포넌트 마운트 시 또는 user 변경 시 프로필 데이터 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        // 'users' 테이블에서 현재 로그인한 user의 id와 일치하는 프로필을 가져옴
        const { data, error } = await supabase
          .from('users') // 'user_profile' 대신 'users' 테이블 사용
          .select('*')
          .eq('id', user.id) // 'user_id' 대신 'id' 사용
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116: No rows found
          console.error(
            'Error fetching user profile from "users" table:',
            error.message,
          );
          toast({
            title: '프로필 로드 실패',
            description: `프로필 정보를 가져오는 중 오류가 발생했습니다: ${error.message}`,
            variant: 'destructive',
          });
        } else if (data) {
          setCurrentProfile(data);
          setDisplayName(
            data.display_name || user.user_metadata.name || '사용자',
          );
          setAvatarUrl(data.avatar_url || user.user_metadata.avatar_url || '');
        } else {
          // 'users' 테이블에 프로필이 없는 경우, auth.user의 메타데이터를 사용하고
          // 새로운 프로필 생성을 준비 (handleSaveProfile에서 처리)
          setCurrentProfile(null); // 'users' 테이블에 아직 프로필이 없음을 나타냄
          setDisplayName(user.user_metadata.name || '사용자');
          setAvatarUrl(user.user_metadata.avatar_url || '');
        }
      } else {
        // user가 없는 경우 상태 초기화
        setCurrentProfile(null);
        setDisplayName('사용자');
        setAvatarUrl('');
      }
    };
    loadProfile();
  }, [user?.id, toast]);

  const displayEmail = useMemo(() => {
    return user?.email ? (
      user.email.startsWith('anon_') ? (
        '익명 사용자는 이메일이 없습니다.'
      ) : (
        user.email
      )
    ) : (
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    );
  }, [currentProfile, user]);

  // 소셜 로그인 계정은 프로필 수정 불가
  const isProvider = useMemo(() => {
    return (
      user &&
      user.app_metadata?.provider &&
      user.app_metadata.provider !== 'email' &&
      !user?.email?.startsWith('anon_') // 익명 이메일 계정도 Provider로 간주 (편집 불가)
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

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      if (!user?.id) {
        toast({
          title: '저장 실패',
          description: '사용자 정보를 찾을 수 없습니다.',
          variant: 'destructive',
        });
        return;
      }

      let updateError = null;
      if (currentProfile) {
        // 기존 프로필이 있으면 업데이트
        const { error } = await supabase
          .from('users') // 'users' 테이블 업데이트
          .update({
            display_name: displayName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id); // user_id 대신 id 필드 사용
        updateError = error;
      } else {
        // 프로필이 없으면 새로 생성 (insert)
        const { error } = await supabase.from('users').insert({
          id: user.id, // Supabase Auth user ID를 id로 사용
          display_name: displayName,
          email: displayEmail, // 생성 시 이메일도 저장
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // 'key' 필드는 필요에 따라 여기에 추가하거나 기본값을 설정
          // key: 'some_default_key',
        });
        updateError = error;
      }

      if (updateError) {
        throw updateError;
      }

      // 성공적으로 저장 후 currentProfile 상태 업데이트
      const { data: updatedData, error: fetchUpdatedError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchUpdatedError) {
        console.error(
          'Error fetching updated profile:',
          fetchUpdatedError.message,
        );
      } else if (updatedData) {
        setCurrentProfile(updatedData);
      }

      toast({
        title: '프로필 저장됨',
        description: '프로필 정보가 성공적으로 업데이트되었습니다.',
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error.message);
      toast({
        title: '저장 실패',
        description: `프로필 저장 중 오류가 발생했습니다: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [displayName, avatarUrl, user?.id, displayEmail, currentProfile, toast]);

  const handleAvatarChange = useCallback(
    () => fileInputRef.current?.click(),
    [],
  );

  const onAvatarFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // ... 초기 유효성 검사 ...

      setIsSaving(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `public/${fileName}`;

        console.log('Attempting to delete existing file at:', filePath);
        const { error: deleteError } = await supabase.storage
          .from('avatar')
          .remove([filePath]);

        if (deleteError) {
          if (deleteError.message !== 'The resource was not found') {
            throw new Error(`기존 아바타 삭제 실패: ${deleteError.message}`);
          }
          console.log('Old avatar not found or already deleted, proceeding.');
        } else {
          console.log('Old avatar delete request sent. Polling for removal...');
          // --- 폴링 로직 시작 ---
          let attempts = 0;
          const maxAttempts = 10;
          const delay = 500; // 0.5초마다 확인

          while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            const { data: listData, error: listError } = await supabase.storage
              .from('avatar')
              .list('public', { search: fileName }); // 'public' 폴더에서 해당 파일 이름으로 검색

            if (listError) {
              console.warn('Error during polling list:', listError.message);
              // 에러 발생 시 계속 시도하거나, 에러 처리 로직 추가
            }

            const fileFound = listData?.some((obj) => obj.name === fileName);

            if (!fileFound) {
              console.log(
                'File successfully removed from storage. Proceeding.',
              );
              break; // 파일이 사라졌으면 루프 종료
            }

            attempts++;
            console.log(
              `Polling attempt ${attempts}/${maxAttempts}. File still found.`,
            );
          }

          if (attempts === maxAttempts) {
            console.warn(
              'File might not have been fully removed after polling attempts.',
            );
            // 이 경우에도 업로드를 시도하거나, 사용자에게 알림
          }
          // --- 폴링 로직 끝 ---
        }

        console.log('Attempting to upload new file...');
        const { error: uploadError } = await supabase.storage
          .from('avatar')
          .upload(filePath, file, {
            cacheControl: '3600',
            contentType: file.type ?? 'image/jpeg',
          });

        if (uploadError) {
          throw uploadError;
        }
        // ... (나머지 로직)
      } catch (error: any) {
        // ... 에러 처리 ...
      } finally {
        setIsSaving(false);
      }
    },
    [
      user?.id,
      currentProfile?.avatar_url,
      user?.user_metadata.avatar_url,
      toast,
    ],
  );

  return (
    <div className="space-y-6">
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
                  onClick={() => setIsEditing(false)}
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
                <AvatarImage src={avatarUrl || ''} />
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
                  JPG, PNG 파일. 2MB 이하.
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
          {achievements.filter((a: Achievement) => a.unlocked).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((ach: Achievement) => (
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
                          ? ach.color + ' text-white'
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
              icon={<Flame className="h-5 w-5" />}
              value={stats.streak}
              label="연속 일수"
              color="text-orange-500"
            />
            <StatItem
              icon={<CheckCircle className="h-5 w-5" />}
              value={stats.todayCompleted}
              label="오늘 완료"
              color="text-green-500"
            />
            <StatItem
              icon={<Award className="h-5 w-5" />}
              value={`${Math.round(stats.completionRate)}%`}
              label="완료율"
              color="text-purple-500"
            />
            <StatItem
              icon={<TrendingUp className="h-5 w-5" />}
              value={stats.weeklyAverage}
              label="주간 평균"
              color="text-blue-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
