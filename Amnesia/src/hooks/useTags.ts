import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';

export const useTags = () => {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 모든 메모에서 태그 수집
  useEffect(() => {
    const loadTags = async () => {
      const notes = await db.getAllNotes();
      const tags = new Set(notes.flatMap(note => note.tags));
      setAllTags(Array.from(tags));
    };
    loadTags();
  }, []);

  // 태그 자동완성을 위한 필터링
  const filterTags = useCallback((input: string) => {
    if (!input.trim()) {
      setFilteredTags([]);
      return;
    }
    const filtered = allTags.filter(tag => 
      tag.toLowerCase().includes(input.toLowerCase())
    );
    setFilteredTags(filtered);
  }, [allTags]);

  return {
    allTags,
    filteredTags,
    selectedTag,
    setSelectedTag,
    filterTags
  };
}; 