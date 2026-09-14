import React from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  Type,
  FileCheck2,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  FileSignature,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';

interface FontFidelityModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSelectExactView: () => void;
  onSelectVectorPdf: () => void;
  isExactViewActive: boolean;
}

export const FontFidelityModal: React.FC<FontFidelityModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectExactView,
  onSelectVectorPdf,
  isExactViewActive,
}) => {
  if (!isOpen) return null;
  const isAr = lang === 'ar';

  return (
    <div
      id="font-fidelity-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002b49] text-white p-4.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {isAr
                  ? 'دليل ثبات الخطوط والتوقيع الإلكتروني وتوافق iOS'
                  : 'Font Fidelity, Signature Alignment & iOS Guide'}
              </h3>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'حلول تقنية معتمدة لمشاكل العرض على الهواتف الذكية ومتصفحات Safari'
                  : 'Technical solutions for mobile rendering & Safari fidelity'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs sm:text-sm text-slate-200">
          {/* Active View Quick Switcher Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-800 to-indigo-950/60 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c5a059]" />
                {isAr ? 'اختر وضع عرض المستند المطلوب:' : 'Select Document Rendering Mode:'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {isExactViewActive
                  ? isAr ? 'المطابقة الأصلية 100% مفعّلة' : '100% Exact Active'
                  : isAr ? 'عرض PDF مفعل' : 'Vector PDF Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Exact Master Copy */}
              <button
                type="button"
                onClick={() => {
                  onSelectExactView();
                  onClose();
                }}
                className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col gap-1.5 ${
                  isExactViewActive
                    ? 'bg-[#003865] border-[#c5a059] text-white shadow-md ring-1 ring-[#c5a059]'
                    : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-[#c5a059]">
                    <CheckCircle2 className="w-4 h-4" />
                    {isAr ? 'المطابقة الأصلية التامة 100%' : '100% Exact Master View'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    {isAr ? 'موصى به للهواتف' : 'Recommended'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isAr
                    ? 'يضمن ثبات الخطوط والمسافات والتوقيع الإلكتروني والختم بنسبة 100% بدون أي انزياح على أي هاتف.'
                    : 'Guarantees 100% locked fonts, line heights, digital signatures, and official seals.'}
                </p>
              </button>

              {/* Option 2: Vector PDF */}
              <button
                type="button"
                onClick={() => {
                  onSelectVectorPdf();
                  onClose();
                }}
                className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col gap-1.5 ${
                  !isExactViewActive
                    ? 'bg-[#003865] border-[#c5a059] text-white shadow-md ring-1 ring-[#c5a059]'
                    : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-slate-200">
                    <FileCheck2 className="w-4 h-4" />
                    {isAr ? 'عرض ملف PDF الأصلي' : 'Standard Vector PDF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isAr
                    ? 'يعتمد على محرك PDF.js المدمج مع حزم خطوط CMaps المعيارية لتحديد النصوص.'
                    : 'Uses PDF.js engine with local standard fonts and CMaps.'}
                </p>
              </button>
            </div>
          </div>

          {/* Section 1: iOS Access Solution */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? '1. حل مشكلة الدخول من أجهزة iOS (iPhone / iPad)' : '1. Solving iOS Access Issue'}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr ? (
                <>
                  <strong className="text-white">سبب المشكلة:</strong> روابط بيئة العمل المباشرة تبدأ بـ <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">ais-dev-</code> وتتطلب حساب مطور مسجل في سحابة جوجل، ولذلك ترفض هواتف الآيفون الدخول إليها.
                  <br />
                  <strong className="text-emerald-400">الحل المطبق:</strong> قمنا بتحديث نظام إنشاء الباركود (QR Code) ليقوم تلقائياً بتحويل الرابط إلى الرابط العام المباشر <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300">ais-pre-</code> وهو متاح لجميع الهواتف بدون أي شاشة تسجيل دخول.
                </>
              ) : (
                <>
                  <strong className="text-white">Cause:</strong> URLs starting with <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">ais-dev-</code> require Google authentication credentials on mobile devices.
                  <br />
                  <strong className="text-emerald-400">Solution:</strong> The QR generator now outputs public direct URLs starting with <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300">ais-pre-</code> which open immediately on any iPhone without login.
                </>
              )}
            </p>
          </div>

          {/* Section 2: Why fonts and signatures shift in PDF */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-[#c5a059]" />
              <span>{isAr ? '2. لماذا يتغير حجم الخط والمسافات والتوقيع الإلكتروني؟' : '2. Why Fonts & Signatures Shift'}</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  {isAr ? (
                    <>
                      <strong className="text-white">استبدال الخطوط (Font Substitution):</strong> عندما يُحفظ ملف الـ PDF بدون خيار (Embed All Fonts)، فإن هاتف الآيفون لا يملك نفس الخطوط فيقوم باستبدالها بخطوط نظام بديلة تختلف في عرض الحروف وارتفاعها، مما يجعل النص يلتف في أسطر غير متوقعة وتتغير المسافات الرأسية.
                    </>
                  ) : (
                    <>
                      <strong>Font Substitution:</strong> When a PDF is exported without embedded fonts, mobile devices substitute them with fallback fonts with different metrics, causing text reflow.
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <FileSignature className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  {isAr ? (
                    <>
                      <strong className="text-white">انزياح التوقيع والختم الرقمي:</strong> التوقيع والختم يتم وضعهما عند إحداثيات ثابتة داخل الصفحة. عندما يتغير ارتفاع الفقرات وتباعد الأسطر، فإن النص يتداخل مع التوقيع أو يبتعد عنه.
                    </>
                  ) : (
                    <>
                      <strong>Signature Displacement:</strong> Signatures sit at fixed coordinates. When text reflows or expands, the signature ends up overlapped or separated.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Professional Tips for Future Exports */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? '3. خطوات تصدير ملفات PDF معتمدة ومثبتة 100%' : '3. Exporting Fixed PDF Files'}</span>
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
              <li>
                {isAr ? (
                  <span>عند الحفظ من برامج الأوفيس (Word) أو التصميم، اختر دائماً صيغة <strong>PDF/A (ISO 19005-1 compliant)</strong>.</span>
                ) : (
                  <span>Always export using <strong>PDF/A (ISO 19005-1 compliant)</strong>.</span>
                )}
              </li>
              <li>
                {isAr ? (
                  <span>تأكد من تفعيل خيار <strong>تضمين كافة الخطوط بالكامل (Embed all fonts)</strong> لمنع أي متصفح من تغيير شكل الخط.</span>
                ) : (
                  <span>Enable <strong>Embed all fonts</strong> option in the export settings.</span>
                )}
              </li>
              <li>
                {isAr ? (
                  <span>استخدم ميزة التكبير باللمس (Pinch-to-zoom) بإصبعين على شاشة الهاتف للتنقل وتكبير التوقيع والختم بكل سهولة.</span>
                ) : (
                  <span>Use two-finger pinch-to-zoom on your mobile screen to inspect signatures and stamps smoothly.</span>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {isAr ? 'جميع الحلول مطبقة وجاهزة للاستخدام' : 'All fidelity patches applied'}
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-[#003865] hover:bg-[#002b49] text-white font-semibold text-xs transition cursor-pointer"
          >
            {isAr ? 'فهمت، إغلاق' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
