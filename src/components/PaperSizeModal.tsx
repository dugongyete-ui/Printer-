import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Mail,
  Sliders,
  Printer,
  Sparkles,
} from 'lucide-react';
import { PAPER_SIZES } from '../constants/paperCatalog';
import { PaperSize } from '../types/print';

interface PaperSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPaperId: string;
  customWidthMm: number;
  customHeightMm: number;
  onSelectPaper: (paperId: string, customWidth?: number, customHeight?: number) => void;
}

type CategoryTab = 'all' | 'doc' | 'photo' | 'large' | 'envelope' | 'custom';

export const PaperSizeModal: React.FC<PaperSizeModalProps> = ({
  isOpen,
  onClose,
  currentPaperId,
  customWidthMm,
  customHeightMm,
  onSelectPaper,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [tempCustomW, setTempCustomW] = useState(customWidthMm || 210);
  const [tempCustomH, setTempCustomH] = useState(customHeightMm || 297);

  if (!isOpen) return null;

  // Filter papers
  const filteredPapers = PAPER_SIZES.filter((p) => {
    // Search filter
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      `${p.widthMm}x${p.heightMm}`.includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'all') return p.id !== 'custom';
    if (activeTab === 'doc') {
      return (
        ['a4', 'f4', 'letter', 'legal', 'a5', 'a6', 'b5', 'b4', 'executive', 'sra4'].includes(
          p.id
        )
      );
    }
    if (activeTab === 'photo') {
      return p.category === 'photo';
    }
    if (activeTab === 'large') {
      return ['a3', 'a3_plus', 'a2', 'a1', 'a0', 'sra3'].includes(p.id);
    }
    if (activeTab === 'envelope') {
      return (
        p.id.startsWith('envelope') ||
        p.id === 'id_card' ||
        p.category === 'specialized_roll'
      );
    }
    if (activeTab === 'custom') {
      return p.id === 'custom';
    }
    return true;
  });

  const getCategoryIcon = (paper: PaperSize) => {
    if (paper.category === 'photo') return <ImageIcon className="h-4 w-4 text-amber-600" />;
    if (paper.requiresSpecialPrinter) return <Maximize2 className="h-4 w-4 text-purple-600" />;
    if (paper.id.startsWith('envelope')) return <Mail className="h-4 w-4 text-blue-600" />;
    return <FileText className="h-4 w-4 text-slate-700" />;
  };

  const handleApplyCustom = () => {
    onSelectPaper('custom', tempCustomW, tempCustomH);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Printer className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Katalog Lengkap Semua Ukuran Kertas
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih dari 30+ standar ukuran kertas internasional, dokumen Indonesia, foto, hingga ukuran kustom bebas.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="border-b border-slate-100 p-4 space-y-3 bg-white">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik untuk mencari ukuran (misal: A4, F4, A3, Foto 4R, Amplop, B5, Legal, 58 mm)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Ukuran ({PAPER_SIZES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('doc')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'doc'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dokumen & Kantor (A4, F4, Legal...)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'photo'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kertas Foto & Pas Foto (4R, 3R, 8R...)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('large')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'large'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Format Besar (A3, A3+, Plotter)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('envelope')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'envelope'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Amplop, KTP & Kasir
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'custom'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sliders className="h-3 w-3" />
              <span>Kustom Bebas (mm)</span>
            </button>
          </div>
        </div>

        {/* Paper Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[55vh]">
          {activeTab === 'custom' ? (
            /* Custom mm dimensions input panel */
            <div className="max-w-md mx-auto p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4">
              <div className="h-10 w-10 mx-auto rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Tentukan Ukuran Kertas Kustom Sendiri
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan ukuran fisik lebar dan tinggi dalam satuan milimeter (mm).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Lebar (mm):
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={2000}
                    value={tempCustomW}
                    onChange={(e) => setTempCustomW(parseFloat(e.target.value) || 210)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    = {(tempCustomW / 10).toFixed(1)} cm
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tinggi (mm):
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={2000}
                    value={tempCustomH}
                    onChange={(e) => setTempCustomH(parseFloat(e.target.value) || 297)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    = {(tempCustomH / 10).toFixed(1)} cm
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
              >
                Gunakan Ukuran Kustom ({tempCustomW} × {tempCustomH} mm)
              </button>
            </div>
          ) : (
            /* Paper list grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredPapers.map((paper) => {
                const isSelected = currentPaperId === paper.id;
                const widthCm = (paper.widthMm / 10).toFixed(1);
                const heightCm = (paper.heightMm / 10).toFixed(1);
                const widthIn = (paper.widthMm / 25.4).toFixed(1);
                const heightIn = (paper.heightMm / 25.4).toFixed(1);

                return (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => {
                      onSelectPaper(paper.id);
                      onClose();
                    }}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected ? 'bg-slate-800' : 'bg-slate-100'
                          }`}
                        >
                          {getCategoryIcon(paper)}
                        </div>
                        <span className="font-bold text-xs font-['Plus_Jakarta_Sans'] line-clamp-1">
                          {paper.name}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-slate-900">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : paper.isPopular ? (
                        <span className="text-[9.5px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                          Populer
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          isSelected ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      >
                        {paper.widthMm} × {paper.heightMm} mm
                      </span>
                      <span
                        className={`text-[10px] font-mono tabular-nums ${
                          isSelected ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      >
                        ({widthCm} × {heightCm} cm · {widthIn}×{heightIn}")
                      </span>
                    </div>

                    {paper.description && (
                      <p
                        className={`text-[10.5px] mt-1.5 leading-snug line-clamp-2 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {paper.description}
                      </p>
                    )}

                    {paper.requiresSpecialPrinter && (
                      <div className="mt-2 text-[9.5px] text-amber-600 flex items-center gap-1 font-medium">
                        <span>⚠️ Perlu printer A3/khusus</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 px-6 py-3 bg-slate-50/70 text-xs text-slate-500">
          <span>
            Ukuran aktif saat ini:{' '}
            <strong className="text-slate-800 font-mono">
              {PAPER_SIZES.find((p) => p.id === currentPaperId)?.name || currentPaperId}
            </strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
