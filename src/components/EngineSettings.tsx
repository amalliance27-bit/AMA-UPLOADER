import React from 'react';
import {
  Sliders,
  SlidersHorizontal,
  HardDrive,
  FileCheck,
  Cpu,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  FolderTree,
  ShieldCheck,
} from 'lucide-react';
import { VaultSettings } from '../types/vault';
import { GoogleSignInButton } from './ui/GoogleSignInButton';

interface EngineSettingsProps {
  settings: VaultSettings;
  onUpdateSettings: (newSettings: VaultSettings) => void;
  accessToken: string | null;
  currentUserEmail?: string | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isSigningIn?: boolean;
}

export const EngineSettings: React.FC<EngineSettingsProps> = ({
  settings,
  onUpdateSettings,
  accessToken,
  currentUserEmail,
  onGoogleSignIn,
  onGoogleSignOut,
  isSigningIn = false,
}) => {
  const update = (partial: Partial<VaultSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-red-500" />
            <span>Vault Engine Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global optimization rules, Google Drive architecture, and batch processing engine.
          </p>
        </div>
      </div>

      {/* Google Drive Status & Connection */}
      <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Drive Cloud Storage</h3>
              <p className="text-xs text-slate-400">
                Primary storage destination for bulk originals and converted website JPGs.
              </p>
            </div>
          </div>

          <div>
            {accessToken ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                <span>Authorization Ready</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#090b0e] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs space-y-1">
            <p className="text-slate-300">
              {accessToken ? (
                <>
                  Authenticated as:{' '}
                  <strong className="text-white">{currentUserEmail || 'Google User'}</strong>
                </>
              ) : (
                'Sign in with Google to sync client folders and enable live Google Drive uploads.'
              )}
            </p>
            <p className="text-slate-500 text-[11px]">
              Root storage folder:{' '}
              <span className="font-mono text-slate-400">/AMA Media Vault</span>
            </p>
          </div>

          <div>
            {accessToken ? (
              <button
                onClick={onGoogleSignOut}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition cursor-pointer"
              >
                Disconnect Account
              </button>
            ) : (
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                isLoading={isSigningIn}
                text="Connect Google Drive"
              />
            )}
          </div>
        </div>

        {/* Drive Architecture Breakdown */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-red-500" />
            <span>Automated Folder Hierarchy</span>
          </h4>
          <div className="bg-[#090b0e] rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1">
            <p className="text-red-400 font-semibold">AMA Media Vault (Root)</p>
            <p className="pl-4 text-slate-400">└── Jeannie / [Client Name]</p>
            <p className="pl-8 text-slate-300">├── Original Uploads (Untouched source files)</p>
            <p className="pl-8 text-emerald-400 font-medium">├── Website JPG (Resized & compressed JPGs)</p>
            <p className="pl-8 text-slate-400">└── Archive (Historical / replaced files)</p>
          </div>
        </div>
      </div>

      {/* Conversion & Optimization Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* JPG Quality */}
        <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">JPG Quality</h3>
          </div>
          <p className="text-xs text-slate-400">
            Balancing visual fidelity and file compression for lightning-fast website load times.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 0.7, label: '70%', sub: 'Smaller File' },
              { val: 0.82, label: '82%', sub: 'Recommended' },
              { val: 0.9, label: '90%', sub: 'High Quality' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => update({ jpgQuality: opt.val })}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  settings.jpgQuality === opt.val
                    ? 'border-red-500 bg-red-500/10 text-white shadow-lg shadow-red-500/10'
                    : 'border-white/10 bg-[#090b0e] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-base font-bold block">{opt.label}</span>
                <span className="text-[10px] text-slate-400 block">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Max Long Edge */}
        <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">Maximum Long Edge</h3>
          </div>
          <p className="text-xs text-slate-400">
            Proportional resize applied to the longest edge. Preserves portrait and landscape aspect ratios without distortion.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 1280, label: '1280 px' },
              { val: 1600, label: '1600 px' },
              { val: 1920, label: '1920 px (Def)' },
              { val: 2560, label: '2560 px' },
              { val: 0, label: 'Original Size' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => update({ maxLongEdge: opt.val })}
                className={`py-2.5 px-2 rounded-2xl border text-center transition cursor-pointer text-xs font-semibold ${
                  settings.maxLongEdge === opt.val
                    ? 'border-red-500 bg-red-500/10 text-white shadow-lg shadow-red-500/10'
                    : 'border-white/10 bg-[#090b0e] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Keep Original Uploads */}
        <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-white">Keep Original Uploads</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                settings.keepOriginals
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              {settings.keepOriginals ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            When ON, untouched raw source files (HEIC, RAW, high-res PNG) are retained in the{' '}
            <strong className="text-slate-200">Original Uploads</strong> folder.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => update({ keepOriginals: true })}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                settings.keepOriginals
                  ? 'border-red-500 bg-red-500/10 text-white font-semibold'
                  : 'border-white/10 bg-[#090b0e] text-slate-400'
              }`}
            >
              ON (Recommended)
            </button>
            <button
              onClick={() => update({ keepOriginals: false })}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                !settings.keepOriginals
                  ? 'border-red-500 bg-red-500/10 text-white font-semibold'
                  : 'border-white/10 bg-[#090b0e] text-slate-400'
              }`}
            >
              OFF (JPG Only)
            </button>
          </div>
        </div>

        {/* Duplicate Behavior */}
        <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">Duplicate File Policy</h3>
          </div>
          <p className="text-xs text-slate-400">
            Action to take when a file with identical naming already exists in the client folder.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'keep_both', label: 'KEEP BOTH' },
              { val: 'replace', label: 'REPLACE' },
              { val: 'skip', label: 'SKIP' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => update({ duplicateBehavior: opt.val as any })}
                className={`py-2.5 px-2 rounded-xl border text-center text-xs transition cursor-pointer ${
                  settings.duplicateBehavior === opt.val
                    ? 'border-red-500 bg-red-500/10 text-white font-semibold'
                    : 'border-white/10 bg-[#090b0e] text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ElevenLabs Sound & Voice FIFO Configuration */}
      <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ElevenLabs Voice & Audio FIFO Engine</h3>
              <p className="text-xs text-slate-400">
                Custom voice greetings, upload completion chimes, and sequential audio queue.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-slate-400 block mb-1 text-xs font-medium">
              ElevenLabs API Key
            </label>
            <input
              type="password"
              placeholder="Paste xi-api-key here"
              defaultValue={localStorage.getItem('ama_elevenlabs_api_key') || ''}
              onChange={(e) => localStorage.setItem('ama_elevenlabs_api_key', e.target.value.trim())}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-red-500 rounded-xl p-2.5 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-xs font-medium">
              Voice ID (e.g. 21m00Tcm4TlvDq8ikWAM)
            </label>
            <input
              type="text"
              placeholder="Voice ID"
              defaultValue={localStorage.getItem('ama_elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM'}
              onChange={(e) => localStorage.setItem('ama_elevenlabs_voice_id', e.target.value.trim())}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-red-500 rounded-xl p-2.5 text-xs text-white font-mono outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
