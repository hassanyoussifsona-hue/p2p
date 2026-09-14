import React from 'react';
import { ShieldCheck, Phone, Globe, ExternalLink, FileCheck } from 'lucide-react';
import { Language } from '../types';

interface AdibFooterProps {
  lang: Language;
}

export const AdibFooter: React.FC<AdibFooterProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  return (
    <footer
      id="adib-official-footer"
      className="no-print bg-[#002b49] text-white py-2 px-4 pb-safe border-t border-slate-700/60 text-xs select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>
            {isAr
              ? 'مصرف أبوظبي الإسلامي - جميع الحقوق محفوظة © 2026 | خدمة التحقق المعتمدة'
              : 'Abu Dhabi Islamic Bank (ADIB) © 2026. All Rights Reserved. Official Verification Service'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300 text-[11px]">
          <span className="flex items-center gap-1 text-amber-200/90 font-medium">
            <Phone className="w-3 h-3" />
            <span>600 543216 (UAE) | +971 2 6100600</span>
          </span>
          <a
            href="https://www.adib.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[#c5a059] transition"
          >
            <span>adib.com</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </footer>
  );
};
