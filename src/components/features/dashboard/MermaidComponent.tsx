import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

let mermaidPromise: Promise<any> | null = null;

const getMermaid = async () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });
      return mermaid;
    });
  }
  return mermaidPromise;
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
  const renderCount = useRef(0);

  useEffect(() => {
    let isCancelled = false;
    const currentRenderId = ++renderCount.current;

    if (ref.current && chart && !isEditing) {
      const renderMermaid = async () => {
        try {
          const mermaid = await getMermaid();
          if (isCancelled || currentRenderId !== renderCount.current) return;

          const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
          
          // Clear previous content
          if (ref.current) ref.current.innerHTML = '<div class="flex items-center justify-center p-8 text-muted-foreground animate-pulse">그래프 생성 중...</div>';

          const { svg } = await mermaid.render(id, chart);
          
          if (isCancelled || currentRenderId !== renderCount.current) return;

          if (ref.current) {
            // Basic security check on the output SVG string
            if (svg.toLowerCase().includes('<script') || svg.toLowerCase().includes('javascript:')) {
              console.error('Blocked potentially malicious Mermaid output');
              ref.current.textContent = 'Blocked potentially malicious content.';
              return;
            }
            ref.current.innerHTML = svg;
          }
        } catch (error) {
          if (isCancelled) return;
          console.error('Mermaid render error:', error);
          
          if (ref.current) {
            ref.current.innerHTML = `
              <div class="p-4 border border-destructive/20 bg-destructive/10 rounded-md text-destructive text-sm">
                그래프 렌더링 중 오류가 발생했습니다. 문법을 확인해주세요.
              </div>
            `;
          }

          toast({
            title: 'Mermaid 렌더링 오류',
            description: '다이어그램 문법을 확인해주세요.',
            variant: 'destructive',
          });
        }
      };

      renderMermaid();
    }

    return () => {
      isCancelled = true;
    };
  }, [chart, isEditing, toast]);

  return <div ref={ref} className="mermaid-container w-full h-full flex items-center justify-center" />;
};

export default MermaidComponent;
