export type PaperCategory = 'standard' | 'photo' | 'extended' | 'specialized_roll';

export interface PaperSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  category: PaperCategory;
  description?: string;
  isPopular?: boolean;
  requiresSpecialPrinter?: boolean;
}

export type Orientation = 'portrait' | 'landscape';

export type AdjustMode = 'fit' | 'fill' | 'stretch' | 'actual';

export interface MarginSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
  linked: boolean;
}

export type OutputQuality = 150 | 300 | 600;

export interface MediaType {
  id: string;
  name: string;
  category: 'standard' | 'photo' | 'card' | 'sticker' | 'specialty';
  availableGsm: number[];
  recommendedDpi: number;
  epsonPaperType: string;
  description: string;
}

export interface PrinterProfile {
  id: string;
  name: string;
  maxPaperWidthMm: number;
  supportedPaperIds: string[];
  supportsBorderless: boolean;
  notes: string;
}

export interface ProcessedPage {
  pageNumber: number;
  canvas: HTMLCanvasElement | null;
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  textContent?: string;
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  extension: string;
  totalPages: number;
  currentPageIndex: number;
  pages: ProcessedPage[];
  status: 'idle' | 'parsing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface CanvasTransform {
  scale: number; // multiplier (e.g. 1.0)
  offsetX: number; // in mm
  offsetY: number; // in mm
  rotation: number; // 0, 90, 180, 270
}

export type ColorMode = 'color' | 'grayscale';
export type EnhanceFilter = 'none' | 'sharpen' | 'high_contrast' | 'auto_enhance';
export type PhotoGridMode = 'none' | 'package_mix' | 'pass_2x3' | 'pass_3x4' | 'pass_4x6';

export interface JobConfig {
  paperSizeId: string;
  customWidthMm: number;
  customHeightMm: number;
  orientation: Orientation;
  mediaTypeId: string;
  gsm: number;
  printerProfileId: string;
  adjustMode: AdjustMode;
  margins: MarginSettings;
  qualityDpi: OutputQuality;
  backgroundColor: string; // '#ffffff', '#000000', 'transparent'
  allPages: boolean;
  targetPageIndex: number;
  colorMode: ColorMode;
  enhanceFilter: EnhanceFilter;
  showCropMarks: boolean;
  photoGridMode: PhotoGridMode;
  presetId?: string;
}

