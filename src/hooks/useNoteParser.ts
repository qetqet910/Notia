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

/**
 * 다양한 한국어 시간 표현을 Date 객체로 변환합니다.
 * 기존 Editor.tsx의 파싱 규칙을 모두 포함하도록 복원 및 개선되었습니다.
 * @param timeText - 파싱할 시간 문자열 (예: "내일 2시", "30분", "2025-12-25")
 */
const parseTimeExpression = (timeText: string): Date | undefined => {
  const now = new Date();
  const timeStr = timeText.trim().toLowerCase();

  // 헬퍼 함수: 주어진 시간이 현재보다 과거일 경우, 날짜를 하루 뒤로 조정
  const adjustForPastTime = (result: Date): Date => {
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  };

  // 1. 상대 시간 (@1시간, @30분)
  //    - 문자열 전체가 상대 시간일 경우에만 매치하도록 ^와 $를 추가하여 안정성 확보
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

  // 2. YYYY-MM-DD [HH:mm] 형식 (가장 구체적인 형식부터)
  match = timeStr.match(
    /(\d{4})-(\d{1,2})-(\d{1,2})(?:\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?)?/,
  );
  if (match) {
    const [, year, month, day, ampm, hourStr, minStr] = match;
    let hour = hourStr ? parseInt(hourStr, 10) : 9; // 시간이 없으면 기본 9시
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
      // 오전/오후가 명시된 경우
      if (ampm === '오전' && hour === 12) hour = 0; // 오전 12시 -> 0시
      if (ampm === '오후' && hour !== 12) hour += 12; // 오후 1-11시 -> 13-23시
    } else if (hourStr) {
      // 오전/오후가 명시되지 않은 경우
      // "1시" 처럼 0으로 시작하는 두자리수가 아니면 오후로 간주 (12시는 정오)
      if (!(hourStr.startsWith('0') && hourStr.length === 2)) {
        if (hour !== 12) {
          hour += 12;
        }
      }
    }

    result.setHours(hour, minute);

    // '오늘'의 경우에만 과거 시간인지 체크 후 조정
    return dayWord === '오늘' ? adjustForPastTime(result) : result;
  }

  // 4. 시간만 명시 (@2시, @오후 3시 30분, @08시)
  match = timeStr.match(/(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (match) {
    let [, ampm, hourStr, minStr] = match;
    if (!hourStr) return undefined;

    let hour = parseInt(hourStr, 10);
    const minute = minStr ? parseInt(minStr, 10) : 0;

    if (!ampm) {
      // 0으로 시작하는 두자리수(01~09)가 아니면 오후로 처리 (12시는 정오)
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
    // 시간은 기본 9시로 설정
    return new Date(now.getFullYear(), month, day, 9, 0, 0, 0);
  }

  return undefined; // 모든 규칙에 맞지 않으면 파싱 실패
};

export const useNoteParser = (content: string) => {
  return useMemo(() => {
    const tags: ParsedTag[] = [];
    const reminders: ParsedReminder[] = [];

    // 1. 해시태그 파싱 (#태그)
    const hashtagRegex = /#([^\s#@]+)/g;
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      tags.push({ text: match[1], originalText: match[0] });
    }

    // 2. 리마인더 파싱 (@시간 할일.)
    const reminderRegex = /@([^@#\n]+?)\./g;
    while ((match = reminderRegex.exec(content)) !== null) {
      const fullText = match[1].trim();
      let timeText = '';
      let reminderText = '';

      // 시간 표현을 식별하기 위한 정규식 패턴들 (구체적인 순서대로)
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

      // 시간과 할일 내용이 모두 추출된 경우에만 리마인더로 추가
      if (timeText && reminderText) {
        reminders.push({
          text: timeText,
          originalText: match[0],
          parsedDate: parseTimeExpression(timeText),
          reminderText,
        });
      }
    }

    return { tags, reminders };
  }, [content]);
};
