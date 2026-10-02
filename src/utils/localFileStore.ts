// Utility for local offline storage, IndexedDB persistence, and local download of deliverables and assets

const DB_NAME = 'uicms_assets_vault_v1';
const DB_VERSION = 1;
const STORE_NAME = 'deliverable_blobs';

export interface StoredFileRecord {
  id: string;
  filename: string;
  mimeType: string;
  size: string;
  dataUrl: string;
  updatedAt: number;
}

// In-memory cache for fast synchronous lookup during renders
const memoryCache = new Map<string, string>();

/**
 * Open or initialize IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Store a file in IndexedDB and memory cache
 */
export async function saveLocalFileBlob(
  id: string,
  filename: string,
  mimeType: string,
  size: string,
  dataUrl: string
): Promise<void> {
  // Always cache in memory
  memoryCache.set(id, dataUrl);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredFileRecord = {
        id,
        filename,
        mimeType,
        size,
        dataUrl,
        updatedAt: Date.now(),
      };
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[LocalFileStore] Failed to persist file in IndexedDB:', err);
  }
}

/**
 * Retrieve a stored file from memory or IndexedDB
 */
export async function getLocalFileDataUrl(id: string): Promise<string | null> {
  if (memoryCache.has(id)) {
    return memoryCache.get(id) || null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as StoredFileRecord | undefined;
        if (record && record.dataUrl) {
          memoryCache.set(id, record.dataUrl);
          resolve(record.dataUrl);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Load all stored file dataUrls into memory map
 */
export async function getAllStoredFileDataUrls(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  // copy memoryCache
  memoryCache.forEach((v, k) => result.set(k, v));

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as StoredFileRecord[];
        records.forEach((r) => {
          if (r.id && r.dataUrl) {
            memoryCache.set(r.id, r.dataUrl);
            result.set(r.id, r.dataUrl);
          }
        });
        resolve(result);
      };

      req.onerror = () => {
        resolve(result);
      };
    });
  } catch {
    return result;
  }
}

/**
 * Delete a file from IndexedDB and memory
 */
export async function deleteLocalFileBlob(id: string): Promise<void> {
  memoryCache.delete(id);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[LocalFileStore] Failed to delete from IndexedDB:', err);
  }
}

/**
 * Convert a File object to a base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Determine if a file is an image based on extension or mimeType
 */
export function isImageFile(filename: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith('image/')) return true;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico'].includes(ext || '');
}

/**
 * Determine if a file is a PDF
 */
export function isPdfFile(filename: string, mimeType?: string): boolean {
  if (mimeType === 'application/pdf') return true;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'pdf';
}

/**
 * Determine if a file is a video
 */
export function isVideoFile(filename: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith('video/')) return true;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '');
}

/**
 * Convert Data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Download a local file (dataUrl, blobUrl, or fallback)
 */
export function triggerLocalDownload(filename: string, urlOrData: string, mimeType = 'application/octet-stream'): void {
  try {
    let downloadUrl = urlOrData;
    let revokeNeeded = false;

    if (urlOrData.startsWith('data:')) {
      const blob = dataUrlToBlob(urlOrData);
      downloadUrl = URL.createObjectURL(blob);
      revokeNeeded = true;
    } else if (urlOrData.startsWith('/')) {
      downloadUrl = new URL(urlOrData, window.location.origin).toString();
    } else if (!urlOrData.startsWith('blob:') && !/^https?:\/\//i.test(urlOrData)) {
      throw new Error('The file does not have a valid download URL.');
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (revokeNeeded) {
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 2000);
    }
  } catch (err) {
    console.error('[LocalFileStore] Failed to trigger download:', err);
  }
}
