import { useState, useEffect, useCallback } from 'react';
import { useNotes, Note } from './useNotes';
import { usePlans, Plan } from './usePlans';

interface SearchResults {
  notes: Note[];
  plans: Plan[];
  tags: string[];
}

export const useSearch = () => {
  const { notes } = useNotes();
  const { plans } = usePlans();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({
    notes: [],
    plans: [],
    tags: []
  });

  // 태그 모음 생성
  const getAllTags = useCallback(() => {
    const tagSet = new Set<string>();
    
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    
    plans.forEach(plan => {
      plan.tags.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet);
  }, [notes, plans]);

  // 검색 로직
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults({
        notes: [],
        plans: [],
        tags: []
      });
      return;
    }

    // 검색어 소문자로 변환
    const lowercaseQuery = query.toLowerCase();
    
    // 노트 검색
    const matchedNotes = notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    // 일정 검색
    const matchedPlans = plans.filter(plan => 
      plan.title.toLowerCase().includes(lowercaseQuery) ||
      plan.description.toLowerCase().includes(lowercaseQuery) ||
      plan.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    // 태그 검색
    const allTags = getAllTags();
    const matchedTags = allTags.filter(tag => 
      tag.toLowerCase().includes(lowercaseQuery)
    );
    
    setSearchResults({
      notes: matchedNotes,
      plans: matchedPlans,
      tags: matchedTags
    });
  }, [notes, plans, getAllTags]);

  // 검색어 변경 시 검색 수행
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  // 노트 또는 일정 데이터가 변경되었을 때 현재 검색어로 다시 검색
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [notes, plans, searchQuery, performSearch]);

  // 검색어와 일치하는 텍스트 하이라이트 함수
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    performSearch,
    highlightMatch
  };
};