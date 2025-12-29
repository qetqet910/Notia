import { preserveNewlines } from './MarkdownPreview';

describe('preserveNewlines', () => {
  it('should preserve single newlines', () => {
    const input = 'Hello\nWorld';
    expect(preserveNewlines(input)).toBe('Hello\nWorld');
  });

  it('should convert double newlines to a paragraph with NBSP', () => {
    const input = 'Para1\n\nPara2';
    // Expecting: Para1 + \n\n + \u00A0\n\n (1 empty line) + Para2 ? 
    // 로직: return '\n\n' + '\u00A0\n\n'.repeat(Math.max(0, newlineCount - 1));
    // 2 newlines -> repeat(1) -> \n\n\u00A0\n\n
    // 잠깐, 로직을 다시 보면
    // match는 \n\n (2개)
    // repeat(2-1) = 1번
    // 결과: \n\n + \u00A0\n\n
    // 이렇게 되면 실제로는 빈 줄이 하나 생기는 효과 (마크다운 파서가 \u00A0를 내용있는 문단으로 인식)
    
    const output = preserveNewlines(input);
    expect(output).toContain('\u00A0');
    expect(output.match(/\u00A0/g)).toHaveLength(1);
  });

  it('should handle triple newlines (two empty lines)', () => {
    const input = 'Para1\n\n\nPara2';
    const output = preserveNewlines(input);
    expect(output.match(/\u00A0/g)).toHaveLength(2);
  });

  it('should ignore code blocks', () => {
    const input = '```\ncode\n\ncode\n```';
    const output = preserveNewlines(input);
    expect(output).toBe(input); // 코드 블록 내부는 건드리지 않음
  });
});
