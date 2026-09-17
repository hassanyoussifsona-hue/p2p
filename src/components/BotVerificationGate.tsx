import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { Language } from '../types';

interface BotVerificationGateProps {
  lang: Language;
  onVerified: () => void;
}

export const BotVerificationGate: React.FC<BotVerificationGateProps> = ({ lang, onVerified }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [isChecked, setIsChecked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isAr = lang === 'ar';

  useEffect(() => {
    // 5-second countdown
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

  // Calculate progress percentage over 5 seconds
  const progressPercent = Math.min(100, Math.round(((5 - secondsRemaining) / 5) * 100));

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
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800">
            <motion.div
              className="h-full bg-emerald-500"
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
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl font-bold text-neutral-100 mb-2">
            {isAr ? 'التحقق الأمني من المتصفح' : 'Security Browser Verification'}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
            {isCompleted
              ? isAr
                ? 'تم التوثيق بنجاح! جاري توجيهك إلى المستند...'
                : 'Verified successfully! Redirecting to the document...'
              : isAr
              ? 'الرجاء الانتظار للتحقق من أنك لست برنامج روبوت للوصول إلى الوثيقة الرسمية.'
              : 'Please wait while we verify you are not a robot to access the official document.'}
          </p>

          {/* Verification Box (CAPTCHA Style) */}
          <div className="w-full bg-neutral-950/80 border border-neutral-700/60 rounded-xl p-4 flex items-center justify-between gap-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all ${
                  isChecked
                    ? 'bg-emerald-600 border-emerald-500 text-white'
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
                {isAr ? 'أنا لست برنامج روبوت' : "I'm not a robot"}
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
                <span>
                  {isAr
                    ? `جاري التحقق التلقائي... (${secondsRemaining} ثوانٍ)`
                    : `Verifying automatically... (${secondsRemaining}s)`}
                </span>
              </>
            ) : (
              <span className="text-emerald-400 font-medium">
                {isAr ? '✓ تم التحقق بنجاح' : '✓ Verification complete'}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
