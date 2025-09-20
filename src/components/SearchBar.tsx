import React from 'react';
import { Search } from 'lucide-react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative search-input">
      <Search 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" 
        size={20} 
      />
      <input
        type="text"
        placeholder="Search knowledge base..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a]/50 border border-white/10 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
      />
    </div>
  );
}