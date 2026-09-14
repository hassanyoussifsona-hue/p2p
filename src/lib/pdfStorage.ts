// IndexedDB storage for persisting custom uploaded PDF files across sessions

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
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ fileName, buffer, savedAt: Date.now() }, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save PDF to IndexedDB:', err);
  }
}

export async function getCustomPdf(): Promise<{ fileName: string; buffer: ArrayBuffer } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => {
        if (req.result && req.result.buffer) {
          resolve({ fileName: req.result.fileName, buffer: req.result.buffer });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not get PDF from IndexedDB:', err);
    return null;
  }
}

export async function clearCustomPdf(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
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
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ fileName, dataUrl, savedAt: Date.now() }, IMAGE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save image to IndexedDB, fallback to localStorage:', err);
    try {
      localStorage.setItem('adib_custom_image', JSON.stringify({ fileName, dataUrl }));
    } catch {}
  }
}

export async function getCustomImage(): Promise<{ fileName: string; dataUrl: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(IMAGE_KEY);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve({ fileName: req.result.fileName, dataUrl: req.result.dataUrl });
        } else {
          // Check localStorage fallback
          try {
            const local = localStorage.getItem('adib_custom_image');
            if (local) {
              resolve(JSON.parse(local));
              return;
            }
          } catch {}
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not get image from IndexedDB, checking localStorage:', err);
    try {
      const local = localStorage.getItem('adib_custom_image');
      if (local) return JSON.parse(local);
    } catch {}
    return null;
  }
}

export async function clearCustomImage(): Promise<void> {
  try {
    localStorage.removeItem('adib_custom_image');
    const db = await openDB();
    return new Promise((resolve, reject) => {
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
