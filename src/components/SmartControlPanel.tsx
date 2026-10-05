import React, { useState } from 'react';
import { JobConfig, FileItem, Orientation, AdjustMode } from '../types/print';
import { SmartRecommendation } from '../utils/smartRecommender';
import { Sparkles, ChevronDown, ChevronUp, Check, Info, Grid, Printer } from 'lucide-react';
import { PAPER_SIZES } from '../constants/paperCatalog';
import { PaperSizeModal } from './PaperSizeModal';

interface SmartControlPanelProps {
  config: JobConfig;
  currentFile: FileItem;
  recommendation: SmartRecommendation;
  onChange: (updated: Partial<JobConfig>) => void;
  onApplyRecommendation: (rec: SmartRecommendation) => void;
}

export const SmartControlPanel: React.FC<SmartControlPanelProps> = ({
  config,
  currentFile,
  recommendation,
  onChange,
  onApplyRecommendation,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  const isA4 = config.paperSizeId === 'a4';
  const isF4 = config.paperSizeId === 'f4';

  const selectPaper = (sizeId: 'a4' | 'f4') => {
    // Let parent trigger recommendation update
    onChange({ paperSizeId: sizeId });
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Big Clear Paper Choice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide font-['Plus_Jakarta_Sans']">
            Langkah 1 · Pilih Ukuran Kertas
          </span>
          <span className="text-xs text-slate-500">
            Pilih A4 atau F4, sisanya otomatis
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* A4 Button */}
          <button
            type="button"
            onClick={() => selectPaper('a4')}
            className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
              isA4
                ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold font-['Plus_Jakarta_Sans']">Kertas A4</span>
              {isA4 && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <span className={`mt-1 font-mono text-xs tabular-nums ${isA4 ? 'text-slate-300' : 'text-slate-500'}`}>
              210 × 297 mm
            </span>
            <span className={`mt-2 text-[11px] leading-tight ${isA4 ? 'text-slate-300' : 'text-slate-500'}`}>
              Standar dokumen umum & kantor internasional.
            </span>
          </button>

          {/* F4 / Folio Button */}
          <button
            type="button"
            onClick={() => selectPaper('f4')}
            className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
              isF4
                ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold font-['Plus_Jakarta_Sans']">Kertas F4 / Folio</span>
              {isF4 && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <span className={`mt-1 font-mono text-xs tabular-nums ${isF4 ? 'text-slate-300' : 'text-slate-500'}`}>
              215,9 × 330,2 mm
            </span>
            <span className={`mt-2 text-[11px] leading-tight ${isF4 ? 'text-slate-300' : 'text-slate-500'}`}>
              Standar map & ijazah Indonesia (21,5 × 33 cm).
            </span>
          </button>
        </div>

        {/* Paper switch dropdown & Full Catalog Button */}
        <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Pilih Ukuran Lain:</span>
            <button
              type="button"
              onClick={() => setIsPaperModalOpen(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-lg"
            >
              <span>Semua Ukuran (30+) ▾</span>
            </button>
          </div>

          <select
            value={config.paperSizeId}
            onChange={(e) => onChange({ paperSizeId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
          >
            <optgroup label="Standar Dokumen">
              {PAPER_SIZES.filter((p) =>
                ['a4', 'f4', 'letter', 'legal', 'a5', 'a6', 'b5', 'b4', 'executive'].includes(p.id)
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.widthMm} × {p.heightMm} mm)
                </option>
              ))}
            </optgroup>

            <optgroup label="Kertas Foto & Pas Foto">
              {PAPER_SIZES.filter((p) => p.category === 'photo').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.widthMm} × {p.heightMm} mm)
                </option>
              ))}
            </optgroup>

            <optgroup label="Format Besar / Plotter">
              {PAPER_SIZES.filter((p) =>
                ['a3', 'a3_plus', 'a2', 'a1', 'a0', 'sra3'].includes(p.id)
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.widthMm} × {p.heightMm} mm)
                </option>
              ))}
            </optgroup>

            <optgroup label="Amplop, Kartu & Kasir">
              {PAPER_SIZES.filter(
                (p) =>
                  p.id.startsWith('envelope') ||
                  p.id === 'id_card' ||
                  p.category === 'specialized_roll'
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.widthMm} × {p.heightMm} mm)
                </option>
              ))}
            </optgroup>

            <optgroup label="Ukuran Bebas">
              <option value="custom">Ukuran Kustom Sendiri (mm)</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Autonomous AI Smart Recommendation Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            {recommendation.title}
          </h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {recommendation.explanation}
        </p>

        {/* Clean Unboxed Decision Points */}
        <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-700">
          {recommendation.reasonList.map((reason, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>{reason}</span>
            </div>
          ))}
        </div>

        {/* Helpful Driver note */}
        <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
          <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            {isF4
              ? 'Pada dialog cetak printer Epson L3110, pilih "User-Defined" (215.9 × 330.2 mm) dan Skala 100%.'
              : 'Pada dialog cetak printer Epson L3110, pilih "A4" dan Skala 100% (Actual Size).'}
          </span>
        </div>
      </div>

      {/* Collapsible Advanced Settings (For users who want to tweak) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>Pengaturan Manual Lanjutan (Opsional)</span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="border-t border-slate-100 p-5 space-y-4 text-xs">
            {/* Orientation */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Orientasi Kertas
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ orientation: 'portrait' as Orientation })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    config.orientation === 'portrait'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Portrait (Tegak)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ orientation: 'landscape' as Orientation })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    config.orientation === 'landscape'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Landscape (Mendatar)
                </button>
              </div>
            </div>

            {/* Mode Penyesuaian */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Mode Penyesuaian ke Kertas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'fit', label: 'Fit (Anti-Gepeng, Utuh)' },
                  { id: 'fill', label: 'Fill (Penuh, Sisi Terpotong)' },
                  { id: 'stretch', label: 'Stretch (Paksakan Penuh)' },
                  { id: 'actual', label: 'Actual Size (1:1 Asli)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange({ adjustMode: m.id as AdjustMode })}
                    className={`py-2 px-2.5 rounded-lg border text-left text-xs transition-all ${
                      config.adjustMode === m.id
                        ? 'border-slate-900 bg-slate-900 text-white font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Margin Tepi Kertas (mm)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="block text-[10px] text-slate-500 mb-1">Atas</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={config.margins.top}
                    onChange={(e) =>
                      onChange({
                        margins: { ...config.margins, top: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 mb-1">Bawah</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={config.margins.bottom}
                    onChange={(e) =>
                      onChange({
                        margins: { ...config.margins, bottom: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 mb-1">Kiri</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={config.margins.left}
                    onChange={(e) =>
                      onChange({
                        margins: { ...config.margins, left: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 mb-1">Kanan</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={config.margins.right}
                    onChange={(e) =>
                      onChange({
                        margins: { ...config.margins, right: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Reset to Recommended button */}
            <button
              type="button"
              onClick={() => onApplyRecommendation(recommendation)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Kembalikan ke Rekomendasi Pintar
            </button>
          </div>
        )}
      </div>

      {/* Full Catalog Modal (30+ Paper Sizes) */}
      <PaperSizeModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        currentPaperId={config.paperSizeId}
        customWidthMm={config.customWidthMm}
        customHeightMm={config.customHeightMm}
        onSelectPaper={(paperId, customW, customH) => {
          if (paperId === 'custom' && customW && customH) {
            onChange({
              paperSizeId: 'custom',
              customWidthMm: customW,
              customHeightMm: customH,
              presetId: undefined,
            });
          } else {
            onChange({ paperSizeId: paperId, presetId: undefined });
          }
        }}
      />
    </div>
  );
};
