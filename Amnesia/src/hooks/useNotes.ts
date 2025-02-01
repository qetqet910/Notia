import { useState } from 'react';
import type { Note } from '../types';

export const useNotes = () => {
  const [notes] = useState<Note[]>([
    {
      id: 1,
      title: "회의 내용 정리",
      content: "프로젝트 킥오프 미팅 주요 논의사항...",
      tags: ["회의", "업무"],
      date: "2024-01-28",
      syncStatus: "synced"
    },
    {
      id: 2,
      title: "쇼핑 목록",
      content: "1. 우유\n2. 계란\n3. 빵",
      tags: ["개인"],
      date: "2024-01-28",
      syncStatus: "pending"
    }
  ]);

  return { notes };
};