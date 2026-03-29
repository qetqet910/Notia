import React from 'react';
import { Header } from '@/components/layout/landing/Header';
import { Footer } from '@/components/layout/landing/Footer';
import { Toaster } from '@/components/ui/toaster';
import { motion } from 'framer-motion';
import { changelogData } from '@/constants/changeLog';
import { ChangeCategory } from '@/types';
import { fadeIn } from '@/constants/animations';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categoryStyles: Record<ChangeCategory, string> = {
  '✨ 기능': 'bg-notia-primary/10 text-notia-primary border-none rounded-toss',
  '🐛 버그 수정': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-toss',
  '🚀 성능': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-toss',
  '💅 디자인': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300 rounded-toss',
  '🔧 리팩토링': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-toss',
  '📝 문서': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-toss',
  '⚙️ 기타': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-toss',
};

export const ChangelogPage: React.FC = () => {
  const { user } = useAuthStore();

  // 1. Redirect Logic
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderChanges = (changes: { category: ChangeCategory; description: string }[]) => (
    <div className="mt-4 space-y-3 border-l-2 border-toss-border/50 pl-6 ml-1">
      {changes.length > 0 ? (
        changes.map((change, changeIndex) => (
          <div key={changeIndex} className="flex items-start space-x-3">
            <Badge className={`${categoryStyles[change.category]} mt-1 shrink-0 font-medium`}>
              {change.category.split(' ')[0]}
            </Badge>
            <p className="text-toss-gray flex-1 break-keep leading-relaxed">
              {change.description}
            </p>
          </div>
        ))
      ) : (
        <p className="text-toss-light italic">해당 버전에서 이 카테고리의 변경 사항이 없습니다.</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12 pt-28">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-toss-dark mb-4">
            업데이트 내역
          </h1>
          <p className="text-toss-gray mt-2">
            Notia의 발전 과정을 확인해 보세요.
          </p>
        </motion.div>

        <Tabs defaultValue="user" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-toss-lightGray/50 p-1 rounded-toss-lg">
              <TabsTrigger 
                value="user"
                className="rounded-toss data-[state=active]:bg-white data-[state=active]:text-notia-primary data-[state=active]:shadow-toss"
              >
                사용자 (User)
              </TabsTrigger>
              <TabsTrigger 
                value="dev"
                className="rounded-toss data-[state=active]:bg-white data-[state=active]:text-notia-primary data-[state=active]:shadow-toss"
              >
                개발자 (Dev)
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="user" className="space-y-12">
            {changelogData.map((release, index) => (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-toss-lg p-6 shadow-toss border border-toss-border/50"
              >
                <div className="flex items-baseline space-x-4 mb-6">
                  <h2 className="text-2xl font-bold text-toss-dark">
                    {release.version}
                  </h2>
                  <p className="text-toss-gray text-sm">
                    {release.date}
                  </p>
                </div>
                {renderChanges(release.userChanges)}
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="dev" className="space-y-12">
            {changelogData.map((release, index) => (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-toss-lg p-6 shadow-toss border border-toss-border/50"
              >
                <div className="flex items-baseline space-x-4 mb-6">
                  <h2 className="text-2xl font-bold text-toss-dark">
                    {release.version}
                  </h2>
                  <p className="text-toss-gray text-sm">
                    {release.date}
                  </p>
                </div>
                {renderChanges(release.devChanges)}
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ChangelogPage;
