import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { Language } from '../types';

interface BotVerificationGateProps {
  lang: Language;
  onVerified: () => void;
  documentName?: string;
  isDocumentVerification?: boolean;
}

export const BotVerificationGate: React.FC<BotVerificationGateProps> = ({
  lang,
  onVerified,
  documentName,
  isDocumentVerification = false,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(7);
  const [isChecked, setIsChecked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isAr = lang === 'ar';

  useEffect(() => {
    // 7-second countdown as requested
    setSecondsRemaining(7);
    setIsChecked(false);
    setIsCompleted(false);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsChecked(true);
          setIsCompleted(true);
          setTimeout(() => {
            onVerified();
          }, 700);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onVerified]);

  // Calculate progress percentage over 7 seconds
  const progressPercent = Math.min(100, Math.round(((7 - secondsRemaining) / 7) * 100));

  return (
    <AnimatePresence>
      <motion.div
        id="bot-verification-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/95 text-neutral-100 p-4 select-none backdrop-blur-md"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Top subtle progress line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-neutral-800">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ ease: 'linear', duration: 0.9 }}
            />
          </div>

          {/* Security Icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 shadow-inner">
            {isCompleted ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-in zoom-in-50 duration-300" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-400 animate-pulse" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl font-bold text-neutral-100 mb-2">
            {isDocumentVerification
              ? isAr
                ? 'التحقق الأمني من المستند'
                : 'Document Security Verification'
              : isAr
              ? 'فحص الأمان والتحقق الأمني'
              : 'Security Verification Check'}
          </h2>

          {documentName && (
            <div className="mb-3 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 font-mono truncate max-w-xs">
              {documentName}
            </div>
          )}

          <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
            {isCompleted
              ? isAr
                ? 'تم فحص التحقق بنجاح! جاري فتح المستند...'
                : 'Verification successful! Opening document...'
              : isAr
              ? 'الرجاء الانتظار 7 ثوانٍ لاستكمال الفحص الأمني وتوثيق فتح المستند.'
              : 'Please wait 7 seconds while completing security verification to open the document.'}
          </p>

          {/* Verification Box (CAPTCHA Style) */}
          <div className="w-full bg-neutral-950/80 border border-neutral-700/60 rounded-xl p-4 flex items-center justify-between gap-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all ${
                  isChecked
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-500/50'
                    : 'bg-neutral-800/80 border-neutral-600'
                }`}
              >
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                )}
              </div>
              <span className="text-sm font-medium text-neutral-200">
                {isAr ? 'التحقق الأمني معتمد' : 'Security verified'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center opacity-70 text-[10px] text-neutral-400">
              <Lock className="w-3.5 h-3.5 text-neutral-400 mb-0.5" />
              <span>{isAr ? 'حماية آمنة' : 'Secure Check'}</span>
            </div>
          </div>

          {/* Countdown & Status indicator */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {!isCompleted ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span className="font-mono">
                  {isAr
                    ? `جاري التحقق التلقائي... (${secondsRemaining} ثوانٍ متبقية)`
                    : `Verifying automatically... (${secondsRemaining}s remaining)`}
                </span>
              </>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? 'تم التحقق بنجاح - يفتح الملف الآن' : 'Verification complete - Opening file now'}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
