// IndexedDB + LocalStorage dual storage for persisting custom uploaded files across sessions

const DB_NAME = 'RemixPdfViewerDB';
const STORE_NAME = 'custom_pdf_store';
const KEY = 'active_pdf_document';
const IMAGE_KEY = 'active_custom_image';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomPdf(fileName: string, buffer: ArrayBuffer): Promise<void> {
  const savedAt = Date.now();

  // 1. Persist to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ fileName, buffer, savedAt }, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save PDF to IndexedDB:', err);
  }

  // 2. Also persist backup to localStorage
  try {
    if (buffer.byteLength < 3 * 1024 * 1024) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      localStorage.setItem('adib_custom_pdf', JSON.stringify({ fileName, base64, savedAt }));
    }
    localStorage.setItem('adib_active_file_type', 'pdf');
  } catch (err) {
    console.warn('Could not save PDF to localStorage:', err);
  }
}

export async function getCustomPdf(): Promise<{ fileName: string; buffer: ArrayBuffer; savedAt?: number } | null> {
  // 1. Try IndexedDB
  try {
    const db = await openDB();
    const result = await new Promise<{ fileName: string; buffer: ArrayBuffer; savedAt?: number } | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => {
        if (req.result && req.result.buffer) {
          resolve({ fileName: req.result.fileName, buffer: req.result.buffer, savedAt: req.result.savedAt });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
    if (result) return result;
  } catch (err) {
    console.warn('Could not get PDF from IndexedDB:', err);
  }

  // 2. Fallback to localStorage
  try {
    const local = localStorage.getItem('adib_custom_pdf');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.base64) {
        const binary = atob(parsed.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return { fileName: parsed.fileName, buffer: bytes.buffer, savedAt: parsed.savedAt };
      }
    }
  } catch {}

  return null;
}

export async function clearCustomPdf(): Promise<void> {
  try {
    localStorage.removeItem('adib_custom_pdf');
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not clear PDF from IndexedDB:', err);
  }
}

export async function saveCustomImage(fileName: string, dataUrl: string): Promise<void> {
  const savedAt = Date.now();

  // 1. Persist to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ fileName, dataUrl, savedAt }, IMAGE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save image to IndexedDB:', err);
  }

  // 2. Also persist backup to localStorage
  try {
    localStorage.setItem('adib_custom_image', JSON.stringify({ fileName, dataUrl, savedAt }));
    localStorage.setItem('adib_active_file_type', 'image');
  } catch (err) {
    console.warn('Could not save image to localStorage:', err);
  }
}

export async function getCustomImage(): Promise<{ fileName: string; dataUrl: string; savedAt?: number } | null> {
  // 1. Try IndexedDB
  try {
    const db = await openDB();
    const result = await new Promise<{ fileName: string; dataUrl: string; savedAt?: number } | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(IMAGE_KEY);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve({ fileName: req.result.fileName, dataUrl: req.result.dataUrl, savedAt: req.result.savedAt });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
    if (result) return result;
  } catch (err) {
    console.warn('Could not get image from IndexedDB:', err);
  }

  // 2. Fallback to localStorage
  try {
    const local = localStorage.getItem('adib_custom_image');
    if (local) {
      return JSON.parse(local);
    }
  } catch {}

  return null;
}

export async function clearCustomImage(): Promise<void> {
  try {
    localStorage.removeItem('adib_custom_image');
    localStorage.removeItem('adib_active_file_type');
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(IMAGE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not clear image from IndexedDB:', err);
  }
}
