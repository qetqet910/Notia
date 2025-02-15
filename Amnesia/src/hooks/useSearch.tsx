import { useState, useCallback, useMemo } from "react"
import type { Note } from "../types"

export const useSearch = (notes: Note[]) => {
  const [searchTerm, setSearchTerm] = useState("")

  const searchNotes = useCallback(
    (notes: Note[]) => {
      if (!searchTerm.trim()) return notes

      const searchLower = searchTerm.toLowerCase()
      return notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(searchLower)
        const contentMatch = note.content.toLowerCase().includes(searchLower)
        const tagMatch = note.tags.some((tag) => tag.toLowerCase().includes(searchLower))

        return titleMatch || contentMatch || tagMatch
      })
    },
    [searchTerm],
  )

  const searchResults = useMemo(() => searchNotes(notes), [searchNotes, notes])

  const highlightText = useCallback(
    (text: string) => {
      if (!searchTerm.trim()) return text

      const parts = text.split(new RegExp(`(${searchTerm})`, "gi"))
      return parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          part
        ),
      )
    },
    [searchTerm],
  )

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    highlightText,
  }
}

