-- 사용자 키 테이블
CREATE TABLE IF NOT EXISTS public.user_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(key)
);

-- 사용자 그룹 테이블
CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(key)
);

-- 그룹 멤버 테이블
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS 정책 설정
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자 키 정책
CREATE POLICY "사용자는 자신의 키만 볼 수 있음" ON public.user_keys
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "사용자는 자신의 키만 생성할 수 있음" ON public.user_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "사용자는 자신의 키만 수정할 수 있음" ON public.user_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자 그룹 정책
CREATE POLICY "모든 사용자가 그룹을 생성할 수 있음" ON public.user_groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
  
CREATE POLICY "그룹 소유자만 그룹을 수정할 수 있음" ON public.user_groups
  FOR UPDATE USING (auth.uid() = owner_id);
  
CREATE POLICY "그룹 멤버는 그룹을 볼 수 있음" ON public.user_groups
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = public.user_groups.id AND user_id = auth.uid()
    )
  );

-- 그룹 멤버 정책
CREATE POLICY "그룹 멤버는 멤버 목록을 볼 수 있음" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_groups
      WHERE id = public.group_members.group_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = public.group_members.group_id AND user_id = auth.uid()
    )
  );
  
CREATE POLICY "사용자는 그룹에 참여할 수 있음" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자 프로필 정책
CREATE POLICY "사용자는 모든 프로필을 볼 수 있음" ON public.user_profiles
  FOR SELECT USING (true);
  
CREATE POLICY "사용자는 자신의 프로필만 수정할 수 있음" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "사용자는 자신의 프로필만 생성할 수 있음" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);