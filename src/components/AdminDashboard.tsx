import React, { useState } from 'react';
import {
  Layers,
  Users,
  SlidersHorizontal,
  Upload,
  HardDrive,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Plus,
  Shield,
  FileCheck,
  TrendingDown,
} from 'lucide-react';
import { ClientProfile, MediaFile, VaultSettings } from '../types/vault';
import { MediaGallery } from './MediaGallery';
import { ClientManager } from './ClientManager';
import { EngineSettings } from './EngineSettings';
import { GoogleSignInButton } from './ui/GoogleSignInButton';
import { formatBytes } from '../services/imageProcessor';

interface AdminDashboardProps {
  clients: ClientProfile[];
  mediaFiles: MediaFile[];
  settings: VaultSettings;
  accessToken: string | null;
  currentUserEmail?: string | null;
  onUpdateSettings: (newSettings: VaultSettings) => void;
  onAddClient: (newClient: Omit<ClientProfile, 'id' | 'createdAt' | 'totalUploads' | 'websiteReadyCount'>) => void;
  onUpdateClient: (updated: ClientProfile) => void;
  onDeleteClient: (clientId: string) => void;
  onDeleteFiles: (fileIds: string[]) => void;
  onMoveFiles: (fileIds: string[], targetFolder: 'Website JPG' | 'Original Uploads' | 'Archive') => void;
  onOpenClientUpload: (client: ClientProfile) => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isSigningIn?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  clients,
  mediaFiles,
  settings,
  accessToken,
  currentUserEmail,
  onUpdateSettings,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onDeleteFiles,
  onMoveFiles,
  onOpenClientUpload,
  onGoogleSignIn,
  onGoogleSignOut,
  isSigningIn = false,
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'clients' | 'settings'>('gallery');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  // Stats calculation
  const totalUploads = mediaFiles.length;
  const totalWebsiteJpgs = mediaFiles.filter((f) => f.driveFolder === 'Website JPG').length;
  const totalOrigBytes = mediaFiles.reduce((sum, f) => sum + (f.originalSize || 0), 0);
  const totalConvBytes = mediaFiles.reduce(
    (sum, f) => sum + (f.convertedSize || f.originalSize || 0),
    0
  );
  const savedBytes = Math.max(0, totalOrigBytes - totalConvBytes);
  const avgReduction =
    totalOrigBytes > 0 ? Math.round((savedBytes / totalOrigBytes) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Executive Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Processed */}
        <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Total Processed
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-display">
            {totalUploads}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalWebsiteJpgs} website ready JPGs
          </span>
        </div>

        {/* Active Clients */}
        <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Active Clients
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-display">
            {clients.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Jeannie + {Math.max(0, clients.length - 1)} others
          </span>
        </div>

        {/* Bandwidth & Storage Saved */}
        <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Bandwidth Saved
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 font-display">
            {avgReduction}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {formatBytes(savedBytes)} bandwidth saved
          </span>
        </div>

        {/* Google Drive Status */}
        <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Google Drive
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                accessToken
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-300'
              }`}
            >
              <HardDrive className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            {accessToken ? (
              <div>
                <p className="text-sm font-bold text-white truncate">Connected</p>
                <span className="text-[11px] text-emerald-400 truncate block">
                  {currentUserEmail || 'Active session'}
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-amber-300">Ready to Connect</p>
                <button
                  onClick={onGoogleSignIn}
                  disabled={isSigningIn}
                  className="text-[11px] text-red-400 hover:text-red-300 underline font-medium cursor-pointer"
                >
                  Sign in with Google
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 bg-[#11141c] p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'bg-white/15 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Media Gallery ({mediaFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-white/15 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Client Portals ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-white/15 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Vault Engine</span>
          </button>
        </div>

        {/* Quick Launch Jeannie Upload Page */}
        {clients.length > 0 && (
          <button
            onClick={() => onOpenClientUpload(clients[0])}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold shadow-lg shadow-red-500/20 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Test Client Upload ({clients[0].name})</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'gallery' && (
        <MediaGallery
          files={mediaFiles}
          clients={clients}
          selectedClientId={selectedClientId}
          onDeleteFiles={onDeleteFiles}
          onMoveFiles={onMoveFiles}
          accessToken={accessToken}
        />
      )}

      {activeTab === 'clients' && (
        <ClientManager
          clients={clients}
          onSelectClient={(id) => {
            setSelectedClientId(id);
            setActiveTab('gallery');
          }}
          onOpenClientUpload={onOpenClientUpload}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
        />
      )}

      {activeTab === 'settings' && (
        <EngineSettings
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          accessToken={accessToken}
          currentUserEmail={currentUserEmail}
          onGoogleSignIn={onGoogleSignIn}
          onGoogleSignOut={onGoogleSignOut}
          isSigningIn={isSigningIn}
        />
      )}
    </div>
  );
};
