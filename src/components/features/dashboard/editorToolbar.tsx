import React from 'react';
import { EditorView } from '@codemirror/view';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';

interface EditorToolbarProps {
  editorRef: React.RefObject<ReactCodeMirrorRef>;
}

// Helper to execute commands and refocus the editor
const executeCommand = (
  editorRef: React.RefObject<ReactCodeMirrorRef>,
  command: (view: EditorView) => void,
) => {
  const view = editorRef.current?.view;
  if (view) {
    command(view);
    view.focus();
  }
};

// Handles inline formats like **bold**
const toggleInlineFormat = (view: EditorView, syntax: string) => {
  const { state, dispatch } = view;
  const { from, to, empty } = state.selection.main;

  const transaction = empty
    ? // No selection: insert syntax and place cursor in the middle
      state.update({
        changes: { from, insert: `${syntax}${syntax}` },
        selection: { anchor: from + syntax.length },
      })
    : // Selection exists: wrap it with syntax
      state.update({
        changes: {
          from,
          to,
          insert: `${syntax}${state.sliceDoc(from, to)}${syntax}`,
        },
      });

  dispatch(transaction);
};

// Handles block formats like headings
const toggleHeading = (view: EditorView, level: number) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  const originalText = state.sliceDoc(line.from, line.to);
  const syntax = '#'.repeat(level);

  const headingRegex = /^(#+)\s/;
  const match = originalText.match(headingRegex);

  let newText;
  if (match && match[1] === syntax) {
    // Same level heading clicked -> remove it
    newText = originalText.replace(headingRegex, '');
  } else if (match) {
    // Different level heading exists -> replace it
    newText = originalText.replace(headingRegex, `${syntax} `);
  } else {
    // No heading -> add it
    newText = `${syntax} ${originalText}`;
  }

  dispatch(
    state.update({
      changes: { from: line.from, to: line.to, insert: newText },
    }),
  );
};

// Inserts a multi-line code block
const insertCodeBlock = (view: EditorView) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const syntax = '```';

  const codeBlock = `${syntax}\n코드 입력\n${syntax}`;
  dispatch(
    state.update({
      changes: { from, insert: codeBlock },
      selection: { anchor: from + syntax.length + 1 },
    }),
  );
};

// Inserts a link
const insertLink = (view: EditorView) => {
  const { state, dispatch } = view;
  const { from, to, empty } = state.selection.main;
  const url = prompt('Enter URL:', 'https://');
  if (!url) return;

  const selectionText = empty ? 'link' : state.sliceDoc(from, to);
  const linkText = `[${selectionText}](${url})`;

  dispatch(state.update({ changes: { from, to, insert: linkText } }));
};

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editorRef }) => {
  const toolbarItems = [
    {
      id: 'h1',
      icon: <Heading1 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 1)),
      title: 'Heading 1',
    },
    {
      id: 'h2',
      icon: <Heading2 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 2)),
      title: 'Heading 2',
    },
    {
      id: 'h3',
      icon: <Heading3 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 3)),
      title: 'Heading 3',
    },
    {
      id: 'h4',
      icon: <Heading4 />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 4)),
      title: 'Heading 4',
    },
    {
      id: 'bold',
      icon: <Bold />,
      action: () =>
        executeCommand(editorRef, (v) => toggleInlineFormat(v, '**')),
      title: 'Bold',
    },
    {
      id: 'italic',
      icon: <Italic />,
      action: () =>
        executeCommand(editorRef, (v) => toggleInlineFormat(v, '_')),
      title: 'Italic',
    },
    {
      id: 'strikethrough',
      icon: <Strikethrough />,
      action: () =>
        executeCommand(editorRef, (v) => toggleInlineFormat(v, '~~')),
      title: 'Strikethrough',
    },
    {
      id: 'quote',
      icon: <Quote />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 1)),
      title: 'Quote',
    },
    {
      id: 'code',
      icon: <Code />,
      action: () => executeCommand(editorRef, insertCodeBlock),
      title: 'Code Block',
    },
    {
      id: 'link',
      icon: <Link />,
      action: () => executeCommand(editorRef, insertLink),
      title: 'Link',
    },
  ];

  return (
    <div className="p-2 border-b bg-background">
      <Carousel opts={{ align: 'start', dragFree: true }} className="w-full">
        <CarouselContent className="-ml-1">
          {toolbarItems.map((item) => (
            <CarouselItem key={item.id} className="basis-auto pl-1 pr-1">
              <Button
                variant="outline"
                size="icon"
                onMouseDown={(e) => e.preventDefault()}
                onClick={item.action}
                title={item.title}
                className="h-8 w-8"
              >
                {React.cloneElement(item.icon, { className: 'h-4 w-4' })}
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
};
