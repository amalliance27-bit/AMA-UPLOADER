import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  FolderCheck,
  Smartphone,
  Layers,
  HardDriveDownload,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClientProfile, MediaFile, VaultSettings } from '../types/vault';
import { processImageFile, formatBytes } from '../services/imageProcessor';
import { uploadBlobToDrive, setupClientFolderStructure } from '../services/googleDriveService';

interface ClientUploadPortalProps {
  client: ClientProfile;
  clients?: ClientProfile[];
  onSelectClient?: (client: ClientProfile) => void;
  settings: VaultSettings;
  accessToken: string | null;
  onFilesProcessed: (files: MediaFile[]) => void;
  onSwitchToAdmin?: () => void;
}

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  originalName: string;
  cleanName: string;
  originalSize: number;
  convertedSize?: number;
  width?: number;
  height?: number;
  status:
    | 'waiting'
    | 'uploading'
    | 'converting'
    | 'resizing'
    | 'compressing'
    | 'saving_drive'
    | 'complete'
    | 'failed';
  progress: number;
  stageText: string;
  errorMessage?: string;
  convertedBlob?: Blob;
  savingsPercent?: number;
  driveJpgFileId?: string;
  driveOriginalFileId?: string;
}

export const ClientUploadPortal: React.FC<ClientUploadPortalProps> = ({
  client,
  clients,
  onSelectClient,
  settings,
  accessToken,
  onFilesProcessed,
  onSwitchToAdmin,
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pinEntered, setPinEntered] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(!client.accessCode);
  const [pinError, setPinError] = useState(false);
  const [isCompletedView, setIsCompletedView] = useState(false);
  const [completedStats, setCompletedStats] = useState({
    totalCount: 0,
    successCount: 0,
    origBytes: 0,
    convBytes: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef(false);

  // Re-check pin lock if client changes
  useEffect(() => {
    setPinUnlocked(!client.accessCode);
    setPinEntered('');
    setPinError(false);
  }, [client]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client.accessCode && pinEntered.trim() === client.accessCode.trim()) {
      setPinUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Add files to queue
  const handleAddFiles = (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    const validExtensions = [
      'jpg',
      'jpeg',
      'png',
      'webp',
      'heic',
      'heif',
      'avif',
      'tiff',
      'tif',
      'bmp',
    ];

    const newItems: QueueItem[] = [];

    for (const file of rawFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isAccepted =
        file.type.startsWith('image/') ||
        validExtensions.includes(ext) ||
        ext === 'heic' ||
        ext === 'heif';

      if (!isAccepted) {
        continue;
      }

      // Quick local preview (fallback to generic if HEIC/TIFF before decoding)
      let initialPreview = '';
      try {
        if (!ext.includes('heic') && !ext.includes('tif')) {
          initialPreview = URL.createObjectURL(file);
        }
      } catch {}

      newItems.push({
        id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: initialPreview,
        originalName: file.name,
        cleanName: file.name,
        originalSize: file.size,
        status: 'waiting',
        progress: 0,
        stageText: 'Waiting in queue',
      });
    }

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
      setIsCompletedView(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Process queue with concurrency
  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    isCancelledRef.current = false;

    // Optional: Pre-fetch or verify Drive folders if accessToken is present
    let driveFolders: any = null;
    if (accessToken && settings.autoSyncToDrive) {
      try {
        driveFolders = await setupClientFolderStructure(accessToken, client.name);
      } catch (err) {
        console.warn('Could not auto-setup Drive folders; will retry during upload:', err);
      }
    }

    const concurrencyLimit = settings.concurrency || 4;
    const existingNamesSet = new Set<string>();

    const itemsToProcess = queue.filter(
      (item) => item.status === 'waiting' || item.status === 'failed'
    );

    let completedList: MediaFile[] = [];

    // Helper to process a single item
    const processSingleItem = async (item: QueueItem) => {
      if (isCancelledRef.current) return;

      const updateItem = (updates: Partial<QueueItem>) => {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, ...updates } : q))
        );
      };

      try {
        // 1. Converting to JPG & Resizing
        updateItem({
          status: 'converting',
          stageText: 'Converting to Website JPG...',
          progress: 25,
        });

        const result = await processImageFile(
          item.file,
          settings,
          client.slug || client.name,
          existingNamesSet,
          (stage) => {
            updateItem({
              stageText: `${stage}...`,
              progress: 40,
            });
          }
        );

        existingNamesSet.add(result.cleanName);

        updateItem({
          status: 'resizing',
          previewUrl: result.previewUrl,
          cleanName: result.cleanName,
          convertedBlob: result.convertedBlob,
          convertedSize: result.convertedSize,
          width: result.width,
          height: result.height,
          savingsPercent: result.savingsPercent,
          progress: 60,
          stageText: 'Website JPG created & compressed',
        });

        let driveJpgId: string | undefined;
        let driveOrigId: string | undefined;

        // 2. Upload to Google Drive if authorized
        if (accessToken && settings.autoSyncToDrive) {
          updateItem({
            status: 'saving_drive',
            stageText: 'Saving to Google Drive...',
            progress: 80,
          });

          if (!driveFolders) {
            driveFolders = await setupClientFolderStructure(accessToken, client.name);
          }

          // Upload Website JPG
          const jpgUpload = await uploadBlobToDrive(accessToken, {
            name: result.cleanName,
            mimeType: 'image/jpeg',
            blob: result.convertedBlob,
            parentId: driveFolders.websiteJpgFolderId,
          });
          driveJpgId = jpgUpload.id;

          // Optionally Upload Original File
          if (settings.keepOriginals) {
            const origUpload = await uploadBlobToDrive(accessToken, {
              name: item.originalName,
              mimeType: item.file.type || 'application/octet-stream',
              blob: item.file,
              parentId: driveFolders.originalsFolderId,
            });
            driveOrigId = origUpload.id;
          }
        }

        // 3. Mark Completed
        updateItem({
          status: 'complete',
          stageText: 'Complete',
          progress: 100,
          driveJpgFileId: driveJpgId,
          driveOriginalFileId: driveOrigId,
        });

        const finishedMedia: MediaFile = {
          id: item.id,
          clientId: client.id,
          clientName: client.name,
          originalName: item.originalName,
          cleanName: result.cleanName,
          originalSize: item.originalSize,
          convertedSize: result.convertedSize,
          originalType: item.file.type || 'image/jpeg',
          width: result.width,
          height: result.height,
          status: 'complete',
          progress: 100,
          previewUrl: result.previewUrl,
          convertedBlob: result.convertedBlob,
          driveFolder: 'Website JPG',
          createdAt: new Date().toISOString(),
          savingsPercent: result.savingsPercent,
          driveJpgFileId: driveJpgId,
          driveOriginalFileId: driveOrigId,
        };

        completedList.push(finishedMedia);
      } catch (err: any) {
        console.error('Failed processing item:', item.originalName, err);
        updateItem({
          status: 'failed',
          stageText: 'Processing failed',
          errorMessage: err.message || 'Could not process image',
          progress: 0,
        });
      }
    };

    // Process with pool
    let currentIndex = 0;
    const pool = new Set<Promise<void>>();

    while (currentIndex < itemsToProcess.length && !isCancelledRef.current) {
      while (pool.size < concurrencyLimit && currentIndex < itemsToProcess.length) {
        const item = itemsToProcess[currentIndex++];
        const promise = processSingleItem(item).then(() => {
          pool.delete(promise);
        });
        pool.add(promise);
      }

      if (pool.size > 0) {
        await Promise.race(pool);
      }
    }

    await Promise.all(pool);

    if (completedList.length > 0) {
      onFilesProcessed(completedList);
    }

    setIsProcessing(false);

    // Calculate final stats
    setQueue((current) => {
      const completed = current.filter((q) => q.status === 'complete');
      if (completed.length > 0) {
        const origSum = completed.reduce((acc, c) => acc + c.originalSize, 0);
        const convSum = completed.reduce((acc, c) => acc + (c.convertedSize || 0), 0);
        setCompletedStats({
          totalCount: current.length,
          successCount: completed.length,
          origBytes: origSum,
          convBytes: convSum,
        });
        setIsCompletedView(true);

        try {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#e63946', '#ffffff', '#457b9d'],
          });
        } catch {}
      }
      return current;
    });
  }, [queue, isProcessing, accessToken, client, settings, onFilesProcessed]);

  const handleRetryFailed = () => {
    setQueue((prev) =>
      prev.map((item) =>
        item.status === 'failed'
          ? { ...item, status: 'waiting', progress: 0, stageText: 'Waiting to retry' }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'complete'));
  };

  const totalFiles = queue.length;
  const completedFiles = queue.filter((q) => q.status === 'complete').length;
  const failedFiles = queue.filter((q) => q.status === 'failed').length;
  const pendingFiles = queue.filter(
    (q) => q.status === 'waiting' || q.status === 'converting' || q.status === 'saving_drive'
  ).length;

  const overallProgress =
    totalFiles > 0
      ? Math.round(
          queue.reduce((sum, item) => sum + item.progress, 0) / totalFiles
        )
      : 0;

  // PIN Protection Gate
  if (!pinUnlocked) {
    return (
      <div className="w-full max-w-md mx-auto py-20 px-4">
        <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-6 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Private Client Vault</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter the access PIN provided for <span className="text-white font-medium">{client.name}</span>
          </p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={8}
              value={pinEntered}
              onChange={(e) => {
                setPinEntered(e.target.value);
                setPinError(false);
              }}
              placeholder="Enter PIN Code"
              className="w-full text-center tracking-[0.3em] font-mono text-xl py-3 px-4 bg-[#090b0e] border border-white/15 focus:border-red-500 rounded-xl text-white outline-none transition"
              autoFocus
            />
            {pinError && (
              <p className="text-red-400 text-xs font-medium animate-shake">
                Incorrect PIN. Please check your credentials or contact administrator.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition shadow-lg shadow-red-500/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Unlock Upload Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Client Status Paused or Expired
  if (client.status === 'paused' || client.status === 'expired') {
    return (
      <div className="w-full max-w-lg mx-auto py-20 px-4 text-center">
        <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Upload Link {client.status === 'paused' ? 'Paused' : 'Expired'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            This private upload link for <span className="text-white font-medium">{client.name}</span> is currently {client.status}. Please reach out to Ask Morpheus Alliance to reactivate.
          </p>
          {onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition cursor-pointer"
            >
              Open Admin Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Completed Success Screen
  if (isCompletedView && queue.length > 0 && pendingFiles === 0 && failedFiles === 0) {
    const totalSavedMb = (
      Math.max(0, completedStats.origBytes - completedStats.convBytes) /
      (1024 * 1024)
    ).toFixed(1);
    const overallReduction =
      completedStats.origBytes > 0
        ? Math.round(
            ((completedStats.origBytes - completedStats.convBytes) /
              completedStats.origBytes) *
              100
          )
        : 0;

    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#11141c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-6 shadow-xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 font-display">
            UPLOAD COMPLETE
          </h2>
          <p className="text-slate-300 text-base max-w-md mx-auto mb-8 font-light">
            Your photographs have been received and prepared. All files are converted to high-grade website JPGs and organized.
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-[#090b0e]/70 border border-white/5 rounded-2xl p-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-white block">
                {completedStats.successCount}
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 mt-1 block">
                Photos Uploaded
              </span>
            </div>
            <div className="bg-[#090b0e]/70 border border-white/5 rounded-2xl p-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 block">
                {completedStats.successCount}
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 mt-1 block">
                Website JPGs
              </span>
            </div>
            <div className="bg-[#090b0e]/70 border border-white/5 rounded-2xl p-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-400 block">
                {overallReduction}%
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 mt-1 block">
                Storage Saved
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setQueue([]);
                setIsCompletedView(false);
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/20 transition-all cursor-pointer active:scale-95"
            >
              UPLOAD MORE
            </button>
            {onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-slate-200 font-medium rounded-2xl transition-all cursor-pointer"
              >
                View in Vault Gallery
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider uppercase">
          <Flame className="w-3.5 h-3.5 text-red-500" />
          <span>AMA Media Vault</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-display">
          UPLOAD ONCE. WEBSITE READY.
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
          Send your media. We’ll handle the rest.
        </p>

        {/* Client & Destination Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {clients && clients.length > 1 && onSelectClient ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131722] border border-white/10 text-xs text-slate-300">
              <span className="text-slate-500 uppercase font-semibold text-[10px] tracking-wider">Client:</span>
              <select
                value={client.id}
                onChange={(e) => {
                  const target = clients.find((c) => c.id === e.target.value);
                  if (target) onSelectClient(target);
                }}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-1"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#11141c] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#131722] border border-white/10 text-xs text-slate-300">
              <span className="text-slate-500 uppercase font-semibold text-[10px] tracking-wider">Client:</span>
              <span className="font-semibold text-white">{client.name}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#131722] border border-white/10 text-xs text-slate-300">
            <span className="text-slate-500 uppercase font-semibold text-[10px] tracking-wider">Destination:</span>
            <span className="font-semibold text-red-400">Website Images</span>
          </div>
          {accessToken ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <FolderCheck className="w-3.5 h-3.5" />
              <span>Google Drive Connected</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Processing Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
          isDragging
            ? 'border-red-500 bg-red-500/[0.07] scale-[1.01] shadow-2xl shadow-red-500/10'
            : 'border-white/15 bg-[#11141c]/70 hover:border-red-500/50 hover:bg-[#151924]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif,.avif,.tiff,.tif,.bmp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleAddFiles(e.target.files);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-[#1c2230] to-[#10141d] border border-white/10 flex items-center justify-center text-red-400 group-hover:scale-110 group-hover:text-red-300 transition-all duration-300 shadow-xl">
            <Upload className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              DROP YOUR PHOTOS HERE
            </h3>
            <p className="text-sm text-slate-400">or</p>
          </div>

          <button
            type="button"
            className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 group-hover:from-red-500 group-hover:to-red-600 text-white font-semibold rounded-2xl shadow-xl shadow-red-500/25 active:scale-95 transition cursor-pointer"
          >
            CHOOSE PHOTOS
          </button>

          <p className="text-xs text-slate-400 pt-2 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>Select 10, 50, 100, 200+ photos. Supports HEIC (iPhone), PNG, JPG, WEBP, AVIF.</span>
          </p>
        </div>
      </div>

      {/* Active Queue & Controls */}
      {queue.length > 0 && (
        <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header Summary & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">Upload Queue</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-mono text-slate-300">
                  {completedFiles} / {totalFiles} Complete
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: Website JPG (Max {settings.maxLongEdge || 'Original'}px, {Math.round(settings.jpgQuality * 100)}% Quality)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {failedFiles > 0 && (
                <button
                  onClick={handleRetryFailed}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry {failedFiles} Failed</span>
                </button>
              )}

              {completedFiles > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
                >
                  Clear Completed
                </button>
              )}

              {!isProcessing && pendingFiles > 0 && (
                <button
                  onClick={processQueue}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/25 active:scale-95 transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>UPLOAD ({pendingFiles})</span>
                </button>
              )}

              {isProcessing && (
                <button
                  onClick={() => {
                    isCancelledRef.current = true;
                    setIsProcessing(false);
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel Remaining
                </button>
              )}
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Overall Processing</span>
              <span className="text-white font-semibold">{overallProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#090b0e] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-red-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Queue Items List */}
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 divide-y divide-white/5">
            {queue.map((item) => (
              <div
                key={item.id}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Thumbnail / Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#090b0e] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Name and Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white truncate text-xs sm:text-sm">
                        {item.cleanName !== item.originalName ? item.cleanName : item.originalName}
                      </p>
                      {item.savingsPercent ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold shrink-0">
                          {item.savingsPercent}% SMALLER
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatBytes(item.originalSize)}</span>
                      {item.convertedSize ? (
                        <>
                          <span>→</span>
                          <span className="text-emerald-400 font-medium">
                            {formatBytes(item.convertedSize)}
                          </span>
                        </>
                      ) : null}
                      <span>•</span>
                      <span
                        className={`capitalize font-medium ${
                          item.status === 'complete'
                            ? 'text-emerald-400'
                            : item.status === 'failed'
                            ? 'text-red-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {item.stageText}
                      </span>
                    </div>

                    {/* Mini item progress */}
                    {item.status !== 'complete' && item.status !== 'failed' && (
                      <div className="w-full h-1 bg-[#090b0e] rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-red-500 transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {item.errorMessage && (
                      <p className="text-red-400 text-[11px] mt-1">{item.errorMessage}</p>
                    )}
                  </div>
                </div>

                {/* Status Indicator / Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  {item.status === 'failed' && (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  {(item.status === 'converting' ||
                    item.status === 'saving_drive' ||
                    item.status === 'resizing') && (
                    <RotateCw className="w-4 h-4 text-red-400 animate-spin" />
                  )}
                  {item.status !== 'complete' && !isProcessing && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
