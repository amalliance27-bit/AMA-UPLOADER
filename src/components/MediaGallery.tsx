import React, { useState, useMemo } from 'react';
import {
  Grid,
  List,
  Search,
  Filter,
  Download,
  Trash2,
  FolderInput,
  Eye,
  CheckSquare,
  Square,
  FileArchive,
  ExternalLink,
  Info,
  Maximize2,
  X,
  Sparkles,
  ArrowUpDown,
  Tag,
  Calendar,
  Layers,
  HardDrive,
} from 'lucide-react';
import JSZip from 'jszip';
import { MediaFile, ClientProfile } from '../types/vault';
import { formatBytes } from '../services/imageProcessor';
import { deleteDriveFile } from '../services/googleDriveService';

interface MediaGalleryProps {
  files: MediaFile[];
  clients: ClientProfile[];
  selectedClientId?: string;
  onDeleteFiles: (fileIds: string[]) => void;
  onMoveFiles: (fileIds: string[], targetFolder: 'Website JPG' | 'Original Uploads' | 'Archive') => void;
  accessToken: string | null;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  files,
  clients,
  selectedClientId,
  onDeleteFiles,
  onMoveFiles,
  accessToken,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>(selectedClientId || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size_desc' | 'savings'>('newest');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesSearch =
          file.cleanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = filterFolder === 'all' || file.driveFolder === filterFolder;
        const matchesClient = filterClient === 'all' || file.clientId === filterClient;
        return matchesSearch && matchesFolder && matchesClient;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'size_desc') {
          return (b.convertedSize || b.originalSize) - (a.convertedSize || a.originalSize);
        }
        if (sortBy === 'savings') {
          return (b.savingsPercent || 0) - (a.savingsPercent || 0);
        }
        return 0;
      });
  }, [files, searchQuery, filterFolder, filterClient, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  // Trigger single download
  const handleDownloadSingle = async (file: MediaFile) => {
    try {
      let blob = file.convertedBlob || file.originalBlob;
      if (!blob && file.previewUrl) {
        const res = await fetch(file.previewUrl);
        blob = await res.blob();
      }
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.cleanName || `${file.originalName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download file:', e);
    }
  };

  // Download batch as ZIP
  const handleDownloadZip = async (targetFiles: MediaFile[], zipName: string) => {
    if (targetFiles.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();

      for (const f of targetFiles) {
        let blob = f.convertedBlob || f.originalBlob;
        if (!blob && f.previewUrl) {
          try {
            const res = await fetch(f.previewUrl);
            blob = await res.blob();
          } catch {}
        }
        if (blob) {
          zip.file(f.cleanName, blob);
        }
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipContent);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create ZIP package:', e);
    } finally {
      setIsZipping(false);
    }
  };

  // Delete flow with confirmation (mandatory according to skill)
  const initiateDelete = (ids: string[]) => {
    setPendingDeleteIds(ids);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (accessToken) {
      for (const id of pendingDeleteIds) {
        const item = files.find((f) => f.id === id);
        if (item?.driveJpgFileId) {
          await deleteDriveFile(accessToken, item.driveJpgFileId).catch(() => {});
        }
        if (item?.driveOriginalFileId) {
          await deleteDriveFile(accessToken, item.driveOriginalFileId).catch(() => {});
        }
      }
    }
    onDeleteFiles(pendingDeleteIds);
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      pendingDeleteIds.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteConfirmOpen(false);
    if (previewFile && pendingDeleteIds.includes(previewFile.id)) {
      setPreviewFile(null);
    }
  };

  const clientObj = clients.find((c) => c.id === filterClient);
  const activeClientName = clientObj?.name || 'All Clients';

  return (
    <div className="space-y-6">
      {/* Action Bar & Controls */}
      <div className="bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Top row: Search and View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search website ready images or original filenames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090b0e] border border-white/10 focus:border-red-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Folder filter */}
            <select
              value={filterFolder}
              onChange={(e) => setFilterFolder(e.target.value)}
              className="bg-[#090b0e] border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 outline-none cursor-pointer hover:border-white/20 transition"
            >
              <option value="all">All Folders</option>
              <option value="Website JPG">Website JPG</option>
              <option value="Original Uploads">Original Uploads</option>
              <option value="Archive">Archive</option>
            </select>

            {/* Client filter */}
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="bg-[#090b0e] border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 outline-none cursor-pointer hover:border-white/20 transition"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#090b0e] border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 outline-none cursor-pointer hover:border-white/20 transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="savings">Highest % Saved</option>
              <option value="size_desc">Largest Size</option>
            </select>

            {/* View toggle */}
            <div className="flex items-center bg-[#090b0e] border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Select Action Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              {selectedFileIds.size > 0 && selectedFileIds.size === filteredFiles.length ? (
                <CheckSquare className="w-4 h-4 text-red-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>
                {selectedFileIds.size > 0
                  ? `Selected (${selectedFileIds.size})`
                  : 'Select All'}
              </span>
            </button>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">
              Showing {filteredFiles.length} images
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedFileIds.size > 0 ? (
              <>
                <button
                  onClick={() => {
                    const sel = filteredFiles.filter((f) => selectedFileIds.has(f.id));
                    handleDownloadZip(sel, `${activeClientName.toLowerCase()}-selected-images`);
                  }}
                  disabled={isZipping}
                  className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isZipping ? 'Preparing ZIP...' : 'Download Selected (ZIP)'}</span>
                </button>
                <button
                  onClick={() => onMoveFiles(Array.from(selectedFileIds), 'Archive')}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                  <span>Move to Archive</span>
                </button>
                <button
                  onClick={() => initiateDelete(Array.from(selectedFileIds))}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  handleDownloadZip(
                    filteredFiles.filter((f) => f.driveFolder === 'Website JPG'),
                    `${activeClientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-website-images`
                  )
                }
                disabled={isZipping || filteredFiles.length === 0}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-medium flex items-center gap-2 shadow-lg shadow-red-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>{isZipping ? 'Creating ZIP Package...' : 'DOWNLOAD ALL JPG (ZIP)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      {filteredFiles.length === 0 ? (
        <div className="bg-[#11141c]/50 border border-white/5 rounded-3xl p-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white/5 text-slate-500 mx-auto flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-white">No Photographs Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No media matching your search term. Try resetting filters.'
              : 'Upload your first batch using the Client Upload Portal.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.has(file.id);
            return (
              <div
                key={file.id}
                className={`group relative bg-[#11141c] border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col ${
                  isSelected
                    ? 'border-red-500 shadow-lg shadow-red-500/10 scale-[0.99]'
                    : 'border-white/10 hover:border-white/25 hover:shadow-xl'
                }`}
              >
                {/* Select button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(file.id);
                  }}
                  className="absolute top-2.5 left-2.5 z-20 p-1 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-red-500" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Savings Badge */}
                {file.savingsPercent ? (
                  <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    {file.savingsPercent}% SMALLER
                  </div>
                ) : null}

                {/* Image Preview */}
                <div
                  onClick={() => setPreviewFile(file)}
                  className="aspect-square w-full bg-[#090b0e] overflow-hidden cursor-pointer relative"
                >
                  <img
                    src={file.previewUrl}
                    alt={file.cleanName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <span className="text-[11px] font-mono text-white flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" /> Quick View
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingle(file);
                      }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-black transition cursor-pointer"
                      title="Download JPG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="p-3 bg-[#11141c] space-y-1 text-xs">
                  <p
                    className="font-medium text-slate-200 truncate"
                    title={file.cleanName}
                  >
                    {file.cleanName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{formatBytes(file.convertedSize || file.originalSize)}</span>
                    <span>
                      {file.width ? `${file.width}×${file.height}` : 'Website Ready'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#11141c]/90 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.has(file.id);
            return (
              <div
                key={file.id}
                className={`p-3 sm:p-4 flex items-center justify-between gap-4 transition hover:bg-white/[0.02] ${
                  isSelected ? 'bg-red-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleSelect(file.id)}
                    className="text-slate-400 hover:text-white cursor-pointer shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-red-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  <div
                    onClick={() => setPreviewFile(file)}
                    className="w-12 h-12 rounded-xl bg-[#090b0e] overflow-hidden shrink-0 cursor-pointer border border-white/10"
                  >
                    <img
                      src={file.previewUrl}
                      alt={file.cleanName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      onClick={() => setPreviewFile(file)}
                      className="font-medium text-white text-sm truncate hover:text-red-400 cursor-pointer"
                    >
                      {file.cleanName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>Orig: {file.originalName}</span>
                      <span>•</span>
                      <span>{file.clientName}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-mono font-medium">
                        {formatBytes(file.convertedSize || file.originalSize)}
                      </span>
                      {file.savingsPercent ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          {file.savingsPercent}% Saved
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="View Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadSingle(file)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Download JPG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => initiateDelete([file.id])}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Detail & Large Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#11141c] border border-white/15 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large Image Preview Pane */}
            <div className="md:w-3/5 bg-black/70 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/10">
              <img
                src={previewFile.previewUrl}
                alt={previewFile.cleanName}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Detailed Metadata Pane */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                    Website Ready JPG
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5 break-all">
                    {previewFile.cleanName}
                  </h3>
                  <p className="text-xs text-slate-400 break-all mt-0.5">
                    Original: {previewFile.originalName}
                  </p>
                </div>

                {/* Comparative Metrics Card */}
                <div className="bg-[#090b0e] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                    <span className="text-slate-400">Original Size</span>
                    <span className="font-mono text-slate-300 font-semibold">
                      {formatBytes(previewFile.originalSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                    <span className="text-slate-400">Website JPG Size</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatBytes(previewFile.convertedSize || previewFile.originalSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Optimization</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                      {previewFile.savingsPercent || 0}% SMALLER
                    </span>
                  </div>
                </div>

                {/* Specs List */}
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="font-mono">
                      {previewFile.width} × {previewFile.height} px
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">Client</span>
                    <span className="font-medium text-white">{previewFile.clientName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">Drive Destination</span>
                    <span className="text-red-400 font-medium">
                      AMA Media Vault / {previewFile.clientName} / {previewFile.driveFolder}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">Upload Date</span>
                    <span>{new Date(previewFile.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <button
                  onClick={() => handleDownloadSingle(previewFile)}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD JPG</span>
                </button>

                <div className="flex gap-2">
                  <a
                    href={
                      previewFile.driveJpgFileId
                        ? `https://drive.google.com/file/d/${previewFile.driveJpgFileId}/view`
                        : 'https://drive.google.com/drive/my-drive'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#161a23] hover:bg-[#1f2432] text-slate-200 rounded-xl text-xs font-medium border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Open in Drive</span>
                  </a>
                  <button
                    onClick={() => {
                      onMoveFiles(
                        [previewFile.id],
                        previewFile.driveFolder === 'Archive' ? 'Website JPG' : 'Archive'
                      );
                      setPreviewFile((prev) =>
                        prev
                          ? {
                              ...prev,
                              driveFolder:
                                prev.driveFolder === 'Archive' ? 'Website JPG' : 'Archive',
                            }
                          : null
                      );
                    }}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium border border-white/10 transition cursor-pointer"
                  >
                    {previewFile.driveFolder === 'Archive' ? 'Restore JPG' : 'Archive'}
                  </button>
                  <button
                    onClick={() => initiateDelete([previewFile.id])}
                    className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium border border-red-500/20 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Destructive Operations (Mandatory for Workspace APIs) */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141c] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Media Files</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete{' '}
              <strong className="text-white">{pendingDeleteIds.length} photograph(s)</strong>{' '}
              from AMA Media Vault and Google Drive? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-500/25 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
