import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, FileText, CornerDownLeft } from 'lucide-react';

interface QuickPageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  currentPage: number;
  onJumpToPage: (page: number) => void;
}

export const QuickPageSearch: React.FC<QuickPageSearchProps> = ({
  isOpen,
  onClose,
  totalPages,
  currentPage,
  onJumpToPage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJump = (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= totalPages) {
      onJumpToPage(targetPage);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(searchTerm.trim(), 10);
    if (!isNaN(num)) {
      handleJump(num);
    }
  };

  // Generate quick suggested page jumps
  const parsedNum = parseInt(searchTerm.trim(), 10);
  const isValidNumber = !isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= totalPages;

  return (
    <div
      id="search-page-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-24 px-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 border-b border-neutral-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-1" />
          <input
            ref={inputRef}
            type="text"
            placeholder={`اكتب رقم الصفحة (1 - ${totalPages})...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-base sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!isValidNumber}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-medium flex items-center gap-1 transition"
          >
            <span>انتقال</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Suggested Quick Jumps */}
        <div className="p-3 max-h-60 overflow-y-auto space-y-1 text-xs">
          {isValidNumber ? (
            <button
              onClick={() => handleJump(parsedNum)}
              className="w-full text-right flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 hover:bg-blue-900/50 transition"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>الانتقال المباشر إلى الصفحة <strong>{parsedNum}</strong></span>
              </div>
              <ArrowLeft className="w-4 h-4 text-blue-400" />
            </button>
          ) : (
            <div className="text-neutral-400 text-xs px-2 py-1">
              انتقال سريع للصفحات الرئيسية:
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleJump(1)}
              className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-right flex items-center justify-between transition"
            >
              <span>الصفحة الأولى (الغلاف)</span>
              <span className="text-neutral-500 font-mono">1</span>
            </button>

            <button
              onClick={() => handleJump(totalPages)}
              className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-right flex items-center justify-between transition"
            >
              <span>الصفحة الأخيرة</span>
              <span className="text-neutral-500 font-mono">{totalPages}</span>
            </button>

            {totalPages >= 3 && (
              <button
                onClick={() => handleJump(Math.ceil(totalPages / 2))}
                className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-right flex items-center justify-between transition"
              >
                <span>منتصف المستند</span>
                <span className="text-neutral-500 font-mono">{Math.ceil(totalPages / 2)}</span>
              </button>
            )}

            <button
              onClick={() => handleJump(currentPage)}
              className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-right flex items-center justify-between transition"
            >
              <span>الصفحة الحالية</span>
              <span className="text-neutral-500 font-mono">{currentPage}</span>
            </button>
          </div>
        </div>

        {/* Footer shortcuts tip */}
        <div className="p-2.5 bg-neutral-950/60 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>يمكنك أيضاً استخدام مفاتيح الأسهم أو Home / End</span>
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
            Esc للإغلاق
          </kbd>
        </div>
      </div>
    </div>
  );
};
