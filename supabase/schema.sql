-- UUID 확장 활성화 (이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 기존 테이블 및 정책 삭제 (필요한 경우)
DROP POLICY IF EXISTS "사용자는 자신의 키만 볼 수 있음" ON public.user_keys;
DROP POLICY IF EXISTS "사용자는 자신의 키만 생성할 수 있음" ON public.user_keys;
DROP POLICY IF EXISTS "사용자는 자신의 키만 수정할 수 있음" ON public.user_keys;
DROP POLICY IF EXISTS "모든 사용자가 그룹을 생성할 수 있음" ON public.user_groups;
DROP POLICY IF EXISTS "그룹 소유자만 그룹을 수정할 수 있음" ON public.user_groups;
DROP POLICY IF EXISTS "그룹 멤버는 그룹을 볼 수 있음" ON public.user_groups;
DROP POLICY IF EXISTS "그룹 멤버는 멤버 목록을 볼 수 있음" ON public.group_members;
DROP POLICY IF EXISTS "사용자는 그룹에 참여할 수 있음" ON public.group_members;
DROP POLICY IF EXISTS "사용자는 모든 프로필을 볼 수 있음" ON public.user_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 수정할 수 있음" ON public.user_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 생성할 수 있음" ON public.user_profiles;

-- 테이블 생성 (이미 존재하는 경우 건너뜀)
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

-- 그룹 생성 및 멤버 추가를 위한 함수 생성
CREATE OR REPLACE FUNCTION public.create_group_with_member(
  group_name TEXT,
  group_key TEXT,
  user_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 소유자 권한으로 실행
AS $$
DECLARE
  new_group_id UUID;
  result jsonb;
BEGIN
  -- 그룹 생성
  INSERT INTO public.user_groups (name, key, owner_id, created_at)
  VALUES (group_name, group_key, user_id, NOW())
  RETURNING id INTO new_group_id;
  
  -- 그룹 멤버로 추가
  INSERT INTO public.group_members (group_id, user_id, joined_at)
  VALUES (new_group_id, user_id, NOW());
  
  -- 결과 반환
  SELECT jsonb_build_object(
    'id', new_group_id,
    'name', group_name,
    'key', group_key,
    'owner_id', user_id
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 그룹 참여 함수 생성
CREATE OR REPLACE FUNCTION public.join_group_by_key(
  group_key TEXT,
  user_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_group_id UUID;
  found_group_name TEXT;
  result jsonb;
BEGIN
  -- 그룹 키로 그룹 찾기
  SELECT id, name INTO found_group_id, found_group_name
  FROM public.user_groups
  WHERE key = group_key;
  
  IF found_group_id IS NULL THEN
    RAISE EXCEPTION '유효하지 않은 그룹 키입니다.';
  END IF;
  
  -- 이미 멤버인지 확인
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = found_group_id AND user_id = user_id
  ) THEN
    RETURN jsonb_build_object(
      'message', '이미 그룹의 멤버입니다.',
      'group_id', found_group_id,
      'group_name', found_group_name
    );
  END IF;
  
  -- 그룹에 멤버 추가
  INSERT INTO public.group_members (group_id, user_id, joined_at)
  VALUES (found_group_id, user_id, NOW());
  
  -- 결과 반환
  SELECT jsonb_build_object(
    'message', found_group_name || ' 그룹에 참여했습니다.',
    'group_id', found_group_id,
    'group_name', found_group_name
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 함수에 대한 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.create_group_with_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_with_member TO service_role;
GRANT EXECUTE ON FUNCTION public.join_group_by_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_key TO service_role;