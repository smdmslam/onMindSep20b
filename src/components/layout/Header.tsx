import React from 'react';
import { LogOut, HelpCircle, Settings } from 'lucide-react';
import type { AuthUser } from '../../lib/firebase-client';

type HeaderProps = {
  user: AuthUser | null;
  onSignOut: () => Promise<void>;
  onStartTour: () => void;
  onOpenSettings: () => void;
  onReloadApp: () => void;
};

export function Header({
  user,
  onSignOut,
  onStartTour,
  onOpenSettings,
  onReloadApp
}: HeaderProps) {
  if (!user) return null;

  return (
    <header className="bg-[#1a1a1a]/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={onReloadApp}
            className="flex items-start gap-2 app-logo hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#2d9edb] to-[#2d9edb]/70 rounded-lg flex items-center justify-center">
              OM
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-semibold text-[#2d9edb] leading-none">
                On Mind
              </h1>
              <span className="text-xs text-white/40">v. 1.09.25</span>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              <button 
                onClick={onStartTour}
                className="p-2 text-[#2d9edb] hover:bg-white/10 rounded-lg transition-colors"
                title="Take Tour (Click here anytime to learn about features)"
              >
                <HelpCircle size={20} />
              </button>
              <button 
                onClick={onOpenSettings}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors settings-button"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
            <button 
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors ml-1"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}