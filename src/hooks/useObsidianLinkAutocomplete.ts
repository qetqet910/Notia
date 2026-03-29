import type { Note } from '@/types';
import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from '@codemirror/autocomplete';
import type { EditorView } from '@codemirror/view';
import { useMemo } from 'react';

const MAX_WIKI_COMPLETIONS = 50;

const normalizeTitle = (title: string): string => title.trim();

const extractTokens = (text: string): Set<string> => {
  if (!text) return new Set();
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  return new Set(words);
};

const calculateRelevanceScore = (candidate: Note, currentNote: Note | null): number => {
  let score = 0;
  
  // 1. Recency Score (High Priority)
  // Give up to +40 points for recency (decay over 7 days)
  const now = new Date().getTime();
  const candidateTime = new Date(candidate.updated_at).getTime();
  const diffDays = (now - candidateTime) / (1000 * 60 * 60 * 24);
  
  if (diffDays >= 0) {
      score += Math.max(0, 40 - (diffDays * 5)); // within ~8 days gets boost
  }

  if (!currentNote || candidate.id === currentNote.id) {
    return score - 1000; // Deprioritize self completely
  }

  // 2. Tag Similarity
  const currentTags = currentNote.tags || [];
  const candidateTags = candidate.tags || [];
  let tagOverlap = 0;
  for (const tag of candidateTags) {
      if (currentTags.includes(tag)) tagOverlap++;
  }
  score += tagOverlap * 15;

  // 3. Keyword Match in Title & Preview
  const currentTitleTokens = extractTokens(currentNote.title);
  const candidatePreview = (candidate.content_preview || '').toLowerCase();
  const candidateTitle = candidate.title.toLowerCase();

  for (const token of currentTitleTokens) {
      if (candidateTitle.includes(token)) score += 10;
      if (candidatePreview.includes(token)) score += 3;
  }

  return score;
};

const createTitleOptions = (notes: Note[], currentNote: Note | null): Completion[] => {
  const seen = new Set<string>();

  // Sort by calculated relevance score first
  const scoredNotes = [...notes].map(note => ({
      note,
      score: calculateRelevanceScore(note, currentNote)
  })).sort((a, b) => b.score - a.score); // Descending order

  return scoredNotes
    .map(({ note }) => normalizeTitle(note.title))
    .filter((title) => {
      if (!title) return false;
      const key = title.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_WIKI_COMPLETIONS)
    .map((title) => ({
      label: title,
      type: 'text',
      boost: 10, // Higher boost ensures it overrides default text completions
      info: '최신 수정 및 연관도순 추천',
      apply: (view: EditorView, completion: Completion, from: number, to: number) => {
        const hasClosingBrackets = view.state.sliceDoc(to, to + 2) === ']]';
        view.dispatch({
          changes: {
            from,
            to: hasClosingBrackets ? to + 2 : to,
            insert: `${completion.label}]]`,
          },
        });
      },
    }));
};

export const createObsidianLinkCompletion = (notes: Note[] = [], currentNote: Note | null = null): CompletionSource => {
  const titleOptions = createTitleOptions(notes, currentNote);

  return (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context;
    const line = state.doc.lineAt(pos);
    const cursorInLine = pos - line.from;
    const textBeforeCursor = line.text.slice(0, cursorInLine);
    const match = textBeforeCursor.match(/\[\[[^\]]*$/);

    if (!match) {
      return null;
    }

    const query = match[0].slice(2).toLocaleLowerCase();
    const from = pos - query.length;

    if (from === pos && !context.explicit) {
      return {
        from,
        options: titleOptions,
      };
    }

    // Preserve the sorted order of titleOptions when filtering
    const options = titleOptions.filter((option) =>
      option.label.toLocaleLowerCase().includes(query),
    );

    if (!options.length) {
      return null;
    }

    return {
      from,
      options,
    };
  };
};

export const useObsidianLinkAutocomplete = (notes: Note[] = [], currentNote: Note | null = null): CompletionSource => {
  return useMemo(() => createObsidianLinkCompletion(notes, currentNote), [notes, currentNote]);
};
