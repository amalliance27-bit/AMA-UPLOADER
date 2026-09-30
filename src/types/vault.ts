export type LinkStatus = 'active' | 'paused' | 'expired';

export interface ClientProfile {
  id: string;
  name: string;
  slug: string;
  accessCode?: string;
  status: LinkStatus;
  createdAt: string;
  totalUploads: number;
  websiteReadyCount: number;
  driveFolderId?: string;
  driveOriginalsFolderId?: string;
  driveWebsiteJpgFolderId?: string;
  driveArchiveFolderId?: string;
  notes?: string;
}

export type FileProcessingStatus =
  | 'waiting'
  | 'uploading'
  | 'converting'
  | 'resizing'
  | 'compressing'
  | 'saving_drive'
  | 'complete'
  | 'failed';

export interface MediaFile {
  id: string;
  clientId: string;
  clientName: string;
  originalName: string;
  cleanName: string;
  originalSize: number;
  convertedSize: number;
  originalType: string;
  width: number;
  height: number;
  status: FileProcessingStatus;
  progress: number;
  statusText?: string;
  errorMessage?: string;
  previewUrl: string;
  originalBlob?: Blob;
  convertedBlob?: Blob;
  driveOriginalFileId?: string;
  driveJpgFileId?: string;
  driveFolder: 'Website JPG' | 'Original Uploads' | 'Archive';
  createdAt: string;
  uploadedAt?: string;
  savingsPercent?: number;
}

export type DuplicateAction = 'keep_both' | 'replace' | 'skip';

export interface VaultSettings {
  jpgQuality: number; // 0.70, 0.82, 0.90
  maxLongEdge: number; // 1280, 1600, 1920, 2560, 0 (0 = Original)
  keepOriginals: boolean; // default true
  duplicateBehavior: DuplicateAction; // default keep_both
  transparencyBg: string; // default #FFFFFF
  concurrency: number; // default 4
  autoSyncToDrive: boolean; // default true
}

export interface GoogleDriveFolderRef {
  id: string;
  name: string;
  parentId?: string;
}
