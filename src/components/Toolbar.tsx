import React, { useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  RotateCw,
  LayoutGrid,
  FileText,
  Search,
  Columns2,
  FileSpreadsheet,
  Globe,
  ImagePlus,
  RotateCcw,
} from 'lucide-react';
import { FitMode, ViewMode, Language } from '../types';

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  fitMode: FitMode;
  isFullscreen: boolean;
  isSidebarOpen: boolean;
  documentTitle: string;
  lang: Language;
  onPageChange: (page: number) => void;
  onZoomChange: (scale: number, fit?: FitMode) => void;
  onRotateChange: () => void;
  onViewModeToggle: () => void;
  onFullscreenToggle: () => void;
  onSidebarToggle: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onOpenSearchModal: () => void;
  onOpenSaveWebPageModal?: () => void;
  onUploadFile?: (file: File) => void;
  isCustomFileLoaded?: boolean;
  onResetDefault?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentPage,
  totalPages,
  scale,
  viewMode,
  fitMode,
  isFullscreen,
  isSidebarOpen,
  documentTitle,
  lang,
  onPageChange,
  onZoomChange,
  onRotateChange,
  onViewModeToggle,
  onFullscreenToggle,
  onSidebarToggle,
  onPrint,
  onDownload,
  onOpenSearchModal,
  onOpenSaveWebPageModal,
  onUploadFile,
  isCustomFileLoaded,
  onResetDefault,
}) => {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageInput, setPageInput] = React.useState(currentPage.toString());

  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      id="pdf-main-toolbar"
      className="no-print bg-[#1e293b] text-slate-200 border-b border-slate-700/80 px-2 sm:px-3 py-2 select-none z-20 shadow-sm overflow-x-auto ios-smooth-scroll"
    >
      <div className="flex flex-nowrap sm:flex-wrap items-center justify-between gap-1.5 sm:gap-2 max-w-7xl mx-auto min-w-max sm:min-w-0">
        {/* Left / Start Section: Sidebar toggle & Document info */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="btn-toggle-sidebar"
            onClick={onSidebarToggle}
            className={`p-1.5 sm:p-2 rounded-lg transition flex items-center justify-center cursor-pointer ${
              isSidebarOpen
                ? 'bg-[#003865] text-white ring-1 ring-white/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={isAr ? 'عرض المصغرات وقائمة الصفحات' : 'Toggle Thumbnails & Page List'}
            aria-label="Thumbnails"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Document name indicator */}
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-400 truncate max-w-[260px]">
            <FileText className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
            <span className="truncate font-medium text-slate-200" title={documentTitle}>
              {documentTitle || (isAr ? 'شهادة التوثيق' : 'Document')}
            </span>
          </div>
        </div>

        {/* Center Section: Page Navigation & Search Jump */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800">
          <button
            id="btn-first-page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
            title={isAr ? 'الصفحة الأولى' : 'First Page'}
          >
            {isAr ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>

          <button
            id="btn-prev-page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
            title={isAr ? 'الصفحة السابقة' : 'Previous Page'}
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Page input box */}
          <form onSubmit={handlePageSubmit} className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 hidden sm:inline">
              {isAr ? 'صفحة' : 'Page'}
            </span>
            <input
              id="input-page-number"
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageSubmit}
              className="w-9 sm:w-11 bg-slate-800 text-center text-white font-semibold py-1 rounded border border-slate-700 focus:outline-none focus:border-blue-400 text-base sm:text-xs"
              title={isAr ? 'اكتب رقم الصفحة ثم اضغط Enter' : 'Type page and hit Enter'}
            />
            <span className="text-slate-400 font-medium">/ {totalPages || 1}</span>
          </form>

          <button
            id="btn-next-page"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
            title={isAr ? 'الصفحة التالية' : 'Next Page'}
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <button
            id="btn-last-page"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
            title={isAr ? 'الصفحة الأخيرة' : 'Last Page'}
          >
            {isAr ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
          </button>

          {/* Quick page search/finder button */}
          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
          <button
            id="btn-search-pages"
            onClick={onOpenSearchModal}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition flex items-center gap-1 text-xs cursor-pointer"
            title={isAr ? 'انتقال سريع للصفحات (Ctrl+K)' : 'Jump to page (Ctrl+K)'}
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline text-slate-400">
              {isAr ? 'بحث' : 'Jump'}
            </span>
          </button>
        </div>

        {/* Right Section: Zoom, View Modes, Rotation, Print, Download, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
            <button
              id="btn-zoom-out"
              onClick={() => onZoomChange(Math.max(0.3, scale - 0.15), 'custom')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition cursor-pointer"
              title={isAr ? 'تصغير (-)' : 'Zoom Out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <select
              id="select-zoom-preset"
              value={fitMode === 'custom' ? zoomPercent.toString() : fitMode}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'width') {
                  onZoomChange(scale, 'width');
                } else if (val === 'page') {
                  onZoomChange(scale, 'page');
                } else {
                  const num = parseInt(val, 10) / 100;
                  onZoomChange(num, 'custom');
                }
              }}
              className="bg-transparent text-xs text-slate-200 py-1 px-1.5 focus:outline-none cursor-pointer text-center font-medium"
              title={isAr ? 'نسبة التكبير' : 'Zoom Level'}
            >
              <option value="width" className="bg-slate-900">{isAr ? 'ملائمة العرض' : 'Fit Width'}</option>
              <option value="page" className="bg-slate-900">{isAr ? 'ملائمة الصفحة' : 'Fit Page'}</option>
              <option value="50" className="bg-slate-900">50%</option>
              <option value="75" className="bg-slate-900">75%</option>
              <option value="100" className="bg-slate-900">100%</option>
              <option value="125" className="bg-slate-900">125%</option>
              <option value="150" className="bg-slate-900">150%</option>
              <option value="200" className="bg-slate-900">200%</option>
            </select>

            <button
              id="btn-zoom-in"
              onClick={() => onZoomChange(Math.min(3.5, scale + 0.15), 'custom')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition cursor-pointer"
              title={isAr ? 'تكبير (+)' : 'Zoom In'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotate button */}
          <button
            id="btn-rotate-page"
            onClick={onRotateChange}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition hidden sm:flex items-center justify-center cursor-pointer"
            title={isAr ? 'تدوير الصفحة 90 درجة' : 'Rotate 90°'}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* View Mode Toggle */}
          <button
            id="btn-view-mode-toggle"
            onClick={onViewModeToggle}
            className={`p-2 rounded-lg transition hidden md:flex items-center justify-center cursor-pointer ${
              viewMode === 'continuous'
                ? 'bg-[#003865] text-blue-200 border border-blue-400/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={
              viewMode === 'continuous'
                ? isAr ? 'التبديل إلى صفحة فردية' : 'Switch to single page'
                : isAr ? 'التبديل إلى التمرير المستمر' : 'Switch to continuous scroll'
            }
          >
            {viewMode === 'continuous' ? (
              <Columns2 className="w-4 h-4" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
          </button>

          {/* Upload Image/PDF File button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0] && onUploadFile) {
                onUploadFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          <button
            id="btn-upload-image-toolbar"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title={isAr ? 'رفع صورة جديدة لعرضها تلقائياً في المنتصف' : 'Upload image to display automatically in center'}
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{isAr ? 'رفع صورة' : 'Upload Image'}</span>
          </button>

          {/* Reset to default document button if custom loaded */}
          {isCustomFileLoaded && onResetDefault && (
            <button
              id="btn-reset-default-doc"
              onClick={onResetDefault}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition flex items-center justify-center cursor-pointer"
              title={isAr ? 'استعادة المستند الافتراضي الأصلي' : 'Restore Default Document'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Print button */}
          <button
            id="btn-print-doc"
            onClick={onPrint}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center justify-center cursor-pointer"
            title={isAr ? 'طباعة المستند' : 'Print Document'}
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download button */}
          <button
            id="btn-download-doc"
            onClick={onDownload}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center justify-center cursor-pointer"
            title={isAr ? 'تحميل ملف PDF' : 'Download PDF'}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen button */}
          <button
            id="btn-toggle-fullscreen"
            onClick={onFullscreenToggle}
            className="p-2 rounded-lg bg-[#003865] hover:bg-[#002b49] text-white transition flex items-center justify-center shadow-xs cursor-pointer"
            title={isFullscreen ? (isAr ? 'إنهاء ملء الشاشة' : 'Exit Fullscreen') : (isAr ? 'عرض بملء الشاشة' : 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Save Web Page Button */}
          {onOpenSaveWebPageModal && (
            <button
              id="btn-open-save-webpage"
              onClick={onOpenSaveWebPageModal}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#c5a059] to-amber-500 hover:from-amber-500 hover:to-[#c5a059] text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title={isAr ? 'حفظ كصفحة ويب ورفعها على الإنترنت' : 'Save as Web Page & Deploy'}
            >
              <Globe className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden md:inline">{isAr ? 'حفظ كصفحة ويب' : 'Save Web Page'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
