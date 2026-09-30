import heic2any from 'heic2any';
import { VaultSettings } from '../types/vault';

export interface ProcessedImageResult {
  convertedBlob: Blob;
  previewUrl: string;
  cleanName: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
  savingsPercent: number;
}

/**
 * Sanitizes and generates a clean, URL-safe and website-ready filename.
 * Example: "Jeannie New Product Photo (FINAL) 001.HEIC" -> "jeannie-new-product-photo-final-001.jpg"
 */
export function generateCleanFileName(
  originalFileName: string,
  clientPrefix?: string,
  existingNames: Set<string> = new Set()
): string {
  // Remove extension
  const lastDotIndex = originalFileName.lastIndexOf('.');
  const baseName = lastDotIndex > -1 ? originalFileName.substring(0, lastDotIndex) : originalFileName;

  // Convert to lowercase
  let clean = baseName.toLowerCase();

  // Replace parenthesis/brackets content markers with spaces first: "(FINAL)" -> " final "
  clean = clean.replace(/[()\[\]{}]/g, ' ');

  // Replace symbols, punctuation, and non-alphanumerics with hyphens
  clean = clean.replace(/[^a-z0-9]+/g, '-');

  // Remove leading/trailing hyphens and collapse multiple hyphens
  clean = clean.replace(/^-+|-+$/g, '').replace(/-+/g, '-');

  if (!clean) {
    clean = 'image';
  }

  // Prepend client prefix if provided and not already included
  if (clientPrefix) {
    const cleanPrefix = clientPrefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (cleanPrefix && !clean.startsWith(cleanPrefix)) {
      clean = `${cleanPrefix}-${clean}`;
    }
  }

  let finalName = `${clean}.jpg`;
  let counter = 2;

  // Prevent collisions / duplicates if existingNames is tracked
  while (existingNames.has(finalName)) {
    finalName = `${clean}-${counter}.jpg`;
    counter++;
  }

  return finalName;
}

/**
 * Loads a File / Blob into an HTMLImageElement or ImageBitmap,
 * converting HEIC/HEIF if needed.
 */
export async function decodeToDrawable(
  file: File | Blob,
  filename: string
): Promise<{ image: CanvasImageSource; width: number; height: number; cleanupUrl?: string }> {
  const isHeic =
    file.type.includes('heic') ||
    file.type.includes('heif') ||
    filename.toLowerCase().endsWith('.heic') ||
    filename.toLowerCase().endsWith('.heif');

  let workingBlob: Blob = file;

  if (isHeic) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.95,
      });
      workingBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn('heic2any conversion failed, attempting fallback decoder:', err);
    }
  }

  // Try createImageBitmap (modern & handles EXIF orientation automatically in modern browsers)
  if (typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(workingBlob, {
        imageOrientation: 'from-image',
      });
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
      };
    } catch (e) {
      console.warn('createImageBitmap failed, falling back to Image element:', e);
    }
  }

  // Fallback to Image element
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(workingBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve({
        image: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanupUrl: objectUrl,
      });
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to decode image: ${filename}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Resizes dimensions proportionally based on maximum long edge.
 * Handles both Portrait (height > width) and Landscape (width >= height).
 * Never distorts, stretches, or upscales smaller images.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxLongEdge: number
): { width: number; height: number } {
  if (maxLongEdge <= 0) {
    return { width: origWidth, height: origHeight };
  }

  const longEdge = Math.max(origWidth, origHeight);

  // If already smaller than max, preserve original dimensions
  if (longEdge <= maxLongEdge) {
    return { width: origWidth, height: origHeight };
  }

  const scaleRatio = maxLongEdge / longEdge;
  return {
    width: Math.round(origWidth * scaleRatio),
    height: Math.round(origHeight * scaleRatio),
  };
}

/**
 * Full Pipeline:
 * Original File
 *   ↓
 * Decode Image & Correct Orientation
 *   ↓
 * Resize proportionally to Max Long Edge (1920px default)
 *   ↓
 * Solid White Background Composite (Prevents black background on PNG/transparency)
 *   ↓
 * Compress to Website JPG (82% default)
 *   ↓
 * Clean Filename & Metrics
 */
export async function processImageFile(
  file: File,
  settings: VaultSettings,
  clientPrefix?: string,
  existingNames: Set<string> = new Set(),
  onProgress?: (stage: string) => void
): Promise<ProcessedImageResult> {
  onProgress?.('Decoding & orientation');
  const { image, width: origW, height: origH, cleanupUrl } = await decodeToDrawable(
    file,
    file.name
  );

  try {
    onProgress?.('Calculating dimensions');
    const { width: targetW, height: targetH } = calculateTargetDimensions(
      origW,
      origH,
      settings.maxLongEdge
    );

    onProgress?.('Resizing & compositing');
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      throw new Error('Could not get 2D canvas context for image processing');
    }

    // Fill with solid white background to handle transparency in PNG/WEBP/AVIF
    ctx.fillStyle = settings.transparencyBg || '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    // Apply high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw scaled image
    ctx.drawImage(image, 0, 0, targetW, targetH);

    onProgress?.('Compressing to JPG');
    const quality = Math.max(0.1, Math.min(1.0, settings.jpgQuality || 0.82));

    const convertedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to encode canvas to JPEG'));
        },
        'image/jpeg',
        quality
      );
    });

    const cleanName = generateCleanFileName(file.name, clientPrefix, existingNames);
    const previewUrl = URL.createObjectURL(convertedBlob);
    const originalSize = file.size;
    const convertedSize = convertedBlob.size;
    const savingsPercent = Math.max(
      0,
      Math.round(((originalSize - convertedSize) / originalSize) * 100)
    );

    return {
      convertedBlob,
      previewUrl,
      cleanName,
      width: targetW,
      height: targetH,
      originalSize,
      convertedSize,
      savingsPercent,
    };
  } finally {
    // Release resources
    if (cleanupUrl) {
      URL.revokeObjectURL(cleanupUrl);
    }
    if ('close' in image && typeof (image as any).close === 'function') {
      (image as ImageBitmap).close();
    }
  }
}

/**
 * Format bytes to readable string (e.g. 8.4 MB, 612 KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
