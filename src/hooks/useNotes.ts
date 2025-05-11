import { useState, useEffect } from 'react';
import { Note } from '@/types';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 초기 노트 데이터 로드
  useEffect(() => {
    const loadNotes = () => {
      setLoading(true);
      try {
        // 로컬 스토리지에서 노트 데이터 가져오기
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
          // JSON으로 저장된 날짜를 Date 객체로 변환
          const parsedNotes = JSON.parse(savedNotes, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
          setNotes(parsedNotes);
        }
      } catch (err) {
        console.error('노트 로드 중 오류 발생:', err);
        setError(
          err instanceof Error ? err : new Error('노트 로드 중 오류 발생'),
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  // 노트 데이터가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);

  // 노트 추가
  const addNote = (newNote: Note) => {
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  // 노트 업데이트
  const updateNote = (updatedNote: Note) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === updatedNote.id
          ? { ...updatedNote, updatedAt: new Date() }
          : note,
      ),
    );
  };

  // 노트 삭제
  const deleteNote = (noteId: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
  };

  // 태그로 노트 필터링
  const getNotesByTag = (tag: string) => {
    return notes.filter((note) => note.tags.includes(tag));
  };

  // 날짜로 노트 필터링
  const getNotesByDate = (date: Date) => {
    return notes.filter((note) => {
      const noteDate = new Date(note.createdAt);
      return (
        noteDate.getFullYear() === date.getFullYear() &&
        noteDate.getMonth() === date.getMonth() &&
        noteDate.getDate() === date.getDate()
      );
    });
  };

  // 모든 태그 가져오기
  const getAllTags = () => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    getNotesByTag,
    getNotesByDate,
    getAllTags,
  };
};
