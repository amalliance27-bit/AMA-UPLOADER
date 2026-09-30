import React from 'react';
import {
  UploadCloud,
  LayoutDashboard,
  HardDrive,
  LogOut,
} from 'lucide-react';
import { AmaLogo } from './ui/AmaLogo';

export type AppView = 'splash' | 'client' | 'admin';

interface NavbarProps {
  currentView: AppView;
  onSwitchView: (view: AppView) => void;
  accessToken: string | null;
  currentUserEmail?: string | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isSigningIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSwitchView,
  accessToken,
  currentUserEmail,
  onGoogleSignIn,
  onGoogleSignOut,
  isSigningIn = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090b0e]/95 backdrop-blur-xl border-b border-white/10 select-none">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 overflow-hidden">
        
        {/* Left: Brand Logo */}
        <div
          onClick={() => onSwitchView('splash')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          title="AMA MEDIA VAULT Home"
        >
          <AmaLogo size={32} animate />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-white text-xs sm:text-base tracking-wide font-display whitespace-nowrap">
                AMA VAULT
              </span>
              <span className="px-1 py-0.2 text-[8px] sm:text-[9px] font-bold uppercase rounded bg-red-500/20 text-red-400 border border-red-500/30">
                PRO
              </span>
            </div>
            <p className="text-[9px] text-slate-400 tracking-tight hidden sm:block">
              Powered by <span className="text-slate-300 font-medium">Ask Morpheus Alliance</span>
            </p>
          </div>
        </div>

        {/* Center: Clean Switcher */}
        <div className="flex items-center bg-[#11141c] p-0.5 rounded-xl border border-white/10 text-xs font-medium shrink-0">
          <button
            onClick={() => onSwitchView('client')}
            className={`px-2.5 sm:px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'client'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-md shadow-red-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Client Upload Portal"
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">Upload</span>
          </button>

          <button
            onClick={() => onSwitchView('admin')}
            className={`px-2.5 sm:px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'admin'
                ? 'bg-white/15 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Admin Vault Gallery"
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">Vault</span>
          </button>
        </div>

        {/* Right: Drive Status - Compact & Non-Overflowing */}
        <div className="flex items-center gap-1 shrink-0">
          {accessToken ? (
            <div className="flex items-center gap-1.5 bg-[#11141c] border border-white/10 rounded-xl px-2 sm:px-2.5 py-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="hidden md:block text-left">
                <span className="text-[9px] text-slate-500 block uppercase font-mono leading-none">
                  Drive
                </span>
                <span className="text-[10px] text-white font-medium truncate max-w-[100px] block">
                  {currentUserEmail || 'Active'}
                </span>
              </div>
              <button
                onClick={onGoogleSignOut}
                title="Disconnect Google Drive"
                className="p-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 bg-[#161a23] hover:bg-[#1f2432] border border-white/10 transition cursor-pointer shrink-0"
              title="Connect Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="hidden sm:inline">{isSigningIn ? '...' : 'Drive'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
