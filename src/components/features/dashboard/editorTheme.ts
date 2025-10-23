import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

export const codeMirrorTheme = createTheme({
  theme: 'light',
  settings: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    caret: 'hsl(var(--foreground))',
    selection: 'hsl(var(--accent))',
    selectionMatch: 'hsl(var(--accent))',
    lineHighlight: 'transparent',
    gutterBackground: 'hsl(var(--background))',
    gutterForeground: 'hsl(var(--muted-foreground))',
    fontFamily: "'NoonnuBasicGothicRegular', sans-serif",
  },
  styles: [
    { tag: t.heading, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
    { tag: t.strong, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
    { tag: t.emphasis, color: 'hsl(var(--foreground))', fontStyle: 'italic' },
    { tag: t.quote, color: '#00a983', fontStyle: 'italic' }, // Velog's quote color
    { tag: t.link, color: '#00a983' },
    { tag: t.keyword, color: '#7c7c7c' },
    { tag: t.string, color: '#00a983' },
    { tag: t.comment, color: '#8e908c', fontStyle: 'italic' },
    { tag: t.meta, color: '#8e908c' },
    { tag: t.variableName, color: 'hsl(var(--foreground))' },
    { tag: t.attributeName, color: 'hsl(var(--foreground))' },
    { tag: t.propertyName, color: 'hsl(var(--foreground))' },
  ],
});
