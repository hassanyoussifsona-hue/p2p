import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface ContinuousViewProps {
  pdfDoc: PDFDocumentProxy | null;
  imageSrc?: string | null;
  imagePages?: string[];
  scale: number;
  rotation: number;
  onVisiblePageChange: (pageNum: number) => void;
  totalPages: number;
}

interface PageItemProps {
  pdfDoc?: PDFDocumentProxy | null;
  imageSrc?: string | null;
  pageNumber: number;
  scale: number;
  rotation: number;
  onIntersect: (pageNum: number) => void;
}

const ContinuousPageItem: React.FC<PageItemProps> = ({
  pdfDoc,
  imageSrc,
  pageNumber,
  scale,
  rotation,
  onIntersect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const baseW = img.naturalWidth || 1240;
        const baseH = img.naturalHeight || 1754;
        // Standardize reference scale so 1.0 looks crisp and comfortable on screen
        const refWidth = baseW > 1000 ? baseW * 0.65 : baseW;
        const refHeight = baseH > 1000 ? baseH * 0.65 : baseH;
        setDimensions({
          width: Math.floor(refWidth * scale),
          height: Math.floor(refHeight * scale),
        });
        setIsRendered(true);
      };
      return;
    }

    if (!pdfDoc) return;
    let isCancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setDimensions({ width: viewport.width, height: viewport.height });

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

        await page.render({
          canvas: canvas,
          canvasContext: ctx,
          viewport,
          transform,
        }).promise;

        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Render error on continuous page ${pageNumber}:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, imageSrc, pageNumber, scale, rotation]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            onIntersect(pageNumber);
          }
        });
      },
      { threshold: [0.4] }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pageNumber, onIntersect]);

  return (
    <div
      ref={containerRef}
      id={`continuous-page-${pageNumber}`}
      className="relative flex flex-col items-center my-6 group"
    >
      <div
        className="relative bg-white shadow-2xl rounded-sm border border-neutral-800"
        style={{
          width: dimensions ? `${dimensions.width}px` : 'auto',
          height: dimensions ? `${dimensions.height}px` : 'auto',
          minHeight: '200px',
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="ADIB Certificate"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain block select-none pointer-events-none"
          />
        ) : (
          <canvas ref={canvasRef} className="block" />
        )}
        {pageNumber === 1 && (
          <a
            id="continuous-cert-qr-hotspot"
            href={typeof window !== 'undefined' ? window.location.origin.replace('ais-dev-', 'ais-pre-') : '#'}
            target="_blank"
            rel="noopener noreferrer"
            title="رمز الاستجابة السريعة (QR Code) لبوابة التحقق الرسمية - انقر لفتح أو فحص الرابط"
            className="absolute z-10 rounded-xs transition-all hover:ring-2 hover:ring-[#003865]/60 hover:bg-[#003865]/10 cursor-pointer"
            style={{
              left: '43.06%',
              top: '53.99%',
              width: '9.68%',
              height: '6.84%',
            }}
          />
        )}
        {!isRendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/10 text-neutral-500 text-xs">
            تحميل صفحة {pageNumber}...
          </div>
        )}
      </div>
      <div className="mt-2 text-xs font-mono text-neutral-400 bg-neutral-900/80 px-2.5 py-0.5 rounded-full border border-neutral-800">
        {pageNumber}
      </div>
    </div>
  );
};

export const ContinuousView: React.FC<ContinuousViewProps> = ({
  pdfDoc,
  imageSrc,
  imagePages,
  scale,
  rotation,
  onVisiblePageChange,
  totalPages,
}) => {
  if (!pdfDoc && !imageSrc) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <main
      id="continuous-scroll-wrapper"
      className="relative flex-1 w-full h-full overflow-y-auto custom-scrollbar p-6 bg-neutral-950 flex flex-col items-center"
    >
      {pages.map((pNum) => (
        <ContinuousPageItem
          key={pNum}
          pdfDoc={pdfDoc}
          imageSrc={imagePages && imagePages[pNum - 1] ? imagePages[pNum - 1] : imageSrc}
          pageNumber={pNum}
          scale={scale}
          rotation={rotation}
          onIntersect={onVisiblePageChange}
        />
      ))}
    </main>
  );
};
