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
  FileCheck,
  ShieldCheck,
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
  const liveUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const [selectedTarget, setSelectedTarget] = useState<'portal' | 'standalone' | 'pdf'>('portal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const cardPrintRef = useRef<HTMLDivElement>(null);

  const targetUrls = {
    portal: liveUrl,
    standalone: `${liveUrl}/adib_certificate_standalone.html`,
    pdf: `${liveUrl}/adib_certificate.pdf`,
  };

  const activeUrl = targetUrls[selectedTarget];

  useEffect(() => {
    if (!isOpen || !activeUrl) return;

    setIsGenerating(true);
    QRCode.toDataURL(activeUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#002b49',
        light: '#ffffff',
      },
    })
      .then((url: string) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err: any) => {
        console.error('Failed to generate QR code:', err);
        setIsGenerating(false);
      });
  }, [isOpen, activeUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `ADIB_QR_Code_${selectedTarget}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        className="w-full max-w-lg bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#002b49]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'رمز الاستجابة السريعة (QR Code) للموقع' : 'Website QR Code / Barcode'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'امسح الرمز بكاميرا أي هاتف لفتح الرابط فوراً أو قم بتنزيله كصورة'
                  : 'Scan with any smartphone camera or download as an image'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-qr-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar text-slate-200">
          {/* Target URL Selector Tabs */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedTarget('portal')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-medium transition cursor-pointer text-center ${
                selectedTarget === 'portal'
                  ? 'bg-[#003865] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'بوابة التحقق الكاملة' : 'Full Portal'}
            </button>
            <button
              onClick={() => setSelectedTarget('standalone')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-medium transition cursor-pointer text-center ${
                selectedTarget === 'standalone'
                  ? 'bg-[#003865] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'صفحة الشهادة المستقلة' : 'Standalone Certificate'}
            </button>
            <button
              onClick={() => setSelectedTarget('pdf')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-medium transition cursor-pointer text-center ${
                selectedTarget === 'pdf'
                  ? 'bg-[#003865] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'ملف الـ PDF المباشر' : 'Direct PDF'}
            </button>
          </div>

          {/* QR Code Presentation Card */}
          <div
            ref={cardPrintRef}
            className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            {/* Bank watermark / badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-col items-center">
                <span className="text-base font-black tracking-wider text-slate-100">ADIB</span>
                <span className="text-[9px] font-semibold text-[#c5a059] uppercase">
                  {isAr ? 'مصرف أبوظبي الإسلامي' : 'Abu Dhabi Islamic Bank'}
                </span>
              </div>
            </div>

            {/* QR Container with high-contrast frame */}
            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[#c5a059]/40 relative group">
              {isGenerating || !qrDataUrl ? (
                <div className="w-52 h-52 flex items-center justify-center bg-slate-100 rounded-xl">
                  <div className="w-8 h-8 border-3 border-[#002b49] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-52 h-52 sm:w-56 sm:h-56 block rounded-lg select-all"
                  />
                  {/* Subtle Center Brand Emblem in QR code */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
                      <span className="text-[10px] font-black text-[#002b49]">ADIB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick scan instruction */}
            <div className="mt-3.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Smartphone className="w-4 h-4" />
              <span>{isAr ? 'امسح بالكاميرا للفتح الفوري على هاتفك' : 'Scan with camera to open on mobile'}</span>
            </div>

            {/* Encoded URL display */}
            <div className="mt-2 text-[11px] font-mono text-slate-400 max-w-sm truncate dir-ltr select-all px-2 py-1 rounded-md bg-slate-950 border border-slate-800/80">
              {activeUrl}
            </div>
          </div>

          {/* Action Buttons: Download, Copy, External, Print */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              id="btn-download-qr-image"
              onClick={handleDownloadQr}
              disabled={isGenerating || !qrDataUrl}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#003865] to-[#0284c7] hover:from-[#002b49] hover:to-[#0369a1] text-white text-xs font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تنزيل الباركود كصورة (PNG)' : 'Download QR Image'}</span>
            </button>

            <button
              id="btn-copy-qr-link"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">{isAr ? 'تم نسخ الرابط!' : 'Link Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>{isAr ? 'نسخ رابط الموقع' : 'Copy Link'}</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs text-slate-400">
            <a
              href={activeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[#c5a059] transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isAr ? 'فتح الرابط في صفحة جديدة' : 'Open link in new tab'}</span>
            </a>

            <button
              onClick={handlePrintCard}
              className="flex items-center gap-1.5 hover:text-slate-200 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة بطاقة الباركود' : 'Print QR Card'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
