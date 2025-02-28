import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTPControlled } from '../../common/Input/Input';
import { Button } from '../../ui/button';
import { Loader2, Key, Users } from 'lucide-react';

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
  const [activeTab, setActiveTab] = React.useState('key');

  return (
    <Tabs 
      defaultValue="key" 
      className="space-y-4"
      onValueChange={setActiveTab}
    >
      <TabsList className="grid grid-cols-2 gap-4 p-1 bg-gray-50 rounded-lg">
        <TabsTrigger 
          value="key" 
          className={`flex items-center justify-center gap-2 ${activeTab === 'key' ? 'bg-white shadow-sm' : ''}`}
        >
          <Key size={16} />
          <span>키</span>
        </TabsTrigger>
        {showGroupTab && (
          <TabsTrigger 
            value="group"
            className={`flex items-center justify-center gap-2 ${activeTab === 'group' ? 'bg-white shadow-sm' : ''}`}
          >
            <Users size={16} />
            <span>그룹</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="key">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="bg-gray-50 p-4 rounded-lg">
            <InputOTPControlled />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-300" 
            disabled={isLoading}
          >
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <InputOTPControlled />
          </div>
          <Button 
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-300" 
            disabled={isLoading}
          >
            그룹 참여하기
          </Button>
        </TabsContent>
      )}
    </Tabs>
  );
};