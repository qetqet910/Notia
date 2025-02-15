import { useCallback } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { Note } from "../types"
import { db } from "../services/db"

export const useNotes = () => {
  const notes = useLiveQuery(() => db.getAllNotes(), [])

  const addNote = useCallback(async (note: Omit<Note, "id" | "date" | "syncStatus" | "lastModified">) => {
    const newNote: Note = {
      ...note,
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      syncStatus: "pending",
      lastModified: Date.now(),
    }

    try {
      await db.saveNote(newNote)
      syncNote(newNote)
    } catch (error) {
      console.error("Failed to save note:", error)
    }
  }, [])

  const updateNote = useCallback(async (id: number, updates: Partial<Note>) => {
    const note = await db.notes.get(id)
    if (!note) return

    if (updates.lastModified && note.lastSynced && updates.lastModified < note.lastSynced) {
      await db.saveNote({ ...note, syncStatus: "conflict" })
      return
    }

    const updatedNote = { ...note, ...updates, syncStatus: "pending" }
    try {
      await db.saveNote(updatedNote)
      await syncNote(updatedNote)
    } catch (error) {
      console.error("Failed to update note:", error)
      await db.saveNote({ ...note, syncStatus: "error" })
    }
  }, [])

  const deleteNote = useCallback(async (id: number) => {
    try {
      await db.deleteNote(id)
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }, [])

  const syncNote = async (note: Note) => {
    try {
      // 실제 서버 동기화 로직을 여기에 구현
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const syncedNote = { ...note, syncStatus: "synced", lastSynced: Date.now() }
      await db.saveNote(syncedNote)
    } catch (error) {
      const errorNote = { ...note, syncStatus: "error" }
      await db.saveNote(errorNote)
    }
  }

  return { notes, addNote, updateNote, deleteNote }
}

