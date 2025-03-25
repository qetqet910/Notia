import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { generateRandomKey, formatKey } from "@/utils/keys";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userKey: string | null;
  formattedKey: string | null;
  error: Error | null;
}

interface AuthStore extends AuthState {
  // Auth methods
  loginWithKey: (
    key: string
  ) => Promise<{ success: boolean; message?: string }>;
  generateAndStoreKey: (email?: string) => Promise<boolean>;
  generateAnonymousKey: () => Promise<boolean>;
  loginWithSocial: (provider: "github" | "google") => Promise<void>;
  signOut: () => Promise<void>;
  // Group methods
  createGroup: (name: string) => Promise<any>;
  joinGroup: (key: string) => Promise<any>;
  // Session management
  checkSession: () => Promise<void>;
  setError: (error: Error | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  userKey: null,
  formattedKey: null,
  error: null,

  // Session management
  checkSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  // Key-based authentication
  loginWithKey: async (key: string) => {
    try {
      set({ isLoading: true, error: null });
      const cleanKey = key.replace(/-/g, "");

      const { data: allKeys, error: allKeysError } = await supabase
        .from("user_keys")
        .select("user_id, key, is_active");

      if (allKeysError) throw allKeysError;

      const matchingKey = allKeys?.find(
        (k) => k.key === cleanKey && k.is_active
      );
      if (!matchingKey) {
        throw new Error("유효하지 않은 키입니다.");
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInAnonymously();
      if (authError) throw authError;

      await supabase.auth.updateUser({
        data: {
          original_user_id: matchingKey.user_id,
          key_login: true,
          login_method: "key",
        },
      });

      set({
        userKey: cleanKey,
        formattedKey: formatKey(cleanKey),
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, message: "로그인 성공" };
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return {
        success: false,
        message: error instanceof Error ? error.message : "로그인 실패",
      };
    }
  },

  generateAndStoreKey: async (email?: string) => {
    try {
      set({ isLoading: true, error: null });

      if (!email?.trim()) {
        throw new Error("이메일을 입력해주세요.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("유효한 이메일 주소를 입력해주세요.");
      }

      const key = generateRandomKey(16);
      const password = generateRandomKey(12);

      const { data: userData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: { key_prefix: key.substring(0, 4) },
          },
        }
      );

      if (signUpError) throw signUpError;
      if (!userData.user) throw new Error("사용자 생성에 실패했습니다.");

      await supabase.from("user_keys").insert({
        user_id: userData.user.id,
        key,
        created_at: new Date().toISOString(),
        is_active: true,
      });

      const displayName = email.split("@")[0];
      await supabase.from("user_profiles").insert({
        user_id: userData.user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      });

      set({
        userKey: key,
        formattedKey: formatKey(key),
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return false;
    }
  },

  generateAnonymousKey: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: authData, error: authError } =
        await supabase.auth.signInAnonymously();
      if (authError) throw authError;
      if (!authData.user) throw new Error("익명 로그인 실패");

      const key = generateRandomKey(16);

      await supabase.from("user_keys").insert({
        user_id: authData.user.id,
        key,
        created_at: new Date().toISOString(),
        is_active: true,
      });

      const displayName = `User-${authData.user.id.substring(0, 6)}`;
      await supabase.from("user_profiles").insert({
        user_id: authData.user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      });

      await supabase.auth.updateUser({
        data: {
          key_prefix: key.substring(0, 4),
          key_login: true,
          login_method: "anonymous",
        },
      });

      set({
        userKey: key,
        formattedKey: formatKey(key),
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return false;
    }
  },

  loginWithSocial: async (provider: "github" | "google") => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (name: string) => {
    try {
      set({ isLoading: true, error: null });
      const { user } = get();

      if (!user) throw new Error("로그인이 필요합니다.");

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name,
          created_by: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  joinGroup: async (key: string) => {
    try {
      set({ isLoading: true, error: null });
      const cleanKey = key.replace(/-/g, "");

      const { data: keyData, error: keyError } = await supabase
        .from("group_keys")
        .select("group_id")
        .eq("key", cleanKey)
        .eq("is_active", true)
        .single();

      if (keyError || !keyData) throw new Error("유효하지 않은 그룹 키입니다.");

      const { user } = get();
      if (!user) throw new Error("로그인이 필요합니다.");

      await supabase.from("group_members").insert({
        group_id: keyData.group_id,
        user_id: user.id,
        role: "member",
      });

      return { success: true, groupId: keyData.group_id };
    } catch (error) {
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      await supabase.auth.signOut();
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        userKey: null,
        formattedKey: null,
      });
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error: Error | null) => set({ error }),
}));

// Auth state change listener
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
  });
});
