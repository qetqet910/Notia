import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile, EditorReminder } from '@/types';
import { formatKey } from '@/utils/keyValidation';
import { checkCreationLimit } from '@/utils/kegisterValidation';
import { guideNoteContent } from '@/constants/basicNote';
import { useDataStore } from './dataStore';

// --- Note Parser Logic (from useNoteParser.ts) ---

const parseTimeExpression = (timeText: string): Date | undefined => {
  const now = new Date();
  const timeStr = timeText.trim().toLowerCase();

  const adjustForPastTime = (result: Date): Date => {
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  };

  let match = timeStr.match(/^(\d+)\s*(시간|분)$/);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const result = new Date();
    if (unit === '시간') {
      result.setHours(result.getHours() + amount);
    } else {
      result.setMinutes(result.getMinutes() + amount);
    }
    return result;
  }

  match = timeStr.match(
    /(\d{4})-(\d{1,2})-(\d{1,2})(?:\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?)?/,
  );
  if (match) {
    const [, year, month, day, ampm, hourStr, minStr] = match;
    let hour = hourStr ? parseInt(hourStr, 10) : 9;
    const minute = minStr ? parseInt(minStr, 10) : 0;
    if (ampm === '오전' && hour === 12) hour = 0;
    if (ampm === '오후' && hour !== 12) hour += 12;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      hour,
      minute,
    );
  }

  match = timeStr.match(
    /(오늘|내일|모레)(?:\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?)?/,
  );
  if (match) {
    const [, dayWord, ampm, hourStr, minStr] = match;
    const result = new Date();
    result.setSeconds(0, 0);

    if (dayWord === '내일') result.setDate(result.getDate() + 1);
    if (dayWord === '모레') result.setDate(result.getDate() + 2);

    let hour = hourStr ? parseInt(hourStr, 10) : 9;
    const minute = minStr ? parseInt(minStr, 10) : 0;

    if (ampm) {
      if (ampm === '오전' && hour === 12) hour = 0;
      if (ampm === '오후' && hour !== 12) hour += 12;
    } else if (hourStr) {
      if (!(hourStr.startsWith('0') && hourStr.length === 2)) {
        if (hour !== 12) {
          hour += 12;
        }
      }
    }

    result.setHours(hour, minute);
    return dayWord === '오늘' ? adjustForPastTime(result) : result;
  }
  
  match = timeStr.match(/(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (match) {
    const [, ampm, hourStr, minStr] = match;
    if (!hourStr) return undefined;

    let hour = parseInt(hourStr, 10);
    const minute = minStr ? parseInt(minStr, 10) : 0;

    if (!ampm) {
      if (!(hourStr.startsWith('0') && hourStr.length === 2)) {
        if (hour !== 12) hour += 12;
      }
    } else {
      if (ampm === '오전' && hour === 12) hour = 0;
      if (ampm === '오후' && hour !== 12) hour += 12;
    }

    const result = new Date();
    result.setHours(hour, minute, 0, 0);
    return adjustForPastTime(result);
  }

  match = timeStr.match(/^(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const now = new Date();
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    return new Date(now.getFullYear(), month, day, 9, 0, 0, 0);
  }

  return undefined;
};

const parseNoteContent = (content: string) => {
    const hashtagRegex = /#([^\s#@]+)/g;
    const uniqueTags = new Set<string>();
    let match;

    while ((match = hashtagRegex.exec(content)) !== null) {
      uniqueTags.add(match[1]);
    }
    const tags = Array.from(uniqueTags);

    const reminders: Omit<EditorReminder, 'id'>[] = [];
    const reminderRegex = /@([^@#\n]+?)\./g;
    while ((match = reminderRegex.exec(content)) !== null) {
      const fullText = match[1].trim();
      let timeText = '';
      let reminderText = '';

      const timePatterns = [
        /^(\d{4}-\d{1,2}-\d{1,2}(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/,
        /^((?:오늘|내일|모레)(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/,
        /^((?:오전|오후)\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(\d+\s*(?:시간|분))/, 
        /^(\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(\d{1,2}-\d{1,2})/, 
      ];

      for (const pattern of timePatterns) {
        const timeMatch = fullText.match(pattern);
        if (timeMatch) {
          timeText = timeMatch[1].trim();
          reminderText = fullText.substring(timeMatch[0].length).trim();
          break;
        }
      }

      if (timeText && reminderText) {
        const parsedDate = parseTimeExpression(timeText);
        if (parsedDate) {
            reminders.push({
              text: reminderText,
              original_text: match[0],
              date: parsedDate,
              completed: false,
              enabled: true,
            });
        }
      }
    }

    return { tags, reminders };
}


// --- Zustand Store ---

interface AuthState {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  userKey: string | null;
  formattedKey: string | null;
  isRegisterLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
  isSessionCheckLoading: boolean;
  isProfileLoading: boolean;
  isTermsLoading: boolean;
  error: Error | null;
}

interface AuthStore extends AuthState {
  setUserKey: (key: string | null) => void;
  setFormattedKey: (key: string | null) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setError: (error: Error | null) => void;
  clearState: () => void;
  clearUserKey: () => void;
  loginWithKey: (key: string) => Promise<{
    success: boolean;
    message?: string;
    user?: User | null;
    error?: Error | null;
  }>;
  loginWithSocial: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<{ success: boolean; error?: Error | null }>;
  checkSession: () => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  restoreSession: () => Promise<boolean>;
  checkCreationLimit: (clientIP: string) => Promise<{
    allowed: boolean;
    error?: string;
  }>;
  createAnonymousUserWithEdgeFunction: (
    key: string,
    clientIP: string,
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    code?: string;
  }>;
  createEmailUserWithEdgeFunction: (
    email: string,
    key: string,
    clientIP: string,
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    code?: string;
  }>;
  updateTermsAgreement: () => Promise<{
    success: boolean;
    error?: Error | null;
  }>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      userProfile: null,
      isAuthenticated: false,
      isRegisterLoading: false,
      isLoginLoading: false,
      isLogoutLoading: false,
      isSessionCheckLoading: true,
      isProfileLoading: true,
      isTermsLoading: false,
      userKey: null,
      formattedKey: null,
      error: null,

      setUserKey: (key) => set({ userKey: key }),
      setFormattedKey: (key) => set({ formattedKey: key }),
      setUser: (user) => set({ user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setError: (error) => set({ error }),
      clearState: () =>
        set({
          userKey: null,
          formattedKey: null,
          user: null,
          isAuthenticated: false,
          error: null,
          userProfile: null,
        }),
      clearUserKey: () => set({ userKey: null }),

      checkCreationLimit: async (clientIP: string) => {
        return await checkCreationLimit(clientIP);
      },

      checkSession: async () => {
        try {
          set({ isSessionCheckLoading: true });
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;

          if (session) {
            set({ user: session.user, session, isAuthenticated: true });
            await get().fetchUserProfile(session.user.id);
            return true;
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              userProfile: null,
            });
            return false;
          }
        } catch (error) {
          console.error('세션 확인 오류:', error);
          set({ error: error as Error, isAuthenticated: false });
          return false;
        } finally {
          set({ isSessionCheckLoading: false });
        }
      },

      fetchUserProfile: async (userId: string) => {
        try {
          set({ isProfileLoading: true });
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              set({ userProfile: null });
              return null;
            }
            throw error;
          }

          set({ userProfile: profile });
          return profile;
        } catch (error) {
          console.error('프로필 조회 오류:', error);
          set({ error: error as Error, userProfile: null });
          return null;
        } finally {
          set({ isProfileLoading: false });
        }
      },

      restoreSession: async () => {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;

          if (session) {
            set({ user: session.user, session, isAuthenticated: true });
            await get().fetchUserProfile(session.user.id);
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              userProfile: null,
            });
          }
        } catch (error) {
          console.error('세션 복원 오류:', error);
          set({
            error: error as Error,
            isAuthenticated: false,
            user: null,
            session: null,
            userProfile: null,
          });
        } finally {
          set({ isSessionCheckLoading: false, isProfileLoading: false });
        }
        return false;
      },

      loginWithKey: async (key: string) => {
        set({ isLoginLoading: true, error: null });
        try {
          const cleanKey = key.replace(/-/g, '').toUpperCase();
          const { data: keyCheckData, error: keyCheckError } =
            await supabase.functions.invoke('login_with_key', {
              body: { key: cleanKey },
            });

          if (keyCheckError || !keyCheckData?.success) {
            throw new Error(keyCheckData?.error || '유효하지 않은 키입니다.');
          }

          if (keyCheckData.email) {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: keyCheckData.email,
              password: cleanKey,
            });

            if (error)
              throw new Error('유효하지 않은 키입니다. 다시 확인해 주세요.');

            if (data.user) {
              set({
                user: data.user,
                session: data.session,
                isAuthenticated: true,
                userKey: cleanKey,
                formattedKey: formatKey(cleanKey),
              });
              await get().fetchUserProfile(data.user.id);
              return { success: true, message: '로그인 성공', user: data.user };
            }
          }

          throw new Error(
            '로그인에 실패했습니다. 키와 연결된 이메일을 찾을 수 없습니다.',
          );
        } catch (error) {
          console.error('로그인 중 오류 발생:', error);
          set({ error: error as Error });
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : '로그인 중 오류가 발생했습니다.',
            error: error as Error,
          };
        } finally {
          set({ isLoginLoading: false });
        }
      },

      loginWithSocial: async (provider: 'github' | 'google') => {
        if (get().isLoginLoading) return;
        set({ isLoginLoading: true, isRegisterLoading: true });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
          if (error) throw error;
        } catch (error) {
          console.error(`${provider} 로그인 오류:`, error);
          set({ isLoginLoading: false, isRegisterLoading: false });
        }
      },

      signOut: async () => {
        set({ isLogoutLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            userProfile: null,
            userKey: null,
            formattedKey: null,
          });
          return { success: true };
        } catch (error) {
          console.error('로그아웃 오류:', error);
          set({ error: error as Error });
          return { success: false, error: error as Error };
        } finally {
          set({ isLogoutLoading: false });
        }
      },

      createAnonymousUserWithEdgeFunction: async (
        key: string,
        clientIP: string,
      ) => {
        set({ isRegisterLoading: true, error: null });
        try {
          const { data, error } = await supabase.functions.invoke(
            'create_anonymous_user',
            {
              body: { key: key.replace(/-/g, '').toUpperCase(), clientIP },
            },
          );

          if (error || !data?.success) {
            const errorMessage =
              data?.error || '익명 사용자 생성에 실패했습니다.';
            const errorCode = data?.code || 'UNEXPECTED_ERROR';
            const customError = new Error(errorMessage);
            (customError as any).code = errorCode;
            throw customError;
          }

          if (data.user) {
            set({
              user: data.user,
              session: data.session || null,
              userKey: key,
              formattedKey: formatKey(key),
            });
            await get().fetchUserProfile(data.user.id);
            return { success: true, user: data.user };
          }
          return {
            success: false,
            error: '사용자 정보가 반환되지 않았습니다.',
            code: 'NO_USER_DATA',
          };
        } catch (error) {
          console.error('익명 사용자 생성 중 오류:', error);
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            code: (error as any)?.code || 'UNEXPECTED_ERROR',
          };
        } finally {
          set({ isRegisterLoading: false });
        }
      },

      createEmailUserWithEdgeFunction: async (
        email: string,
        key: string,
      ) => {
        set({ isRegisterLoading: true, error: null });
        try {
          const { data, error } = await supabase.functions.invoke(
            'create_email_user',
            {
              body: {
                email,
                key: key.replace(/-/g, '').toUpperCase(),
              },
            },
          );

          if (error || !data?.success) {
            const errorMessage =
              data?.error || '이메일 사용자 생성에 실패했습니다.';
            const errorCode = data?.code || 'UNEXPECTED_ERROR';
            const customError = new Error(errorMessage);
            (customError as any).code = errorCode;
            throw customError;
          }

          if (data.user) {
            set({
              user: data.user,
              session: data.session || null,
              userKey: key,
              formattedKey: formatKey(key),
            });
            await get().fetchUserProfile(data.user.id);
            return { success: true, user: data.user };
          }
          return {
            success: false,
            error: '사용자 정보가 반환되지 않았습니다.',
            code: 'NO_USER_DATA',
          };
        } catch (error) {
          console.error('이메일 사용자 생성 중 오류:', error);
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            code: (error as any)?.code || 'UNEXPECTED_ERROR',
          };
        } finally {
          set({ isRegisterLoading: false });
        }
      },

      updateTermsAgreement: async () => {
        set({ isTermsLoading: true });
        try {
          const { user, userProfile } = get();
          if (!user || !userProfile) throw new Error('User not authenticated');

          const { error: termsError } = await supabase
            .from('users')
            .update({ terms_agreed: true })
            .eq('id', user.id);

          if (termsError) throw termsError;

          set({ userProfile: { ...userProfile, terms_agreed: true } });

          const { tags, reminders } = parseNoteContent(guideNoteContent);

          useDataStore.getState().createNote({
            owner_id: user.id,
            title: '🎉 NOTIA 에 오신 것을 환영합니다! 🎉',
            content: guideNoteContent,
            tags: tags,
            reminders: reminders,
          });

          return { success: true };
        } catch (error) {
          console.error(
            'Error updating terms agreement and creating guide note:',
            error,
          );
          return { success: false, error: error as Error };
        } finally {
          set({ isTermsLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        userKey: state.userKey,
        formattedKey: state.formattedKey,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.restoreSession();
        }
      },
    },
  ),
);