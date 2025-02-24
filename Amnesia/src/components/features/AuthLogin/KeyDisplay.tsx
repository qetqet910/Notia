import React from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Key, Copy } from 'lucide-react';

interface KeyDisplayProps {
  formattedKey: string;
  onCopy: () => void;
  copiedKey: boolean;
}

export const KeyDisplay: React.FC<KeyDisplayProps> = ({
  formattedKey,
  onCopy,
  copiedKey
}) => (
  <div className="mt-8 pt-6 border-t">
    <div className="flex items-center mb-3">
      <Key size={18} className="mr-2" />
      <h3 className="text-md font-medium">노트 키</h3>
    </div>
    
    <div className="flex">
      <div className="flex-grow relative">
        <Input
          readOnly
          value={formattedKey}
          className="font-mono text-center tracking-wide"
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="ml-2"
        onClick={onCopy}
      >
        <Copy size={16} />
      </Button>
    </div>
    
    {copiedKey && (
      <p className="text-xs text-green-600 mt-1 text-center">노트 키가 복사되었습니다!</p>
    )}
    <p className="text-xs text-muted-foreground mt-2">
      키를 잃어버리면 데이터에 접근할 수 없습니다. 안전하게 보관하세요.
    </p>
  </div>
);