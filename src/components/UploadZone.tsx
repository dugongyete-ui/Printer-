import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, AlertCircle } from 'lucide-react';
import { FileItem } from '../types/print';
import { processInputFile } from '../utils/fileParser';
import { createSampleReceiptImage, createSampleCertificateImage } from '../utils/sampleData';

interface UploadZoneProps {
  onFilesLoaded: (files: FileItem[]) => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesLoaded, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" melebihi batas 50 MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      const processedItems: FileItem[] = [];
      for (const f of validFiles) {
        const item = await processInputFile(f);
        if (item.status === 'error') {
          setErrorMessage(item.errorMessage || `Gagal memproses file.`);
        } else {
          processedItems.push(item);
        }
      }

      if (processedItems.length > 0) {
        onFilesLoaded(processedItems);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Format file belum didukung.');
    }
  };

  const loadSampleReceipt = () => {
    const page = createSampleReceiptImage();
    const fakeFile = new File(['sample'], 'Bukti_Bayar_Kecil.png', { type: 'image/png' });
    const item: FileItem = {
      id: `sample_${Date.now()}`,
      file: fakeFile,
      name: 'Bukti_Bayar_Kecil.png',
      size: 45000,
      type: 'image/png',
      extension: 'png',
      totalPages: 1,
      currentPageIndex: 0,
      pages: [page],
      status: 'ready',
    };
    onFilesLoaded([item]);
  };

  const loadSampleCertificate = () => {
    const page = createSampleCertificateImage();
    const fakeFile = new File(['sample'], 'Sertifikat_Foto.png', { type: 'image/png' });
    const item: FileItem = {
      id: `sample_${Date.now()}`,
      file: fakeFile,
      name: 'Sertifikat_Foto.png',
      size: 110000,
      type: 'image/png',
      extension: 'png',
      totalPages: 1,
      currentPageIndex: 0,
      pages: [page],
      status: 'ready',
    };
    onFilesLoaded([item]);
  };

  return (
    <div className="w-full">
      {/* Drag & Drop Surface */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragOver
            ? 'border-slate-800 bg-slate-100/80 ring-2 ring-slate-800/10'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.doc,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-transform group-hover:scale-105">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
          Klik untuk Memilih File atau Tarik ke Sini
        </h3>

        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Sistem otomatis mendeteksi ukuran dan menyarankan setelan terbaik untuk kertas A4 atau F4.
        </p>

        {/* Clean unboxed metadata with separators */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span>Foto JPG, PNG</span>
          <span aria-hidden="true">·</span>
          <span>Dokumen PDF</span>
          <span aria-hidden="true">·</span>
          <span>Word DOCX</span>
          <span aria-hidden="true">·</span>
          <span>Excel XLSX</span>
        </div>

        {isLoading && (
          <div className="mt-3 text-xs font-medium text-slate-600 animate-pulse">
            Sedang memuat file...
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Instant Test Buttons for Zero Hassle Testing */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-700" />
          <span>Ingin mencoba tanpa upload file sendiri?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSampleReceipt}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Coba Contoh Bukti Bayar
          </button>
          <button
            type="button"
            onClick={loadSampleCertificate}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Coba Contoh Sertifikat
          </button>
        </div>
      </div>
    </div>
  );
};
