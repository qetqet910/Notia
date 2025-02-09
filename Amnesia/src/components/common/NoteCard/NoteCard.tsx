import React from 'react';
import { Tag, Cloud, AlertCircle, RefreshCw } from 'lucide-react';
import { Note } from '../../../types';

interface NoteCardProps {
  note: Note;
  highlightText?: (text: string) => React.ReactNode;
}

const SyncStatusIcon = ({ status }: { status: Note['syncStatus'] }) => {
  switch (status) {
    case 'synced':
      return <Cloud className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
    case 'conflict':
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

export const NoteCard: React.FC<NoteCardProps> = ({ note, highlightText }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">
          {highlightText ? highlightText(note.title) : note.title}
        </h3>
        <div className="flex items-center gap-2">
          <SyncStatusIcon status={note.syncStatus} />
          <span className="text-xs text-gray-500">{note.date}</span>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-3">
        {highlightText ? highlightText(note.content) : note.content}
      </p>
      <div className="flex items-center gap-2">
        {note.tags.map(tag => (
          <span key={tag} className="flex items-center text-xs text-gray-500">
            <Tag className="w-3 h-3 mr-1" />
            {highlightText ? highlightText(tag) : tag}
          </span>
        ))}
      </div>
    </div>
  );
};