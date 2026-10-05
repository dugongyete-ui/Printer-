import React, { useState } from 'react';
import {
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Info,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { JobConfig, FileItem, CanvasTransform } from '../types/print';
import { PAPER_SIZES } from '../constants/paperCatalog';
import { generatePrintReadyPdf, triggerDirectBrowserPrint } from '../utils/pdfGenerator';
import { resizeDocxFile } from '../utils/docxResizer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileItem: FileItem;
  config: JobConfig;
  transform: CanvasTransform;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  fileItem,
  config,
  transform,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Menyiapkan file...');
  const [generatedPdfBlobUrl, setGeneratedPdfBlobUrl] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const paper = PAPER_SIZES.find((p) => p.id === config.paperSizeId) || PAPER_SIZES[0];
  const isDocx = fileItem.name.toLowerCase().endsWith('.docx') || fileItem.type.includes('word');
  const isPdf = fileItem.name.toLowerCase().endsWith('.pdf') || fileItem.type.includes('pdf');

  const handleStartExport = async () => {
    setIsProcessing(true);
    setProgress(15);
    setErrorMsg(null);
    setStatusMessage('Menyesuaikan ukuran fisik dan rasio...');

    try {
      const pdfBytes = await generatePrintReadyPdf(
        fileItem.pages,
        config,
        transform,
        (pct, text) => {
          setProgress(pct);
          setStatusMessage(text);
        },
        fileItem.file
      );

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setGeneratedPdfBlobUrl(url);
      setFileSizeKb(Math.round(blob.size / 1024));
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan saat membuat file PDF.');
    }
  };

  React.useEffect(() => {
    if (isOpen && !generatedPdfBlobUrl && !isProcessing) {
      handleStartExport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    if (!generatedPdfBlobUrl) return;
    const link = document.createElement('a');
    link.href = generatedPdfBlobUrl;
    const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_PrintFit_${paper.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadResizedDocx = async () => {
    if (!isDocx || isDownloadingDocx) return;
    try {
      setIsDownloadingDocx(true);
      const docxBytes = await resizeDocxFile(fileItem.file, paper, config);
      const blob = new Blob([docxBytes.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
      link.download = `${baseName}_${paper.name.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download DOCX error:', err);
      alert('Gagal mengunduh file DOCX: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadImage = () => {
    const page = fileItem.pages[fileItem.currentPageIndex] || fileItem.pages[0];
    if (!page) return;
    const link = document.createElement('a');
    link.href = page.dataUrl;
    link.download = `${fileItem.name.replace(/\.[^/.]+$/, '')}_PrintFit.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectPrint = () => {
    const page = fileItem.pages[fileItem.currentPageIndex] || fileItem.pages[0];
    if (!page) return;

    let w = paper.id === 'custom' ? config.customWidthMm : paper.widthMm;
    let h = paper.id === 'custom' ? config.customHeightMm : paper.heightMm;

    triggerDirectBrowserPrint(page.dataUrl, paper.name, w, h, config.orientation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Processing State */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 h-10 w-10 rounded-full border-3 border-slate-900 border-t-transparent animate-spin" />
            <h4 className="text-sm font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
              Membuat File Siap Cetak
            </h4>
            <p className="mt-1 text-xs text-slate-500">{statusMessage}</p>

            <div className="mt-5 w-full max-w-xs h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="mt-2 font-mono text-[11px] text-slate-400 tabular-nums">
              {progress}%
            </span>
          </div>
        )}

        {/* Error State */}
        {!isProcessing && errorMsg && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Gagal Membuat File</h4>
            <p className="mt-1 text-xs text-red-600 max-w-sm mx-auto">{errorMsg}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={handleStartExport}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Coba Lagi
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Completion State */}
        {!isProcessing && !errorMsg && generatedPdfBlobUrl && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Dokumen Siap Diunduh
                </h4>
                <p className="text-xs text-slate-500">
                  Disesuaikan ke ukuran {paper.name} ({config.orientation}).
                </p>
              </div>
            </div>

            {/* Original Integrity Badge */}
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 p-3 text-xs text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-emerald-950">Isi Dokumen Asli 100% Terjaga: </span>
                {isDocx
                  ? `Semua teks, tabel, font, gambar, dan format Word asli Anda tetap 100% utuh tanpa diubah. Hanya ukuran halaman (<w:pgSz>) dan margin yang diperbarui ke ${paper.name}.`
                  : isPdf
                  ? `Format vektor asli, font, teks tajam, dan diagram PDF Anda dipertahankan utuh tanpa kompresi pixel / rasterization ke ukuran ${paper.name}.`
                  : `Rasio asli dokumen Anda terkunci proporsional dan aman dari gepeng saat dicetak di kertas ${paper.name}.`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {/* If DOCX, offer original DOCX download with updated paper size */}
              {isDocx && (
                <button
                  type="button"
                  onClick={handleDownloadResizedDocx}
                  disabled={isDownloadingDocx}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>
                    {isDownloadingDocx
                      ? 'Menyiapkan File Word...'
                      : `Unduh File Word Asli (.docx) — Ukuran ${paper.name}`}
                  </span>
                </button>
              )}

              {/* PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>
                  {isDocx
                    ? `Unduh Versi Cetak PDF (.pdf) — Ukuran ${paper.name}`
                    : `Unduh PDF Asli Siap Cetak (${paper.name})`}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-700" />
                  <span>Cetak Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-slate-700" />
                  <span>Unduh Gambar (PNG)</span>
                </button>
              </div>

              {/* Checklist Print Reminder */}
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/80 space-y-1 mt-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Info className="h-3.5 w-3.5 text-slate-700" />
                  <span>Petunjuk Cetak Printer Epson / Inkjet:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px] leading-relaxed">
                  <li>Ukuran Kertas di Driver Printer: <strong>{paper.name}</strong></li>
                  <li>Skala: Pilih <strong>Actual Size (100%)</strong></li>
                </ul>
              </div>

              <div className="text-center pt-1">
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  Ukuran file: {fileSizeKb} KB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
