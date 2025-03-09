import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}; 