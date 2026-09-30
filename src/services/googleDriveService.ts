export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
  };
}

export interface ClientFolderStructure {
  rootId: string;
  clientFolderId: string;
  originalsFolderId: string;
  websiteJpgFolderId: string;
  archiveFolderId: string;
}

export const ROOT_VAULT_FOLDER_NAME = 'AMA Media Vault';
export const FOLDER_ORIGINALS = 'Original Uploads';
export const FOLDER_WEBSITE_JPG = 'Website JPG';
export const FOLDER_ARCHIVE = 'Archive';

/**
 * Searches for a folder with a given name in a specific parent or root
 */
export async function findFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<DriveFileItem | null> {
  try {
    let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and trashed = false`;
    if (parentId) {
      q += ` and '${parentId}' in parents`;
    }
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,mimeType,parents)&pageSize=1`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to search folder: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (error) {
    console.error('Error finding folder:', error);
    throw error;
  }
}

/**
 * Creates a folder with optional parent
 */
export async function createFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<DriveFileItem> {
  try {
    const body: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      body.parents = [parentId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create folder ${name}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`Error creating folder ${name}:`, error);
    throw error;
  }
}

/**
 * Finds or creates a folder
 */
export async function findOrCreateFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<DriveFileItem> {
  const existing = await findFolder(token, name, parentId);
  if (existing) return existing;
  return await createFolder(token, name, parentId);
}

/**
 * Automatically sets up the required folder hierarchy:
 * AMA Media Vault
 *   └── [Client Name] (e.g. Jeannie)
 *         ├── Original Uploads
 *         ├── Website JPG
 *         └── Archive
 */
export async function setupClientFolderStructure(
  token: string,
  clientName: string
): Promise<ClientFolderStructure> {
  // 1. Root folder
  const root = await findOrCreateFolder(token, ROOT_VAULT_FOLDER_NAME);

  // 2. Client subfolder
  const clientFolder = await findOrCreateFolder(token, clientName, root.id);

  // 3. Child folders
  const [originals, websiteJpg, archive] = await Promise.all([
    findOrCreateFolder(token, FOLDER_ORIGINALS, clientFolder.id),
    findOrCreateFolder(token, FOLDER_WEBSITE_JPG, clientFolder.id),
    findOrCreateFolder(token, FOLDER_ARCHIVE, clientFolder.id),
  ]);

  return {
    rootId: root.id,
    clientFolderId: clientFolder.id,
    originalsFolderId: originals.id,
    websiteJpgFolderId: websiteJpg.id,
    archiveFolderId: archive.id,
  };
}

/**
 * Uploads a Blob directly to a Google Drive folder using Multipart upload
 */
export async function uploadBlobToDrive(
  token: string,
  options: {
    name: string;
    mimeType: string;
    blob: Blob;
    parentId?: string;
  }
): Promise<DriveFileItem> {
  const { name, mimeType, blob, parentId } = options;

  const metadata = {
    name,
    mimeType,
    parents: parentId ? [parentId] : undefined,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;

  const fileBytes = await blob.arrayBuffer();

  const preContent = `${delimiter}${metaPart}${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
  const postContent = `${closeDelim}`;

  const preBuffer = new TextEncoder().encode(preContent);
  const postBuffer = new TextEncoder().encode(postContent);

  const combined = new Uint8Array(
    preBuffer.byteLength + fileBytes.byteLength + postBuffer.byteLength
  );
  combined.set(preBuffer, 0);
  combined.set(new Uint8Array(fileBytes), preBuffer.byteLength);
  combined.set(postBuffer, preBuffer.byteLength + fileBytes.byteLength);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': combined.byteLength.toString(),
      },
      body: combined,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload file ${name}: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Lists files in a specific Google Drive folder
 */
export async function listFolderFiles(
  token: string,
  folderId: string
): Promise<DriveFileItem[]> {
  try {
    const q = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,mimeType,size,createdTime,webViewLink,thumbnailLink,imageMediaMetadata)&orderBy=createdTime desc&pageSize=100`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to list drive files');
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing folder files:', error);
    throw error;
  }
}

/**
 * Downloads a file blob from Drive
 */
export async function downloadDriveBlob(token: string, fileId: string): Promise<Blob> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.statusText}`);
  }

  return await res.blob();
}

/**
 * Deletes a file from Google Drive (Requires confirmation dialog in UI!)
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Drive: ${res.statusText}`);
  }
}

/**
 * Moves a file from one Drive folder to another
 */
export async function moveDriveFile(
  token: string,
  fileId: string,
  newParentId: string,
  oldParentId: string
): Promise<DriveFileItem> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentId}&removeParents=${oldParentId}&fields=id,name,parents`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to move file in Drive`);
  }

  return await res.json();
}

/**
 * Gets Google Drive quota info
 */
export async function getDriveAbout(
  token: string
): Promise<{ user?: any; storageQuota?: { limit?: string; usage?: string; usageInDrive?: string } }> {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
