import React, { useState } from 'react';
import { adminService, TrialPolicyConfig } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import {
  CreditCard,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PaywallModalProps {
  userId: string;
  userName: string;
  policy: TrialPolicyConfig;
  onPaymentSuccess?: () => void;
  onDismiss?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  userId,
  userName,
  policy,
  onPaymentSuccess,
  onDismiss,
}) => {
  const { language } = useLanguage();
  const isFa = language === 'fa';
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const formattedFee = policy.subscriptionFeeToman.toLocaleString(isFa ? 'fa-IR' : 'en-US');

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      adminService.simulateSuccessfulPayment(userId, policy.subscriptionFeeToman);
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onPaymentSuccess?.();
      }, 1500);
    }, 1200);
  };

  const handleOpenGateway = () => {
    // Open payment gateway link in a new tab or current tab
    if (policy.paymentGatewayUrl) {
      window.open(policy.paymentGatewayUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-750 p-5 sm:p-6 shadow-2xl relative overflow-hidden text-center">
        {/* Glow decoration */}
        <div className="absolute -top-14 -end-14 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-14 -start-14 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 shadow-lg">
          <Lock className="w-7 h-7" />
        </div>

        {/* Title & Notification Notice */}
        <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
          {isFa ? 'پایان دوره آزمایشی رایگان' : 'Free Trial Expired'}
        </h2>

        <p className="text-xs text-amber-300 font-medium mt-1 leading-relaxed px-2">
          {policy.paywallMessage ||
            (isFa
              ? 'دوره استفاده آزمایشی شما به پایان رسیده است. برای فعال‌سازی مجدد و تمدید امکانات اپلیکیشن، لطفاً نسبت به پرداخت اشتراک اقدام نمایید.'
              : 'Your trial period has ended. Please renew your subscription to continue using the application.')}
        </p>

        {/* Subscription Plan Card */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-start space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-xs text-slate-400 font-semibold">
              {isFa ? 'کاربر گرامی:' : 'Account:'}
            </span>
            <span className="text-xs font-bold text-white">{userName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-xs text-slate-400 font-semibold">
              {isFa ? 'طرح اشتراک:' : 'Plan:'}
            </span>
            <span className="text-xs font-bold text-indigo-300">
              {isFa ? 'تمدید ۳۰ روزه ویژه' : '30-Day Pro Subscription'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300 font-bold">
              {isFa ? 'مبلغ قابل پرداخت:' : 'Payable Amount:'}
            </span>
            <div className="text-end">
              <span className="text-lg font-black text-emerald-400 font-mono tracking-wider">
                {formattedFee}
              </span>
              <span className="text-[10px] text-slate-400 ms-1 font-semibold">
                {isFa ? 'تومان' : 'Tomans'}
              </span>
            </div>
          </div>
        </div>

        {/* Success notification banner if paid */}
        {paymentSuccess && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{isFa ? 'پرداخت تایید شد! اشتراک شما تمدید شد.' : 'Payment confirmed! Activated.'}</span>
          </div>
        )}

        {/* Actions Buttons */}
        <div className="space-y-2">
          {/* Real Gateway Button */}
          <button
            type="button"
            onClick={handleOpenGateway}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isFa
                ? 'اتصال به درگاه پرداخت الکترونیک (شاپرک)'
                : 'Proceed to Payment Gateway (Shaparak)'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Test Simulation Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSimulatePayment}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 hover:border-indigo-500 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {isProcessing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {isProcessing
                ? (isFa ? 'در حال ثبت تاییدیه پرداخت...' : 'Processing...')
                : (isFa ? 'شبیه‌ساز پرداخت تستی و فعال‌سازی فوری' : 'Simulate Test Payment')}
            </span>
          </button>
        </div>

        {/* Secure badge footer */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {isFa
              ? 'تراکنش امن تحت نظارت شاپرک و درگاه‌های پرداخت مجاز بانک مرکزی'
              : 'Secure transaction powered by Shaparak IPG'}
          </span>
        </div>
      </div>
    </div>
  );
};
