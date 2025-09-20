import React from 'react';
import { LayoutGrid, LayoutList, AlignJustify } from 'lucide-react';

type ViewMode = 'card' | 'row' | 'line';

type ViewModeToggleProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2 ml-auto view-toggle">
      <button
        onClick={() => onViewModeChange('card')}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'card'
            ? 'bg-[#2d9edb] text-white'
            : 'text-white/60 hover:bg-white/10'
        }`}
        title="Card View"
      >
        <LayoutGrid size={20} />
      </button>
      <button
        onClick={() => onViewModeChange('row')}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'row'
            ? 'bg-[#2d9edb] text-white'
            : 'text-white/60 hover:bg-white/10'
        }`}
        title="Row View"
      >
        <LayoutList size={20} />
      </button>
      <button
        onClick={() => onViewModeChange('line')}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'line'
            ? 'bg-[#2d9edb] text-white'
            : 'text-white/60 hover:bg-white/10'
        }`}
        title="Line View"
      >
        <AlignJustify size={20} />
      </button>
    </div>
  );
}