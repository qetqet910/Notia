import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { termsOfService, privacyPolicy } from '@/constants/terms';
import { useToast } from '@/hooks/useToast';

export default function TermsAgreement() {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { updateTermsAgreement, isTermsLoading } = useAuthStore();

  const from = location.state?.from?.pathname || '/';

  const handleAgreement = async () => {
    try {
      const { success, error } = await updateTermsAgreement();
      if (success) {
        toast({
          title: '성공',
          description: '약관 동의가 완료되었습니다. Notia에 오신 것을 환영합니다!',
        });
        navigate(from, { replace: true });
      } else {
        throw error || new Error('약관 동의 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const error = err as Error;
      toast({
        title: '오류',
        description: error.message || '약관 동의에 실패했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  const canSubmit = agreedTerms && agreedPrivacy;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">서비스 이용 약관 동의</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">서비스 이용약관</h3>
            <ScrollArea className="h-40 w-full rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap font-sans">{termsOfService}</pre>
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(checked) => setAgreedTerms(Boolean(checked))} />
              <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                서비스 이용약관에 동의합니다.
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">개인정보 처리방침</h3>
            <ScrollArea className="h-40 w-full rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap font-sans">{privacyPolicy}</pre>
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Checkbox id="privacy" checked={agreedPrivacy} onCheckedChange={(checked) => setAgreedPrivacy(Boolean(checked))} />
              <label htmlFor="privacy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                개인정보 처리방침에 동의합니다.
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAgreement} 
            disabled={!canSubmit || isTermsLoading} 
            className="w-full"
          >
            {isTermsLoading ? '처리 중...' : '동의하고 시작하기'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}