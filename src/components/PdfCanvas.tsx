import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { FitMode } from '../types';

interface PdfCanvasProps {
  pdfDoc: PDFDocumentProxy | null;
  imageSrc?: string | null;
  imageName?: string;
  currentPage: number;
  scale: number;
  rotation: number;
  fitMode: FitMode;
  onScaleCalculated: (newScale: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  totalPages: number;
  onUploadImageClick?: () => void;
}

export const PdfCanvas: React.FC<PdfCanvasProps> = ({
  pdfDoc,
  imageSrc,
  imageName = 'ADIB_Document.jpg',
  currentPage,
  scale,
  rotation,
  fitMode,
  onScaleCalculated,
  onNextPage,
  onPrevPage,
  totalPages,
  onUploadImageClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const [isRendering, setIsRendering] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 794,
    height: 1123,
  });

  // Load natural dimensions when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const w = img.naturalWidth || 794;
      const h = img.naturalHeight || 1123;
      setNaturalDimensions({ width: w, height: h });
    };
  }, [imageSrc]);

  // ResizeObserver to calculate fit-width / fit-page dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    if (!pdfDoc && !imageSrc) return;

    const calculateFit = async () => {
      try {
        const container = containerRef.current;
        if (!container) return;

        // Leave comfortable padding around the document
        const availableWidth = container.clientWidth - 48;
        const availableHeight = container.clientHeight - 48;

        if (imageSrc) {
          const baseWidth = naturalDimensions.width;
          const baseHeight = naturalDimensions.height;
          if (fitMode === 'width' && availableWidth > 0) {
            const widthScale = availableWidth / baseWidth;
            onScaleCalculated(Math.max(0.2, Math.min(widthScale, 4.0)));
          } else if (fitMode === 'page' && availableWidth > 0 && availableHeight > 0) {
            const widthScale = availableWidth / baseWidth;
            const heightScale = availableHeight / baseHeight;
            const bestScale = Math.min(widthScale, heightScale);
            onScaleCalculated(Math.max(0.2, Math.min(bestScale, 4.0)));
          }
          return;
        }

        if (pdfDoc) {
          const page = await pdfDoc.getPage(currentPage);
          const unscaledViewport = page.getViewport({ scale: 1, rotation });

          if (fitMode === 'width' && availableWidth > 0) {
            const widthScale = availableWidth / unscaledViewport.width;
            onScaleCalculated(Math.max(0.3, Math.min(widthScale, 3.5)));
          } else if (fitMode === 'page' && availableWidth > 0 && availableHeight > 0) {
            const widthScale = availableWidth / unscaledViewport.width;
            const heightScale = availableHeight / unscaledViewport.height;
            const bestScale = Math.min(widthScale, heightScale);
            onScaleCalculated(Math.max(0.3, Math.min(bestScale, 3.5)));
          }
        }
      } catch (err) {
        console.warn('Error calculating fit scale:', err);
      }
    };

    if (fitMode === 'width' || fitMode === 'page') {
      calculateFit();
    }

    const ro = new ResizeObserver(() => {
      if (fitMode === 'width' || fitMode === 'page') {
        calculateFit();
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [pdfDoc, imageSrc, naturalDimensions, currentPage, rotation, fitMode, onScaleCalculated]);

  // If using imageSrc, update page dimensions directly from scale
  useEffect(() => {
    if (imageSrc) {
      setPageSize({
        width: Math.floor(naturalDimensions.width * scale),
        height: Math.floor(naturalDimensions.height * scale),
      });
      setIsRendering(false);
    }
  }, [imageSrc, scale, naturalDimensions]);

  // Main rendering effect for PDF canvas (when imageSrc is not used)
  useEffect(() => {
    if (imageSrc) return;
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      setIsRendering(true);

      // Cancel previous ongoing render task if active
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancellation exception
        }
        renderTaskRef.current = null;
      }

      try {
        const page: PDFPageProxy = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        // High DPI sharpness
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setPageSize({ width: viewport.width, height: viewport.height });

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

        const renderContext = {
          canvas: canvas,
          canvasContext: context,
          viewport: viewport,
          transform: transform,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (error: any) {
        // PDF.js throws an exception when a render task is cancelled
        if (error?.name === 'RenderingCancelledException') {
          return;
        }
        console.error('PDF Page render error:', error);
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, imageSrc, currentPage, scale, rotation]);

  // Touch pinch-to-zoom and double-tap gestures for mobile & iOS
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(scale);
  const lastTapTimeRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        if (scale > 1.1) {
          onScaleCalculated(0.85);
        } else {
          onScaleCalculated(1.35);
        }
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const newScale = Math.min(3.8, Math.max(0.35, touchStartScaleRef.current * factor));
      onScaleCalculated(Number(newScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  return (
    <main
      ref={containerRef}
      id="pdf-canvas-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex-1 w-full h-full overflow-auto custom-scrollbar ios-smooth-scroll flex items-start sm:items-center justify-center p-2 sm:p-8 bg-neutral-950/90 select-none focus:outline-none"
      tabIndex={0}
    >
      <div className="min-w-full min-h-full flex items-center justify-center py-2 sm:py-4">
        {/* Centered Document Sheet */}
        <div
          id="pdf-page-sheet"
          className="relative transition-all duration-150 ease-out my-auto mx-auto group pdf-canvas-container"
          style={{
            width: pageSize ? `${pageSize.width}px` : 'auto',
            height: pageSize ? `${pageSize.height}px` : 'auto',
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
          }}
        >
          {imageSrc ? (
            <div className="relative w-full h-full">
              <img
                id="pdf-main-image"
                src={imageSrc}
                alt={imageName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-white shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-sm border border-neutral-800 block select-none pointer-events-auto"
              />
            </div>
          ) : (
            /* Canvas element */
            <canvas
              ref={canvasRef}
              id="pdf-main-canvas"
              className="bg-white shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-sm border border-neutral-800 transition-opacity block"
            />
          )}

          {/* Interactive QR Code Hotspot (Links directly to the portal) - only if default image/cert */}
          {imageSrc === '/44.jpg' && (
            <a
              id="pdf-cert-qr-hotspot"
              href={typeof window !== 'undefined' ? window.location.origin.replace('ais-dev-', 'ais-pre-') : '#'}
              target="_blank"
              rel="noopener noreferrer"
              title="رمز الاستجابة السريعة (QR Code) لبوابة التحقق الرسمية - انقر لفتح أو نسخ الرابط"
              className="absolute z-10 rounded-xs transition-all hover:ring-2 hover:ring-[#003865]/60 hover:bg-[#003865]/10 cursor-pointer"
              style={{
                left: '43.06%',
                top: '53.99%',
                width: '9.68%',
                height: '6.84%',
              }}
            />
          )}

          {/* Subtle loading spinner overlay */}
          {isRendering && (
            <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-[1px] flex items-center justify-center rounded-sm transition-all pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 text-neutral-200 text-xs shadow-lg border border-neutral-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>جاري العرض...</span>
              </div>
            </div>
          )}

          {/* Hover Quick Nav overlay arrows (Right & Left) */}
          {currentPage > 1 && (
            <button
              id="btn-quick-prev-page"
              onClick={onPrevPage}
              className="absolute top-1/2 -translate-y-1/2 -right-12 opacity-0 group-hover:opacity-100 hover:scale-110 p-2.5 rounded-full bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 shadow-xl border border-neutral-700 transition hidden sm:flex items-center justify-center z-10"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-0" />
            </button>
          )}

          {currentPage < totalPages && (
            <button
              id="btn-quick-next-page"
              onClick={onNextPage}
              className="absolute top-1/2 -translate-y-1/2 -left-12 opacity-0 group-hover:opacity-100 hover:scale-110 p-2.5 rounded-full bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 shadow-xl border border-neutral-700 transition hidden sm:flex items-center justify-center z-10"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-0" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
};
