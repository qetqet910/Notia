import React, { useState, useEffect, memo } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// ✨ 등록된 언어를 기억하는 Set (모듈 레벨에서 유지)
const registeredLanguages = new Set<string>();

interface DynamicSyntaxHighlighterProps {
  language: string;
  children: React.ReactNode;
}

const Loader = () => (
  <pre className="bg-muted rounded-lg p-4 h-32 animate-pulse" />
);

const DynamicSyntaxHighlighterComponent: React.FC<
  DynamicSyntaxHighlighterProps
> = ({ language, children, ...props }) => {
  const [, forceUpdate] = useState(0);
  const isLanguageRegistered = registeredLanguages.has(language);

  useEffect(() => {
    if (language && !isLanguageRegistered) {
      import(
        /* @vite-ignore */ `react-syntax-highlighter/dist/esm/languages/hljs/${language}`
      )
        .then((module) => {
          SyntaxHighlighter.registerLanguage(language, module.default);
          registeredLanguages.add(language);
        })
        .catch(() => {
          // 실패한 경우에도 다시 시도하지 않도록 'text'로 등록
          console.warn(
            `Language '${language}' not found, falling back to plaintext.`, 
          );
          registeredLanguages.add(language); // 실패 기록
        })
        .finally(() => {
          // 언어 로딩(성공 또는 실패)이 완료되었으므로, 리렌더링을 강제하여 UI를 업데이트
          forceUpdate((n) => n + 1);
        });
    }
  }, [language, isLanguageRegistered]);

  if (!isLanguageRegistered) {
    return <Loader />; 
  }

  return (
    <SyntaxHighlighter
      language={language || 'text'}
      style={atomOneDark}
      customStyle={{
        borderRadius: '8px',
        fontSize: '14px',
        margin: '0',
        backgroundColor: '#282c34', // 테마 배경색과 일치
      }}
      codeTagProps={{ style: { fontFamily: '"Fira Code", monospace' } }}
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

// React.memo를 사용해 불필요한 리렌더링을 방지합니다.
export const DynamicSyntaxHighlighter = memo(DynamicSyntaxHighlighterComponent);
