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
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    )
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // ✅ 최신순 정렬 추가

  // Get a preview of the content (first 60 characters)
  const getContentPreview = (content: string) => {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 60
      ? plainText.substring(0, 60) + '...'
      : plainText;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
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
          <div className="divide-y">
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
                  {getContentPreview(note.content)}
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
                    {formatDistanceToNow(note.updatedAt, {
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
