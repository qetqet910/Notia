import { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { MarkdownDocument } from '../types/markdown';

export const useMarkdown = () => {
  const [docs, setDocs] = useState<MarkdownDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const savedDocs = await db.getMarkdownDocs();
        setDocs(savedDocs);
      } catch (error) {
        console.error('Failed to load markdown docs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, []);

  const saveDoc = async (doc: Omit<MarkdownDocument, 'id' | 'lastEdited'>) => {
    const newDoc: MarkdownDocument = {
      ...doc,
      id: Date.now(),
      lastEdited: new Date().toISOString()
    };

    try {
      await db.saveMarkdown(newDoc);
      setDocs(prev => [...prev, newDoc]);
    } catch (error) {
      console.error('Failed to save markdown:', error);
    }
  };

  return {
    docs,
    loading,
    saveDoc
  };
}; 