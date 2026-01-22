import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { useToast } from '@/hooks/useToast';

// 1. Singleton Initialization (Performance & Correctness)
// Initialize once at module level to avoid repeated initialization costs.
// 'startOnLoad: false' prevents Mermaid from scanning the entire document unnecessarily.
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  // suppressErrorRendering: true, // Optional: handle errors manually without Mermaid injecting error SVGs
});

export const MermaidComponent = ({
  chart,
  isEditing,
}: {
  chart: string;
  isEditing: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  // Correctness: Use a stable unique ID for this instance to prevent ID collisions
  const [uniqueId] = useState(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    // Skip rendering if editing or missing chart/ref
    if (!ref.current || !chart || isEditing) return;

    const renderMermaid = async () => {
      try {
        // Correctness: Reset container content before rendering
        // This ensures we don't have stale content or duplicate charts
        if (ref.current) {
           ref.current.innerHTML = ''; 
        }

        // Render the diagram
        // mermaid.render returns an object { svg: string, bindFunctions?: (element: Element) => void }
        const { svg } = await mermaid.render(uniqueId, chart);

        // DOMPurify가 SVG 구조를 깨뜨릴 수 있어 잠시 제거하고 Mermaid의 기본 보안에 의존합니다.
        // 추후 검증된 Sanitize 옵션으로 다시 적용할 수 있습니다.
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid render error:', error);
        
        // Correctness: Handle errors locally within the component container
        // Avoids global DOM queries (document.querySelector) which might affect other components.
        if (ref.current) {
           ref.current.innerHTML = `
             <div class="text-destructive text-sm p-2 border border-destructive/20 rounded bg-destructive/10">
               <p class="font-semibold">Mermaid Syntax Error</p>
               <p class="opacity-80 text-xs mt-1">Please check your diagram syntax.</p>
             </div>
           `;
        }
        
        // Optional: Toast notification (debouncing recommended if enabled)
        // toast({ title: 'Rendering Failed', description: 'Invalid Mermaid syntax.', variant: 'destructive' });
      }
    };

    renderMermaid();
  }, [chart, isEditing, uniqueId, toast]);

  return <div ref={ref} className="mermaid-container w-full flex justify-center my-4 overflow-x-auto" />;
};

export default MermaidComponent;