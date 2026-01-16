import {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import {
  insertChecklist,
  insertCodeBlock,
  insertTable,
  insertDivider,
  insertMermaidFlow,
  insertMermaidSequence,
  insertMermaidMindmap,
} from '@/components/features/dashboard/toolbar/editorCommands';

// Now takes onImageUpload callback to trigger file selector
const getSlashCommands = (onImageUpload: () => void): Completion[] => [
  {
    label: '/flowchart',
    displayLabel: '🔀 플로우차트',
    detail: 'Mermaid Flowchart',
    type: 'function',
    boost: 10,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertMermaidFlow(view);
    },
  },
  {
    label: '/sequence',
    displayLabel: '⏱️ 시퀀스',
    detail: 'Mermaid Sequence',
    type: 'function',
    boost: 9,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertMermaidSequence(view);
    },
  },
  {
    label: '/mindmap',
    displayLabel: '🧠 마인드맵',
    detail: 'Mermaid Mindmap',
    type: 'function',
    boost: 8,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertMermaidMindmap(view);
    },
  },
  {
    label: '/table',
    displayLabel: '📊 표',
    detail: '표 삽입',
    type: 'type',
    boost: 7,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertTable(view);
    },
  },
  {
    label: '/todo',
    displayLabel: '✅ 할 일',
    detail: '체크박스',
    type: 'variable',
    boost: 6,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertChecklist(view);
    },
  },
  {
    label: '/code',
    displayLabel: '💻 코드 블록',
    detail: '코드 삽입',
    type: 'class',
    boost: 5,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertCodeBlock(view);
    },
  },
  {
    label: '/divider',
    displayLabel: '➖ 구분선',
    detail: '수평선 삽입',
    type: 'interface',
    boost: 4,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      insertDivider(view);
    },
  },
  {
    label: '/image',
    displayLabel: '🖼️ 이미지',
    detail: '이미지 업로드',
    type: 'constant',
    boost: 3,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
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