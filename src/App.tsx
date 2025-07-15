import React, { useState, useEffect, useCallback, memo } from 'react';

// --- 가짜 데이터 및 서버 통신 함수 ---
// 실제 Note 타입을 간단하게 흉내냅니다.
interface SimpleNote {
  id: string;
  title: string;
  content?: string; // content는 선택적입니다.
}

// 1. 초기 목록 데이터 (content 없음)
const MOCK_NOTES_METADATA: SimpleNote[] = [
  { id: '1', title: '첫 번째 노트' },
  { id: '2', title: '두 번째 노트' },
  { id: '3', title: '세 번째 노트' },
];

// 2. 노트별 상세 내용 데이터
const MOCK_NOTE_CONTENTS: { [key: string]: string } = {
  '1': '이것은 첫 번째 노트의 전체 내용입니다.',
  '2': '두 번째 노트의 상세 내용은 이렇습니다.',
  '3': '마지막 세 번째 노트의 내용입니다.',
};

// 3. 서버에서 목록을 가져오는 것을 흉내내는 함수 (500ms 소요)
const fetchNotesList = (): Promise<SimpleNote[]> => {
  console.log('📞 API 요청: 노트 목록 가져오는 중...');
  return new Promise(resolve => setTimeout(() => resolve(MOCK_NOTES_METADATA), 500));
};

// 4. 서버에서 특정 노트의 content를 가져오는 것을 흉내내는 함수 (500ms 소요)
const fetchNoteContent = (noteId: string): Promise<string> => {
  console.log(`📞 API 요청: 노트 ID [${noteId}]의 내용 가져오는 중...`);
  return new Promise(resolve => setTimeout(() => resolve(MOCK_NOTE_CONTENTS[noteId]), 500));
};
// ------------------------------------


// --- NoteList 컴포넌트 ---
interface NoteListProps {
  notes: SimpleNote[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
}

// ✨ React.memo로 감싸서 props가 변경되지 않으면 리렌더링을 방지합니다.
const NoteList: React.FC<NoteListProps> = memo(({ notes, selectedNoteId, onSelectNote }) => {
  console.log('%c🎨 NoteList 컴포넌트 리렌더링!', 'color: orange;');

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', width: '300px' }}>
      <h2>노트 목록</h2>
      {notes.map(note => (
        <div
          key={note.id}
          onClick={() => onSelectNote(note.id)}
          style={{
            padding: '8px',
            cursor: 'pointer',
            backgroundColor: selectedNoteId === note.id ? '#e0e0e0' : 'transparent',
          }}
        >
          {note.title}
        </div>
      ))}
    </div>
  );
});
NoteList.displayName = 'NoteList';
// -----------------------------


// --- App 컴포넌트 (Dashboard 역할) ---
export default function App() {
  console.log('%c🎨 App 컴포넌트 리렌더링!', 'color: lightblue;');

  const [notes, setNotes] = useState<SimpleNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [detailedNote, setDetailedNote] = useState<SimpleNote | null>(null);
  
  const [isListLoading, setIsListLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);

  // 1. 앱이 처음 마운트될 때, 노트 목록을 불러옵니다.
  useEffect(() => {
    fetchNotesList().then(data => {
      setNotes(data);
      setIsListLoading(false);
    });
  }, []);

  // 2. 노트가 선택될 때 (selectedNoteId가 바뀔 때), 상세 내용을 불러옵니다.
  useEffect(() => {
    if (!selectedNoteId) {
      setDetailedNote(null);
      return;
    }

    const loadContent = async () => {
      setIsContentLoading(true);
      const noteMetadata = notes.find(n => n.id === selectedNoteId);
      if (noteMetadata) {
        const content = await fetchNoteContent(selectedNoteId);
        setDetailedNote({ ...noteMetadata, content });
      }
      setIsContentLoading(false);
    };

    loadContent();
  }, [selectedNoteId]); // ✨ 의존성 배열에 'notes'가 없습니다. 중요!

  // 3. 노트 선택 핸들러 함수
  const handleSelectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
  }, []);
  
  if (isListLoading) {
    return <div>전체 노트를 불러오는 중...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <NoteList
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectNote}
      />
      <div style={{ border: '1px solid #ccc', padding: '10px', flex: 1 }}>
        <h2>상세 내용</h2>
        {isContentLoading ? (
          <div>노트 내용을 불러오는 중...</div>
        ) : detailedNote ? (
          <div>
            <h3>{detailedNote.title}</h3>
            <p>{detailedNote.content}</p>
          </div>
        ) : (
          <div>노트를 선택해주세요.</div>
        )}
      </div>
    </div>
  );
}