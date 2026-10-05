import React from 'react';
import { AdjustMode, JobConfig, OutputQuality } from '../types/print';
import { MARGIN_PRESETS } from '../constants/paperCatalog';
import { Maximize2, Minimize2, StretchHorizontal, Square, Sliders, AlertTriangle } from 'lucide-react';

interface AdjustControlsProps {
  config: JobConfig;
  onChange: (updated: Partial<JobConfig>) => void;
}

export const AdjustControls: React.FC<AdjustControlsProps> = ({ config, onChange }) => {
  const handleMarginPresetChange = (presetKey: string) => {
    const preset = MARGIN_PRESETS[presetKey];
    if (preset) {
      onChange({
        margins: {
          top: preset.top,
          bottom: preset.bottom,
          left: preset.left,
          right: preset.right,
          linked: config.margins.linked,
        },
      });
    }
  };

  const updateMargin = (field: 'top' | 'bottom' | 'left' | 'right', val: number) => {
    if (config.margins.linked) {
      onChange({
        margins: {
          top: val,
          bottom: val,
          left: val,
          right: val,
          linked: true,
        },
      });
    } else {
      onChange({
        margins: {
          ...config.margins,
          [field]: val,
        },
      });
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <h4 className="text-sm font-semibold text-white font-['Plus_Jakarta_Sans']">
            Mode Penyesuaian & Margin
          </h4>
        </div>
      </div>

      {/* 4 Adjustment Modes */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-2">
          Pilih Mode Penyesuaian ke Kertas
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* Fit */}
          <button
            type="button"
            onClick={() => onChange({ adjustMode: 'fit' })}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              config.adjustMode === 'fit'
                ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/50'
                : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Minimize2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Fit (Proporsional)</span>
            </div>
            <span className="mt-1 text-[11px] text-neutral-400">
              Utuh tanpa terpotong. Ruang sisa jadi putih.
            </span>
          </button>

          {/* Fill */}
          <button
            type="button"
            onClick={() => onChange({ adjustMode: 'fill' })}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              config.adjustMode === 'fill'
                ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/50'
                : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Maximize2 className="h-3.5 w-3.5 text-blue-400" />
              <span>Fill (Penuhi Kertas)</span>
            </div>
            <span className="mt-1 text-[11px] text-neutral-400">
              Penuh maksimal, sebagian tepi mungkin terpotong.
            </span>
          </button>

          {/* Stretch */}
          <button
            type="button"
            onClick={() => onChange({ adjustMode: 'stretch' })}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              config.adjustMode === 'stretch'
                ? 'border-amber-500 bg-amber-950/30 text-white shadow-sm ring-1 ring-amber-500/50'
                : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <StretchHorizontal className="h-3.5 w-3.5 text-amber-400" />
              <span>Stretch (Tarik Penuh)</span>
            </div>
            <span className="mt-1 text-[11px] text-neutral-400">
              Memaksa penuh, rasio gambar berubah/gepeng.
            </span>
          </button>

          {/* Actual Size */}
          <button
            type="button"
            onClick={() => onChange({ adjustMode: 'actual' })}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              config.adjustMode === 'actual'
                ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/50'
                : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Square className="h-3.5 w-3.5 text-emerald-400" />
              <span>Actual (Ukuran Asli)</span>
            </div>
            <span className="mt-1 text-[11px] text-neutral-400">
              1:1 ukuran fisik asli tanpa diperbesar.
            </span>
          </button>
        </div>

        {/* Warnings based on mode */}
        {config.adjustMode === 'fill' && (
          <div className="mt-2 text-[11px] text-blue-300 bg-blue-950/30 border border-blue-900/50 p-2.5 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span>
              <strong>Perhatian Mode Fill:</strong> Sisi gambar yang melebihi rasio kertas akan dipotong agar halaman terisi penuh.
            </span>
          </div>
        )}
        {config.adjustMode === 'stretch' && (
          <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Peringatan Distorsi:</strong> Gambar dapat terlihat melar atau gepeng karena rasio aslinya tidak dipertahankan.
            </span>
          </div>
        )}
      </div>

      {/* Margin Presets & Custom Margins */}
      <div className="pt-3 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-neutral-400">Pengaturan Margin Tepi</label>
          <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.margins.linked}
              onChange={(e) =>
                onChange({
                  margins: { ...config.margins, linked: e.target.checked },
                })
              }
              className="rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-0"
            />
            <span>Samakan semua sisi</span>
          </label>
        </div>

        {/* Margin Presets Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {Object.entries(MARGIN_PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleMarginPresetChange(key)}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-white text-left transition-colors"
            >
              <div className="font-medium truncate">{p.name}</div>
            </button>
          ))}
        </div>

        {/* Custom Margin Inputs (in mm) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <span className="block text-[11px] text-neutral-400 mb-1">Atas (mm)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={config.margins.top}
              onChange={(e) => updateMargin('top', parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-mono text-white tabular-nums"
            />
          </div>
          <div>
            <span className="block text-[11px] text-neutral-400 mb-1">Bawah (mm)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={config.margins.bottom}
              onChange={(e) => updateMargin('bottom', parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-mono text-white tabular-nums"
            />
          </div>
          <div>
            <span className="block text-[11px] text-neutral-400 mb-1">Kiri (mm)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={config.margins.left}
              onChange={(e) => updateMargin('left', parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-mono text-white tabular-nums"
            />
          </div>
          <div>
            <span className="block text-[11px] text-neutral-400 mb-1">Kanan (mm)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={config.margins.right}
              onChange={(e) => updateMargin('right', parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-mono text-white tabular-nums"
            />
          </div>
        </div>

        {/* Epson borderless hardware limitation note */}
        {config.margins.top === 0 && config.margins.bottom === 0 && (
          <div className="mt-2 text-[11px] text-neutral-400 bg-neutral-950/40 p-2 rounded-lg border border-neutral-800">
            💡 <strong>Catatan Epson L3110:</strong> Printer inkjet biasa menyisakan tepi putih sekitar 3 mm kecuali mode <em>Borderless</em> diaktifkan pada driver printer (umumnya untuk kertas foto 4R).
          </div>
        )}
      </div>

      {/* Background Color & Quality DPI */}
      <div className="pt-3 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Background Color */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Warna Dasar Halaman
          </label>
          <div className="flex gap-2">
            {[
              { label: 'Putih (Standar HVS)', val: '#ffffff' },
              { label: 'Hitam', val: '#000000' },
              { label: 'Transparan', val: 'transparent' },
            ].map((c) => (
              <button
                key={c.val}
                type="button"
                onClick={() => onChange({ backgroundColor: c.val })}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                  config.backgroundColor === c.val
                    ? 'border-indigo-500 bg-indigo-950/50 text-white shadow-sm'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality DPI */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Kualitas Output Dokumen
          </label>
          <div className="flex gap-2">
            {[
              { label: 'Draft (150 DPI)', dpi: 150 },
              { label: 'Standar (300 DPI)', dpi: 300 },
              { label: 'High (600 DPI)', dpi: 600 },
            ].map((q) => (
              <button
                key={q.dpi}
                type="button"
                onClick={() => onChange({ qualityDpi: q.dpi as OutputQuality })}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                  config.qualityDpi === q.dpi
                    ? 'border-indigo-500 bg-indigo-950/50 text-white shadow-sm'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
