import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Note } from '@/types';

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNote,
  onSelectNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content_preview || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (note.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const getContentPreview = (previewText: string | null) => {
    if (!previewText) return '미리보기 없음';
    return previewText.length >= 100 ? previewText + '...' : previewText;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b pt-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="노트 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredNotes.length > 0 ? (
          <div className="divide-y border-b">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedNote?.id === note.id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelectNote(note)}
              >
                <h3 className="font-medium line-clamp-1">{note.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {getContentPreview(note.content_preview)}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {(note.tags || []).slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(note.tags || []).length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{(note.tags || []).length - 2}
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.updated_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            <p>검색 결과가 없습니다</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
