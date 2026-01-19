import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Search from 'lucide-react/dist/esm/icons/search';
import Pin from 'lucide-react/dist/esm/icons/pin';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Note } from '@/types';
import { isTauri } from '@/utils/isTauri';
import { invoke } from '@tauri-apps/api/core';

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNote,
  onSelectNote,
  onTogglePin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setFilteredNotes(
          [...notes].sort((a, b) => {
            const pinDiff = Number(b.is_pinned || false) - Number(a.is_pinned || false);
            if (pinDiff !== 0) return pinDiff;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }),
        );
        return;
      }

      if (isTauri()) {
        try {
          const filteredIds = await invoke<string[]>('search_notes', {
            notes,
            query: debouncedSearchTerm,
          });
          
          const filtered = notes.filter((note) => filteredIds.includes(note.id));
           // Sort filtered results by pin then update time
           filtered.sort((a, b) => {
             const pinDiff = Number(b.is_pinned || false) - Number(a.is_pinned || false);
             if (pinDiff !== 0) return pinDiff;
             return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
           });
          setFilteredNotes(filtered);
        } catch (error) {
          console.error('Rust search failed:', error);
          // Fallback to JS filtering
          filterNotesJs();
        }
      } else {
        filterNotesJs();
      }
    };

    const filterNotesJs = () => {
      const lowerQuery = debouncedSearchTerm.toLowerCase();
      const filtered = notes
        .filter(
          (note) =>
            note.title.toLowerCase().includes(lowerQuery) ||
            (note.content_preview || '').toLowerCase().includes(lowerQuery) ||
            (note.tags || []).some((tag) =>
              tag.toLowerCase().includes(lowerQuery),
            ),
        )
        .sort((a, b) => {
          const pinDiff = Number(b.is_pinned || false) - Number(a.is_pinned || false);
          if (pinDiff !== 0) return pinDiff;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      setFilteredNotes(filtered);
    };

    performSearch();
  }, [debouncedSearchTerm, notes]);

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
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 group relative ${ // group 클래스 추가
                  selectedNote?.id === note.id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelectNote(note)}
              >
                <div className="absolute right-2 top-2 z-10">
                   <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 transition-opacity ${note.is_pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(note.id);
                      }}
                   >
                      <Pin className={`h-3.5 w-3.5 ${note.is_pinned ? "fill-orange-500 text-orange-500" : "text-muted-foreground"}`} />
                   </Button>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)] pr-6">
                  <div className="flex items-center gap-1">
                    <h3 className="font-medium truncate">{note.title || '제목 없음'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {getContentPreview(note.content_preview)}
                  </p>
                </div>

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
