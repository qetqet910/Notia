import React from 'react';
import { MarkdownEditor } from '../../components/features/MarkdownEditor/MarkdownEditor';
import { MarkdownRenderer } from '../../components/features/MarkdownRenderer/MarkdownRenderer';
import { useMarkdown } from '../../hooks/useMarkdown';

export const MarkdownPage: React.FC = () => {
  const { docs, saveDoc } = useMarkdown();

  const handleSave = (content: string) => {
    saveDoc({
      title: '새 문서',
      content,
      tags: []
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">마크다운 에디터</h1>
      
      <div className="mb-8">
        <MarkdownEditor onSave={handleSave} />
      </div>

      <h2 className="text-xl font-semibold mb-4">저장된 문서</h2>
      <div className="space-y-4">
        {docs.map(doc => (
          <div key={doc.id} className="border rounded p-4">
            <h3 className="font-medium mb-2">{doc.title}</h3>
            <MarkdownRenderer content={doc.content} />
            <div className="text-sm text-gray-500 mt-2">
              마지막 수정: {new Date(doc.lastEdited).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 