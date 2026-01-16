import { describe, it, expect } from 'vitest';
// boilerplate 내부의 코드를 직접 import
import { parseNoteContent } from '../../boilerplate/src/utils/noteParser';

describe('Boilerplate Code Verification', () => {
  it('should parse simple hashtags', () => {
    const result = parseNoteContent('Hello #world');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].text).toBe('world');
  });

  it('should extract multiple unique hashtags', () => {
    const result = parseNoteContent('This is a #test note with #tags and #test again.');
    expect(result.tags).toHaveLength(2);
    expect(result.tags.map(t => t.text)).toContain('test');
    expect(result.tags.map(t => t.text)).toContain('tags');
  });
});