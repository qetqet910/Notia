import React, { useRef } from 'react';
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
import Image from 'lucide-react/dist/esm/icons/image';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';

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
    ? state.update({
        changes: { from, insert: `${syntax}${syntax}` },
        selection: { anchor: from + syntax.length },
      })
    : state.update({
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
    newText = originalText.replace(headingRegex, '');
  } else if (match) {
    newText = originalText.replace(headingRegex, `${syntax} `);
  } else {
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

// Inserts an image markdown with a given URL
const insertImageMarkdown = (view: EditorView, url: string) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const imageText = `![image](${url})`;
  dispatch(state.update({ changes: { from, insert: imageText } }));
};

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editorRef }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const view = editorRef.current?.view;
    if (!file || !view || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: '업로드 실패',
        description: '이미지 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size >= 10 * 1024 * 1024) {
      // 10MB
      toast({
        title: '업로드 실패',
        description: '파일 크기는 10MB를 초과할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const newFileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${newFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        insertImageMarkdown(view, data.publicUrl);
        toast({
          title: '성공',
          description: '이미지가 성공적으로 업로드되었습니다.',
        });
      }
    } catch (error) {
      const err = error as Error;
      toast({
        title: '이미지 업로드 실패',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
  ];

  const otherItems = [
    {
      id: 'quote',
      icon: <Quote />,
      action: () => executeCommand(editorRef, (v) => toggleHeading(v, 1)),
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
      action: () => fileInputRef.current?.click(),
      title: '이미지',
    },
  ];

  const renderToolbarItems = (items: typeof headingItems) =>
    items.map((item) => (
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
    ));

  return (
    <div className="p-2 border-b bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">{renderToolbarItems(headingItems)}</div>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex flex-wrap gap-1">{renderToolbarItems(styleItems)}</div>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex flex-wrap gap-1">{renderToolbarItems(otherItems)}</div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};
