import React from 'react';
import { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';

interface TrashViewProps {
  trashNotes: Note[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ trashNotes, onRestore, onDeleteForever }) => {
  if (trashNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Trash2 className="h-12 w-12 mb-4 opacity-20" />
        <p>휴지통이 비어있습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trash2 className="h-6 w-6" /> 휴지통
      </h2>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trashNotes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold truncate mb-2">{note.title || '제목 없음'}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {note.content_preview || '내용 없음'}
              </p>
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                <span>삭제됨: {note.deleted_at && formatDistanceToNow(new Date(note.deleted_at), { addSuffix: true, locale: ko })}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onRestore(note.id)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> 복구
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDeleteForever(note.id)}>
                  영구 삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
