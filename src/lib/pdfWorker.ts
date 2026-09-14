import * as pdfjsLib from 'pdfjs-dist';
// Vite URL import for worker
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  try {
    // Set worker URL with fallback safety
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch (err) {
    console.warn('PDF Worker setup warning, falling back:', err);
  }
}

export { pdfjsLib };

