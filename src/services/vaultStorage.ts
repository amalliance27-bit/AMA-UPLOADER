import { ClientProfile, MediaFile, VaultSettings } from '../types/vault';

const SETTINGS_KEY = 'ama_vault_settings';
const CLIENTS_KEY = 'ama_vault_clients';
const MEDIA_CATALOG_KEY = 'ama_vault_media_catalog';

export const DEFAULT_SETTINGS: VaultSettings = {
  jpgQuality: 0.82,
  maxLongEdge: 1920,
  keepOriginals: true,
  duplicateBehavior: 'keep_both',
  transparencyBg: '#FFFFFF',
  concurrency: 4,
  autoSyncToDrive: true,
};

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'client-jeannie',
    name: 'Jeannie',
    slug: 'jeannie',
    status: 'active',
    createdAt: new Date().toISOString(),
    totalUploads: 143,
    websiteReadyCount: 128,
    notes: 'Website Redesign 2026 - Product & Team Photography',
  },
  {
    id: 'client-002',
    name: 'Client 002 (Apex Studio)',
    slug: 'apex-studio',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    totalUploads: 84,
    websiteReadyCount: 84,
    notes: 'Architectural portfolio scans',
  },
  {
    id: 'client-003',
    name: 'Client 003 (Solaria)',
    slug: 'solaria',
    status: 'paused',
    accessCode: '7744',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    totalUploads: 0,
    websiteReadyCount: 0,
    notes: 'Pending lookbook release',
  },
];

// Sample showcase files for Jeannie
export const INITIAL_MEDIA_FILES: MediaFile[] = [
  {
    id: 'file-sample-1',
    clientId: 'client-jeannie',
    clientName: 'Jeannie',
    originalName: 'IMG_4827_Product_Display_Raw.HEIC',
    cleanName: 'jeannie-product-display-raw.jpg',
    originalSize: 8400000,
    convertedSize: 612000,
    originalType: 'image/heic',
    width: 1920,
    height: 1280,
    status: 'complete',
    progress: 100,
    previewUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80',
    driveFolder: 'Website JPG',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    savingsPercent: 93,
    driveJpgFileId: 'drive-mock-jpg-01',
    driveOriginalFileId: 'drive-mock-orig-01',
  },
  {
    id: 'file-sample-2',
    clientId: 'client-jeannie',
    clientName: 'Jeannie',
    originalName: 'Hero Banner Studio Shoot (FINAL) 002.PNG',
    cleanName: 'jeannie-hero-banner-studio-shoot-final-002.jpg',
    originalSize: 12600000,
    convertedSize: 840000,
    originalType: 'image/png',
    width: 1920,
    height: 1080,
    status: 'complete',
    progress: 100,
    previewUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    driveFolder: 'Website JPG',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    savingsPercent: 93,
    driveJpgFileId: 'drive-mock-jpg-02',
    driveOriginalFileId: 'drive-mock-orig-02',
  },
  {
    id: 'file-sample-3',
    clientId: 'client-jeannie',
    clientName: 'Jeannie',
    originalName: 'Jeannie Portrait Outdoor Sun Flare.HEIC',
    cleanName: 'jeannie-portrait-outdoor-sun-flare.jpg',
    originalSize: 9800000,
    convertedSize: 720000,
    originalType: 'image/heic',
    width: 1280,
    height: 1920,
    status: 'complete',
    progress: 100,
    previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80',
    driveFolder: 'Website JPG',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    savingsPercent: 92,
    driveJpgFileId: 'drive-mock-jpg-03',
    driveOriginalFileId: 'drive-mock-orig-03',
  },
  {
    id: 'file-sample-4',
    clientId: 'client-jeannie',
    clientName: 'Jeannie',
    originalName: 'Workspace Setup Studio Angle 4K.WEBP',
    cleanName: 'jeannie-workspace-setup-studio-angle-4k.jpg',
    originalSize: 6400000,
    convertedSize: 490000,
    originalType: 'image/webp',
    width: 1920,
    height: 1280,
    status: 'complete',
    progress: 100,
    previewUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80',
    driveFolder: 'Website JPG',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    savingsPercent: 92,
    driveJpgFileId: 'drive-mock-jpg-04',
    driveOriginalFileId: 'drive-mock-orig-04',
  },
];

export function getStoredSettings(): VaultSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: VaultSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function getStoredClients(): ClientProfile[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CLIENTS;
  }
}

export function saveStoredClients(clients: ClientProfile[]): void {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Failed to save clients:', e);
  }
}

export function getStoredMediaFiles(): MediaFile[] {
  try {
    const raw = localStorage.getItem(MEDIA_CATALOG_KEY);
    if (!raw) {
      localStorage.setItem(MEDIA_CATALOG_KEY, JSON.stringify(INITIAL_MEDIA_FILES));
      return INITIAL_MEDIA_FILES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEDIA_FILES;
  }
}

export function saveStoredMediaFiles(files: MediaFile[]): void {
  try {
    // Strip in-memory Blobs before writing to localStorage
    const serializable = files.map((f) => {
      const { originalBlob, convertedBlob, ...rest } = f;
      return rest;
    });
    localStorage.setItem(MEDIA_CATALOG_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.error('Failed to save media files:', e);
  }
}
