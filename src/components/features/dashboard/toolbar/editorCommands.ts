import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';

// Helper to execute commands and refocus the editor
export const executeCommand = (
  editorRef: React.RefObject<ReactCodeMirrorRef>,
  command: (view: EditorView) => void,
) => {
  const view = editorRef.current?.view;
  if (view) {
    command(view);
  }
};

// Handles inline formats like **bold**
export const toggleInlineFormat = (view: EditorView, syntax: string) => {
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
export const toggleHeading = (view: EditorView, level: number) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  const syntax = '#'.repeat(level) + ' ';

  const headingRegex = /^(#+)\s/;
  const match = line.text.match(headingRegex);

  if (match) {
    const currentLevel = match[1].length;
    if (currentLevel === level) {
      dispatch(
        state.update({
          changes: {
            from: line.from,
            to: line.from + match[0].length,
            insert: '',
          },
        }),
      );
    } else {
      dispatch(
        state.update({
          changes: {
            from: line.from,
            to: line.from + match[0].length,
            insert: syntax,
          },
        }),
      );
    }
  } else {
    dispatch(
      state.update({
        changes: { from: line.from, insert: syntax },
        selection: EditorSelection.cursor(line.from + syntax.length),
      }),
    );
  }
};

// Inserts a multi-line code block
export const insertCodeBlock = (view: EditorView) => {
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
export const insertLink = (view: EditorView) => {
  const { state, dispatch } = view;
  const { from, to, empty } = state.selection.main;
  const url = prompt('Enter URL:', 'https://');
  if (!url) return;

  const selectionText = empty ? 'link' : state.sliceDoc(from, to);
  const linkText = `[${selectionText}](${url}`;

  dispatch(state.update({ changes: { from, to, insert: linkText } }));
};

// Inserts an image markdown with a given URL
export const insertImageMarkdown = (view: EditorView, url: string) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const imageText = `![image](${url})`;
  dispatch(state.update({ changes: { from, insert: imageText } }));
};

// Toggles checklist syntax
export const insertChecklist = (view: EditorView) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  const checklistRegex = /^(\s*)-\s\[([ x])\]\s/;
  const match = line.text.match(checklistRegex);

  if (match) {
    dispatch(
      state.update({
        changes: {
          from: line.from + match[1].length,
          to: line.from + match[0].length,
          insert: '',
        },
      })
    );
  } else {
    dispatch(
      state.update({
        changes: {
          from: line.from,
          insert: '- [ ] ',
        },
        selection: { anchor: line.from + 6 },
      })
    );
  }
};

// Toggles blockquote syntax
export const toggleQuote = (view: EditorView) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  const quoteRegex = /^(\s*)>\s/;
  const match = line.text.match(quoteRegex);

  if (match) {
    dispatch(
      state.update({
        changes: {
          from: line.from + match[1].length,
          to: line.from + match[0].length,
          insert: '',
        },
      })
    );
  } else {
    dispatch(
      state.update({
        changes: {
          from: line.from,
          insert: '> ',
        },
        selection: { anchor: line.from + 2 },
      }),
    );
  }
};
