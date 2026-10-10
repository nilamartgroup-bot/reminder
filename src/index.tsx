import React from 'react';
import { useLanguage } from './context/LanguageContext';
import { formatAppDate } from './utils/jalali';
import { Bell, Calendar } from 'lucide-react';

interface IndexPageProps {
  onOpenReminders: () => void;
}

export const IndexPage: React.FC<IndexPageProps> = ({ onOpenReminders }) => {
  const { t, language } = useLanguage();
  const now = new Date();

  return (
    <div className="w-full flex flex-col items-center pt-[5mm] animate-fade-in select-none">
      {/* Today's Date at the top: exactly 5mm from the top of the app container */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shadow-sm">
        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        <span>{formatAppDate(now, language, false)}</span>
      </div>

      {/* Reminder Module Button: exactly 25mm x 25mm square, 5mm below the date */}
      <div className="mt-[5mm] flex justify-center items-center">
        <button
          onClick={onOpenReminders}
          className="w-[25mm] h-[25mm] min-w-[25mm] min-h-[25mm] max-w-[25mm] max-h-[25mm] rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 border border-indigo-500/50 shadow-xl hover:shadow-indigo-500/25 active:scale-95 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-1.5 gap-1.5 text-center group"
          title={t('reminder_button')}
        >
          {/* Animated Bell Icon */}
          <Bell className="w-6 h-6 text-amber-400 animate-bounce group-hover:text-amber-300 transition flex-shrink-0" />

          {/* Module Label "یادآوری" */}
          <span className="text-[11px] sm:text-xs font-black text-white tracking-tight leading-none text-center">
            {t('reminder_button')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default IndexPage;

