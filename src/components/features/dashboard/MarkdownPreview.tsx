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

export const preserveNewlines = (content: string): string => {
  if (!content) return '';
  
  // Normalize CRLF to LF
  const normalized = content.replace(/\r\n/g, '\n');
  
  const parts = normalized.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) return part; // Code block
    
    // Notepad Style: Treat every newline sequence >= 2 as explicit empty lines
    return part.replace(/\n([ \t]*\n)+/g, (match) => {
      const newlineCount = (match.match(/\n/g) || []).length;
      
      // If 2 or more newlines, inject empty paragraphs (NBSP)
      // Count - 1 because the first newline ends the previous paragraph
      // e.g., \n\n (2) -> 1 empty line
      // e.g., \n\n\n (3) -> 2 empty lines
      return '\n\n' + '\u00A0\n\n'.repeat(Math.max(0, newlineCount - 1));
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
              <h3 className="text-lg font-semibold mb-2 mt-4" {...props}>
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p className="mb-0 leading-[1.2] min-h-[1.2em]" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside mb-0 space-y-0" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol
                className="list-decimal list-inside mb-0 space-y-0"
                {...props}
              >
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li className="leading-[1.2]" {...props}>
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
            img: ({ src, alt, ...props }) => {
              if (!src || typeof src !== 'string' || src.trim() === '') return null;
              return (
                <img
                  src={src}
                  alt={alt || ''}
                  className="rounded-lg border border-border shadow-sm max-w-full h-auto my-4"
                />
              );
            },
            input: ({ ...props }) => {
              if (props.type === 'checkbox') {
                const checkIcon = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>');
                return (
                  <input
                    type="checkbox"
                    className="appearance-none h-4 w-4 border-2 border-muted-foreground/30 rounded-[4px] bg-transparent checked:bg-green-600 checked:border-green-600 transition-all mr-2 align-middle relative pointer-events-none"
                    style={props.checked ? {
                      backgroundImage: `url("data:image/svg+xml,${checkIcon}")`,
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    } : {}}
                    readOnly
                    {...props}
                  />
                );
              }
              return <input {...props} />;
            },
          }}
        >
          {processedContent || '*내용이 없습니다.*'}
        </ReactMarkdown>
      </div>
    );
  },
);

MarkdownPreview.displayName = 'MarkdownPreview';
