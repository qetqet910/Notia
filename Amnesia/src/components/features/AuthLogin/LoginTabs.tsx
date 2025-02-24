import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { SocialLoginSection } from './SocialLogin';
import { KeyDisplay } from './KeyDisplay'
import { AuthenticationTabs } from './AuthenticationTabs'

// import { LoginForm } from './LoginForm';
// import { SignupForm } from './SignupForm';

export const LoginTabs: React.FC = () => {
  return (
    <Tabs defaultValue='login' className="space-y-4">
      <TabsList className="grid grid-cols-2 gap-4">
        <TabsTrigger value="login">로그인</TabsTrigger>
        <TabsTrigger value="signup">회원가입</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        {/* <LoginForm /> */}
        <AuthenticationTabs />
        <KeyDisplay />
        <SocialLoginSection />
      </TabsContent>
      <TabsContent value="signup">
        {/* <SignupForm /> */}
      </TabsContent>
    </Tabs>
  );
};