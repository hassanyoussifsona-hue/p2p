import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { X, Search, FileText } from 'lucide-react';
import { DocumentMeta } from '../types';

interface ThumbnailsSidebarProps {
  pdfDoc: PDFDocumentProxy | null;
  imageSrc?: string | null;
  currentPage: number;
  totalPages: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (pageNum: number) => void;
  documentMeta: DocumentMeta | null;
}

interface ThumbnailItemProps {
  pdfDoc?: PDFDocumentProxy | null;
  imageSrc?: string | null;
  pageNumber: number;
  isSelected: boolean;
  onSelect: () => void;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({
  pdfDoc,
  imageSrc,
  pageNumber,
  isSelected,
  onSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (imageSrc) {
      setIsLoaded(true);
      return;
    }
    if (!pdfDoc) return;

    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        // Render at small thumbnail scale (e.g. width ~140px)
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = 140 / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvas: canvas,
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        if (!isCancelled) {
          setIsLoaded(true);
        }
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') {
          // ignore error
        }
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, imageSrc, pageNumber]);

  return (
    <button
      id={`thumbnail-page-${pageNumber}`}
      onClick={onSelect}
      className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all text-right w-full ${
        isSelected
          ? 'bg-blue-950/50 border-blue-500 shadow-md ring-1 ring-blue-500/50'
          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
      }`}
    >
      <div className="relative w-full aspect-[1/1.414] bg-neutral-950 rounded overflow-hidden flex items-center justify-center border border-neutral-800">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`Page ${pageNumber}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain bg-white"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        {!isLoaded && !imageSrc && (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600 text-xs font-mono">
            {pageNumber}
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between mt-2 px-1 text-xs">
        <span
          className={`font-semibold ${
            isSelected ? 'text-blue-400' : 'text-neutral-400 group-hover:text-neutral-200'
          }`}
        >
          صفحة {pageNumber}
        </span>
        {isSelected && (
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
        )}
      </div>
    </button>
  );
};

export const ThumbnailsSidebar: React.FC<ThumbnailsSidebarProps> = ({
  pdfDoc,
  imageSrc,
  currentPage,
  totalPages,
  isOpen,
  onClose,
  onSelectPage,
  documentMeta,
}) => {
  const [filterText, setFilterText] = useState('');
  const activeThumbnailRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter((num) => {
    if (!filterText.trim()) return true;
    return num.toString().includes(filterText.trim());
  });

  return (
    <aside
      id="pdf-thumbnails-sidebar"
      className="no-print w-64 sm:w-72 bg-neutral-900/95 border-l border-neutral-800 flex flex-col h-full z-20 shadow-2xl backdrop-blur select-none animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-xs sm:text-sm text-neutral-200">
            صفحات المستند ({totalPages})
          </h2>
        </div>
        <button
          id="btn-close-sidebar"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
          title="إغلاق اللوحة الجانبية"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search / Filter */}
      <div className="p-3 border-b border-neutral-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            id="input-filter-thumbnails"
            type="text"
            placeholder="انتقال أو تصفية برقم الصفحة..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pr-8 pl-3 py-1.5 text-base sm:text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Thumbnails Grid List */}
      <div
        id="thumbnails-scroll-container"
        className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3"
      >
        {(pdfDoc || imageSrc) &&
          pageNumbers.map((pNum) => (
            <div
              key={pNum}
              ref={pNum === currentPage ? activeThumbnailRef : null}
            >
              <ThumbnailItem
                pdfDoc={pdfDoc}
                imageSrc={imageSrc}
                pageNumber={pNum}
                isSelected={pNum === currentPage}
                onSelect={() => onSelectPage(pNum)}
              />
            </div>
          ))}

        {pageNumbers.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-xs">
            لا توجد صفحات مطابقة لرقم البحث
          </div>
        )}
      </div>

      {/* Document info footer */}
      {documentMeta && (
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 text-[11px] text-neutral-400 space-y-1">
          <div className="truncate font-medium text-neutral-300" title={documentMeta.fileName}>
            {documentMeta.fileName}
          </div>
          {documentMeta.fileSize && (
            <div className="text-neutral-500">الحجم: {documentMeta.fileSize}</div>
          )}
        </div>
      )}
    </aside>
  );
};
