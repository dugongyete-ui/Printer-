import { FileItem, JobConfig, Orientation, AdjustMode } from '../types/print';

export interface SmartRecommendation {
  title: string;
  explanation: string;
  paperSizeId: 'a4' | 'f4' | string;
  orientation: Orientation;
  adjustMode: AdjustMode;
  mediaTypeId: string;
  gsm: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    linked: boolean;
  };
  reasonList: string[];
}

/**
 * Analyzes file and selected paper size to provide autonomous, intelligent recommendations
 * so beginners don't need to configure complex printing settings manually.
 */
export function getSmartRecommendation(
  fileItem: FileItem | null,
  targetPaperSizeId: 'a4' | 'f4' = 'a4'
): SmartRecommendation {
  if (!fileItem || !fileItem.pages || fileItem.pages.length === 0) {
    return {
      title: targetPaperSizeId === 'a4' ? 'Rekomendasi Standar A4' : 'Rekomendasi Standar F4 / Folio',
      explanation: 'File belum diunggah. Pengaturan standar siap digunakan.',
      paperSizeId: targetPaperSizeId,
      orientation: 'portrait',
      adjustMode: 'fit',
      mediaTypeId: 'hvs',
      gsm: targetPaperSizeId === 'f4' ? 75 : 80,
      margins: { top: 5, bottom: 5, left: 5, right: 5, linked: true },
      reasonList: ['Orientasi Portrait', 'Margin aman 5 mm', 'Kertas HVS'],
    };
  }

  const page = fileItem.pages[fileItem.currentPageIndex] || fileItem.pages[0];
  const aspect = page.aspectRatio; // width / height
  const isLandscape = aspect > 1.15;
  const isSquare = aspect >= 0.85 && aspect <= 1.15;
  const ext = fileItem.extension.toLowerCase();

  const isDoc = ['pdf', 'docx', 'doc'].includes(ext);
  const isSheet = ['xlsx', 'xls', 'csv'].includes(ext);
  const isPhoto = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

  // Determine optimal orientation
  let optimalOrientation: Orientation = isLandscape ? 'landscape' : 'portrait';
  if (isSheet) {
    optimalOrientation = 'landscape';
  }

  // Determine media & gsm
  let mediaTypeId = 'hvs';
  let gsm = targetPaperSizeId === 'f4' ? 75 : 80;
  if (isPhoto && !isDoc) {
    // Photos benefit from Photo Paper Glossy or standard HVS
    mediaTypeId = 'photo_glossy';
    gsm = 230;
  }

  // Determine margins
  // For documents: 10mm top/bottom/sides or 5mm safe inkjet
  const margins = isDoc
    ? { top: 8, bottom: 8, left: 10, right: 10, linked: false }
    : { top: 4, bottom: 4, left: 4, right: 4, linked: true };

  // Determine title and plain Indonesian explanations
  let title = '';
  let explanation = '';
  const reasonList: string[] = [];

  if (targetPaperSizeId === 'a4') {
    title = isPhoto
      ? 'Rekomendasi Pintar: Foto Pas di A4'
      : isDoc
      ? 'Rekomendasi Pintar: Dokumen Rapi A4'
      : 'Rekomendasi Pintar: A4 Siap Cetak';

    if (isPhoto) {
      explanation = `Foto otomatis diposisikan ${optimalOrientation === 'landscape' ? 'Mendatar (Landscape)' : 'Tegak (Portrait)'} dan diperbesar maksimal tanpa merusak bentuk asli (anti-gepeng).`;
      reasonList.push(`Orientasi otomatis: ${optimalOrientation === 'landscape' ? 'Landscape' : 'Portrait'} mengikuti foto`);
      reasonList.push('Mode Fit: Seluruh foto terlihat penuh tanpa terpotong');
      reasonList.push('Margin aman 4 mm agar tidak terkena batas roller printer');
    } else if (isDoc) {
      explanation = 'Format dokumen disesuaikan ke standar A4 internasional dengan margin simetris untuk jilid dan klip.';
      reasonList.push('Ukuran A4: 210 × 297 mm');
      reasonList.push('Margin dokumen 8–10 mm');
      reasonList.push('Media rekomendasi: HVS 80 GSM');
    } else {
      explanation = 'Tabel spreadsheet dilebarkan dalam mode Landscape agar seluruh kolom muat dalam 1 halaman A4.';
      reasonList.push('Orientasi Landscape');
      reasonList.push('Skala proporsional otomatis');
    }
  } else {
    // F4 / Folio
    title = isPhoto
      ? 'Rekomendasi Pintar: Foto Pas di F4 / Folio'
      : isDoc
      ? 'Rekomendasi Pintar: Dokumen Resmi F4 / Folio'
      : 'Rekomendasi Pintar: F4 Siap Cetak';

    explanation = `Ukuran otomatis dikunci ke standar F4 Indonesia (21,5 × 33 cm). Menghindari kesalahan cetak US Legal yang terlalu panjang.`;
    reasonList.push('Ukuran fisik: 215,9 × 330,2 mm (Standar Folio / Map Indonesia)');
    reasonList.push(`Orientasi: ${optimalOrientation === 'landscape' ? 'Landscape' : 'Portrait'}`);
    reasonList.push('Skala 100% otomatis diatur agar margin bawah tidak meleset di Epson L3110');
    reasonList.push('Media rekomendasi: HVS 70/75 GSM');
  }

  return {
    title,
    explanation,
    paperSizeId: targetPaperSizeId,
    orientation: optimalOrientation,
    adjustMode: 'fit',
    mediaTypeId,
    gsm,
    margins,
    reasonList,
  };
}
