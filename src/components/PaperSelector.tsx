import React from 'react';
import { PaperSize, Orientation, JobConfig } from '../types/print';
import { PAPER_SIZES, MEDIA_TYPES, PRINTER_PROFILES } from '../constants/paperCatalog';
import { FileText, AlertTriangle, Layers } from 'lucide-react';

interface PaperSelectorProps {
  config: JobConfig;
  onChange: (updated: Partial<JobConfig>) => void;
}

export const PaperSelector: React.FC<PaperSelectorProps> = ({ config, onChange }) => {
  const currentPaper = PAPER_SIZES.find((p) => p.id === config.paperSizeId) || PAPER_SIZES[0];
  const currentMedia = MEDIA_TYPES.find((m) => m.id === config.mediaTypeId) || MEDIA_TYPES[0];
  const currentPrinter = PRINTER_PROFILES.find((pr) => pr.id === config.printerProfileId) || PRINTER_PROFILES[0];

  // Calculate pixel preview at current DPI
  const widthMm = currentPaper.id === 'custom' ? config.customWidthMm : currentPaper.widthMm;
  const heightMm = currentPaper.id === 'custom' ? config.customHeightMm : currentPaper.heightMm;
  const effectiveW = config.orientation === 'landscape' ? heightMm : widthMm;
  const effectiveH = config.orientation === 'landscape' ? widthMm : heightMm;

  const pxW = Math.round((effectiveW / 25.4) * config.qualityDpi);
  const pxH = Math.round((effectiveH / 25.4) * config.qualityDpi);

  // Check Epson L3110 hardware limits (max 215.9 mm width)
  const isEpsonIncompatible =
    config.printerProfileId === 'epson_l3110' &&
    (currentPaper.requiresSpecialPrinter || currentPaper.widthMm > 215.9);

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <h4 className="text-sm font-semibold text-white font-['Plus_Jakarta_Sans']">
            Ukuran Kertas & Orientasi
          </h4>
        </div>

        {/* Tabular dimensions badge */}
        <div className="text-right">
          <span className="font-mono text-xs font-medium text-neutral-300 tabular-nums">
            {effectiveW.toFixed(1)} × {effectiveH.toFixed(1)} mm
          </span>
          <span className="block text-[11px] text-neutral-500 font-mono tabular-nums">
            {pxW} × {pxH} px @ {config.qualityDpi} DPI
          </span>
        </div>
      </div>

      {/* Primary Paper Presets: A4 & F4 prominently featured */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-2">
          Pilihan Kertas Utama
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAPER_SIZES.filter((p) => p.isPopular).map((paper) => {
            const isSelected = config.paperSizeId === paper.id;
            return (
              <button
                key={paper.id}
                type="button"
                onClick={() => onChange({ paperSizeId: paper.id })}
                className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-sm">{paper.name}</span>
                  {paper.id === 'f4' && (
                    <span className="text-[10px] text-indigo-400 font-medium bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      Folio
                    </span>
                  )}
                </div>
                <span className="mt-1 font-mono text-[11px] text-neutral-400 tabular-nums">
                  {paper.widthMm} × {paper.heightMm} mm
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Paper Catalog Dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Semua Ukuran Kertas / Media
          </label>
          <select
            value={config.paperSizeId}
            onChange={(e) => onChange({ paperSizeId: e.target.value })}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 focus:border-indigo-500 focus:outline-none"
          >
            <optgroup label="Standar Lembar Dokumen">
              {PAPER_SIZES.filter((p) => p.category === 'standard').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.widthMm} × {p.heightMm} mm)
                </option>
              ))}
            </optgroup>
            <optgroup label="Format Foto & Pas Foto">
              {PAPER_SIZES.filter((p) => p.category === 'photo').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.widthMm} × {p.heightMm} mm)
                </option>
              ))}
            </optgroup>
            <optgroup label="Format Besar / Plotter / SRA">
              {PAPER_SIZES.filter((p) => p.category === 'extended').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.widthMm} × {p.heightMm} mm)
                </option>
              ))}
            </optgroup>
            <optgroup label="Khusus Roll & Continuous Form (Non-L3110)">
              {PAPER_SIZES.filter((p) => p.category === 'specialized_roll').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Orientation Toggle */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Orientasi Halaman
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ orientation: 'portrait' as Orientation })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                config.orientation === 'portrait'
                  ? 'border-indigo-500 bg-indigo-950/50 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="h-4 w-3 border border-current rounded-xs" />
              <span>Portrait (Tegak)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ orientation: 'landscape' as Orientation })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                config.orientation === 'landscape'
                  ? 'border-indigo-500 bg-indigo-950/50 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="h-3 w-4 border border-current rounded-xs" />
              <span>Landscape (Mendatar)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Size Inputs if custom selected */}
      {config.paperSizeId === 'custom' && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-900/40">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Lebar Custom (mm)</label>
            <input
              type="number"
              min={20}
              max={1200}
              value={config.customWidthMm}
              onChange={(e) => onChange({ customWidthMm: parseFloat(e.target.value) || 210 })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tinggi Custom (mm)</label>
            <input
              type="number"
              min={20}
              max={1500}
              value={config.customHeightMm}
              onChange={(e) => onChange({ customHeightMm: parseFloat(e.target.value) || 297 })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* Clarification about F4 vs Legal */}
      {config.paperSizeId === 'f4' && (
        <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-3 text-xs text-blue-300">
          <p className="font-semibold text-blue-200">
            Catatan F4 / Folio (Indonesia):
          </p>
          <p className="mt-0.5 text-neutral-300 leading-relaxed">
            F4 berukuran <strong>215,9 × 330,2 mm (33 cm)</strong>. Jangan gunakan preset <em>US Legal</em> di driver printer karena Legal lebih panjang (35,56 cm) sehingga teks bawah rawan terpotong.
          </p>
        </div>
      )}

      {/* Device Compatibility Warning */}
      {isEpsonIncompatible && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold">Catatan Kompatibilitas Perangkat: </span>
            Ukuran {currentPaper.name} melebihi batas fisik printer Epson L3110 (maks 215,9 mm). Output PDF tetap dapat dibuat dan disimpan secara akurat untuk dicetak pada mesin format besar/plotter.
          </div>
        </div>
      )}

      {/* Media Type, Grammage & Printer Profile */}
      <div className="pt-3 border-t border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-neutral-400" />
          <h5 className="text-xs font-semibold text-neutral-300">
            Jenis Kertas, Gramasi (GSM) & Driver Printer
          </h5>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Media Type */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Jenis Media</label>
            <select
              value={config.mediaTypeId}
              onChange={(e) => {
                const newMedia = MEDIA_TYPES.find((m) => m.id === e.target.value) || MEDIA_TYPES[0];
                onChange({
                  mediaTypeId: newMedia.id,
                  gsm: newMedia.availableGsm[0] || 75,
                });
              }}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
            >
              {MEDIA_TYPES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Grammage */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Ketebalan / Gramasi</label>
            <select
              value={config.gsm}
              onChange={(e) => onChange({ gsm: parseInt(e.target.value, 10) })}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
            >
              {currentMedia.availableGsm.map((gsmVal) => (
                <option key={gsmVal} value={gsmVal}>
                  {gsmVal} GSM
                </option>
              ))}
            </select>
          </div>

          {/* Printer Profile */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Profil Printer</label>
            <select
              value={config.printerProfileId}
              onChange={(e) => onChange({ printerProfileId: e.target.value })}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
            >
              {PRINTER_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Driver Helper Tip */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/80">
          <span>
            Setting Paper Type di Driver: <strong className="text-neutral-200">{currentMedia.epsonPaperType}</strong>
          </span>
          <span className="text-neutral-500">
            {config.gsm >= 200 ? '⚠️ Kertas tebal: Masukkan 1 per 1' : 'Standar feeding tray'}
          </span>
        </div>
      </div>
    </div>
  );
};
