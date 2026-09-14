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
import { AdibFooter } from './components/AdibFooter';
import { DocumentMeta, FitMode, ViewMode, Language, VerificationDetails } from './types';
import { downloadImageAsPdf } from './lib/pdfExport';
import {
  saveCustomPdf,
  getCustomPdf,
  clearCustomPdf,
  saveCustomImage,
  getCustomImage,
  clearCustomImage,
} from './lib/pdfStorage';
import { FileUp, AlertCircle, RefreshCw, BookOpen, ShieldCheck, CheckCircle2, SlidersHorizontal, Eye } from 'lucide-react';

export default function App() {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [fitMode, setFitMode] = useState<FitMode>('width');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>('/44.jpg');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toolbar visibility: restored by default, with intuitive multi-mode toggle
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  // Language state (default Arabic, can toggle to English)
  const [lang, setLang] = useState<Language>('ar');

  // Verification Details matching the ADIB No Liability Certificate
  const [verification, setVerification] = useState<VerificationDetails>({
    refNumber: '26/472376/70672211/HFO',
    channel: 'ADIB Branch Document Services (Oud Al Touba)',
    issueDate: '13 September 2026',
    documentType: 'شهادة براءة ذمة / No Liability Certificate',
    isValid: true,
    securityHash: 'SERIAL: No. 09466 | IBAN: AE640500000000019510954',
    customerRef: 'MAHMOOD ABDULLA MOHAMMED GHALLAB Ali (Acc: 19510954)',
  });

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isSaveWebPageModalOpen, setIsSaveWebPageModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFontFidelityModalOpen, setIsFontFidelityModalOpen] = useState(false);
  const [isCustomFileLoaded, setIsCustomFileLoaded] = useState(false);

  // Document metadata & active raw data for downloading / printing
  const [documentMeta, setDocumentMeta] = useState<DocumentMeta>({
    title: 'شهادة براءة ذمة - مصرف أبوظبي الإسلامي.pdf',
    fileName: 'ADIB_No_Liability_Certificate.pdf',
    author: 'Abu Dhabi Islamic Bank',
    subject: 'No Liability Certificate',
    creator: 'ADIB Core Banking',
    producer: 'ADIB Document Vault',
  });
  const rawPdfBufferRef = useRef<ArrayBuffer | null>(null);
  const rootContainerRef = useRef<HTMLDivElement>(null);

  // Prefetch official PDF in background for instant download
  useEffect(() => {
    fetch('/adib_certificate.pdf')
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

  // Initial load: Checks for saved custom image, saved custom PDF, URL params, or default ADIB Certificate
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        // 1. Check for saved custom image
        const customImg = await getCustomImage();
        if (!isCancelled && customImg && customImg.dataUrl) {
          setIsCustomFileLoaded(true);
          setPdfDoc(null);
          setImageSrc(customImg.dataUrl);
          setDocumentMeta({
            title: customImg.fileName || 'custom_image.jpg',
            fileName: customImg.fileName || 'custom_image.jpg',
            author: 'Abu Dhabi Islamic Bank',
            subject: 'Custom Document Image',
            creator: 'ADIB Document Viewer',
          });
          setIsLoading(false);
          return;
        }

        // 2. Check for saved custom PDF
        const custom = await getCustomPdf();
        if (!isCancelled && custom && custom.buffer) {
          setIsCustomFileLoaded(true);
          await loadPdf(custom.buffer, custom.fileName);
          return;
        }
      } catch (err) {
        console.warn('Could not read saved custom media:', err);
      }

      if (isCancelled) return;
      const urlParams = new URLSearchParams(window.location.search);
      const pdfParam = urlParams.get('pdf') || urlParams.get('file');

      if (pdfParam) {
        setImageSrc(null);
        loadPdf(pdfParam, pdfParam.split('/').pop() || 'adib_certificate.pdf');
      } else {
        setImageSrc('/44.jpg');
        setIsLoading(false);
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

  // Main file selector: processes any image or PDF immediately
  const handleFileSelect = (file: File) => {
    setIsLoading(true);
    setError(null);

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp|ico)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          // Clear any PDF document state
          setPdfDoc(null);
          setImageSrc(dataUrl);
          setCurrentPage(1);
          setTotalPages(1);
          setScale(1.0);
          setFitMode('page');

          setDocumentMeta({
            title: file.name,
            fileName: file.name,
            author: 'مصرف أبوظبي الإسلامي - ADIB',
            subject: 'وثيقة رسمية / صورة مرفوعة',
            creator: 'عارض مستندات ADIB',
            producer: 'ADIB Instant Image Viewer',
          });

          // Persist image so refreshing the page preserves it
          await saveCustomImage(file.name, dataUrl);
          setIsCustomFileLoaded(true);
          setIsLoading(false);

          setToastMessage(
            lang === 'ar'
              ? `تم عرض الصورة "${file.name}" تلقائياً في منتصف الصفحة!`
              : `Image "${file.name}" displayed automatically in the center!`
          );
        }
      };
      reader.onerror = () => {
        setIsLoading(false);
        setError(lang === 'ar' ? 'تعذر قراءة ملف الصورة المختارة.' : 'Failed to read the chosen image.');
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          setImageSrc(null);
          await loadPdf(buffer, file.name);
          await saveCustomPdf(file.name, buffer);
          setIsCustomFileLoaded(true);
          setToastMessage(
            lang === 'ar'
              ? `تم فتح ملف الـ PDF "${file.name}" بنجاح!`
              : `PDF file "${file.name}" loaded successfully!`
          );
        }
      };
      reader.onerror = () => {
        setIsLoading(false);
        setError(lang === 'ar' ? 'تعذر فتح ملف الـ PDF.' : 'Failed to read PDF document.');
      };
      reader.readAsArrayBuffer(file);
    } else {
      setIsLoading(false);
      alert(
        lang === 'ar'
          ? 'يرجى اختيار صورة صالحة (PNG, JPG, WEBP, GIF) أو ملف PDF.'
          : 'Please choose a valid image file (PNG, JPG, WEBP) or a PDF.'
      );
    }
  };

  const handleResetDefault = async () => {
    await clearCustomPdf();
    await clearCustomImage();
    setIsCustomFileLoaded(false);
    setPdfDoc(null);
    setImageSrc('/44.jpg');
    setCurrentPage(1);
    setTotalPages(1);
    setScale(1.0);
    setFitMode('width');
    setDocumentMeta({
      title: 'شهادة براءة ذمة - مصرف أبوظبي الإسلامي.pdf',
      fileName: 'ADIB_No_Liability_Certificate.pdf',
      author: 'Abu Dhabi Islamic Bank',
      subject: 'No Liability Certificate',
      creator: 'ADIB Core Banking',
      producer: 'ADIB Document Vault',
    });
    setIsLoading(false);
    setError(null);
    setToastMessage(lang === 'ar' ? 'تمت استعادة الوثيقة الافتراضية بنجاح' : 'Default document restored');
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
        if (imageSrc === '/44.jpg') {
          try {
            const res = await fetch('/Mohamed_Abdulla_Verfication.pdf');
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              const blob = new Blob([buffer], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ADIB_No_Liability_Certificate.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 3000);
              setToastMessage(lang === 'ar' ? 'تم تحميل الشهادة بصيغة PDF بنجاح' : 'Certificate PDF downloaded successfully');
              return;
            }
          } catch {
            // Fallback to pdf-lib dynamic export
          }
        }

        // Universal high-quality image-to-PDF generation
        await downloadImageAsPdf(imageSrc, documentMeta.fileName || 'ADIB_No_Liability_Certificate.pdf', documentMeta.title);
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
        const res = await fetch('/adib_certificate.pdf');
        buffer = await res.arrayBuffer();
        rawPdfBufferRef.current = buffer;
      }
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentMeta.fileName || 'ADIB_No_Liability_Certificate.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setToastMessage(lang === 'ar' ? 'تم تحميل ملف PDF بنجاح' : 'PDF downloaded successfully');
    } catch {
      const a = document.createElement('a');
      a.href = '/adib_certificate.pdf';
      a.download = documentMeta.fileName || 'ADIB_No_Liability_Certificate.pdf';
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
                loadPdf('/adib_certificate.pdf');
              } else {
                setImageSrc('/44.jpg');
              }
            }}
            isExactViewActive={Boolean(imageSrc)}
            onUploadFile={handleFileSelect}
            isCustomFileLoaded={isCustomFileLoaded}
            onResetDefault={handleResetDefault}
            onHideToolbar={handleToggleToolbar}
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
                  setImageSrc('/44.jpg');
                  setError(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#003865] hover:bg-[#002b49] text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'single' ? (
          <PdfCanvas
            pdfDoc={pdfDoc}
            imageSrc={imageSrc}
            imageName={documentMeta.title}
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
          />
        ) : (
          <ContinuousView
            pdfDoc={pdfDoc}
            imageSrc={imageSrc}
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
            {lang === 'ar' ? 'أفلت أي صورة هنا لعرضها تلقائياً في المنتصف!' : 'Drop any image here to display automatically in center!'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md">
            {lang === 'ar'
              ? 'سيتم عرض الصورة فوراً في منتصف الصفحة بدون أي خطوات مع إمكانية التكبير والفتح في نافذة منبثقة'
              : 'The image will be displayed automatically in the center with zoom and popup window view'}
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
      />

      {/* Font & Signature Fidelity & iOS Guide Modal */}
      <FontFidelityModal
        isOpen={isFontFidelityModalOpen}
        onClose={() => setIsFontFidelityModalOpen(false)}
        lang={lang}
        onSelectExactView={() => setImageSrc('/44.jpg')}
        onSelectVectorPdf={() => {
          setImageSrc(null);
          loadPdf('/adib_certificate.pdf');
        }}
        isExactViewActive={Boolean(imageSrc)}
      />
    </div>
  );
}
