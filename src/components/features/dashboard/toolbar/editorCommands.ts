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

// Inserts a horizontal divider or removes it if already present
export const insertDivider = (view: EditorView) => {
  const { state, dispatch } = view;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  
  // Check if the line is effectively a divider (ignoring whitespace)
  if (line.text.trim() === '---') {
    dispatch(
      state.update({
        changes: { from: line.from, to: line.to, insert: '' },
      })
    );
  } else {
    // If line is not empty, insert newlines to be safe, otherwise just the divider
    const insertText = line.text.trim() === '' ? '---' : '\n---\n';
    dispatch(
      state.update({
        changes: { from, insert: insertText },
        selection: { anchor: from + insertText.length },
      }),
    );
  }
};

// Inserts a basic table
export const insertTable = (view: EditorView) => {
  const { state, dispatch } = view;
  const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
| :--------  |  :-------- |  :-------- |
|  Row 1      |  Data       |  Data       |
|  Row 2      |  Data       |  Data       |
`;
  dispatch(
    state.update({
      changes: { from: state.selection.main.from, insert: tableTemplate },
      selection: { anchor: state.selection.main.from + tableTemplate.length },
    }),
  );
};

// Inserts a mermaid flowchart
export const insertMermaidFlow = (view: EditorView) => {
  const { state, dispatch } = view;
  const mermaidTemplate = `
\`\`\`mermaid
graph TD
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Great!]
  B -- No --> D[Debug]
  D --> B
\`\`\`
`;
  dispatch(
    state.update({
      changes: { from: state.selection.main.from, insert: mermaidTemplate },
      selection: { anchor: state.selection.main.from + mermaidTemplate.length },
    }),
  );
};

// Inserts a mermaid sequence diagram
export const insertMermaidSequence = (view: EditorView) => {
  const { state, dispatch } = view;
  const mermaidTemplate = `
\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant S as System
  participant D as Database

  U->>S: Request Data
  S->>D: Query
  D-->>S: Return Results
  S-->>U: Show Response
\`\`\`
`;
  dispatch(
    state.update({
      changes: { from: state.selection.main.from, insert: mermaidTemplate },
      selection: { anchor: state.selection.main.from + mermaidTemplate.length },
    }),
  );
};

// Inserts a mermaid mindmap
export const insertMermaidMindmap = (view: EditorView) => {
  const { state, dispatch } = view;
  const mermaidTemplate = `
\`\`\`mermaid
mindmap
  root((New Project))
    Planning
      Research
      Strategy
    Design
      UI / UX
      Assets
    Development
      Frontend
      Backend
\`\`\`
`;
  dispatch(
    state.update({
      changes: { from: state.selection.main.from, insert: mermaidTemplate },
      selection: { anchor: state.selection.main.from + mermaidTemplate.length },
    }),
  );
};
