import { JobConfig, PhotoGridMode } from '../types/print';

export interface PhotoItemRect {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  label: string;
}

export interface IndoPreset {
  id: string;
  name: string;
  category: 'identitas' | 'sekolah' | 'administrasi' | 'foto';
  description: string;
  badge: string;
  paperInfo: string;
  iconName: string;
  config: Partial<JobConfig>;
}

export const INDO_PRESETS: IndoPreset[] = [
  {
    id: 'kk',
    name: 'Kartu Keluarga (KK)',
    category: 'identitas',
    description: 'Kertas F4 Folio Mendatar (Landscape). Tabel dan NIK muat penuh tanpa terpotong.',
    badge: 'F4 Landscape',
    paperInfo: 'F4 · 215,9 × 330,2 mm',
    iconName: 'Users',
    config: {
      paperSizeId: 'f4',
      orientation: 'landscape',
      adjustMode: 'fit',
      margins: { top: 6, bottom: 6, left: 6, right: 6, linked: true },
      mediaTypeId: 'hvs',
      gsm: 75,
      photoGridMode: 'none',
      showCropMarks: false,
      colorMode: 'color',
      enhanceFilter: 'none',
    },
  },
  {
    id: 'ijazah',
    name: 'Ijazah Sekolah',
    category: 'sekolah',
    description: 'Kertas F4 Folio Tegak. Margin aman 12 mm agar bingkai ornamen tidak tertutup map.',
    badge: 'F4 Portrait (Tegak)',
    paperInfo: 'F4 · 215,9 × 330,2 mm',
    iconName: 'GraduationCap',
    config: {
      paperSizeId: 'f4',
      orientation: 'portrait',
      adjustMode: 'fit',
      margins: { top: 12, bottom: 12, left: 12, right: 12, linked: true },
      mediaTypeId: 'hvs',
      gsm: 80,
      photoGridMode: 'none',
      showCropMarks: false,
      colorMode: 'color',
      enhanceFilter: 'none',
    },
  },
  {
    id: 'sertifikat',
    name: 'Sertifikat & Piagam',
    category: 'sekolah',
    description: 'Kertas A4 Mendatar (Landscape) dengan margin simetris untuk kertas sertifikat/linen.',
    badge: 'A4 Landscape',
    paperInfo: 'A4 · 210 × 297 mm',
    iconName: 'Award',
    config: {
      paperSizeId: 'a4',
      orientation: 'landscape',
      adjustMode: 'fit',
      margins: { top: 10, bottom: 10, left: 10, right: 10, linked: true },
      mediaTypeId: 'photo_glossy',
      gsm: 210,
      photoGridMode: 'none',
      showCropMarks: false,
      colorMode: 'color',
      enhanceFilter: 'none',
    },
  },
  {
    id: 'ktp_sim',
    name: 'KTP & SIM (Ukuran Asli)',
    category: 'identitas',
    description: 'Skala 100% ukuran fisik KTP asli (85,6 × 54 mm) pas di tengah kertas dengan garis potong.',
    badge: 'Skala Asli 100%',
    paperInfo: 'A4 / F4 Tengah',
    iconName: 'CreditCard',
    config: {
      paperSizeId: 'a4',
      orientation: 'portrait',
      adjustMode: 'actual',
      margins: { top: 20, bottom: 20, left: 20, right: 20, linked: true },
      mediaTypeId: 'hvs',
      gsm: 80,
      photoGridMode: 'none',
      showCropMarks: true,
      colorMode: 'color',
      enhanceFilter: 'none',
    },
  },
  {
    id: 'akta_nikah',
    name: 'Akta Lahir / Surat Nikah',
    category: 'administrasi',
    description: 'Kertas F4 Folio Tegak dengan filter kontras pekat agar cap stempel dan tulisan jelas.',
    badge: 'F4 Tegak · Kontras',
    paperInfo: 'F4 · 215,9 × 330,2 mm',
    iconName: 'FileCheck',
    config: {
      paperSizeId: 'f4',
      orientation: 'portrait',
      adjustMode: 'fit',
      margins: { top: 8, bottom: 8, left: 8, right: 8, linked: true },
      mediaTypeId: 'hvs',
      gsm: 75,
      photoGridMode: 'none',
      showCropMarks: false,
      colorMode: 'color',
      enhanceFilter: 'sharpen',
    },
  },
  {
    id: 'lamaran_cv',
    name: 'Surat Lamaran & CV',
    category: 'administrasi',
    description: 'Kertas A4 Tegak dengan margin kiri 18 mm khusus staples, klip, atau jilid rapi.',
    badge: 'A4 Portrait · Margin Jilid',
    paperInfo: 'A4 · 210 × 297 mm',
    iconName: 'FileText',
    config: {
      paperSizeId: 'a4',
      orientation: 'portrait',
      adjustMode: 'fit',
      margins: { top: 10, bottom: 10, left: 18, right: 10, linked: false },
      mediaTypeId: 'hvs',
      gsm: 75,
      photoGridMode: 'none',
      showCropMarks: false,
      colorMode: 'color',
      enhanceFilter: 'none',
    },
  },
  {
    id: 'pas_foto_paket',
    name: 'Paket Pas Foto Komplit',
    category: 'foto',
    description: '1 lembar kertas A4 isi 12 pas foto campuran (2×3, 3×4, 4×6) lengkap dengan garis potong.',
    badge: '12 Pas Foto + Garis Potong',
    paperInfo: 'A4 Glossy · 230 GSM',
    iconName: 'Grid',
    config: {
      paperSizeId: 'a4',
      orientation: 'portrait',
      adjustMode: 'fill',
      photoGridMode: 'package_mix',
      mediaTypeId: 'photo_glossy',
      gsm: 230,
      showCropMarks: true,
      colorMode: 'color',
      enhanceFilter: 'none',
    },
  },
  {
    id: 'struk_transfer',
    name: 'Struk & Bukti Transfer',
    category: 'administrasi',
    description: 'Diletakkan pas di tengah lembar dengan mode teks pekat (auto-contrast) agar mudah dibaca.',
    badge: 'A4 Tengah · Teks Pekat',
    paperInfo: 'A4 · Tengah Lembar',
    iconName: 'Receipt',
    config: {
      paperSizeId: 'a4',
      orientation: 'portrait',
      adjustMode: 'fit',
      margins: { top: 25, bottom: 25, left: 25, right: 25, linked: true },
      mediaTypeId: 'hvs',
      gsm: 75,
      photoGridMode: 'none',
      showCropMarks: true,
      colorMode: 'color',
      enhanceFilter: 'high_contrast',
    },
  },
];

