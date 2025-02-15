import type React from "react"
import { useState } from "react"
import { useTags } from "../../../hooks/useTags"
import { useNotes } from "../../../hooks/useNotes"
import { Tag, Save } from 'lucide-react';
import { Button } from '../../common/Button/Button';

export const Editor: React.FC = () => {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const { filteredTags, filterTags } = useTags()
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const { addNote } = useNotes()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && content.trim()) {
      await addNote({ title, content, tags })
      setTitle("")
      setContent("")
      setTags([])
    }
  }

 const handleTagAdd = (e: React.KeyboardEvent) => {
   if (e.key === 'Enter' && tagInput.trim()) {
     e.preventDefault();
     
     const newTag = tagInput.trim();
     if (!tags.includes(newTag)) {
       setTags(prevTags => [...prevTags, newTag]);
     }
     setTagInput('');
   }
 };

 const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const value = e.target.value;
   setTagInput(value);
   filterTags(value);
   setShowTagSuggestions(true);
 };

 const handleTagSelect = (tag: string) => {
  // 자동완성
   if (!tags.includes(tag)) {
     console.log('Selecting tag:', tag);
     setTags(prevTags => [...prevTags, tag]);
   }
   setTagInput('');
   setShowTagSuggestions(false);
 };

 const handleTagRemove = (tagToRemove: string) => {
  // 선택된 태그 삭제
   console.log('Removing tag:', tagToRemove);
   setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
 };

 return (
   <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
     <input
       type="text"
       value={title}
       onChange={(e) => setTitle(e.target.value)}
       placeholder="제목을 입력하세요"
       className="w-full mb-2 p-2 border rounded"
     />
     <textarea
       value={content}
       onChange={(e) => setContent(e.target.value)}
       placeholder="내용을 입력하세요"
       className="w-full h-32 mb-2 p-2 border rounded resize-none"
     />
     <div className="relative">
       <div className="flex items-center gap-2 mb-2">
         <Tag className="w-4 h-4" />
         <input
           type="text"
           value={tagInput}
           onChange={handleTagInputChange}
           onKeyDown={handleTagAdd}
           onFocus={() => setShowTagSuggestions(true)}
           placeholder="태그 입력 (Enter로 추가)"
           className="flex-1 p-1 border rounded"
         />
       </div>
       {showTagSuggestions && filteredTags.length > 0 && (
         <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
           {filteredTags.map(tag => (
             <li
               key={tag}
               className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
               onClick={() => handleTagSelect(tag)}
             >
               {tag}
             </li>
           ))}
         </ul>
       )}
     </div>
     <div className="flex flex-wrap gap-2 mb-2">
       {tags.map((tag, index) => (
         <span 
           key={index} 
           className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1"
         >
           {tag}
           <button
             type="button"
             onClick={() => handleTagRemove(tag)}
             className="ml-1 text-gray-500 hover:text-gray-700"
           >
             ×
           </button>
         </span>
       ))}
     </div>
     <Button 
       icon={Save} 
       label="저장" 
       className="bg-blue-500 text-white px-3.5 py-1.5 rounded  hover:bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 active:bg-blue-700 cursor-pointer"
     />
   </form>
 );
};