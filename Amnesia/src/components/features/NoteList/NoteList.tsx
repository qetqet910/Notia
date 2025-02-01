import React from 'react';
import { NoteCard } from '../../common/NoteCard/NoteCard';
import { useNotes } from '../../../hooks/useNotes';

export const NoteList: React.FC = () => {
  const { notes } = useNotes();

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
};