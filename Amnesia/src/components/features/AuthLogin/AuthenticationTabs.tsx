import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTPControlled } from '../../common/Input/Input';
import { Button } from '../../ui/button';
import { Loader2 } from 'lucide-react';

interface AuthenticationTabsProps {
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  showGroupTab?: boolean;
}

export const AuthenticationTabs: React.FC<AuthenticationTabsProps> = ({
  isLoading,
  onSubmit,
  showGroupTab = true
}) => {
  return (
    <Tabs defaultValue="key" className="space-y-4">
      <TabsList className="grid grid-cols-2 gap-4">
        <TabsTrigger value="key">키</TabsTrigger>
        {showGroupTab && <TabsTrigger value="group">그룹</TabsTrigger>}
      </TabsList>

      <TabsContent value="key">
        <form className="space-y-4" onSubmit={onSubmit}>
          <InputOTPControlled />
          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              "로그인"
            )}
          </Button>
        </form>
      </TabsContent>

      {showGroupTab && (
        <TabsContent value="group">
          <InputOTPControlled />
          <Button className="w-full h-12" disabled={isLoading}>
            그룹 참여하기
          </Button>
        </TabsContent>
      )}
    </Tabs>
  );
};