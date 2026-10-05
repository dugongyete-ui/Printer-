import React from 'react';
import { X, Printer, Check } from 'lucide-react';

interface EpsonGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EpsonGuideModal: React.FC<EpsonGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Panduan Praktis Cetak Epson L3110 / L3210
              </h3>
              <p className="text-xs text-slate-500">
                Cara mengatur ukuran kertas A4 & F4 agar tidak terpotong.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="mt-4 space-y-3.5 text-xs text-slate-700">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
            <span className="font-bold text-slate-900">1. Memilih Ukuran Kertas pada Driver Printer</span>
            <ul className="mt-1 space-y-1 text-slate-600 text-[11px] list-disc list-inside">
              <li>
                <strong>Untuk Kertas A4:</strong> Pilih langsung opsi <em>A4 (210 × 297 mm)</em>.
              </li>
              <li>
                <strong>Untuk Kertas F4 / Folio:</strong> Jika opsi Folio belum ada di driver, klik <em>User-Defined (Tentukan Sendiri)</em>, lalu ketik lebar <strong>215.9 mm</strong> dan tinggi <strong>330.2 mm</strong>.
              </li>
              <li>
                ⚠️ <em>Jangan memilih US Legal</em>, karena Legal lebih panjang (35,5 cm) sehingga margin bawah sering meleset.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
            <span className="font-bold text-slate-900">2. Pengaturan Skala Cetak (Scale)</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Wajib pilih <strong>Actual Size</strong> atau ketik <strong>100%</strong>. Jangan pilih <em>"Fit to Printable Area"</em> karena PrintFit sudah menyesuaikan ukuran fisik secara presisi.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
            <span className="font-bold text-slate-900">3. Jenis Kertas (Paper Type)</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Gunakan <strong>Plain Paper</strong> untuk kertas HVS fotokopi (70–80 GSM). Gunakan <strong>Epson Premium Glossy</strong> jika mencetak di kertas foto mengkilap.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
