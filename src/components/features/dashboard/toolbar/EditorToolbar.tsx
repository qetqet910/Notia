import React from 'react';
import { Button } from '@/components/ui/button';
import Bold from 'lucide-react/dist/esm/icons/bold';
import Italic from 'lucide-react/dist/esm/icons/italic';
import Strikethrough from 'lucide-react/dist/esm/icons/strikethrough';
import Code from 'lucide-react/dist/esm/icons/code';
import Link from 'lucide-react/dist/esm/icons/link';
import Quote from 'lucide-react/dist/esm/icons/quote';
import Heading1 from 'lucide-react/dist/esm/icons/heading-1';
import Heading2 from 'lucide-react/dist/esm/icons/heading-2';
import Heading3 from 'lucide-react/dist/esm/icons/heading-3';
import Heading4 from 'lucide-react/dist/esm/icons/heading-4';
import Image from 'lucide-react/dist/esm/icons/image';
import CheckSquare from 'lucide-react/dist/esm/icons/check-square';
import Minus from 'lucide-react/dist/esm/icons/minus';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  executeCommand,
  toggleHeading,
  toggleInlineFormat,
  insertCodeBlock,
  insertLink,
  insertChecklist,
  toggleQuote,
  insertDivider,
} from '@/components/features/dashboard/toolbar/editorCommands';

interface EditorToolbarProps {
  editorRef: React.RefObject<ReactCodeMirrorRef>;
  onImageClick: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editorRef, onImageClick }) => {
  const headingItems = [
    {
      id: 'h1',
      icon: <Heading1 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 1)),
      title: '제목 1',
    },
    {
      id: 'h2',
      icon: <Heading2 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 2)),
      title: '제목 2',
    },
    {
      id: 'h3',
      icon: <Heading3 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 3)),
      title: '제목 3',
    },
    {
      id: 'h4',
      icon: <Heading4 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 4)),
      title: '제목 4',
    },
  ];

  const styleItems = [
    {
      id: 'bold',
      icon: <Bold />,
      action: () =>
        executeCommand(editorRef, (v) => toggleInlineFormat(v, '**')),
      title: '굵게',
    },
    {
      id: 'italic',
      icon: <Italic />,
      action: () =>
        executeCommand(editorRef, (v) => toggleInlineFormat(v, '_')),
      title: '기울임꼴',
    },
    {
      id: 'strikethrough',
      icon: <Strikethrough />,
      action: () =>
        executeCommand(editorRef, (v) => toggleInlineFormat(v, '~~')),
      title: '취소선',
    },
    {
      id: 'divider',
      icon: <Minus />,
      action: () => executeCommand(editorRef, insertDivider),
      title: '구분선',
    },
  ];

  const otherItems = [
    {
      id: 'checklist',
      icon: <CheckSquare />,
      action: () => executeCommand(editorRef, insertChecklist),
      title: '체크리스트',
    },
    {
      id: 'quote',
      icon: <Quote />,
      action: () => executeCommand(editorRef, toggleQuote),
      title: '인용',
    },
    {
      id: 'code',
      icon: <Code />,
      action: () => executeCommand(editorRef, insertCodeBlock),
      title: '코드 블록',
    },
    {
      id: 'link',
      icon: <Link />,
      action: () => executeCommand(editorRef, insertLink),
      title: '링크',
    },
    {
      id: 'image',
      icon: <Image />,
      action: onImageClick,
      title: '이미지',
    },
  ];

  const renderButtonGroup = (items: typeof headingItems) => (
    <div className="flex gap-1">
      {items.map((item) => (
        <Button
          key={item.id}
          variant="outline"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={item.action}
          title={item.title}
          className="h-8 w-8"
        >
          {React.cloneElement(item.icon, { className: 'h-4 w-4' })}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="p-2 border-b bg-background">
      <Carousel opts={{ align: 'start', dragFree: true }} className="w-full">
        <CarouselContent className="-ml-1 items-center flex w-full justify-between">
          <CarouselItem className="basis-auto pl-1">
            {renderButtonGroup(headingItems)}
          </CarouselItem>
          <CarouselItem className="basis-auto pl-1">
            <Separator orientation="vertical" className="h-8 mx-2" />
          </CarouselItem>
          <CarouselItem className="basis-auto pl-1">
            {renderButtonGroup(styleItems)}
          </CarouselItem>
          <CarouselItem className="basis-auto pl-1">
            <Separator orientation="vertical" className="h-8 mx-2" />
          </CarouselItem>
          <CarouselItem className="basis-auto pl-1">
            {renderButtonGroup(otherItems)}
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  );
};

