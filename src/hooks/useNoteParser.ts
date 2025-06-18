import { useMemo } from 'react';

// 타입 정의
interface ParsedTag {
  text: string;
  originalText: string;
}
interface ParsedReminder {
  text: string;
  originalText: string;
  parsedDate?: Date;
  reminderText?: string;
}

// 기존 리마인더 타입 (DB에서 오는 데이터)
interface ExistingReminder {
  id: string;
  text: string;
  date: Date;
  completed: boolean;
  original_text: string;
}

const parseTimeExpression = (timeText: string): Date | undefined => {
  const now = new Date();
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
    const result = new Date();
    if (unit === '시간') {
      result.setHours(result.getHours() + amount);
    } else {
      result.setMinutes(result.getMinutes() + amount);
    }
    return result;
  }

  // 2. YYYY-MM-DD [HH:mm] 형식
  match = timeStr.match(
    /(\d{4})-(\d{1,2})-(\d{1,2})(?:\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?)?/,
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
      minute,
    );
  }

  // 3. 오늘, 내일, 모레 [HH:mm] 형식
  match = timeStr.match(
    /(오늘|내일|모레)(?:\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?)?/,
  );
  if (match) {
    const [, dayWord, ampm, hourStr, minStr] = match;
    const result = new Date();
    result.setSeconds(0, 0);

    if (dayWord === '내일') result.setDate(result.getDate() + 1);
    if (dayWord === '모레') result.setDate(result.getDate() + 2);

    let hour = hourStr ? parseInt(hourStr, 10) : 9;
    const minute = minStr ? parseInt(minStr, 10) : 0;

    if (ampm) {
      if (ampm === '오전' && hour === 12) hour = 0;
      if (ampm === '오후' && hour !== 12) hour += 12;
    } else if (hourStr) {
      if (!(hourStr.startsWith('0') && hourStr.length === 2)) {
        if (hour !== 12) {
          hour += 12;
        }
      }
    }

    result.setHours(hour, minute);
    return dayWord === '오늘' ? adjustForPastTime(result) : result;
  }

  // 4. 시간만 명시
  match = timeStr.match(/(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (match) {
    let [, ampm, hourStr, minStr] = match;
    if (!hourStr) return undefined;

    let hour = parseInt(hourStr, 10);
    const minute = minStr ? parseInt(minStr, 10) : 0;

    if (!ampm) {
      if (!(hourStr.startsWith('0') && hourStr.length === 2)) {
        if (hour !== 12) hour += 12;
      }
    } else {
      if (ampm === '오전' && hour === 12) hour = 0;
      if (ampm === '오후' && hour !== 12) hour += 12;
    }

    const result = new Date();
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

export const useNoteParser = (
  content: string,
  existingReminders: ExistingReminder[] = [],
) => {
  return useMemo(() => {
    const reminders: ParsedReminder[] = [];

    // 기존 리마인더를 텍스트로 매핑
    const existingByText = new Map(existingReminders.map((r) => [r.text, r]));

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
    const reminderRegex = /@([^@#\n]+?)\./g;
    while ((match = reminderRegex.exec(content)) !== null) {
      const fullText = match[1].trim();
      let timeText = '';
      let reminderText = '';

      const timePatterns = [
        /^(\d{4}-\d{1,2}-\d{1,2}(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/,
        /^((?:오늘|내일|모레)(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/,
        /^((?:오전|오후)\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(\d+\s*(?:시간|분))/,
        /^(\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
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
        // ✅ 기존 리마인더가 있으면 그 날짜 사용, 없으면 새로 파싱
        const existingReminder = existingByText.get(reminderText);
        const parsedDate = existingReminder
          ? existingReminder.date
          : parseTimeExpression(timeText);

        reminders.push({
          text: timeText,
          originalText: match[0],
          parsedDate,
          reminderText,
        });
      }
    }

    return { tags, reminders };
  }, [content, existingReminders]);
};
