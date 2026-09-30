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
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { ClientProfile, MediaFile, VaultSettings } from '../types/vault';
import { MediaGallery } from './MediaGallery';
import { ClientManager } from './ClientManager';
import { EngineSettings } from './EngineSettings';
import { formatBytes } from '../services/imageProcessor';
import { setupClientFolderStructure } from '../services/googleDriveService';

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
  const [isSyncingFolders, setIsSyncingFolders] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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

  const handleSyncDriveFolders = async () => {
    if (!accessToken) {
      onGoogleSignIn();
      return;
    }

    setIsSyncingFolders(true);
    setSyncStatus('Creating AMA Media Vault / Jeannie folders in your Google Drive...');

    try {
      for (const c of clients) {
        await setupClientFolderStructure(accessToken, c.name);
      }
      setSyncStatus('Success! Folders created in your Google Drive under "AMA Media Vault".');
    } catch (e: any) {
      setSyncStatus(`Sync note: ${e.message || 'Could not verify folders'}`);
    } finally {
      setIsSyncingFolders(false);
    }
  };

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

      {/* Google Drive Direct Access Banner & One-Click Folder Creator */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#11141c] to-[#11141c] border border-blue-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Google Drive Remote Folder Sync</h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
              /AMA Media Vault/Jeannie/Website JPG
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {accessToken
              ? `Connected as ${currentUserEmail || 'your Google account'}. Click "Create & Sync Drive Folders" to establish the folders in your Google Drive right now.`
              : 'Sign in with your Google account to automatically create and sync the client folders into your Google Drive.'}
          </p>
          {syncStatus && (
            <p className="text-xs text-emerald-400 font-medium pt-1 animate-pulse">
              {syncStatus}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSyncDriveFolders}
            disabled={isSyncingFolders}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            {isSyncingFolders ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FolderPlus className="w-3.5 h-3.5" />
            )}
            <span>{isSyncingFolders ? 'Creating Folders...' : 'Create & Sync Drive Folders'}</span>
          </button>

          <a
            href="https://drive.google.com/drive/u/0/my-drive"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 bg-[#11141c] p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vault Gallery</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Private Clients ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Vault Engine</span>
          </button>
        </div>

        {activeTab === 'gallery' && (
          <button
            onClick={() => onOpenClientUpload(clients[0])}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>New Upload</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'gallery' && (
        <MediaGallery
          mediaFiles={mediaFiles}
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClientFilter={setSelectedClientId}
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
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onOpenClientUpload={onOpenClientUpload}
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
