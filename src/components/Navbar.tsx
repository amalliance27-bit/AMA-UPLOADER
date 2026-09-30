import React from 'react';
import {
  Flame,
  UploadCloud,
  LayoutDashboard,
  HardDrive,
  LogOut,
} from 'lucide-react';
import { GoogleSignInButton } from './ui/GoogleSignInButton';

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
    <header className="sticky top-0 z-40 w-full bg-[#090b0e]/90 backdrop-blur-xl border-b border-white/10 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Logo (Click to return to 3D Splash Hub) */}
        <div
          onClick={() => onSwitchView('splash')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          title="AMA MEDIA VAULT Home"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-wide font-display whitespace-nowrap">
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

        {/* Center: Clean Dual Switcher (Upload & Vault) - No sparkle icon */}
        <div className="flex items-center bg-[#11141c] p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-white/10 text-xs font-medium">
          {/* Client Upload Button */}
          <button
            onClick={() => onSwitchView('client')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'client'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-md shadow-red-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Client Upload Portal"
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">Upload</span>
          </button>

          {/* Admin Vault Button */}
          <button
            onClick={() => onSwitchView('admin')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
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

        {/* Right: Google Drive Status & Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {accessToken ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#11141c] border border-white/10 rounded-xl px-2 sm:px-3 py-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="hidden md:block text-left">
                <span className="text-[9px] text-slate-500 block uppercase font-mono leading-none">
                  Drive Connected
                </span>
                <span className="text-[11px] text-white font-medium truncate max-w-[120px] block">
                  {currentUserEmail || 'Active'}
                </span>
              </div>
              <button
                onClick={onGoogleSignOut}
                title="Disconnect Google Drive"
                className="p-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-[#161a23] hover:bg-[#1f2432] border border-white/10 hover:border-white/20 transition cursor-pointer"
              title="Connect Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="hidden sm:inline">{isSigningIn ? 'Connecting...' : 'Drive'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
