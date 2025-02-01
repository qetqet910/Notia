import React from 'react';
import { Tag } from 'lucide-react';
import { Note } from '../../../types';

interface NoteCardProps {
  note: Note;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{note.title}</h3>
        <span className="text-xs text-gray-500">{note.date}</span>
      </div>
      <p className="text-gray-600 text-sm mb-3">{note.content}</p>
      <div className="flex items-center gap-2">
        {note.tags.map(tag => (
          <span key={tag} className="flex items-center text-xs text-gray-500">
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}