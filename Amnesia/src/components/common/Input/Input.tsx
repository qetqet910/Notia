import * as React from 'react';
import { Search } from 'lucide-react';

interface InputProps {
  placeholder?: string;
  icon?: boolean;
}

export const Input: React.FC<InputProps> = ({ placeholder, icon }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-2">
      {icon && <Search className="w-5 h-5 text-gray-500 mr-2" />}
      <input 
        type="text" 
        placeholder={placeholder} 
        className="bg-transparent w-full outline-none text-gray-700"
      />
    </div>
  );
};
