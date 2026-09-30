import React, { useState } from 'react';
import {
  SlidersHorizontal,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  FolderTree,
  ShieldCheck,
  GitBranch,
  Github,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { VaultSettings } from '../types/vault';
import { GoogleSignInButton } from './ui/GoogleSignInButton';
import { soundFIFO, MALE_JARVIS_VOICES } from '../services/soundEngine';
import {
  getStoredGitHubConfig,
  saveStoredGitHubConfig,
  verifyGitHubRepo,
} from '../services/githubService';

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
  const [githubConfig, setGithubConfig] = useState(getStoredGitHubConfig);
  const [githubTesting, setGithubTesting] = useState(false);
  const [githubMessage, setGithubMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  const update = (partial: Partial<VaultSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  const handleTestGitHub = async () => {
    if (!githubConfig.token || !githubConfig.repo) {
      setGithubMessage({
        text: 'Please enter both a GitHub Personal Access Token and repository (owner/repo).',
        isError: true,
      });
      return;
    }

    setGithubTesting(true);
    setGithubMessage(null);

    const result = await verifyGitHubRepo(githubConfig.token, githubConfig.repo);
    setGithubTesting(false);

    if (result.success) {
      setGithubMessage({
        text: result.message || 'Connected successfully to GitHub repository!',
        isError: false,
      });
    } else {
      setGithubMessage({
        text: result.message || 'Could not verify GitHub repository.',
        isError: true,
      });
    }
  };

  const handleUpdateGitHub = (updates: Partial<typeof githubConfig>) => {
    const updated = { ...githubConfig, ...updates };
    setGithubConfig(updated);
    saveStoredGitHubConfig(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-red-500" />
            <span>Vault Engine & Remote Storage</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global optimization rules, GitHub repository sync, Google Drive architecture, and batch processing engine.
          </p>
        </div>
      </div>

      {/* GitHub Repository Cloud Sync (Requested Alternative) */}
      <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">GitHub Repository Direct Sync</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                  Recommended Remote Storage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatically push optimized website JPGs to your GitHub repository under <code className="text-purple-300">media/[client]/</code> for instant CDN and remote access.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-400">Auto Push to GitHub</span>
            <input
              type="checkbox"
              checked={githubConfig.autoSync}
              onChange={(e) => handleUpdateGitHub({ autoSync: e.target.checked })}
              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 text-xs font-medium">
                GitHub Personal Access Token (PAT)
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=AMA+Media+Vault"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>Create Token (repo scope)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={githubConfig.token}
              onChange={(e) => handleUpdateGitHub({ token: e.target.value })}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-xs font-medium">
              Repository (owner/repo)
            </label>
            <input
              type="text"
              placeholder="username/my-media-vault"
              value={githubConfig.repo}
              onChange={(e) => handleUpdateGitHub({ repo: e.target.value })}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white font-mono outline-none"
            />
          </div>
        </div>

        {githubMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              githubMessage.isError
                ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            }`}
          >
            {githubMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{githubMessage.text}</span>
          </div>
        )}

        <div className="pt-1 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Files are saved to: <code className="text-slate-400 font-mono">media/jeannie/filename.jpg</code>
          </p>

          <button
            onClick={handleTestGitHub}
            disabled={githubTesting}
            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            {githubTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <GitBranch className="w-3.5 h-3.5" />
            )}
            <span>{githubTesting ? 'Verifying...' : 'Test GitHub Connection'}</span>
          </button>
        </div>
      </div>

      {/* Google Drive Status & Connection */}
      <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Drive Cloud Storage</h3>
              <p className="text-xs text-slate-400">
                Primary storage destination for bulk originals and converted website JPGs.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-400">Auto Sync to Drive</span>
            <input
              type="checkbox"
              checked={settings.autoSyncToDrive}
              onChange={(e) => update({ autoSyncToDrive: e.target.checked })}
              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-2">
          {accessToken ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090b0e] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white">Google Drive Active & Authenticated</p>
                  <p className="text-[11px] text-slate-400">{currentUserEmail || 'Session connected'}</p>
                </div>
              </div>
              <button
                onClick={onGoogleSignOut}
                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Disconnect Drive
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090b0e] border border-white/10 rounded-2xl p-4">
              <div>
                <p className="text-xs font-bold text-white">Google Drive Not Connected</p>
                <p className="text-[11px] text-slate-400">
                  Connect your Google account to automatically store media in /AMA Media Vault.
                </p>
              </div>
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                isSigningIn={isSigningIn}
                className="shrink-0"
              />
            </div>
          )}
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
              <h3 className="text-sm font-bold text-white">Jarvis Voice & Audio FIFO Engine</h3>
              <p className="text-xs text-slate-400">
                Custom voice greetings, upload completion chimes, and persistent MP3 caching.
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
              defaultValue={soundFIFO.getElevenLabsApiKey()}
              onChange={(e) => soundFIFO.setElevenLabsApiKey(e.target.value.trim())}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-red-500 rounded-xl p-2.5 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-xs font-medium">
              Jarvis Male Voice Preset
            </label>
            <select
              defaultValue={soundFIFO.getElevenLabsVoiceId()}
              onChange={(e) => {
                soundFIFO.setElevenLabsVoiceId(e.target.value);
                const customInput = document.getElementById('custom-voice-id') as HTMLInputElement;
                if (customInput) customInput.value = e.target.value;
              }}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-red-500 rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
            >
              {MALE_JARVIS_VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#11141c]">
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-400 block mb-1 text-xs font-medium">
              Active Voice ID
            </label>
            <input
              id="custom-voice-id"
              type="text"
              placeholder="Voice ID"
              defaultValue={soundFIFO.getElevenLabsVoiceId()}
              onChange={(e) => soundFIFO.setElevenLabsVoiceId(e.target.value.trim())}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-red-500 rounded-xl p-2.5 text-xs text-white font-mono outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => {
              soundFIFO.playWelcomeChime();
              soundFIFO.speak(
                'Good day. Jarvis system is active. Welcome to AMA Media Vault. Upload once, website ready.'
              );
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Jarvis Voice Output</span>
          </button>
        </div>
      </div>

      {/* Image Optimization Rules */}
      <div className="bg-[#11141c]/90 border border-white/10 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Conversion & Compression Rules</h3>
            <p className="text-xs text-slate-400">
              Deterministic standards for website performance and Google PageSpeed metrics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Max Dimension */}
          <div>
            <label className="text-slate-300 block mb-1.5 text-xs font-semibold">
              Max Dimension Edge: <span className="text-red-400">{settings.maxLongEdge}px</span>
            </label>
            <select
              value={settings.maxLongEdge}
              onChange={(e) => update({ maxLongEdge: parseInt(e.target.value, 10) })}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-red-500 rounded-xl p-3 text-xs text-white outline-none cursor-pointer"
            >
              <option value="1920">1920px (Desktop Full HD - Standard)</option>
              <option value="2560">2560px (2K Retina Display)</option>
              <option value="1280">1280px (Compact Mobile Web)</option>
              <option value="3840">3840px (4K Ultra High-Res)</option>
            </select>
          </div>

          {/* JPG Quality */}
          <div>
            <label className="text-slate-300 block mb-1.5 text-xs font-semibold">
              JPG Compression Quality: <span className="text-red-400">{Math.round(settings.jpgQuality * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.60"
              max="0.95"
              step="0.01"
              value={settings.jpgQuality}
              onChange={(e) => update({ jpgQuality: parseFloat(e.target.value) })}
              className="w-full accent-red-600 cursor-pointer h-2 bg-[#090b0e] rounded-lg mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>60% (High compression)</span>
              <span>82% (Ideal Balance)</span>
              <span>95% (Near Lossless)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
