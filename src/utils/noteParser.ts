// src/utils/noteParser.ts
import { EditorReminder } from '@/types';

// 타입 정의 - 외부에서도 사용할 수 있도록 export
export interface ParsedTag {
  text: string;
  originalText: string;
}
export interface ParsedReminder {
  text: string;
  originalText: string;
  parsedDate?: Date;
  reminderText?: string;
}

const parseTimeExpression = (
  timeText: string,
  baseDate: Date = new Date(),
): Date | undefined => {
  const now = baseDate; // Use baseDate instead of new Date()
  const timeStr = timeText.trim().toLowerCase();

  const adjustForPastTime = (result: Date): Date => {
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  };

  // 1. 상대 시간 (@1시간, @30분)
  let match = timeStr.match(/^(\d+)\s*(시간|분)$/);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const result = new Date(now); // Use new Date(now) to create a mutable copy
    if (unit === '시간') {
      result.setHours(result.getHours() + amount);
    } else {
      result.setMinutes(result.getMinutes() + amount);
    }
    return result;
  }

  // 2. YYYY-MM-DD [HH:mm] 형식
  match = timeStr.match(
    /(\d{4})-(\d{1,2})-(\d{1,2})(?:\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?)?/
  );
  if (match) {
    const [, year, month, day, ampm, hourStr, minStr] = match;
    let hour = hourStr ? parseInt(hourStr, 10) : 9;
    const minute = minStr ? parseInt(minStr, 10) : 0;
    if (ampm === '오전' && hour === 12) hour = 0;
    if (ampm === '오후' && hour !== 12) hour += 12;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      hour,
      minute
    );
  }

  // 3. 오늘, 내일, 모레, 글피 등 [HH:mm] 형식
  match = timeStr.match(
    /(오늘|금일|내일|명일|모레|글피)(?:\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?)?/
  );
  if (match) {
    const [, dayWord, ampm, hourStr, minStr] = match;
    const result = new Date(now); // Use new Date(now)
    result.setSeconds(0, 0);

    if (dayWord === '내일' || dayWord === '명일') result.setDate(result.getDate() + 1);
    if (dayWord === '모레') result.setDate(result.getDate() + 2);
    if (dayWord === '글피') result.setDate(result.getDate() + 3);

    let hour = hourStr ? parseInt(hourStr, 10) : 9;
    const minute = minStr ? parseInt(minStr, 10) : 0;

    if (ampm) {
      if (ampm === '오전' && hour === 12) hour = 0;
      if (ampm === '오후' && hour < 12) hour += 12;
    } else if (hourStr && !ampm) {
      // AMPM 지정 없이 시간만 입력된 경우 (e.g., "3시"),
      // 일반적으로 오후를 의도하는 경우가 많으므로 12를 더해준다.
      // 단, 12시 자체는 오후 12시이므로 더하지 않는다.
      if (hour < 12) {
        hour += 12;
      }
    }

    result.setHours(hour, minute);
    // '오늘' 또는 '금일'이면서 과거 시간일 경우에만 다음 날로 조정
    if (['오늘', '금일'].includes(dayWord)) {
      return adjustForPastTime(result);
    }
    return result;
  }

  // 4. 시간만 명시
  match = timeStr.match(/(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (match) {
    const [, ampm, hourStr, minStr] = match;
    if (!hourStr) return undefined;

    let hour = parseInt(hourStr, 10);
    const minute = minStr ? parseInt(minStr, 10) : 0;

    if (ampm === '오전' && hour === 12) {
      hour = 0;
    } else if (ampm === '오후' && hour < 12) {
      hour += 12;
    } else if (!ampm && hour < 12) {
      hour += 12;
    }

    const result = new Date(now); // Use new Date(now)
    result.setHours(hour, minute, 0, 0);
    return adjustForPastTime(result);
  }

  // 5. MM-DD 형식
  match = timeStr.match(/^(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    return new Date(now.getFullYear(), month, day, 9, 0, 0, 0);
  }

  return undefined;
};

export const parseNoteContent = (
  content: string,
  baseDate: Date = new Date(),
  existingReminders: EditorReminder[] = [],
) => {
  const reminders: ParsedReminder[] = [];
  const existingRemindersMap = new Map(
    existingReminders.map((r) => [r.original_text, r.date])
  );

  // 1. 해시태그 파싱
  const hashtagRegex = /#([^\s#@]+)/g;
  const uniqueTags = new Set<string>();
  let match;

  while ((match = hashtagRegex.exec(content)) !== null) {
    uniqueTags.add(match[1]);
  }

  const tags: ParsedTag[] = Array.from(uniqueTags).map((text) => ({
    text,
    originalText: `#${text}`,
  }));

  // 2. 리마인더 파싱
  // 마침표(.), 줄바꿈(\n), 또는 문자열의 끝($)에서 리마인더를 인식하도록 정규식 수정
  const reminderRegex = /@([^@#\n]+?)(?:\.|\n|$)/g;
  while ((match = reminderRegex.exec(content)) !== null) {
    // 빈 캡처 그룹(예: 문자열 끝의 빈 줄)은 건너뜁니다.
    if (!match[1]) continue;

    const fullText = match[1].trim();
    const originalText = match[0];
    let timeText = '';
    let reminderText = '';

    const timePatterns = [
      /^(\d{4}-\d{1,2}-\d{1,2}(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/,
      /^((?:오늘|내일|명일|모레|글피)(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/,
      /^((?:오전|오후)\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
      /^(\d+\s*(?:시간|분))/,
      /^(\d{1,2}\s*시(?:\s*(\d{1,2})\s*분)?)/,
      /^(\d{1,2}-\d{1,2})/, 
    ];

    for (const pattern of timePatterns) {
      const timeMatch = fullText.match(pattern);
      if (timeMatch) {
        timeText = timeMatch[1].trim();
        reminderText = fullText.substring(timeMatch[0].length).trim();
        break;
      }
    }

    if (timeText && reminderText) {
      const existingDate = existingRemindersMap.get(originalText);
      const parsedDate = existingDate ?? parseTimeExpression(timeText, baseDate); 
      
      reminders.push({
        text: timeText,
        originalText: originalText,
        parsedDate,
        reminderText,
      });
    }
  }

  return { tags, reminders };
};

export const parseReminder = (
  text: string,
  baseDate: Date = new Date(),
): ParsedReminder | null => {
  const result = parseNoteContent(`@${text}.`, baseDate);
  if (result.reminders.length > 0) {
    return result.reminders[0];
  }
  return null;
};