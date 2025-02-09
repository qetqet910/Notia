import React, { useState, useEffect } from 'react';
import { Tag, Save } from 'lucide-react';
import { Button } from '../../common/Button/Button';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { useTags } from '../../../hooks/useTags';

interface EditorProps {
  onSave: (note: { title: string; content: string; tags: string[] }) => void;
}

export const Editor: React.FC<EditorProps> = ({ onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { filteredTags, filterTags } = useTags();
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // 자동 저장 적용
  useAutoSave(
    { title, content, tags },
    { onSave, debounceMs: 1000 }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, content, tags });
    // 저장 후 초기화
    setTitle('');
    setContent('');
    setTags([]);
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setTags([...tags, tagInput.trim()]);
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
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
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
      <div className="flex gap-2 mb-2">
        {tags.map((tag, index) => (
          <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
            {tag}
          </span>
        ))}
      </div>
      <Button 
        icon={Save} 
        label="저장" 
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
      />
    </form>
  );
};
