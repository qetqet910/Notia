import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

const initializeMermaid = async () => {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
  });
  return mermaid;
};

export const MermaidComponent = ({
  chart,
  isEditing,
}: {
  chart: string;
  isEditing: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (ref.current && chart && !isEditing) {
      const renderMermaid = async () => {
        const mermaid = await initializeMermaid();
        // 이전 내용 초기화
        ref.current.innerHTML = '';

        try {
          const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;

          // DOM에서 기존 mermaid 오류 SVG 제거
          const existingErrors = document.querySelectorAll('svg[id*="mermaid"]');
          existingErrors.forEach((svg) => {
            if (svg.textContent?.includes('Syntax error')) {
              svg.remove();
            }
          });

          mermaid
            .render(id, chart)
            .then(({ svg }) => {
              if (ref.current) {
                ref.current.innerHTML = svg;
              }
            })
            .catch((error) => {
              console.error('Mermaid render error:', error);

              // DOM에서 새로 생긴 오류 SVG 찾아서 이동
              setTimeout(() => {
                const errorSvg = document.querySelector('svg[id*="mermaid"]');
                if (errorSvg && errorSvg.textContent?.includes('Syntax error')) {
                  if (ref.current) {
                    ref.current.appendChild(errorSvg.cloneNode(true));
                  }
                  errorSvg.remove();
                }
              }, 100);

              toast({
                title: 'Mermaid 렌더링 오류',
                description: '다이어그램 문법을 확인해주세요.',
              });
            });
        } catch (error) {
          console.error('Mermaid render error:', error);

          // DOM에서 오류 SVG 찾아서 이동
          setTimeout(() => {
            const errorSvg = document.querySelector('svg[id*="mermaid"]');
            if (errorSvg && errorSvg.textContent?.includes('Syntax error')) {
              if (ref.current) {
                ref.current.appendChild(errorSvg.cloneNode(true));
              }
              errorSvg.remove();
            }
          }, 100);

          toast({
            title: 'Mermaid 렌더링 오류',
            description: '다이어그램 문법을 확인해주세요.',
          });
        }
      };
      renderMermaid();
    }
  }, [chart, isEditing, toast]);

  return <div ref={ref} className="mermaid-container" />;
};

export default MermaidComponent;
