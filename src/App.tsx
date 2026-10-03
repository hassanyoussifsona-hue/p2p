import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfjsLib } from './lib/pdfWorker';
import { AdibHeader } from './components/AdibHeader';
import { Toolbar } from './components/Toolbar';
import { PdfCanvas } from './components/PdfCanvas';
import { ThumbnailsSidebar } from './components/ThumbnailsSidebar';
import { ContinuousView } from './components/ContinuousView';
import { QuickPageSearch } from './components/QuickPageSearch';
import { VerificationModal } from './components/VerificationModal';
import { SaveWebPageModal } from './components/SaveWebPageModal';
import { QrCodeModal } from './components/QrCodeModal';
import { FontFidelityModal } from './components/FontFidelityModal';
import { BotVerificationGate } from './components/BotVerificationGate';
import { AdibFooter } from './components/AdibFooter';
import { DocumentMeta, FitMode, ViewMode, Language, VerificationDetails } from './types';
import { downloadImageAsPdf } from './lib/pdfExport';
import { CenterImageViewer } from './components/CenterImageViewer';
import {
  saveCustomPdf,
  getCustomPdf,
  clearCustomPdf,
  saveCustomImage,
  getCustomImage,
  clearCustomImage,
  StoredImage,
  addImageToDatabase,
  getAllImagesFromDatabase,
  deleteImageFromDatabase,
} from './lib/pdfStorage';
import { FileUp, AlertCircle, RefreshCw, BookOpen, ShieldCheck, CheckCircle2, SlidersHorizontal, Eye } from 'lucide-react';

