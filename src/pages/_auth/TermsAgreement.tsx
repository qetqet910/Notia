import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MarkdownPreview } from '@/components/features/dashboard/MarkdownPreview';
import { termsOfService, privacyPolicy } from '@/constants/terms';
import { useToast } from '@/hooks/useToast';
import Expand from 'lucide-react/dist/esm/icons/expand';
import { motion } from 'framer-motion';

// 약관 내용을 표시하고 확대하는 재사용 가능한 컴포넌트
const TermBox = ({
  title,
  content,
  checked,
  onCheckedChange,
  onExpand,
}: {
  title: string;
  content: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onExpand: () => void;
}) => (
  <div className="space-y-2">
    <h3 className="font-semibold">{title}</h3>
    <div className="relative">
      <ScrollArea className="h-40 w-full rounded-md border p-4">
        <MarkdownPreview content={content} />
      </ScrollArea>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={onExpand}
      >
        <Expand className="h-4 w-4" />
        <span className="sr-only">확대하기</span>
      </Button>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox
        id={title}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(Boolean(checked))}
      />
      <label
        htmlFor={title}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {title}에 동의합니다.
      </label>
    </div>
  </div>
);

export default function TermsAgreement() {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [dialogContent, setDialogContent] = useState<{ title: string; content: string } | null>(null);

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
          <TermBox
            title="서비스 이용약관"
            content={termsOfService}
            checked={agreedTerms}
            onCheckedChange={setAgreedTerms}
            onExpand={() => setDialogContent({ title: '서비스 이용약관', content: termsOfService })}
          />
          <TermBox
            title="개인정보 처리방침"
            content={privacyPolicy}
            checked={agreedPrivacy}
            onCheckedChange={setAgreedPrivacy}
            onExpand={() => setDialogContent({ title: '개인정보 처리방침', content: privacyPolicy })}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleAgreement} disabled={!canSubmit || isTermsLoading} className="w-full">
            {isTermsLoading ? '처리 중...' : '동의하고 시작하기'}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={!!dialogContent} onOpenChange={(isOpen) => !isOpen && setDialogContent(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>
              아래 내용을 스크롤하여 전체 약관을 확인하실 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <motion.div
            key={dialogContent?.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-hidden"
          >
            <ScrollArea className="h-full pr-4">
              <MarkdownPreview content={dialogContent?.content ?? ''} />
            </ScrollArea>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}