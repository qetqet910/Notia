import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { motion } from 'framer-motion';
import { changelogData } from '@/constants/changeLog';
import { ChangeCategory } from '@/types';
import { fadeIn } from '@/constants/animations';
import { Badge } from '@/components/ui/badge';

const categoryStyles: Record<ChangeCategory, string> = {
  '✨ 기능': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  '🐛 버그 수정': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  '🚀 성능': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  '💅 디자인': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  '🔧 리팩토링': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  '📝 문서': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  '⚙️ 기타': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

export const ChangelogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Toaster />
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12 mt-16">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            업데이트 내역
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Notia의 발전 과정을 확인해 보세요.
          </p>
        </motion.div>

        <div className="space-y-12">
          {changelogData.map((release, index) => (
            <motion.div
              key={release.version}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-baseline space-x-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {release.version}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {release.date}
                </p>
              </div>
              <div className="mt-4 space-y-3 border-l-2 border-slate-200 dark:border-slate-700 pl-6 ml-1">
                {release.changes.map((change, changeIndex) => (
                  <div key={changeIndex} className="flex items-start space-x-3">
                    <Badge className={`${categoryStyles[change.category]} mt-1`}>
                      {change.category.split(' ')[0]}
                    </Badge>
                    <p className="text-gray-700 dark:text-gray-300 flex-1">
                      {change.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangelogPage;
