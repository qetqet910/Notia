import { describe, it, expect } from 'vitest';
import { parseNoteContent } from '../utils/noteParser';

describe('Note Parser', () => {
  const baseDate = new Date('2025-05-25T09:00:00'); // 기준 시간: 5월 25일 오전 9시

  it('should parse simple tags', () => {
    const content = 'Hello #world this is a #test';
    const { tags } = parseNoteContent(content);
    expect(tags).toHaveLength(2);
    expect(tags[0].text).toBe('world');
    expect(tags[1].text).toBe('test');
  });

  it('should ignore duplicate tags', () => {
    const content = '#hello #hello #world';
    const { tags } = parseNoteContent(content);
    expect(tags).toHaveLength(2);
  });

  describe('Reminder Parsing', () => {
    it('should parse relative time (hours)', () => {
      const content = '@2시간 밥먹기.';
      const { reminders } = parseNoteContent(content, baseDate);
      expect(reminders).toHaveLength(1);
      expect(reminders[0].reminderText).toBe('밥먹기');
      // 9시 + 2시간 = 11시
      expect(reminders[0].parsedDate?.getHours()).toBe(11);
    });

    it('should parse specific time (today)', () => {
      const content = '@오늘 14시 회의.';
      const { reminders } = parseNoteContent(content, baseDate);
      expect(reminders).toHaveLength(1);
      expect(reminders[0].parsedDate?.getHours()).toBe(14);
      expect(reminders[0].parsedDate?.getDate()).toBe(25);
    });

    it('should parse "tomorrow" correctly', () => {
      const content = '@내일 10시 미팅.';
      const { reminders } = parseNoteContent(content, baseDate);
      expect(reminders).toHaveLength(1);
      expect(reminders[0].parsedDate?.getDate()).toBe(26); // 25 + 1
      expect(reminders[0].parsedDate?.getHours()).toBe(10);
    });

    it('should parse AM/PM correctly', () => {
      const content = '@오후 3시 운동.';
      const { reminders } = parseNoteContent(content, baseDate);
      expect(reminders).toHaveLength(1);
      expect(reminders[0].parsedDate?.getHours()).toBe(15);
    });

    it('should handle time without AM/PM intelligently', () => {
        // "3시"라고 하면 문맥상 오후 3시(15시)로 추론하는 로직 테스트
        const content = '@3시 간식.';
        const { reminders } = parseNoteContent(content, baseDate);
        expect(reminders).toHaveLength(1);
        expect(reminders[0].parsedDate?.getHours()).toBe(15);
    });

    it('should extract reminder text correctly', () => {
        const content = '중요한 일: @1시간 리포트 작성 완료하기.\n다음 할 일...';
        const { reminders } = parseNoteContent(content, baseDate);
        expect(reminders[0].reminderText).toBe('리포트 작성 완료하기');
    });
  });
});
