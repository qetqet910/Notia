import type React from 'react';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KeyDisplayProps {
  formattedKey: string;
  onCopy: () => void;
  copied: boolean;
  autoCopy?: boolean; // 자동 복사 옵션 추가
}

export const KeyDisplay: React.FC<KeyDisplayProps> = ({
  formattedKey,
  onCopy,
  copied,
  autoCopy = false, // 기본값은 false
}) => {
  // 자동 복사 기능 - 무한 루프 방지를 위한 ref 사용
  const hasCopied = useRef(false);

  useEffect(() => {
    // 이미 복사했으면 다시 복사하지 않음
    if (autoCopy && formattedKey && !hasCopied.current) {
      onCopy();
      hasCopied.current = true;
    }
  }, [autoCopy, formattedKey, onCopy]);

  return (
    <motion.div
      key="key-display"
      className="mt-6 pt-4 border-t"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-3">
        <Key size={18} className="mr-2 text-[#61C9A8]" />
        <h3 className="text-md font-medium text-[#61C9A8]">노트 키</h3>
      </div>

      <motion.div
        className="flex"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex-grow relative">
          <Input
            readOnly
            value={formattedKey}
            className="font-mono text-center tracking-wide border-[#c5e9de]"
            onClick={onCopy} // 입력 필드 클릭 시에도 복사
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="ml-2 border-[#c5e9de] hover:bg-[#f0faf7] hover:border-[#61C9A8]"
          onClick={onCopy}
        >
          {copied ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Copy size={16} className="text-[#61C9A8]" />
          )}
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        {copied && (
          <motion.p
            key="copied-message"
            className="text-xs text-green-600 mt-1 text-center"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            노트 키가 복사되었습니다!
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs text-amber-800">
          <strong>중요:</strong> 이 키는 노트에 접근하는 유일한 방법입니다.
          안전한 곳에 보관하세요. 키를 잃어버리면 데이터에 접근할 수 없습니다.
        </p>
      </motion.div>
    </motion.div>
  );
};
