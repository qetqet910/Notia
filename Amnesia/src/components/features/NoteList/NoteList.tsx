import type React from "react"
import { useMemo } from "react"
import { NoteCard } from "../../common/NoteCard/NoteCard"
import { useNotes } from "../../../hooks/useNotes"
import { useSearch } from "../../../hooks/useSearch"
import { Search } from "../Search/Search"

interface NoteListProps {
  tagFilter?: string | null
}

export const NoteList: React.FC<NoteListProps> = ({ tagFilter }) => {
  const { notes } = useNotes()

  const filteredByTag = useMemo(() => {
    return tagFilter ? notes?.filter((note) => note.tags.includes(tagFilter)) || [] : notes || []
  }, [notes, tagFilter])

  const { searchTerm, setSearchTerm, searchResults, highlightText } = useSearch(filteredByTag)

  return (
    <div className="space-y-4">
      <Search value={searchTerm} onChange={setSearchTerm} />
      {searchResults.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">검색 결과가 없습니다.</p>
      ) : (
        searchResults.map((note) => (
          <NoteCard key={note.id} note={note} highlightText={searchTerm ? highlightText : undefined} />
        ))
      )}
    </div>
  )
}

