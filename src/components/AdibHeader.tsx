import React from 'react';
import { Info, Globe, CheckCircle2, Lock, FileCheck, Search, MapPin } from 'lucide-react';
import { VerificationDetails, Language } from '../types';

interface AdibHeaderProps {
  lang: Language;
  onLanguageToggle: () => void;
  verification: VerificationDetails;
  onOpenDetailsModal: () => void;
}

export const AdibHeader: React.FC<AdibHeaderProps> = ({
  lang,
  onLanguageToggle,
  verification,
  onOpenDetailsModal,
}) => {
  const isAr = lang === 'ar';

  return (
    <header
      id="adib-official-header"
      className="no-print bg-[#003865] text-white border-b border-[#002b49] shadow-md z-30 transition-all select-none"
    >
      {/* Top micro-bar for bank authority */}
      <div className="bg-[#00223d] text-slate-300 text-[11px] py-1 pt-safe px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-[#c5a059]" />
            <span className="font-medium tracking-wide">
              {isAr
                ? 'البوابة الإلكترونية الرسمية للتحقق من صحة الوثائق والمستندات - مصرف أبوظبي الإسلامي'
                : 'Official Document Verification Portal - Abu Dhabi Islamic Bank (ADIB)'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 hidden md:inline">
              {isAr ? 'مرخص من قبل مصرف الإمارات المركزي' : 'Licensed by Central Bank of the UAE'}
            </span>
            <button
              onClick={onLanguageToggle}
              className="flex items-center gap-1.5 hover:text-[#c5a059] font-medium transition cursor-pointer text-slate-200"
              title="تغيير اللغة / Change Language"
            >
              <Globe className="w-3 h-3 text-[#c5a059]" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bank Navigation bar matching official ADIB branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Logo & Portal title (Top right in Arabic RTL) */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          {/* Official ADIB Logo Image */}
          <div className="flex items-center shrink-0">
            <img
              id="adib-official-logo"
              src="/adib_logo_white.png"
              alt="ADIB - مصرف أبوظبي الإسلامي"
              className="h-8 sm:h-9.5 md:h-10 w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
            />
          </div>

          <div className="h-7 w-px bg-white/20 hidden sm:block shrink-0" />

          {/* Portal Verification title */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#c5a059] shrink-0 hidden xs:block" />
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                {isAr ? 'التحقق من صحة المستندات' : 'Document Verification'}
              </h1>
            </div>
            <span className="text-[10px] text-blue-200/90 font-mono hidden md:block">
              {verification.refNumber}
            </span>
          </div>
        </div>

        {/* Action Controls & Official ADIB Navigation items */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Verified status badge */}
          <div
            id="adib-verification-badge"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold shadow-xs"
            title={isAr ? 'تم التحقق من الوثيقة وهي مطابقة لسجلات البنك' : 'Document verified authentic with ADIB records'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden xs:inline">
              {isAr ? 'مستند موثّق وصالح' : 'Authentic & Verified'}
            </span>
            <span className="xs:hidden">
              {isAr ? 'موثّق' : 'Verified'}
            </span>
          </div>

          {/* Details modal trigger */}
          <button
            id="btn-adib-doc-details"
            onClick={onOpenDetailsModal}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition cursor-pointer"
            title={isAr ? 'عرض بيانات شهادة التوثيق' : 'View certificate security details'}
          >
            <Info className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">
              {isAr ? 'تفاصيل الوثيقة' : 'Certificate Details'}
            </span>
          </button>

          {/* Official Bank Quick Actions from screenshot (Desktop) */}
          <div className="hidden xl:flex items-center gap-3 border-s border-white/20 ps-3">
            {/* Search icon */}
            <button
              className="p-1.5 text-white/80 hover:text-white transition cursor-pointer"
              title={isAr ? 'البحث في خدمات المصرف' : 'Search ADIB services'}
            >
              <Search className="w-4 h-4" />
            </button>
            {/* Branches / Location icon */}
            <button
              className="p-1.5 text-white/80 hover:text-white transition cursor-pointer"
              title={isAr ? 'الفروع وأجهزة الصراف الآلي' : 'Branches & ATMs'}
            >
              <MapPin className="w-4 h-4" />
            </button>
            {/* Country flag indicator */}
            <div className="flex items-center gap-1 text-xs text-white/90 font-medium px-1">
              <span className="text-sm">🇦🇪</span>
              <span className="text-[11px] font-semibold">{isAr ? '-EN' : '-AR'}</span>
            </div>
            {/* Official Cyan Log In Button */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0090df] hover:bg-[#0080c7] text-white text-xs font-bold shadow-xs cursor-pointer transition select-none"
              title={isAr ? 'تسجيل الدخول إلى الخدمات المصرفية' : 'ADIB Online Banking Login'}
            >
              <span>LOG IN</span>
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
