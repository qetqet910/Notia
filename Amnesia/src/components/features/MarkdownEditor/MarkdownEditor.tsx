import React, { useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Save } from 'lucide-react';
import { Button } from '../../common/Button/Button';

interface MarkdownEditorProps {
  initialValue?: string;
  onSave: (content: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialValue = '',
  onSave,
}) => {
  const [content, setContent] = useState(initialValue);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'split'>('split');

  const handleKeyCommand = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          wrapText('**', '**');
          break;
        case 'i':
          e.preventDefault();
          wrapText('*', '*');
          break;
        case '`':
          e.preventDefault();
          wrapText('```\n', '\n```');
          break;
      }
    }
  }, []);

  const wrapText = (before: string, after: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + 
                   before + selectedText + after + 
                   content.substring(end);
    
    setContent(newText);
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyCommand);
    return () => document.removeEventListener('keydown', handleKeyCommand);
  }, [handleKeyCommand]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {(['edit', 'preview', 'split'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`px-3 py-1 rounded ${
                previewMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <Button
          icon={Save}
          label="저장"
          onClick={() => onSave(content)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        />
      </div>

      <MDEditor
        value={content}
        onChange={value => setContent(value || '')}
        preview={previewMode}
        height={400}
        className="w-full"
      />

      <div className="text-sm text-gray-500">
        <h4 className="font-medium mb-2">단축키:</h4>
        <ul className="space-y-1">
          <li>Ctrl/Cmd + B: 굵게</li>
          <li>Ctrl/Cmd + I: 기울임</li>
          <li>Ctrl/Cmd + `: 코드 블록</li>
        </ul>
      </div>
    </div>
  );
}; 