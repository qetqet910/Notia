import { useEffect, useRef } from 'react';
import { Note } from '../types';

interface AutoSaveOptions {
  onSave: (data: Partial<Note>) => void;
  debounceMs?: number;
}

export const useAutoSave = (data: Partial<Note>, { onSave, debounceMs = 1000 }: AutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSave({
        ...data,
        lastModified: Date.now(),
      });
      lastSavedRef.current = currentData;
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, debounceMs]);
}; 