/**
 * Calculates millimeter coordinates for pas foto items on a paper sheet
 */
export function calculatePhotoGridItems(
  mode: PhotoGridMode,
  paperWidthMm: number,
  paperHeightMm: number
): PhotoItemRect[] {
  if (mode === 'none') return [];

  const items: PhotoItemRect[] = [];
  const startY = 20;
  const gap = 5;

  if (mode === 'package_mix') {
    // Row 1: 4 pieces of 4x6 (38x56 mm)
    const w4x6 = 38;
    const h4x6 = 56;
    let currX = (paperWidthMm - (4 * w4x6 + 3 * gap)) / 2;
    let currY = startY;

    for (let i = 0; i < 4; i++) {
      items.push({
        xMm: currX,
        yMm: currY,
        widthMm: w4x6,
        heightMm: h4x6,
        label: '4×6',
      });
      currX += w4x6 + gap;
    }

    // Row 2: 4 pieces of 3x4 (28x38 mm)
    const w3x4 = 28;
    const h3x4 = 38;
    currX = (paperWidthMm - (4 * w3x4 + 3 * gap)) / 2;
    currY += h4x6 + 12;

    for (let i = 0; i < 4; i++) {
      items.push({
        xMm: currX,
        yMm: currY,
        widthMm: w3x4,
        heightMm: h3x4,
        label: '3×4',
      });
      currX += w3x4 + gap;
    }

    // Row 3: 4 pieces of 2x3 (20x30 mm)
    const w2x3 = 20;
    const h2x3 = 30;
    currX = (paperWidthMm - (4 * w2x3 + 3 * gap)) / 2;
    currY += h3x4 + 12;

    for (let i = 0; i < 4; i++) {
      items.push({
        xMm: currX,
        yMm: currY,
        widthMm: w2x3,
        heightMm: h2x3,
        label: '2×3',
      });
      currX += w2x3 + gap;
    }
  } else if (mode === 'pass_3x4') {
    // 12 pieces of 3x4 (3 rows x 4 cols)
    const w = 28;
    const h = 38;
    const cols = 4;
    const rows = 3;
    const totalW = cols * w + (cols - 1) * gap;
    const startX = (paperWidthMm - totalW) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          xMm: startX + c * (w + gap),
          yMm: startY + r * (h + gap * 2),
          widthMm: w,
          heightMm: h,
          label: '3×4',
        });
      }
    }
  } else if (mode === 'pass_4x6') {
    // 8 pieces of 4x6 (2 rows x 4 cols)
    const w = 38;
    const h = 56;
    const cols = 4;
    const rows = 2;
    const totalW = cols * w + (cols - 1) * gap;
    const startX = (paperWidthMm - totalW) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          xMm: startX + c * (w + gap),
          yMm: startY + r * (h + gap * 2),
          widthMm: w,
          heightMm: h,
          label: '4×6',
        });
      }
    }
  } else if (mode === 'pass_2x3') {
    // 16 pieces of 2x3 (4 rows x 4 cols)
    const w = 20;
    const h = 30;
    const cols = 4;
    const rows = 4;
    const totalW = cols * w + (cols - 1) * gap;
    const startX = (paperWidthMm - totalW) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          xMm: startX + c * (w + gap),
          yMm: startY + r * (h + gap * 2),
          widthMm: w,
          heightMm: h,
          label: '2×3',
        });
      }
    }
  }

  return items;
}
