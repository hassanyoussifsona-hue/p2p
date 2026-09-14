import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Smartphone,
  Share2,
  Link2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Palette,
  FileText,
  Globe,
} from 'lucide-react';
import { Language } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';

  // Obtain the live URLs safely
  const getLiveUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const getOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const [selectedTarget, setSelectedTarget] = useState<'current' | 'portal' | 'standalone' | 'pdf' | 'custom'>('current');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrColorTheme, setQrColorTheme] = useState<'adib' | 'classic' | 'emerald'>('adib');
  const [canShare, setCanShare] = useState(false);

  // Card reference for printing
  const cardPrintRef = useRef<HTMLDivElement>(null);

  // Check if Web Share API is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setCanShare(true);
    }
  }, []);

  // Sync activeUrl when target or customUrl changes
  useEffect(() => {
    const origin = getOrigin();
    const current = getLiveUrl();

    if (selectedTarget === 'current') {
      setActiveUrl(current);
    } else if (selectedTarget === 'portal') {
      setActiveUrl(origin);
    } else if (selectedTarget === 'standalone') {
      setActiveUrl(`${origin}/adib_certificate_standalone.html`);
    } else if (selectedTarget === 'pdf') {
      setActiveUrl(`${origin}/adib_certificate.pdf`);
    } else if (selectedTarget === 'custom') {
      setActiveUrl(customUrl || origin);
    }
  }, [selectedTarget, customUrl, isOpen]);

  // Color scheme configs for QR code
  const colorConfigs = {
    adib: {
      dark: '#002b49', // ADIB Deep Navy
      light: '#ffffff',
      labelAr: 'كحلي المصرف (ADIB)',
      labelEn: 'ADIB Deep Navy',
    },
    classic: {
      dark: '#000000',
      light: '#ffffff',
      labelAr: 'أسود كلاسيكي',
      labelEn: 'Classic Black',
    },
    emerald: {
      dark: '#064e3b', // Emerald
      light: '#ffffff',
      labelAr: 'أخضر توثيق',
      labelEn: 'Verified Emerald',
    },
  };

  // Generate QR Code dynamically whenever activeUrl or color changes
  useEffect(() => {
    if (!isOpen || !activeUrl) return;

    let isMounted = true;
    setIsGenerating(true);

    const cfg = colorConfigs[qrColorTheme];

    QRCode.toDataURL(activeUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: cfg.dark,
        light: cfg.light,
      },
    })
      .then((url: string) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err: any) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) {
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeUrl, qrColorTheme]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2200);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setIsCopiedImage(true);
      setTimeout(() => setIsCopiedImage(false), 2200);
    } catch (err) {
      console.warn('Could not copy image directly, downloading instead:', err);
      handleDownloadQr();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `ADIB_Page_QRCode_${selectedTarget}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isAr ? 'رابط وثيقة مصرف أبوظبي الإسلامي' : 'ADIB Document Verification Portal',
          text: isAr
            ? 'بوابة التحقق الرسمية من الوثائق والمستندات - مصرف أبوظبي الإسلامي'
            : 'Official Document Verification Portal - Abu Dhabi Islamic Bank',
          url: activeUrl,
        });
      } catch (e) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div
      id="qr-code-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#002b49]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'رابط الصفحة ورمز الاستجابة السريعة (QR Code)' : 'Page Link & QR Code'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isAr ? 'تحويل فوري' : 'Live Sync'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'رابط الصفحة من داخل التطبيق مع تحويله تلقائياً لرمز باركود QR قابل للمسح والتحميل'
                  : 'Get the in-app page link and instantly convert it into a scannable & downloadable QR code'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-qr-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4.5 custom-scrollbar text-slate-200">
          {/* Target URL Quick Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>{isAr ? 'اختر الرابط المراد نسخه وتحويله إلى QR:' : 'Select link to copy & convert to QR:'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <button
                type="button"
                id="tab-qr-current"
                onClick={() => setSelectedTarget('current')}
                className={`py-2 px-2 rounded-lg font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  selectedTarget === 'current'
                    ? 'bg-[#003865] text-white shadow-sm ring-1 ring-blue-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#c5a059]" />
                <span className="truncate">{isAr ? 'الصفحة الحالية' : 'Current Page'}</span>
              </button>

              <button
                type="button"
                id="tab-qr-portal"
                onClick={() => setSelectedTarget('portal')}
                className={`py-2 px-2 rounded-lg font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  selectedTarget === 'portal'
                    ? 'bg-[#003865] text-white shadow-sm ring-1 ring-blue-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span className="truncate">{isAr ? 'بوابة التحقق' : 'Full Portal'}</span>
              </button>

              <button
                type="button"
                id="tab-qr-standalone"
                onClick={() => setSelectedTarget('standalone')}
                className={`py-2 px-2 rounded-lg font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  selectedTarget === 'standalone'
                    ? 'bg-[#003865] text-white shadow-sm ring-1 ring-blue-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span className="truncate">{isAr ? 'شهادة مستقلة' : 'Standalone'}</span>
              </button>

              <button
                type="button"
                id="tab-qr-custom"
                onClick={() => {
                  setSelectedTarget('custom');
                  if (!customUrl) setCustomUrl(getLiveUrl());
                }}
                className={`py-2 px-2 rounded-lg font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  selectedTarget === 'custom'
                    ? 'bg-[#003865] text-white shadow-sm ring-1 ring-blue-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Link2 className="w-3 h-3 text-emerald-400" />
                <span className="truncate">{isAr ? 'رابط مخصص' : 'Custom URL'}</span>
              </button>
            </div>
          </div>

          {/* In-App Page Link Display & Copy Bar */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Link2 className="w-3.5 h-3.5 text-[#c5a059]" />
                {isAr ? 'رابط الصفحة الفعلي (Link):' : 'Active Page URL:'}
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isAr ? 'جاهز للنسخ والمشاركة' : 'Ready to share'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0">
                <input
                  id="input-active-page-url"
                  type="text"
                  dir="ltr"
                  value={selectedTarget === 'custom' ? customUrl : activeUrl}
                  onChange={(e) => {
                    setSelectedTarget('custom');
                    setCustomUrl(e.target.value);
                  }}
                  placeholder="https://..."
                  className="w-full bg-slate-950 text-slate-200 text-xs font-mono py-2.5 px-3 rounded-lg border border-slate-700/80 focus:outline-none focus:border-[#0090df] focus:ring-1 focus:ring-[#0090df] transition"
                />
              </div>

              {/* Copy Link Button */}
              <button
                type="button"
                id="btn-copy-page-link"
                onClick={handleCopyLink}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm ${
                  isCopiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#003865] hover:bg-[#002b49] text-white'
                }`}
                title={isAr ? 'نسخ الرابط إلى الحافظة' : 'Copy link to clipboard'}
              >
                {isCopiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isAr ? 'نسخ الرابط' : 'Copy'}</span>
                  </>
                )}
              </button>

              {/* Native Share button if supported */}
              {canShare && (
                <button
                  type="button"
                  id="btn-share-page-link"
                  onClick={handleShare}
                  className="py-2.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer shrink-0"
                  title={isAr ? 'مشاركة الرابط' : 'Share link'}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Open in new tab */}
              <a
                id="link-open-new-tab"
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition shrink-0 flex items-center justify-center"
                title={isAr ? 'فتح الرابط في نافذة جديدة' : 'Open in new tab'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {selectedTarget === 'custom' && (
              <p className="text-[11px] text-[#c5a059]">
                {isAr
                  ? '💡 يمكنك كتابة أو لصق أي رابط تريده لتحويله فوراً إلى رمز QR في المربع أدناه.'
                  : '💡 You can enter or paste any URL above to instantly convert it into a QR code.'}
              </p>
            )}
          </div>

          {/* QR Code Presentation Card */}
          <div
            ref={cardPrintRef}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            {/* Bank watermark / badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-col items-center">
                <span className="text-base font-black tracking-wider text-slate-100">ADIB</span>
                <span className="text-[9px] font-semibold text-[#c5a059] uppercase">
                  {isAr ? 'مصرف أبوظبي الإسلامي - توثيق المستندات' : 'Abu Dhabi Islamic Bank - Document Verification'}
                </span>
              </div>
            </div>

            {/* QR Container with high-contrast frame */}
            <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-[#c5a059]/40 relative group transition-transform hover:scale-[1.01]">
              {isGenerating || !qrDataUrl ? (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl space-y-2">
                  <div className="w-8 h-8 border-3 border-[#002b49] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-slate-500 font-medium">
                    {isAr ? 'جاري تحويل الرابط...' : 'Converting to QR...'}
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 block rounded-lg select-all"
                  />
                  {/* Center Brand Emblem in QR code */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
                      <span className="text-[10px] font-black text-[#002b49]">ADIB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick scan instruction */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>
                {isAr
                  ? 'امسح الرمز بكاميرا الهاتف لفتح الصفحة مباشرة'
                  : 'Scan with smartphone camera to open page directly'}
              </span>
            </div>

            {/* Color Palette Selector */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Palette className="w-3 h-3 text-[#c5a059]" />
                {isAr ? 'لون الرمز:' : 'Theme:'}
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['adib', 'classic', 'emerald'] as const).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setQrColorTheme(theme)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      qrColorTheme === theme
                        ? 'bg-slate-800 text-white font-semibold ring-1 ring-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isAr ? colorConfigs[theme].labelAr : colorConfigs[theme].labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons: Download, Copy Image, Print */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              id="btn-download-qr-image"
              type="button"
              onClick={handleDownloadQr}
              disabled={isGenerating || !qrDataUrl}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#003865] to-[#0284c7] hover:from-[#002b49] hover:to-[#0369a1] text-white text-xs font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">{isAr ? 'تنزيل كصورة (PNG)' : 'Download PNG'}</span>
            </button>

            <button
              id="btn-copy-qr-image"
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating || !qrDataUrl}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              {isCopiedImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 truncate">{isAr ? 'تم نسخ الصورة!' : 'Image Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{isAr ? 'نسخ صورة الرمز' : 'Copy Image'}</span>
                </>
              )}
            </button>

            <button
              id="btn-print-qr-card"
              type="button"
              onClick={handlePrintCard}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{isAr ? 'طباعة بطاقة الباركود' : 'Print Card'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
