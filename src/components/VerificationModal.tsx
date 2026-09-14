import React from 'react';
import { X, ShieldCheck, Calendar, Hash, Building2, CheckCircle2, QrCode } from 'lucide-react';
import { VerificationDetails, Language } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: VerificationDetails;
  lang: Language;
  onOpenQrModal?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  verification,
  lang,
  onOpenQrModal,
}) => {
  if (!isOpen) return null;
  const isAr = lang === 'ar';

  return (
    <div
      id="verification-details-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002b49] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isAr ? 'بيانات التوثيق والاعتماد الإلكتروني' : 'Electronic Verification Record'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isAr ? 'مصرف أبوظبي الإسلامي - نظام فحص الشهادات الرسمي' : 'Abu Dhabi Islamic Bank (ADIB) Document Portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Status banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {isAr ? 'الوثيقة أصلية ومطابقة لسجلات البنك' : 'Document Verified & Authentic'}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                {isAr ? 'تمت مطابقة الرمز الرقمي بنجاح مع قاعدة البيانات المركزية.' : 'Cryptographic digital hash verified against core banking records.'}
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 p-1">
            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                {isAr ? 'رقم المرجع (Ref No):' : 'Reference No:'}
              </span>
              <span className="font-mono font-bold text-[#002b49] text-xs">
                {verification.refNumber}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {isAr ? 'نوع المستند:' : 'Document Type:'}
              </span>
              <span className="font-semibold text-slate-800">
                {verification.documentType}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {isAr ? 'تاريخ ووقت الإصدار:' : 'Issue Timestamp:'}
              </span>
              <span className="font-medium text-slate-800">
                {verification.issueDate}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                {isAr ? 'رمز التشفير الرقمي (Hash):' : 'Security Hash:'}
              </span>
              <span className="font-mono text-[10px] text-slate-600 truncate max-w-[180px]" title={verification.securityHash}>
                {verification.securityHash}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {onOpenQrModal ? (
            <button
              onClick={() => {
                onClose();
                onOpenQrModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-[#002b49] text-xs font-semibold transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>{isAr ? 'عرض باركود QR' : 'View QR Code'}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              {isAr ? 'مصرف أبوظبي الإسلامي ش.م.ع' : 'Abu Dhabi Islamic Bank PJSC'}
            </span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#002b49] hover:bg-[#003865] text-white text-xs font-medium transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
