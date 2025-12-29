import {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import {
  toggleHeading,
  insertChecklist,
  insertCodeBlock,
  toggleQuote,
} from '@/components/features/dashboard/toolbar/editorCommands';

const getSlashCommands = (onImageUpload: () => void): Completion[] => [
  {
    label: '/h1',
    displayLabel: '제목 1',
    detail: '가장 큰 제목',
    type: 'keyword',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      toggleHeading(view, 1);
    },
  },
  {
    label: '/h2',
    displayLabel: '제목 2',
    detail: '중간 제목',
    type: 'keyword',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      toggleHeading(view, 2);
    },
  },
  {
    label: '/h3',
    displayLabel: '제목 3',
    detail: '작은 제목',
    type: 'keyword',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      toggleHeading(view, 3);
    },
  },
  {
    label: '/todo',
    displayLabel: '할 일',
    detail: '체크박스',
    type: 'variable',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertChecklist(view);
    },
  },
  {
    label: '/code',
    displayLabel: '코드',
    detail: '코드 블록',
    type: 'class',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertCodeBlock(view);
    },
  },
  {
    label: '/quote',
    displayLabel: '인용',
    detail: '인용문',
    type: 'text',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      toggleQuote(view);
    },
  },
  {
    label: '/image',
    displayLabel: '이미지',
    detail: '이미지 업로드',
    type: 'constant',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      onImageUpload();
    },
  },
];

export const createSlashCommandCompletion = (onImageUpload: () => void) => {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\/[\w]*/);
    if (!word) return null;
    if (word.from === word.to && !context.explicit) return null;

    return {
      from: word.from,
      options: getSlashCommands(onImageUpload),
    };
  };
};
