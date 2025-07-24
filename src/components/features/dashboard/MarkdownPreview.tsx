import React, { lazy, Suspense } from 'react';
import ReactMarkdown, { type CodeProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DynamicSyntaxHighlighter } from '@/components/features/dashboard/DynamicSyntaxHighlighter';
import { MermaidLoader } from '@/components/loader/MermaidLoader';

const MermaidComponent = lazy(() =>
  import('@/components/features/dashboard/MermaidComponent').then((module) => ({
    default: module.MermaidComponent,
  })),
);

interface MarkdownPreviewProps {
  content: string;
  isEditing?: boolean;
}

const CodeBlock: React.FC<CodeProps> = ({ className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (!match) {
    return (
      <code
        className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  if (language === 'mermaid') {
    return (
      <Suspense fallback={<MermaidLoader />}>
        <MermaidComponent
          chart={String(children).replace(/\n$/, '')}
          isEditing={false} // isEditing prop is passed down
        />
      </Suspense>
    );
  }

  return (
    <DynamicSyntaxHighlighter language={language} {...props}>
      {String(children).replace(/\n$/, '')}
    </DynamicSyntaxHighlighter>
  );
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = React.memo(
  ({ content }) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children, ...props }) => (
              <h1 className="text-xl font-bold mb-4" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-lg font-semibold mb-3" {...props}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-base font-medium mb-2" {...props}>
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p className="mb-3 leading-relaxed" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside mb-3 space-y-1" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol
                className="list-decimal list-inside mb-3 space-y-1"
                {...props}
              >
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li className="leading-relaxed" {...props}>
                {children}
              </li>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote
                className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3"
                {...props}
              >
                {children}
              </blockquote>
            ),
            code: CodeBlock,
            pre: ({ children, ...props }) => <pre {...props}>{children}</pre>,
            table: ({ children, ...props }) => (
              <table
                className="border-collapse border border-border mb-3 w-full"
                {...props}
              >
                {children}
              </table>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border border-border px-3 py-2 bg-muted font-semibold text-left"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-border px-3 py-2" {...props}>
                {children}
              </td>
            ),
            a: ({ children, ...props }) => (
              <a className="text-primary hover:underline" {...props}>
                {children}
              </a>
            ),
          }}
        >
          {content || '*내용이 없습니다.*'}
        </ReactMarkdown>
      </div>
    );
  },
);

MarkdownPreview.displayName = 'MarkdownPreview';