export default function App() {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [fitMode, setFitMode] = useState<FitMode>('page');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Verification & pending file loading states
  const [isBotVerified, setIsBotVerified] = useState(false);
  const [isVerifyingDocument, setIsVerifyingDocument] = useState(false);
  const [verifyingDocName, setVerifyingDocName] = useState<string | undefined>(undefined);
  const [pendingFileAction, setPendingFileAction] = useState<(() => void) | null>(null);

  // Database Images State for Center Image Viewer
  const [dbImages, setDbImages] = useState<StoredImage[]>([]);
  const [selectedDbImage, setSelectedDbImage] = useState<StoredImage | null>(null);

  // Toolbar visibility: restored by default, with intuitive multi-mode toggle
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  // Language state (default Arabic, can toggle to English)
  const [lang, setLang] = useState<Language>('ar');

  // Verification Details for generic verification document
  const [verification, setVerification] = useState<VerificationDetails>({
    refNumber: 'DOC-VERIFY-2026-9482',
    channel: 'Document Verification System (Online)',
    issueDate: '01 October 2026',
    documentType: 'وثيقة تحقق / Verification Document',
    isValid: true,
    securityHash: 'SERIAL: DOC-2026-9482 | REF: VERIFY-DEMO',
    customerRef: 'Verified User',
  });

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isSaveWebPageModalOpen, setIsSaveWebPageModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFontFidelityModalOpen, setIsFontFidelityModalOpen] = useState(false);
  const [isCustomFileLoaded, setIsCustomFileLoaded] = useState(false);

  // Document metadata & active raw data for downloading / printing
  const [currentQrUrl, setCurrentQrUrl] = useState<string>(
    'https://ais-dev-jjoiefkhngzukahhahyand-171172990740.europe-west2.run.app'
  );
  const [documentMeta, setDocumentMeta] = useState<DocumentMeta>({
    title: '',
    fileName: '',
    author: 'Document Verification System',
    subject: 'Document Viewer',
    creator: 'Document Viewer Core',
    producer: 'Secure Document Vault',
    currentQrUrl: 'https://ais-dev-jjoiefkhngzukahhahyand-171172990740.europe-west2.run.app',
  });
  const rawPdfBufferRef = useRef<ArrayBuffer | null>(null);
  const rootContainerRef = useRef<HTMLDivElement>(null);

  const handleQrApplied = (newUrl: string) => {
    setCurrentQrUrl(newUrl);
    setDocumentMeta((prev) => ({
      ...prev,
      currentQrUrl: newUrl,
    }));
    const ts = Date.now();
    setImageSrc((prev) => (prev ? `${prev.split('?')[0]}?v=${ts}` : `/sample_document.png?v=${ts}`));
    setDocumentPages((prev) =>
      prev ? prev.map((p) => `${p.split('?')[0]}?v=${ts}`) : [`/sample_document.png?v=${ts}`]
    );
    setToastMessage(
      lang === 'ar'
        ? 'تم تحديث وطباعة رمز الـ QR الجديد على الوثيقة بنجاح!'
        : 'New QR code stamped onto document successfully!'
    );
  };

  // Prefetch official PDF in background for instant download
  useEffect(() => {
    fetch('/sample_document.pdf')
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        rawPdfBufferRef.current = buf;
      })
      .catch((err) => {
        console.warn('Could not prefetch PDF:', err);
      });
  }, []);

  // Decode URL params if present (e.g. ?QR=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get('QR');
    if (qrParam) {
      try {
        const decoded = atob(qrParam);
        const subParams = new URLSearchParams(decoded);
        const ref = subParams.get('REF');
        const ch = subParams.get('CH');
        const dt = subParams.get('E');
        if (ref) {
          setVerification((prev) => ({
            ...prev,
            refNumber: ref,
            channel: ch ? `ADIB Channel (${ch})` : prev.channel,
            issueDate: dt ? `${dt.slice(0, 2)}/${dt.slice(2, 4)}/${dt.slice(4)}` : prev.issueDate,
          }));
        }
      } catch (e) {
        console.warn('Could not decode QR parameter', e);
      }
    }
  }, []);

  // Update HTML dir and lang based on chosen language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Load PDF from URL or ArrayBuffer
  const loadPdf = useCallback(async (source: string | ArrayBuffer, fileName: string = 'adib_certificate.pdf') => {
    setIsLoading(true);
    setError(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const commonPdfConfig = {
        cMapUrl: `${origin}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${origin}/standard_fonts/`,
        enableXfa: true,
      };

      let loadingTask;
      if (typeof source === 'string') {
        loadingTask = pdfjsLib.getDocument({
          url: source,
          ...commonPdfConfig,
        });
        // fetch buffer for download & print
        fetch(source)
          .then((res) => res.arrayBuffer())
          .then((buf) => {
            rawPdfBufferRef.current = buf;
          })
          .catch(() => {});
      } else {
        rawPdfBufferRef.current = source;
        loadingTask = pdfjsLib.getDocument({
          data: source,
          ...commonPdfConfig,
        });
      }

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);

      // Extract metadata
      try {
        const meta = await doc.getMetadata();
        const info = (meta.info as any) || {};
        setDocumentMeta({
          title: info.Title || fileName,
          author: info.Author || 'Abu Dhabi Islamic Bank',
          subject: info.Subject || 'Electronic Document Verification',
          creator: info.Creator || 'ADIB Core Banking',
          producer: info.Producer || 'ADIB Document Vault',
          creationDate: info.CreationDate || undefined,
          fileName: fileName,
        });
      } catch {
        setDocumentMeta({
          title: fileName,
          fileName: fileName,
        });
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to load PDF document:', err);
      setError(
        lang === 'ar'
          ? 'تعذر فتح ملف الـ PDF. تأكد من أن الملف سليم ومطابق للمواصفات.'
          : 'Failed to load PDF file. Please ensure the document is valid.'
      );
      setIsLoading(false);
    }
  }, [lang]);

  // Auto-dismiss toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initial load: load uploaded document (/uploaded_doc.png or from /api/document-meta)
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        // 1. Check server document meta
        const res = await fetch('/api/document-meta', { cache: 'no-store' });
        if (res.ok) {
          const meta = await res.json();
          if (!isCancelled && meta && meta.pages && meta.pages.length > 0) {
            const mainImg = meta.pages[0];
            setImageSrc(mainImg);
            setDocumentPages(meta.pages);
            setTotalPages(meta.totalPages || meta.pages.length || 1);
            setCurrentPage(1);
            setIsCustomFileLoaded(true);
            setVerifyingDocName(meta.fileName || '04-10.png');
            setDocumentMeta((prev) => ({
              ...prev,
              title: meta.title || meta.fileName || '04-10',
              fileName: meta.fileName || '04-10.png',
              originalPdf: meta.originalPdf,
            }));
            return;
          }
        }
      } catch (metaErr) {
        console.warn('Could not fetch server document meta:', metaErr);
      }

      // 2. Check local database / IndexedDB stored images
      try {
        const stored = await getAllImagesFromDatabase();
        if (!isCancelled && stored && stored.length > 0) {
          setDbImages(stored);
          setSelectedDbImage(stored[0]);
          setImageSrc(stored[0].dataUrl);
          setDocumentPages([stored[0].dataUrl]);
          setTotalPages(1);
          setCurrentPage(1);
          setVerifyingDocName(stored[0].fileName);
          setIsCustomFileLoaded(true);
          setDocumentMeta((prev) => ({
            ...prev,
            title: stored[0].fileName,
            fileName: stored[0].fileName,
          }));
          return;
        }
      } catch (err) {
        console.warn('Could not read images from database:', err);
      }

      // 3. Fallback to /uploaded_doc.png as the default uploaded image
      if (!isCancelled) {
        setImageSrc('/uploaded_doc.png');
        setDocumentPages(['/uploaded_doc.png']);
        setTotalPages(1);
        setCurrentPage(1);
        setVerifyingDocName('04-10.png');
        setIsCustomFileLoaded(true);
        setDocumentMeta((prev) => ({
          ...prev,
          title: '04-10',
          fileName: '04-10.png',
        }));
      }

      const urlParams = new URLSearchParams(window.location.search);
      const pdfParam = urlParams.get('pdf') || urlParams.get('file');

      if (pdfParam) {
        setImageSrc(null);
        setFitMode('page');
        loadPdf(pdfParam, pdfParam.split('/').pop() || 'document.pdf');
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [loadPdf]);

  // Fullscreen change listener (standard + iOS/WebKit prefix)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(totalPages);
      } else if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setScale((prev) => Math.min(3.5, prev + 0.15));
        setFitMode('custom');
      } else if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setScale((prev) => Math.max(0.3, prev - 0.15));
        setFitMode('custom');
      } else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setScale(1.0);
        setFitMode('custom');
      } else if (e.ctrlKey && (e.key === 'k' || e.key === 'g' || e.key === 'f')) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        handleToggleFullscreen();
      } else if ((e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'h') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setIsToolbarVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  // Drag & Drop handlers - Instant automatic display in the center!
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Actually process and render chosen file into the viewer
  const actuallyProcessFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp|ico)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) {
        setIsLoading(false);
        return;
      }

      // If it's an image, render directly
      if (isImage) {
        setPdfDoc(null);
        setImageSrc(dataUrl);
        setDocumentPages([dataUrl]);
        setCurrentPage(1);
        setTotalPages(1);
        setScale(1.0);
        setFitMode('page');

        setDocumentMeta({
          title: file.name,
          fileName: file.name,
          author: 'Document Verification System',
          subject: 'Custom Document Image',
          creator: 'Document Viewer Core',
          producer: 'High Fidelity Viewer',
        });

        await saveCustomImage(file.name, dataUrl);
        setIsCustomFileLoaded(true);
      }

      // Synchronize with server
      try {
        const res = await fetch('/api/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
            fileData: dataUrl,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.meta) {
            const m = result.meta;
            setDocumentPages(m.pages || [dataUrl]);
            setTotalPages(m.totalPages || 1);
            setCurrentPage(1);
            setImageSrc(m.pages[0]);
            setPdfDoc(null);
            setIsCustomFileLoaded(true);
            setDocumentMeta({
              title: m.title || file.name,
              fileName: m.fileName || file.name,
              originalPdf: m.originalPdf,
            });
            setIsLoading(false);
            setToastMessage(
              lang === 'ar'
                ? `تم فتح وتوثيق المستند "${file.name}" بنجاح!`
                : `Document "${file.name}" verified and opened successfully!`
            );
            return;
          }
        }
      } catch (uploadErr) {
        console.warn('Server upload fallback:', uploadErr);
      }

      // PDF handling
      if (isPdf) {
        try {
          const base64Data = dataUrl.split(',')[1];
          const binaryStr = atob(base64Data);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          setImageSrc(null);
          setFitMode('page');
          await loadPdf(bytes.buffer, file.name);
          await saveCustomPdf(file.name, bytes.buffer);
          setIsCustomFileLoaded(true);
        } catch (pdfErr) {
          console.error('PDF loading error:', pdfErr);
        }
      }

      setIsLoading(false);
      setToastMessage(
        lang === 'ar'
          ? `تم فتح المستند "${file.name}" بنجاح!`
          : `Document "${file.name}" opened successfully!`
      );
    };

    reader.onerror = () => {
      setIsLoading(false);
      setError(lang === 'ar' ? 'تعذر قراءة ملف المستند المختار.' : 'Failed to read the chosen document file.');
    };

    reader.readAsDataURL(file);
  }, [lang, loadPdf]);

  // Main file selector: triggers 7-second verification countdown, then opens the file!
  const handleFileSelect = (file: File) => {
    setVerifyingDocName(file.name);
    setIsVerifyingDocument(true);
    setIsBotVerified(false);
    setPendingFileAction(() => () => {
      actuallyProcessFile(file);
    });
  };

  const handleVerified = () => {
    setIsBotVerified(true);
    setIsVerifyingDocument(false);
    if (pendingFileAction) {
      pendingFileAction();
      setPendingFileAction(null);
    }
  };

  const handleCloseDocument = async () => {
    setImageSrc(null);
    setPdfDoc(null);
    setDocumentPages([]);
    setCurrentPage(1);
    setTotalPages(1);
    setIsCustomFileLoaded(false);
    setDocumentMeta({
      title: '',
      fileName: '',
      author: 'Document Verification System',
      subject: 'Document Viewer',
      creator: 'Document Viewer Core',
      producer: 'Secure Document Vault',
    });
    await clearCustomPdf();
    await clearCustomImage();
    try {
      await fetch('/api/reset-document', { method: 'POST' });
    } catch {}
    setToastMessage(lang === 'ar' ? 'تمت إزالة المستند بنجاح' : 'Document closed successfully');
  };

  const handleUploadImageToDb = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp|ico)$/i.test(file.name);
    if (!isImage) {
      handleFileSelect(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const record = await addImageToDatabase({
        fileName: file.name,
        dataUrl,
        fileSize: file.size,
      });

      setDbImages((prev) => [record, ...prev.filter((img) => img.id !== record.id)]);
      setSelectedDbImage(record);
      setImageSrc(record.dataUrl);
      setDocumentPages([record.dataUrl]);
      setPdfDoc(null);
      setDocumentMeta({
        title: record.fileName,
        fileName: record.fileName,
        author: 'Database Image Store',
        subject: 'Custom Image',
        creator: 'Center Image Viewer',
        producer: 'Database Storage',
      });
      setToastMessage(
        lang === 'ar'
          ? `تم رفع وحفظ "${file.name}" في قاعدة البيانات وعرضها في المنتصف بنجاح!`
          : `Image "${file.name}" saved to database and displayed in center!`
      );
    };
    reader.readAsDataURL(file);
  }, [lang]);

  const handleDeleteImageFromDb = useCallback(async (id: string) => {
    await deleteImageFromDatabase(id);
    setDbImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      const nextSelected = next[0] || null;
      setSelectedDbImage(nextSelected);
      setImageSrc(nextSelected ? nextSelected.dataUrl : null);
      setDocumentPages(nextSelected ? [nextSelected.dataUrl] : []);
      setDocumentMeta({
        title: nextSelected?.fileName || '',
        fileName: nextSelected?.fileName || '',
        author: 'Database Image Store',
        subject: 'Custom Image',
        creator: 'Center Image Viewer',
        producer: 'Database Storage',
      });
      return next;
    });
    setToastMessage(lang === 'ar' ? 'تم حذف الصورة من قاعدة البيانات' : 'Image deleted from database');
  }, [lang]);

  const handleRerunVerification = () => {
    if (!imageSrc && !pdfDoc) return;
    setIsVerifyingDocument(true);
    setIsBotVerified(false);
    setVerifyingDocName(documentMeta.fileName || documentMeta.title || 'Document');
    setPendingFileAction(null);
  };

  const handleResetDefault = async () => {
    await handleCloseDocument();
  };

  const handleToggleFullscreen = () => {
    const doc = document as unknown as {
      fullscreenElement?: Element;
      webkitFullscreenElement?: Element;
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => void;
    };
    const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (!isFs) {
      const el = rootContainerRef.current as unknown as {
        requestFullscreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => void;
      };
      if (el?.requestFullscreen) {
        el.requestFullscreen().catch((err) => {
          console.warn('Could not enter fullscreen:', err);
        });
      } else if (el?.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleToolbar = useCallback(() => {
    setIsToolbarVisible((prev) => {
      const next = !prev;
      setToastMessage(
        next
          ? (lang === 'ar' ? 'تمت استعادة شريط الأدوات' : 'Toolbar restored')
          : (lang === 'ar' ? 'تم إخفاء شريط الأدوات مؤقتاً (اضغط على "إظهار الأدوات" أو T للإعادة)' : 'Toolbar hidden (Click "Show Tools" or press T)')
      );
      return next;
    });
  }, [lang]);

  const handleDownload = async () => {
    // If viewing an image (default or custom), export and download as authentic PDF
    if (imageSrc && !pdfDoc) {
      try {
        setToastMessage(lang === 'ar' ? 'جاري تجهيز المستند وتحميله بصيغة PDF...' : 'Preparing PDF download...');
        
        // If default official certificate image
        if (imageSrc === '/sample_document.png' || imageSrc === '/44.jpg') {
          try {
            const res = await fetch('/sample_document.pdf');
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              const blob = new Blob([buffer], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'sample_document.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 3000);
              setToastMessage(lang === 'ar' ? 'تم تحميل الوثيقة بصيغة PDF بنجاح' : 'Document PDF downloaded successfully');
              return;
            }
          } catch {
            // Fallback to pdf-lib dynamic export
          }
        }

        // Universal high-quality image-to-PDF generation
        await downloadImageAsPdf(imageSrc, documentMeta.fileName || 'sample_document.pdf', documentMeta.title);
        setToastMessage(lang === 'ar' ? 'تم تحميل المستند بصيغة PDF بنجاح' : 'Document PDF downloaded successfully');
        return;
      } catch (err) {
        console.error('PDF export error:', err);
        setToastMessage(lang === 'ar' ? 'حدث خطأ أثناء تحميل PDF' : 'Error generating PDF');
      }
    }

    // If PDF
    try {
      let buffer = rawPdfBufferRef.current;
      if (!buffer) {
        const res = await fetch('/sample_document.pdf');
        buffer = await res.arrayBuffer();
        rawPdfBufferRef.current = buffer;
      }
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentMeta.fileName || 'sample_document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setToastMessage(lang === 'ar' ? 'تم تحميل ملف PDF بنجاح' : 'PDF downloaded successfully');
    } catch {
      const a = document.createElement('a');
      a.href = '/sample_document.pdf';
      a.download = documentMeta.fileName || 'sample_document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleRotateChange = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomChange = (newScale: number, newFitMode: FitMode = 'custom') => {
    setScale(newScale);
    setFitMode(newFitMode);
  };

  const handleLanguageToggle = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  return (
    <div
      ref={rootContainerRef}
      id="pdf-app-root"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-screen h-screen h-[100dvh] flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-['Cairo','Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Official ADIB Bank Portal Header */}
      <AdibHeader
        lang={lang}
        onLanguageToggle={handleLanguageToggle}
        verification={verification}
        onOpenDetailsModal={() => setIsVerificationModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        isToolbarVisible={isToolbarVisible}
        onToggleToolbar={handleToggleToolbar}
      />

      {/* Collapsible Document Toolbar */}
      {isToolbarVisible && (
        <div id="active-toolbar-container" className="relative transition-all duration-200">
          <Toolbar
            currentPage={currentPage}
            totalPages={totalPages}
            scale={scale}
            rotation={rotation}
            viewMode={viewMode}
            fitMode={fitMode}
            isFullscreen={isFullscreen}
            isSidebarOpen={isSidebarOpen}
            documentTitle={documentMeta.title}
            lang={lang}
            onPageChange={(page) => setCurrentPage(page)}
            onZoomChange={handleZoomChange}
            onRotateChange={handleRotateChange}
            onViewModeToggle={() => setViewMode((prev) => (prev === 'single' ? 'continuous' : 'single'))}
            onFullscreenToggle={handleToggleFullscreen}
            onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
            onPrint={handlePrint}
            onDownload={handleDownload}
            onOpenSearchModal={() => setIsSearchOpen(true)}
            onOpenSaveWebPageModal={() => setIsSaveWebPageModalOpen(true)}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onOpenFontFidelityModal={() => setIsFontFidelityModalOpen(true)}
            onToggleFidelityMode={() => {
              if (imageSrc) {
                setImageSrc(null);
                setFitMode('page');
                loadPdf('/sample_document.pdf');
              } else {
                setImageSrc('/sample_document.png');
                setFitMode('page');
              }
            }}
            isExactViewActive={Boolean(imageSrc)}
            onUploadFile={handleUploadImageToDb}
            isCustomFileLoaded={isCustomFileLoaded}
            onResetDefault={handleResetDefault}
            onHideToolbar={handleToggleToolbar}
            hasDocument={Boolean(selectedDbImage || imageSrc || pdfDoc)}
            onRerunVerification={handleRerunVerification}
            onCloseDocument={handleCloseDocument}
          />
        </div>
      )}

      {/* Main Center Stage: Sidebar + PDF Centered View */}
      <main id="pdf-workspace" className="relative flex-1 flex flex-row overflow-hidden w-full bg-[#0b1120]">
        {/* Floating Quick Restore Pill when toolbar is hidden */}
        {!isToolbarVisible && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              id="btn-floating-show-toolbar"
              onClick={handleToggleToolbar}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/95 hover:bg-[#003865] text-white border border-[#c5a059] shadow-2xl text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-black/40"
              title={lang === 'ar' ? 'إظهار شريط أدوات المستند (اختصار: T)' : 'Show document toolbar (Shortcut: T)'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>{lang === 'ar' ? 'إظهار شريط الأدوات' : 'Show Toolbar'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-slate-200 font-mono font-normal">T</span>
            </button>
          </div>
        )}
        {/* Thumbnails Sidebar */}
        <ThumbnailsSidebar
          pdfDoc={pdfDoc}
          imageSrc={imageSrc}
          imagePages={documentPages}
          currentPage={currentPage}
          totalPages={totalPages}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectPage={(page) => setCurrentPage(page)}
          documentMeta={documentMeta}
        />

        {/* Center Viewer Area */}
        {isLoading ? (
          <div
            id="pdf-loading-state"
            className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4"
          >
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
              <BookOpen className="w-8 h-8 text-[#c5a059] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-200">
                {lang === 'ar' ? 'جاري فتح وتحميل المستند...' : 'Opening Document...'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? 'يتم تجهيز الصورة للعرض التلقائي بدقة فائقة في منتصف الصفحة'
                  : 'Rendering with high-fidelity canvas in the center of the page'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div
            id="pdf-error-state"
            className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-base font-semibold text-rose-300">{error}</h3>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? 'يمكنك إعادة المحاولة أو رفع صورة / ملف آخر.'
                  : 'You can retry loading or upload another image or file.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setError(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#003865] hover:bg-[#002b49] text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
              </button>
            </div>
          </div>
        ) : (viewMode === 'single' || !pdfDoc) ? (
          <PdfCanvas
            pdfDoc={pdfDoc}
            imageSrc={(documentPages && documentPages[currentPage - 1]) ? documentPages[currentPage - 1] : imageSrc}
            imageName={documentMeta.title || documentMeta.fileName || '04-10.png'}
            currentPage={currentPage}
            scale={scale}
            rotation={rotation}
            fitMode={fitMode}
            onScaleCalculated={(newScale) => setScale(newScale)}
            onNextPage={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            onPrevPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            totalPages={totalPages}
            onUploadImageClick={() => {
              document.getElementById('btn-upload-image-toolbar')?.click();
            }}
            qrUrl={currentQrUrl}
            onQrClick={() => setIsQrModalOpen(true)}
          />
        ) : (
          <ContinuousView
            pdfDoc={pdfDoc}
            imageSrc={imageSrc}
            imagePages={documentPages}
            scale={scale}
            rotation={rotation}
            onVisiblePageChange={(p) => setCurrentPage(p)}
            totalPages={totalPages}
          />
        )}
      </main>

      {/* Official ADIB Footer */}
      <AdibFooter lang={lang} />

      {/* Instant Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 border border-emerald-500/80 text-emerald-200 text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div
          id="pdf-drag-drop-overlay"
          className="absolute inset-0 z-50 bg-[#002b49]/92 backdrop-blur-sm border-4 border-dashed border-[#c5a059] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-150 pointer-events-none"
        >
          <div className="p-4 rounded-3xl bg-slate-800/80 border border-[#c5a059]/40 text-[#c5a059] shadow-2xl mb-4">
            <FileUp className="w-12 h-12 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {lang === 'ar' ? 'أفلت أي صورة أو ملف هنا لتغيير وتحديث المستند!' : 'Drop any image or file here to change the document!'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md">
            {lang === 'ar'
              ? 'سيتم فحص وتحديث المستند بالصورة الجديدة وحفظها تلقائياً للمعاينة في المنتصف'
              : 'The document will be verified, updated and saved with the new image for center viewing'}
          </p>
        </div>
      )}

      {/* Quick Page Search / Jump Modal */}
      <QuickPageSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        totalPages={totalPages}
        currentPage={currentPage}
        onJumpToPage={(p) => setCurrentPage(p)}
      />

      {/* Verification Details Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        verification={verification}
        lang={lang}
        onOpenQrModal={() => setIsQrModalOpen(true)}
      />

      {/* Save Web Page & Deployment Modal */}
      <SaveWebPageModal
        isOpen={isSaveWebPageModalOpen}
        onClose={() => setIsSaveWebPageModalOpen(false)}
        lang={lang}
        onOpenQrModal={() => setIsQrModalOpen(true)}
      />

      {/* QR Code / Barcode Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        lang={lang}
        currentQrUrl={currentQrUrl}
        onQrApplied={handleQrApplied}
      />

      {/* Font & Signature Fidelity & iOS Guide Modal */}
      <FontFidelityModal
        isOpen={isFontFidelityModalOpen}
        onClose={() => setIsFontFidelityModalOpen(false)}
        lang={lang}
        onSelectExactView={() => setImageSrc('/sample_document.png')}
        onSelectVectorPdf={() => {
          setImageSrc(null);
          loadPdf('/sample_document.pdf');
        }}
        isExactViewActive={Boolean(imageSrc)}
      />

      {/* Security Verification Gate (7s auto-check) */}
      {!isBotVerified && (
        <BotVerificationGate
          lang={lang}
          onVerified={handleVerified}
          documentName={verifyingDocName}
          isDocumentVerification={isVerifyingDocument}
        />
      )}
    </div>
  );
}
