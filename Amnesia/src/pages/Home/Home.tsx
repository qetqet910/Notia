import React from 'react';
import { Plus, Search, Settings, Tag, Calendar, Menu } from 'lucide-react';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { NoteList } from '../../components/features/NoteList/NoteList';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between p-4">
          <Button icon={Menu} className="p-2 text-gray-600" />
          <h1 className="text-xl font-semibold text-gray-800">메모</h1>
          <Button icon={Settings} className="p-2 text-gray-600" />
        </div>
        
        {/* 검색바 */}
        <div className="px-4 pb-4">
          <Input placeholder="메모 검색하기" icon />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="pt-32 pb-24 px-4">
        {/* 태그 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          <button className="flex items-center bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm">
            전체
          </button>
          <button className="flex items-center bg-gray-100 text-gray-700 px-4 py-1 rounded-full text-sm">
            업무
          </button>
          <button className="flex items-center bg-gray-100 text-gray-700 px-4 py-1 rounded-full text-sm">
            개인
          </button>
        </div>

        <NoteList />
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-between items-center px-8 py-4">
          <Button 
            icon={Calendar}
            label="타임라인"
            className="flex flex-col items-center text-gray-600"
          />
          <Button className="bg-blue-600 text-white p-4 rounded-full shadow-lg -mt-8">
            <Plus className="w-6 h-6" />
          </Button>
          <Button 
            icon={Tag}
            label="태그"
            className="flex flex-col items-center text-gray-600"
          />
        </div>
      </nav>
    </div>
  );
};