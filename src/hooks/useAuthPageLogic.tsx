import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { generateRandomKey, formatKey } from '@/utils/keyValidation';
import { ToastAction } from '@/components/ui/toast';

export const useAuthPageLogic = () => {
  const {
    user,
    formattedKey,
    isRegisterLoading,
    isLoginLoading,
    loginWithSocial,
    createAnonymousUserWithEdgeFunction,
    createEmailUserWithEdgeFunction,
  } = useAuthStore();

  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        const cleanText = text.replace(/-/g, '');
        await navigator.clipboard.writeText(cleanText);
        setCopiedKey(true);
        toast({
          title: '클립보드에 복사됨',
          description: '하이픈이 제거된 키가 클립보드에 복사되었습니다.',
        });
        setTimeout(() => setCopiedKey(false), 2000);
      } catch (err) {
        console.error('클립보드 복사 오류:', err);
        toast({
          title: '클립보드 복사 오류',
          description: '클립보드에 복사하는 데 실패했습니다.',
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  const handleCreateEmailKey = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (formattedKey && showKey) {
        toast({
          title: '이미 키가 생성되어 있습니다',
          description: '생성된 키를 복사해서 사용하세요.',
        });
        return;
      }
      if (!email || !email.includes('@')) {
        toast({
          title: '유효하지 않은 이메일',
          description: '올바른 이메일 주소를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }
      try {
        const key = generateRandomKey(16);
        const formattedKeyValue = formatKey(key);
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        const result = await createEmailUserWithEdgeFunction(
          email,
          formattedKeyValue,
          ip,
        );
        if (result.success) {
          useAuthStore.setState({
            userKey: key,
            formattedKey: formattedKeyValue,
          });
          setShowKey(true);
          toast({
            title: '키 생성 성공!',
            description: '새로운 키가 생성되었습니다.',
            action: (
              <ToastAction
                altText="Copy"
                onClick={() => copyToClipboard(formattedKeyValue)}
              >
                복사
              </ToastAction>
            ),
          });
        } else {
          let errorMessage = result.error || '알 수 없는 오류가 발생했습니다.';
          if (result.code === 'USER_ALREADY_EXISTS') {
            errorMessage =
              '이미 등록된 이메일입니다. 다른 이메일을 사용하세요.';
          } else if (result.code === 'RATE_LIMITED') {
            errorMessage =
              '너무 많은 키를 생성했습니다. 잠시 후 다시 시도해주세요.';
          }
          toast({
            title: '키 생성 실패',
            description: errorMessage,
            variant: 'destructive',
          });
          setEmail('');
        }
      } catch (err) {
        console.error('이메일 키 생성 오류:', err);
        toast({
          title: '키 생성 오류',
          description:
            '서버 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        });
        setEmail('');
      }
    },
    [
      formattedKey,
      showKey,
      email,
      createEmailUserWithEdgeFunction,
      toast,
      copyToClipboard,
    ],
  );

  const handleSocialLogin = useCallback(
    async (provider: 'github' | 'google') => {
      await loginWithSocial(provider);
    },
    [loginWithSocial],
  );

  const handleCreateAnonymousKey = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isRegisterLoading) return;
      if (formattedKey && showKey) {
        toast({
          title: '이미 키가 생성되어 있습니다',
          description: '생성된 키를 복사해서 사용하세요.',
        });
        return;
      }
      try {
        setShowKey(false);
        const key = generateRandomKey(16);
        const formattedKeyValue = formatKey(key);
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        const result = await createAnonymousUserWithEdgeFunction(
          formattedKeyValue,
          ip,
        );
        if (!result.success) {
          let errorMessage = result?.error || '알 수 없는 오류가 발생했습니다.';
          if (result.code === 'RATE_LIMITED') {
            errorMessage =
              '너무 많은 키를 생성했습니다. 잠시 후 다시 시도해주세요.';
          }
          toast({
            title: '키 생성 실패',
            description: errorMessage,
            variant: 'destructive',
          });
          return;
        }
        useAuthStore.setState({
          userKey: key,
          formattedKey: formattedKeyValue,
        });
        setShowKey(true);
        toast({
          title: '키 생성 성공!',
          description: '새로운 키가 생성되었습니다.',
          action: (
            <ToastAction
              altText="Copy"
              onClick={() => copyToClipboard(formattedKeyValue)}
            >
              복사
            </ToastAction>
          ),
        });
      } catch (err) {
        console.error('익명 사용자 저장 오류:', err);
        toast({
          title: '키 생성 오류',
          description:
            err instanceof Error
              ? err.message
              : '키 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
          variant: 'destructive',
        });
      }
    },
    [
      isRegisterLoading,
      formattedKey,
      showKey,
      createAnonymousUserWithEdgeFunction,
      toast,
      copyToClipboard,
    ],
  );

  return {
    user,
    formattedKey,
    isRegisterLoading,
    isLoginLoading,
    email,
    setEmail,
    copiedKey,
    activeTab,
    setActiveTab,
    showKey,
    handleCreateEmailKey,
    handleSocialLogin,
    handleCreateAnonymousKey,
    copyToClipboard,
  };
};
