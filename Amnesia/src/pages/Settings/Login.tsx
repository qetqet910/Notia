import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Lottie from 'lottie-react';
import animationData from '@/stores/login-animation.json';
import logoImage from '@/stores/Logo.png';
import { LoginTabs } from '../../components/features/AuthLogin/LoginTabs';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { error, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5, 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-blue-50 to-purple-50"
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Left login section */}
      <motion.div 
        className="w-full lg:w-1/2 p-4 md:p-8 flex items-center justify-center lg:justify-end"
        variants={itemVariants}
      >
        <div className="w-full max-w-md relative bg-white rounded-xl shadow-lg p-6 md:p-8">
          <motion.div 
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 lg:left-10 lg:translate-x-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img src={logoImage} className="w-24 h-24 object-contain" alt="Amnesia Logo" />
          </motion.div>
          
          <CardContent className="pt-10 pb-6">
            <motion.h1 
              className="text-3xl font-bold mb-6 text-center lg:text-left bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              암네시아 노트
            </motion.h1>
            
            <motion.div variants={itemVariants}>
              <LoginTabs />
            </motion.div>
            
            {error && (
              <motion.div 
                className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mb-4 mt-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </CardContent>
        </div>
      </motion.div>
      
      {/* Right animation section */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 order-first lg:order-last"
        variants={itemVariants}
      >
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.6,
              delay: 0.3,
              ease: "easeOut"
            }}
          >
            <Lottie animationData={animationData} />
          </motion.div>
          
          <motion.div 
            className="text-center mt-4 lg:mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">안전하게 기록하세요</h2>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              암네시아는 당신의 아이디어, 메모, 생각을 안전하게 보관해 드립니다.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;