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
import { Achievement } from '@/types/index';

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

  const [currentProfile, setCurrentProfile] = useState<UserProfileData | null>(
    null,
  );

  // 입력 필드 상태는 currentProfile에서 초기화
  const [displayName, setDisplayName] = useState('');
  // 임시 아바타 URL 상태 (미리보기용)
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  // DB에 저장된 실제 아바타 URL (취소 시 복원용)
  const [dbAvatarUrl, setDbAvatarUrl] = useState('');

  // 컴포넌트 마운트 시 또는 user 변경 시 프로필 데이터 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        if (isProvider) {
          setCurrentProfile(null); // 'users' 테이블에 프로필이 없으므로 null로 설정
          setDisplayName(
            user.user_metadata.name || user.user_metadata.full_name || '사용자',
          );
          setTempAvatarUrl(user.user_metadata.avatar_url || '');
          setDbAvatarUrl(user.user_metadata.avatar_url || '');
        } else {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
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
            setTempAvatarUrl(
              data.avatar_url || user.user_metadata.avatar_url || '',
            );

            setDbAvatarUrl(
              data.avatar_url || user.user_metadata.avatar_url || '',
            );
          }
        }
      } else {
        setCurrentProfile(null);
        setDisplayName('사용자');
        setTempAvatarUrl('');
        setDbAvatarUrl('');
      }
    };

    loadProfile();
  }, [user, toast]);

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

  const isProvider = useMemo(() => {
    return (
      user &&
      user.app_metadata?.provider &&
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

  // 아바타 파일 선택 핸들러: 파일 업로드 및 미리보기 URL 설정
  const onAvatarFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast({
          title: '업로드 실패',
          description: '이미지 파일만 업로드 가능합니다.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size >= 10485760) {
        // 10MB 제한
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
        // 1. 고유한 파일 이름 생성 (user.id + 타임스탬프) - 임시 파일용
        const timestamp = new Date().getTime();
        const newFileName = `${user.id}-${timestamp}.${fileExt}`;
        const newFilePath = `public/${newFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatar')
          .upload(newFilePath, file, {
            cacheControl: '3600', // 1시간 캐시
            contentType: file.type,
            // upsert: true 제거! (항상 새로운 파일로 업로드)
          });

        if (uploadError) {
          throw uploadError;
        }

        // 2. 업로드 성공 시 임시 URL 생성 및 미리보기 상태 업데이트
        const { data } = supabase.storage
          .from('avatar')
          .getPublicUrl(newFilePath);

        const uploadedTempUrl = data.publicUrl;

        setTempAvatarUrl(uploadedTempUrl); // 미리보기 URL만 업데이트

        toast({
          title: '사진 업로드 완료',
          description:
            '새로운 아바타가 미리보기로 업로드되었습니다. 저장을 눌러 적용하세요.',
        });
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: '사진 업로드 실패',
          description: '업로드를 실패하였습니다, ' + error.message,
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, toast, setTempAvatarUrl],
  );

  // 저장 버튼 핸들러: DB 업데이트 및 기존 파일 삭제
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

      // 1. 기존 아바타 이미지 삭제 (새로운 URL이 다르다면)
      // handleSaveProfile 함수 내부, 기존 아바타 이미지 삭제 로직 부분

      // 1. 기존 아바타 이미지 삭제 (새로운 URL이 다르다면)
      if (dbAvatarUrl && dbAvatarUrl !== tempAvatarUrl) {
        console.log('DB Avatar URL before deletion attempt:', dbAvatarUrl);
        try {
          // URL에서 '/storage/v1/object/public/버킷명/' 부분을 제거하여 실제 파일 경로만 추출
          // 정규식을 사용하는 것이 가장 견고합니다.
          const urlPattern =
            /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/avatar\/(.*)$/;
          const match = dbAvatarUrl.match(urlPattern);

          let oldFilePathToDelete: string | null = null;
          if (match && match[1]) {
            oldFilePathToDelete = match[1]; //
            console.log(
              'Calculated old file path to delete:',
              oldFilePathToDelete,
            ); // 계산된 삭제 경로 확인

            const { error: deleteError } = await supabase.storage
              .from('avatar')
              .remove([oldFilePathToDelete]); // 추출한 경로를 직접 사용

            if (deleteError) {
              if (deleteError.message !== 'The resource was not found') {
                console.error(
                  '*** ERROR: Failed to delete old avatar:',
                  deleteError.message,
                  deleteError,
                );
                toast({
                  title: '기존 사진 삭제 실패',
                  description: `이전 프로필 사진 삭제 중 오류 발생: ${deleteError.message}`,
                  variant: 'destructive',
                });
              } else {
                console.log(
                  'Old avatar not found (already deleted or never existed).',
                );
              }
            } else {
              console.log('Old DB avatar successfully deleted.');
            }
            await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5초 대기
          } else {
            console.warn(
              'Could not parse old avatar URL for deletion:',
              dbAvatarUrl,
            );
          }
        } catch (error) {
          console.error(
            'Error processing old DB avatar URL for deletion:',
            error,
          );
        }
      } else {
        console.log('No old avatar to delete or URL is the same.');
      }

      // 2. 사용자 프로필 DB 업데이트
      let updateError = null;
      if (currentProfile) {
        const { error } = await supabase
          .from('users')
          .update({
            display_name: displayName,
            avatar_url: tempAvatarUrl, // 미리보기 URL을 최종 저장
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        updateError = error;
      } else {
        const { error } = await supabase.from('users').insert({
          id: user.id,
          display_name: displayName,
          email: displayEmail,
          avatar_url: tempAvatarUrl, // 미리보기 URL을 최종 저장
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        updateError = error;
      }

      if (updateError) {
        throw updateError;
      }

      // 성공적으로 저장 후 currentProfile 및 dbAvatarUrl 상태 업데이트
      const { data: updatedData, error: fetchUpdatedError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchUpdatedError) {
        console.error(
          'Error fetching updated profile after save:',
          fetchUpdatedError.message,
        );
      } else if (updatedData) {
        setCurrentProfile(updatedData);
        setDbAvatarUrl(updatedData.avatar_url); // DB에 저장된 최종 URL로 업데이트
      }

      toast({
        title: '프로필 저장됨',
        description: '프로필 정보가 성공적으로 업데이트되었습니다.',
      });
      setIsEditing(false); // 편집 모드 종료
    } catch (error: any) {
      console.error('Overall error saving profile:', error); // 전체 오류 로깅
      toast({
        title: '저장 실패',
        description: `프로필 저장 중 오류가 발생했습니다: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    displayName,
    tempAvatarUrl,
    user?.id,
    user?.email,
    currentProfile,
    toast,
    dbAvatarUrl,
  ]);

  // 취소 버튼 핸들러: 변경 사항 롤백
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false); // 편집 모드 종료
    // 원래 프로필 값으로 되돌림
    setDisplayName(
      currentProfile?.display_name || user?.user_metadata.name || '사용자',
    );
    setTempAvatarUrl(dbAvatarUrl); // 미리보기 URL을 DB 저장된 URL로 되돌림
  }, [currentProfile, user, dbAvatarUrl]);

  const handleAvatarChange = useCallback(
    () => isEditing && fileInputRef.current?.click(), // 편집 모드일 때만 클릭 가능
    [isEditing],
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
                  onClick={handleCancelEdit} // 취소 버튼에 handleCancelEdit 연결
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
                <AvatarImage src={tempAvatarUrl || ''} />{' '}
                {/* tempAvatarUrl 사용 */}
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
};
