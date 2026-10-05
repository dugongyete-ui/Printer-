/**
 * Utility to identify the original paper format of an uploaded document
 * based on its natural aspect ratio.
 */

export interface DetectedPaperInfo {
  name: string;
  dimensionsMm: string;
  notes: string;
  isCommonMismatch: boolean;
}

export function detectDocumentOriginalSize(aspectRatio: number): DetectedPaperInfo {
  if (!aspectRatio || aspectRatio <= 0) {
    return {
      name: 'Dokumen Standar',
      dimensionsMm: '210 × 297 mm',
      notes: 'Rasio dokumen standar.',
      isCommonMismatch: false,
    };
  }

  const isLandscape = aspectRatio > 1;
  const portraitRatio = isLandscape ? 1 / aspectRatio : aspectRatio;

  // US Letter: 8.5 x 11 inches (215.9 x 279.4 mm) -> ratio = 0.7727
  if (Math.abs(portraitRatio - 0.7727) < 0.035) {
    return {
      name: isLandscape ? 'US Letter (Landscape)' : 'US Letter (Bawaan Word)',
      dimensionsMm: isLandscape ? '279.4 × 215.9 mm' : '215.9 × 279.4 mm',
      notes: 'Ukuran bawaan default Microsoft Word & PDF ekspor Amerika.',
      isCommonMismatch: true,
    };
  }

  // A4: 210 x 297 mm -> ratio = 0.7071
  if (Math.abs(portraitRatio - 0.7071) < 0.035) {
    return {
      name: isLandscape ? 'A4 (Landscape)' : 'A4 Standar',
      dimensionsMm: isLandscape ? '297 × 210 mm' : '210 × 297 mm',
      notes: 'Ukuran standar dokumen resmi di Indonesia & internasional.',
      isCommonMismatch: false,
    };
  }

  // F4 / Folio: 215.9 x 330.2 mm (8.5 x 13 in) -> ratio = 0.6538
  if (Math.abs(portraitRatio - 0.6538) < 0.035) {
    return {
      name: isLandscape ? 'F4 / Folio (Landscape)' : 'F4 / Folio Indonesia',
      dimensionsMm: isLandscape ? '330.2 × 215.9 mm' : '215.9 × 330.2 mm',
      notes: 'Ukuran kertas fisik HVS Folio (33 cm) yang umum di fotokopi/kantor.',
      isCommonMismatch: false,
    };
  }

  // US Legal: 8.5 x 14 in (215.9 x 355.6 mm) -> ratio = 0.6071
  if (Math.abs(portraitRatio - 0.6071) < 0.035) {
    return {
      name: isLandscape ? 'US Legal (Landscape)' : 'US Legal (Panjang 35.5 cm)',
      dimensionsMm: isLandscape ? '355.6 × 215.9 mm' : '215.9 × 355.6 mm',
      notes: 'Ukuran Legal lebih panjang 2.5 cm dari kertas F4 Indonesia.',
      isCommonMismatch: true,
    };
  }

  // A3: 297 x 420 mm -> ratio = 0.7071 (covered above)
  // A5: 148 x 210 mm -> ratio = 0.7047
  if (Math.abs(portraitRatio - 0.7047) < 0.02) {
    return {
      name: isLandscape ? 'A5 (Landscape)' : 'A5 (Buku Saku)',
      dimensionsMm: isLandscape ? '210 × 148 mm' : '148 × 210 mm',
      notes: 'Ukuran separuh A4.',
      isCommonMismatch: false,
    };
  }

  return {
    name: 'Ukuran Dokumen Asli',
    dimensionsMm: `Rasio ${aspectRatio.toFixed(2)} : 1`,
    notes: 'Format proporsi asli dokumen.',
    isCommonMismatch: false,
  };
}
