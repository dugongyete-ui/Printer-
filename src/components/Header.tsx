import React from 'react';
import { Printer, RotateCcw, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenEpsonGuide: () => void;
  onReset: () => void;
  hasFile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenEpsonGuide, onReset, hasFile }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <Printer className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">
                PrintFit
              </span>
              <span className="text-xs text-slate-500 font-normal">
                · Asisten Cetak A4 & F4
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Primary Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenEpsonGuide}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>Panduan Epson L3110</span>
          </button>

          {hasFile && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Ganti file atau mulai dari awal"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Ganti File</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
