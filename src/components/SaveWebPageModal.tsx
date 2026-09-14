import React, { useState } from 'react';
import {
  X,
  Download,
  Globe,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  FolderArchive,
  CloudUpload,
  Laptop,
  CheckCircle2,
  FileCode,
  QrCode,
} from 'lucide-react';
import { Language } from '../types';

interface SaveWebPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onOpenQrModal?: () => void;
}

export const SaveWebPageModal: React.FC<SaveWebPageModalProps> = ({
  isOpen,
  onClose,
  lang,
  onOpenQrModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const isAr = lang === 'ar';

  const liveUrl = window.location.origin;

  if (!isOpen) return null;

  const handleDownloadStandaloneHtml = async () => {
    setDownloadingHtml(true);
    try {
      // Fetch the standalone HTML file from public
      const res = await fetch('/adib_certificate_standalone.html');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ADIB_Certificate_Portal.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading standalone html:', err);
      // Fallback: open in new tab
      window.open('/adib_certificate_standalone.html', '_blank');
    } finally {
      setTimeout(() => setDownloadingHtml(false), 800);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div
      id="save-webpage-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#002b49]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'حفظ الصفحة ورفعها على الإنترنت' : 'Save Web Page & Deploy to Internet'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isAr ? 'جاهز فوراً' : 'Ready'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'خيارات حفظ الصفحة كملف ويب على جهازك أو رفعها لتعمل على الإنترنت'
                  : 'Options to save as an offline web page or deploy online globally'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-save-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar text-slate-200">
          
          {/* Option 1: 1-Click Download Standalone HTML */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-[#c5a059]/50 transition space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#c5a059] text-slate-900 text-xs font-bold">1</span>
                  <h4 className="text-sm font-bold text-slate-100">
                    {isAr ? 'تنزيل كصفحة ويب مستقلة (ملف HTML مدمج)' : 'Download Standalone Web Page (.html)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pr-7">
                  {isAr
                    ? 'يتم تنزيل ملف واحد بصيغة HTML مدمج به مستند شهادة ADIB بالكامل وأدوات العرض والتحقق. يمكنك فتحه بالنقر المزدوج على أي حاسوب أو هاتف حتى بدون اتصال بالإنترنت!'
                    : 'Download a single .html file with the certificate document embedded. Opens offline on any browser with full tools.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                id="btn-download-html-file"
                onClick={handleDownloadStandaloneHtml}
                disabled={downloadingHtml}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003865] to-[#0284c7] hover:from-[#002b49] hover:to-[#0369a1] text-white text-xs font-semibold shadow-md transition cursor-pointer"
              >
                {downloadingHtml ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 animate-pulse" />
                    <span>{isAr ? 'جاري تجهيز وتنزيل الملف...' : 'Preparing download...'}</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-4 h-4 text-[#c5a059]" />
                    <span>{isAr ? 'تنزيل صفحة الويب الآن (ADIB_Portal.html)' : 'Download HTML Web Page'}</span>
                  </>
                )}
              </button>

              <a
                href="/adib_certificate_standalone.html"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isAr ? 'معاينة في علامة تبويب جديدة' : 'Open in new tab'}</span>
              </a>
            </div>
          </div>

          {/* Option 2: Live Online Link */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-slate-900 text-xs font-bold">2</span>
              <h4 className="text-sm font-bold text-slate-100">
                {isAr ? 'رابط الصفحة المباشر على الإنترنت (يعمل الآن)' : 'Live Public Web Link (Working Now)'}
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'الصفحة مرفوعة ومستضافة بالفعل على السحابة وتعمل بشكل طبيعي. يمكنك مشاركة هذا الرابط مع أي جهة أو عميل:'
                : 'The page is already deployed to the cloud. You can share this link with anyone:'}
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-700/80">
              <div className="flex-1 text-xs font-mono text-emerald-400 truncate dir-ltr select-all px-1">
                {liveUrl}
              </div>
              <button
                id="btn-copy-live-link"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003865] hover:bg-[#0284c7] text-white text-xs font-medium transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isAr ? 'نسخ الرابط' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>

            {onOpenQrModal && (
              <div className="flex justify-end pt-1">
                <button
                  id="btn-modal-open-qr"
                  onClick={() => {
                    onClose();
                    onOpenQrModal();
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#c5a059] hover:text-amber-300 font-medium transition cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isAr ? 'عرض وتنزيل باركود QR لهذا الرابط' : 'View & download QR code for this link'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Option 3: Step-by-step deploy to any hosting */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-slate-900 text-xs font-bold">3</span>
              <h4 className="text-sm font-bold text-slate-100">
                {isAr ? 'كيف ترفعها على استضافتك الخاصة أو أي موقع مجاني؟' : 'How to deploy to Netlify / Vercel / cPanel?'}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Netlify Drop (أسهل طريقة)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  افتح موقع <strong className="text-slate-200">app.netlify.com/drop</strong> واسحب الملف الذي تم تنزيله في الخطوة 1، وسيعطيك رابطاً عالمياً خلال 10 ثوانٍ مجاناً.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 space-y-1">
                <div className="font-bold text-blue-300 flex items-center gap-1">
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>استضافة cPanel</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  افتح لوحة تحكم موقعك cPanel &gt; مدير الملفات &gt; public_html وارفع ملف <code className="text-emerald-400">index.html</code> وملف الـ PDF وسيعمل فوراً.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>تصدير المشروع كاملاً</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  من القائمة العلوية للتطبيق (Settings)، اضغط على <strong>Export as ZIP</strong> للحصول على سورس كود التطبيق بالكامل مع React و Vite.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-[#001f35] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'الملف مشفر ومدمج بنسبة 100% وجاهز للاستخدام الفوري' : 'Self-contained & ready to publish'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
