import React, { useMemo } from 'react';
import { cn } from '@/utils/shadcnUtils';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import List from 'lucide-react/dist/esm/icons/list';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface NoteTOCProps {
  content: string;
  onHeaderClick?: (text: string) => void;
  className?: string;
}

export const NoteTOC: React.FC<NoteTOCProps> = ({ content, onHeaderClick, className }) => {
  const tocItems = useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const items: TOCItem[] = [];
    let isInCodeBlock = false;

    lines.forEach((line, index) => {
      if (line.trim().startsWith('```')) {
        isInCodeBlock = !isInCodeBlock;
        return;
      }
      if (isInCodeBlock) return;

      const match = line.match(/^\s*(#{1,6})\s+(.+)$/);
      if (match) {
        items.push({
          id: `header-${index}`,
          level: match[1].length,
          text: match[2].replace(/[*_~`]/g, '').trim(),
        });
      }
    });

    return items;
  }, [content]);

  if (tocItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center opacity-40">
        <List className="h-8 w-8 mb-2" />
        <p className="text-xs">표시할 목차가 없습니다.<br /># 을 사용해 헤더를 만드세요.</p>
      </div>
    );
  }

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2 mt-2 px-2 text-muted-foreground/60">
        <ChevronRight className="h-3 w-3" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Table of Contents</span>
      </div>
      <div className="space-y-[1px] overflow-y-auto custom-scrollbar pr-2 max-h-[calc(100vh-200px)]">
        {tocItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onHeaderClick?.(item.text)}
            className={cn(
              "group flex w-full text-left px-2 py-1 text-sm rounded-md transition-all duration-200 items-center",
              "hover:bg-muted/80 hover:translate-x-1",
              item.level === 1 && "font-bold text-foreground pl-2 text-sm py-1.5",
              item.level === 2 && "text-muted-foreground pl-5 text-[13px] py-1",
              item.level === 3 && "text-muted-foreground/90 pl-8 text-[12px] py-1",
              item.level === 4 && "text-muted-foreground/70 pl-11 text-[11px] py-0.5",
              item.level === 5 && "text-muted-foreground/50 pl-14 text-[10.5px] py-0.5",
              item.level === 6 && "text-muted-foreground/40 pl-[68px] text-[10px] py-0.5"
            )}
          >
            <span className={cn(
              "mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0",
              item.level > 1 && "text-[10px]"
            )}>
              {item.level === 1 ? '•' : '└'}
            </span>
            <span className="truncate">{item.text}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
