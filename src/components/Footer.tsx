import React from 'react';
import { AmaLogo } from './ui/AmaLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#07090c] py-10 px-4 sm:px-6 lg:px-8 mt-auto text-center relative z-10">
      <div className="max-w-4xl mx-auto space-y-3.5">
        <div className="flex items-center justify-center gap-2.5">
          <AmaLogo size={28} className="shadow-md shadow-red-500/20" />
          <span className="font-extrabold text-white tracking-widest text-sm font-display">
            AMA MEDIA VAULT
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
          ASK MORPHEUS ALLIANCE
        </p>

        <p className="text-sm font-serif italic text-red-400/90 tracking-wide">
          “Do for Self. Then Do for Others.”
        </p>

        <div className="pt-3 border-t border-white/5 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-4">
          <span>Private Bulk Media Upload & Website JPG Optimization</span>
          <span className="hidden sm:inline">•</span>
          <span>Google Drive Cloud Architecture</span>
          <span className="hidden sm:inline">•</span>
          <span>© {new Date().getFullYear()} Ask Morpheus Alliance</span>
        </div>
      </div>
    </footer>
  );
};
