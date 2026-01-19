import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

export const FeedbackDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const { user } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: '내용을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        message: message.trim(),
        category,
      });

      if (error) throw error;

      toast({
        title: '소중한 의견 감사합니다!',
        description: '보내주신 의견은 서비스 개선에 큰 도움이 됩니다.',
      });
      setIsOpen(false);
      setMessage('');
      setCategory('general');
    } catch (error) {
      console.error('Feedback error:', error);
      toast({
        title: '전송 실패',
        description: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="sr-only">의견 보내기</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>의견 보내기</DialogTitle>
          <DialogDescription>
            Notia를 사용하며 느낀 점, 버그 제보, 기능 요청 등을 자유롭게 보내주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="category">카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반 의견</SelectItem>
                <SelectItem value="bug">버그 신고</SelectItem>
                <SelectItem value="feature">기능 요청</SelectItem>
                <SelectItem value="praise">칭찬하기</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">내용</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="여기에 내용을 입력하세요..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            보내기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
