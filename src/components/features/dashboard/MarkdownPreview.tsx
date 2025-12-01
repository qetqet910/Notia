import React, { lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { DynamicSyntaxHighlighter } from '@/components/features/dashboard/DynamicSyntaxHighlighter';
import { MermaidDiagramLoader } from '@/components/loader/dashboard/MermaidDiagramLoader';

const MermaidComponent = lazy(() =>
  import('@/components/features/dashboard/MermaidComponent').then((module) => ({
    default: module.MermaidComponent,
  })),
);

interface MarkdownPreviewProps {
  content: string;
  isEditing?: boolean;
}

interface CodeBlockProps {
  className?: string | undefined;
  children: React.ReactNode;
  [key: string]: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = React.memo(
  ({ className, children, ...props }) => {
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
        <Suspense fallback={<MermaidDiagramLoader />}>
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
  },
);

CodeBlock.displayName = 'CodeBlock';

const preserveNewlines = (content: string): string => {
  if (!content) return '';
  
  // Normalize CRLF to LF
  const normalized = content.replace(/\r\n/g, '\n');
  
  const parts = normalized.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) return part; // Code block
    
    // Robust regex to match 2 or more newlines, ignoring spaces/tabs on empty lines
    return part.replace(/\n([ \t]*\n)+/g, (match) => {
      // Count effective newlines
      const newlineCount = (match.match(/\n/g) || []).length;
      
      if (newlineCount < 2) return match;
      if (newlineCount === 2) return '\n\n';
      
      // For 3 or more newlines, inject empty paragraphs with Unicode NBSP
      // Using Unicode \u00A0 ensures it's treated as a character, preventing collapse
      return '\n\n' + '\u00A0\n\n'.repeat(newlineCount - 2);
    });
  }).join('');
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = React.memo(
  ({ content }) => {
    const processedContent = React.useMemo(() => preserveNewlines(content || ''), [content]);

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            h1: ({ children, ...props }) => (
              <h1 className="text-4xl font-extrabold mb-6" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-2xl font-bold mb-4" {...props}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-lg font-semibold mb-2" {...props}>
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p className="mb-2 min-h-[1.5em] leading-relaxed" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol
                className="list-decimal list-inside mb-4 space-y-2"
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
                className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4"
                {...props}
              >
                {children}
              </blockquote>
            ),
            code: CodeBlock,
            pre: ({ children, ...props }) => <pre {...props}>{children}</pre>,
            table: ({ children, ...props }) => (
              <table
                className="border-collapse border border-border mb-4 w-full"
                {...props}
              >
                {children}
              </table>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border border-border px-4 py-2 bg-muted font-semibold text-left"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-border px-4 py-2" {...props}>
                {children}
              </td>
            ),
            a: ({ children, ...props }) => (
              <a className="text-primary underline" {...props}>
                {children}
              </a>
            ),
          }}
        >
          {processedContent || '*내용이 없습니다.*'}
        </ReactMarkdown>
      </div>
    );
  },
);

MarkdownPreview.displayName = 'MarkdownPreview';
