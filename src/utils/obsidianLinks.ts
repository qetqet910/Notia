export interface ParsedObsidianLink {
  target: string;
  alias?: string;
  start: number;
  end: number;
}

const createWikiLinkPattern = (): RegExp => /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

const isInsideFencedCodeBlock = (index: number, ranges: Array<{ start: number; end: number }>): boolean => {
  return ranges.some((range) => index >= range.start && index < range.end);
};

const getFencedCodeBlockRanges = (content: string): Array<{ start: number; end: number }> => {
  const ranges: Array<{ start: number; end: number }> = [];
  const fencedCodeBlockPattern = /```[\s\S]*?```/g;
  let match = fencedCodeBlockPattern.exec(content);

  while (match !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });

    match = fencedCodeBlockPattern.exec(content);
  }

  return ranges;
};

export const parseObsidianLinks = (content: string): ParsedObsidianLink[] => {
  if (!content) return [];

  const fencedRanges = getFencedCodeBlockRanges(content);
  const links: ParsedObsidianLink[] = [];
  const wikiLinkPattern = createWikiLinkPattern();

  let match = wikiLinkPattern.exec(content);

  while (match !== null) {
    if (isInsideFencedCodeBlock(match.index, fencedRanges)) {
      match = wikiLinkPattern.exec(content);
      continue;
    }

    const rawTarget = match[1]?.trim();
    const rawAlias = match[2]?.trim();

    if (!rawTarget) {
      continue;
    }

    links.push({
      target: rawTarget,
      alias: rawAlias || undefined,
      start: match.index,
      end: match.index + match[0].length,
    });

    match = wikiLinkPattern.exec(content);
  }

  return links;
};

export const convertObsidianLinksToMarkdown = (content: string): string => {
  if (!content) return '';

  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part, index) => {
      if (index % 2 === 1) {
        return part;
      }

      return part.replace(createWikiLinkPattern(), (_fullMatch, target: string, alias?: string) => {
        const normalizedTarget = target?.trim();
        const normalizedAlias = alias?.trim();

        if (!normalizedTarget) {
          return _fullMatch;
        }

        const linkText = normalizedAlias || normalizedTarget;
        const encodedTarget = encodeURIComponent(normalizedTarget);

        return `[${linkText}](#notia-wiki:${encodedTarget})`;
      });
    })
    .join('');
};
