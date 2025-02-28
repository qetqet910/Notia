import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialLoginSection } from './SocialLogin';
import { KeyDisplay } from './KeyDisplay';
import { AuthenticationTabs } from './AuthenticationTabs';
import { motion } from 'framer-motion';

export const LoginTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [formattedKey, setFormattedKey] = useState('XXXX-XXXX-XXXX-XXXX');
  const [copiedKey, setCopiedKey] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };
  
  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
    // Your login logic here
  };

  return (
    <Tabs 
      defaultValue="login" 
      className="space-y-6"
      onValueChange={setActiveTab}
    >
      <TabsList className="grid grid-cols-2 w-full p-1 rounded-lg bg-gray-100">
        <TabsTrigger 
          value="login"
          className={`rounded-md py-2 ${activeTab === 'login' ? 'bg-white shadow-sm' : ''}`}
        >
          로그인
        </TabsTrigger>
        <TabsTrigger 
          value="signup"
          className={`rounded-md py-2 ${activeTab === 'signup' ? 'bg-white shadow-sm' : ''}`}
        >
          회원가입
        </TabsTrigger>
      </TabsList>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        key={activeTab}
      >
        <TabsContent value="login" className="mt-0">
          <AuthenticationTabs 
            isLoading={false} 
            onSubmit={(e) => {
              e.preventDefault();
              console.log('Logging in');
            }}
          />
          <KeyDisplay 
            formattedKey={formattedKey}
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
          <SocialLoginSection 
            onSocialLogin={handleSocialLogin}
            isLoading={false}
          />
        </TabsContent>
        
        <TabsContent value="signup" className="mt-0">
          <AuthenticationTabs 
            isLoading={false} 
            onSubmit={(e) => {
              e.preventDefault();
              console.log('Signing up');
            }}
          />
          <KeyDisplay 
            formattedKey={formattedKey}
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
          <SocialLoginSection 
            onSocialLogin={handleSocialLogin}
            isLoading={false}
            isSignup={true}
          />
        </TabsContent>
      </motion.div>
    </Tabs>
  );
};