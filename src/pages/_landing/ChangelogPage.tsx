import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { motion } from 'framer-motion';

const changelogData = [
  {
    version: 'v1.2.0',
    date: '2025년 7월 8일',
    features: [
      '메인 기능 구현',
      '사용자 시스템 완성',
      'UI/UX 및 편의성, 디자인 개선',
    ],
    fixes: ['DB 성능, 안정성 개선', '일부 버그 수정'],
  },
  {
    version: 'v1.1.0',
    date: '2025년 6월 3일',
    features: ['기본 기능 구현', '사용자 시스템 도입'],
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
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
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            업데이트 내역
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            최신 변경 사항과 개선된 기능을 확인하세요.
          </p>
        </motion.div>

        <div className="space-y-8">
          {changelogData.map((release) => (
            <motion.div
              key={release.version}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: changelogData.indexOf(release) * 0.1,
              }}
              className="bg-white dark:bg-slate-800 rounded-md shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {release.version}
              </h2>
              <p className="text-gray-500 dark:text-gray-300 text-sm mb-4">
                {release.date}
              </p>
              {release.features && release.features.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    주요 기능
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                    {release.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              {release.fixes && release.fixes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">
                    수정 사항
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                    {release.fixes.map((fix, index) => (
                      <li key={index}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangelogPage;
