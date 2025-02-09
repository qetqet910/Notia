import React from 'react';
import { FiMenu, FiHome, FiCalendar, FiTag } from "react-icons/fi"
import { Editor } from "../../components/features/Editor/Editor"
import { NoteList } from "../../components/features/NoteList/NoteList"
import { useNotes } from "../../hooks/useNotes"
import { useTags } from "../../hooks/useTags"

export const Home: React.FC = () => {
  const { addNote } = useNotes()
  const { allTags, selectedTag, setSelectedTag } = useTags()

  const menuItems = [
    { icon: <FiHome className="mr-2" />, text: "홈" },
    { icon: <FiCalendar className="mr-2" />, text: "오늘" },
    { icon: <FiTag className="mr-2" />, text: "레이블" },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <div className="flex items-center mb-6">
          <FiMenu className="mr-2" />
          <h1 className="text-xl font-semibold">MEMO</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
                {item.icon} {item.text}
              </li>
            ))}
          </ul>
          {/* 태그 목록 */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-2">태그</h2>
            <ul className="space-y-1">
              {allTags.map(tag => (
                <li
                  key={tag}
                  className={`text-sm p-1 cursor-pointer rounded ${
                    selectedTag === tag ? 'bg-blue-500' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  <FiTag className="inline mr-2" />
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">새 메모</h2>
          <Editor onSave={addNote} />
          
          <h2 className="text-2xl font-semibold my-4">
            {selectedTag ? `${selectedTag} 태그의 메모` : '모든 메모'}
          </h2>
          <NoteList tagFilter={selectedTag} />
        </div>
      </div>
    </div>
  )
}

