import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  Image as ImageIcon,
  Database,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Plus,
  Move,
  Layers,
} from 'lucide-react';
import { StoredImage } from '../lib/pdfStorage';
import { Language } from '../types';

interface CenterImageViewerProps {
  images: StoredImage[];
  selectedImage: StoredImage | null;
  onSelectImage: (image: StoredImage) => void;
  onUploadImage: (file: File) => void;
  onDeleteImage: (id: string) => void;
  lang: Language;
}

export const CenterImageViewer: React.FC<CenterImageViewerProps> = ({
  images,
  selectedImage,
  onSelectImage,
  onUploadImage,
  onDeleteImage,
  lang,
}) => {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGallery, setShowGallery] = useState(true);

  // Reset transforms when selected image changes
  useEffect(() => {
    setScale(1.0);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [selectedImage?.id]);

  // Handle zoom in/out
  const handleZoomIn = () => setScale((s) => Math.min(4.0, Number((s + 0.2).toFixed(2))));
  const handleZoomOut = () => setScale((s) => Math.max(0.2, Number((s - 0.2).toFixed(2))));
  const handleResetZoom = () => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1.0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Download active image
  const handleDownload = () => {
    if (!selectedImage) return;
    const a = document.createElement('a');
    a.href = selectedImage.dataUrl;
    a.download = selectedImage.fileName || 'image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Format date helper
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString();
  };

  return (
    <div
      ref={containerRef}
      id="center-image-viewer"
      className="relative flex-1 w-full h-full flex flex-col bg-[#070b14] text-slate-100 overflow-hidden select-none"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUploadImage(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/40 cursor-pointer transition hover:scale-105 active:scale-95"
          title={isAr ? 'رفع صورة جديدة وحفظها في قاعدة البيانات' : 'Upload image to database'}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAr ? 'رفع صورة لقاعدة البيانات' : 'Upload Image'}</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Database indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 text-[11px] text-[#c5a059] font-medium border border-slate-700/50">
          <Database className="w-3.5 h-3.5" />
          <span>{isAr ? `قاعدة البيانات (${images.length})` : `Database (${images.length})`}</span>
        </div>

        {selectedImage && (
          <>
            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={isAr ? 'تصغير' : 'Zoom Out'}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 text-xs font-mono font-medium text-slate-200 hover:text-white cursor-pointer"
                title={isAr ? 'إعادة ضبط الحجم' : 'Reset Zoom'}
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={isAr ? 'تكبير' : 'Zoom In'}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate */}
            <button
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
              title={isAr ? 'تدوير 90°' : 'Rotate 90°'}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
              title={isAr ? 'تحميل الصورة' : 'Download Image'}
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
              title={isFullscreen ? (isAr ? 'إنهاء ملء الشاشة' : 'Exit Fullscreen') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Delete Image */}
            <button
              onClick={() => onDeleteImage(selectedImage.id)}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition cursor-pointer"
              title={isAr ? 'حذف من قاعدة البيانات' : 'Delete from database'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Main Center Area */}
      <div
        className={`relative flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden ${
          scale > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {selectedImage ? (
          <div
            className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            <img
              ref={imageRef}
              src={selectedImage.dataUrl}
              alt={selectedImage.fileName}
              draggable={false}
              className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-800/80 bg-neutral-900/90 pointer-events-auto"
              style={{
                imageRendering: '-webkit-optimize-contrast',
              }}
            />
          </div>
        ) : (
          /* Empty Database State */
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-[#003865]/40 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] mb-5 shadow-inner">
              <Database className="w-10 h-10 animate-pulse text-[#c5a059]" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {isAr ? 'عارض الصور من قاعدة البيانات' : 'Database Image Viewer'}
            </h2>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isAr
                ? 'لا توجد صور محفوظة في قاعدة البيانات حتى الآن. يمكنك رفع أي صورة ليتم تخزينها وعرضها فوراً في منتصف التطبيق.'
                : 'No images in the database yet. Upload any image to store and view it directly in the center.'}
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer transition hover:scale-105 active:scale-95 mb-4"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isAr ? 'رفع صورة وحفظها في قاعدة البيانات' : 'Upload Image to Database'}</span>
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'يدعم صور JPG, PNG, WEBP, SVG' : 'Supports JPG, PNG, WEBP, SVG'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Database Images Gallery Strip */}
      {images.length > 0 && (
        <div className="relative border-t border-slate-800 bg-slate-950/95 backdrop-blur-md p-2 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-300">
              <Layers className="w-4 h-4 text-[#c5a059]" />
              <span className="hidden sm:inline">
                {isAr ? `الصور المخزنة في قاعدة البيانات (${images.length}):` : `Database Images (${images.length}):`}
              </span>
            </div>

            {/* Thumbnails row */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 ios-smooth-scroll">
              {images.map((img, idx) => {
                const isSelected = selectedImage?.id === img.id;
                return (
                  <button
                    key={img.id}
                    onClick={() => onSelectImage(img)}
                    className={`group relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                        : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                    title={`${img.fileName} (${formatDate(img.savedAt)})`}
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.fileName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white truncate px-1 py-0.5 text-center font-mono">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Upload Button at end of strip */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              title={isAr ? 'إضافة صورة جديدة لقاعدة البيانات' : 'Add new image to database'}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{isAr ? 'إضافة صورة' : 'Add Image'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
