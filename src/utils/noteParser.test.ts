import { parseNoteContent } from '@/utils/noteParser';

describe('noteParser', () => {
  const baseDate = new Date('2024-03-20T10:00:00'); // 수요일

  it('should parse basic relative time', () => {
    const content = '할일 @1시간.';
    const { reminders } = parseNoteContent(content, baseDate);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].parsedDate?.getHours()).toBe(11);
  });

  it('should parse specific date', () => {
    const content = '회의 @2024-12-25 14시.';
    const { reminders } = parseNoteContent(content, baseDate);
    expect(reminders[0].parsedDate).toEqual(new Date(2024, 11, 25, 14, 0));
  });

  it('should parse relative days (tomorrow)', () => {
    const content = '미팅 @내일 14시.';
    const { reminders } = parseNoteContent(content, baseDate);
    // 3/21 14:00
    expect(reminders[0].parsedDate?.getDate()).toBe(21);
    expect(reminders[0].parsedDate?.getHours()).toBe(14);
  });

  it('should handle "today" with PM inference', () => {
    // base: 10시. @오늘 9시 -> 9시는 12보다 작으므로 오후 9시(21시)로 추론됨 (미래)
    const content = '지각 @오늘 9시.';
    const { reminders } = parseNoteContent(content, baseDate);
    expect(reminders[0].parsedDate?.getDate()).toBe(20); // 오늘
    expect(reminders[0].parsedDate?.getHours()).toBe(21); // 오후 9시
  });

  it('should handle past time explicitly (move to next day)', () => {
    // base: 10시. @오늘 오전 9시 -> 이미 지났으므로 내일 오전 9시
    const content = '지각 @오늘 오전 9시.';
    const { reminders } = parseNoteContent(content, baseDate);
    expect(reminders[0].parsedDate?.getDate()).toBe(21); // 내일
    expect(reminders[0].parsedDate?.getHours()).toBe(9);
  });

  it('should infer PM for small hours if not specified otherwise', () => {
    // @3시 -> 15시 추론 (현재 10시 기준 3시는 과거이므로 15시로 추론되어야 함)
    // 로직 상 adjustForPastTime이 적용됨
    const content = '간식 @3시.';
    const { reminders } = parseNoteContent(content, baseDate);
    expect(reminders[0].parsedDate?.getHours()).toBe(15);
  });
  
  it('should handle AM/PM explicitly', () => {
    const content = '새벽 @오전 3시.';
    const { reminders } = parseNoteContent(content, baseDate);
    // 3/20 오전 3시는 이미 지났으므로 -> 3/21 오전 3시
    expect(reminders[0].parsedDate?.getDate()).toBe(21);
    expect(reminders[0].parsedDate?.getHours()).toBe(3);
  });

  it('should parse tags correctly', () => {
    const content = '#태그1 내용 #태그2';
    const { tags } = parseNoteContent(content, baseDate);
    expect(tags).toHaveLength(2);
    expect(tags.map(t => t.text)).toContain('태그1');
    expect(tags.map(t => t.text)).toContain('태그2');
  });
});