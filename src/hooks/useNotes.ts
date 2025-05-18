import { useState, useEffect } from 'react';
import { Note } from '@/types';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();

  // 노트 데이터 로드
  const fetchNotes = async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Supabase에서 현재 사용자의 노트 가져오기
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('owner_id', user.id) // user_id 대신 owner_id 사용
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // 날짜 문자열을 Date 객체로 변환
      const formattedNotes = data.map((note) => ({
        ...note,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        // Supabase의 컬럼명과 클라이언트 타입 맞추기
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
      }));

      setNotes(formattedNotes);
    } catch (err) {
      console.error('노트 로드 중 오류 발생:', err);
      setError(
        err instanceof Error ? err : new Error('노트 로드 중 오류 발생'),
      );
    } finally {
      setLoading(false);
    }
  };

  // 사용자가 변경되면 노트 다시 로드
  useEffect(() => {
    fetchNotes();
  }, [user]);

  // 노트 추가
  const addNote = async (newNote: Omit<Note, 'id'>) => {
    if (!user) return;

    try {
      // Supabase에 노트 추가
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            owner_id: user.id, // user_id 대신 owner_id 사용
            title: newNote.title,
            content: newNote.content,
            tags: newNote.tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      // 새 노트를 상태에 추가
      const addedNote = {
        ...data[0],
        id: data[0].id,
        createdAt: new Date(data[0].created_at),
        updatedAt: new Date(data[0].updated_at),
        tags: data[0].tags || [],
      };

      setNotes((prevNotes) => [addedNote, ...prevNotes]);
      return addedNote;
    } catch (err) {
      console.error('노트 추가 중 오류 발생:', err);
      setError(
        err instanceof Error ? err : new Error('노트 추가 중 오류 발생'),
      );
      return null;
    }
  };

  // 노트 업데이트
  const updateNote = async (updatedNote: Note) => {
    if (!user) return;

    try {
      // Supabase에서 노트 업데이트
      const { error } = await supabase
        .from('notes')
        .update({
          title: updatedNote.title,
          content: updatedNote.content,
          tags: updatedNote.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedNote.id)
        .eq('owner_id', user.id);

      if (error) throw error;

      // 상태 업데이트
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === updatedNote.id
            ? { ...updatedNote, updatedAt: new Date() }
            : note,
        ),
      );

      return true;
    } catch (err) {
      console.error('노트 업데이트 중 오류 발생:', err);
      setError(
        err instanceof Error ? err : new Error('노트 업데이트 중 오류 발생'),
      );
      return false;
    }
  };

  // 노트 삭제
  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      // Supabase에서 노트 삭제
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // 상태 업데이트
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      return true;
    } catch (err) {
      console.error('노트 삭제 중 오류 발생:', err);
      setError(
        err instanceof Error ? err : new Error('노트 삭제 중 오류 발생'),
      );
      return false;
    }
  };

const fetchTeamNotes = async (teamId: string) => {
    if (!teamId) return [];
    
    try {
      // 1. 팀이 접근 가능한 노트 ID 가져오기
      const { data: groupNotesData, error: groupNotesError } = await supabase
        .from('group_notes')
        .select('note_id, access_level')
        .eq('group_id', teamId);
        
      if (groupNotesError) throw groupNotesError;
      
      if (!groupNotesData.length) return [];
      
      // 2. 노트 ID로 실제 노트 데이터 가져오기
      const noteIds = groupNotesData.map(item => item.note_id);
      
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .in('id', noteIds)
        .order('updated_at', { ascending: false });
        
      if (notesError) throw notesError;
      
      // 3. 노트 데이터 형식 변환
      const formattedNotes = notesData.map(note => ({
        ...note,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        tags: note.tags || [],
        // 접근 레벨 추가
        accessLevel: groupNotesData.find(gn => gn.note_id === note.id)?.access_level || 'read'
      }));
      
      return formattedNotes;
    } catch (err) {
      console.error('팀 노트 로드 중 오류 발생:', err);
      return [];
    }
  };
  
  // 노트를 팀과 공유
  const shareNoteWithTeam = async (noteId: string, teamId: string, accessLevel: 'read' | 'write' | 'admin' = 'read') => {
    try {
      // 이미 공유되어 있는지 확인
      const { data: existingShare } = await supabase
        .from('group_notes')
        .select('*')
        .eq('note_id', noteId)
        .eq('group_id', teamId)
        .single();
      
      if (existingShare) {
        // 이미 공유되어 있으면 접근 레벨만 업데이트
        const { error } = await supabase
          .from('group_notes')
          .update({ access_level: accessLevel })
          .eq('note_id', noteId)
          .eq('group_id', teamId);
          
        if (error) throw error;
      } else {
        // 새로 공유
        const { error } = await supabase
          .from('group_notes')
          .insert([
            {
              note_id: noteId,
              group_id: teamId,
              access_level: accessLevel
            }
          ]);
          
        if (error) throw error;
      }
      
      return true;
    } catch (err) {
      console.error('노트 공유 중 오류 발생:', err);
      return false;
    }
  };
  
  // 팀과 노트 공유 취소
  const unshareNoteWithTeam = async (noteId: string, teamId: string) => {
    try {
      const { error } = await supabase
        .from('group_notes')
        .delete()
        .eq('note_id', noteId)
        .eq('group_id', teamId);
        
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('노트 공유 취소 중 오류 발생:', err);
      return false;
    }
  };
  
  // 노트가 공유된 팀 목록 가져오기
  const getTeamsWithAccess = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_notes')
        .select(`
          group_id,
          access_level,
          user_groups:group_id(id, name)
        `)
        .eq('note_id', noteId);
        
      if (error) throw error;
      
      return data.map(item => ({
        teamId: item.group_id,
        teamName: item.user_groups.name,
        accessLevel: item.access_level
      }));
    } catch (err) {
      console.error('노트 공유 정보 로드 중 오류 발생:', err);
      return [];
    }
  };

//**********************************************************************************************// */

  // 태그로 노트 필터링
  const getNotesByTag = (tag: string) => {
    return notes.filter((note) => note.tags.includes(tag));
  };

  // 날짜로 노트 필터링
  const getNotesByDate = (date: Date) => {
    return notes.filter((note) => {
      const noteDate = new Date(note.createdAt);
      return (
        noteDate.getFullYear() === date.getFullYear() &&
        noteDate.getMonth() === date.getMonth() &&
        noteDate.getDate() === date.getDate()
      );
    });
  };

  // 모든 태그 가져오기
  const getAllTags = () => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  return {
    notes,
    loading,
    error,
    fetchNotes,
    addNote,
    updateNote,
    deleteNote,
    getNotesByTag,
    getNotesByDate,
    getAllTags,

    fetchTeamNotes,
    shareNoteWithTeam,
    unshareNoteWithTeam,
    getTeamsWithAccess
  };
};
