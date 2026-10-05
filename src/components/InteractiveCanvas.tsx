import React, { useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlignCenter,
  Move,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Sparkles,
  Droplet,
  Grid,
  ArrowRight,
  FileText,
  Printer,
} from 'lucide-react';
import { FileItem, JobConfig, CanvasTransform, Orientation, ColorMode, EnhanceFilter, PhotoGridMode } from '../types/print';
import { PAPER_SIZES } from '../constants/paperCatalog';
import { calculateLayout } from '../utils/pdfGenerator';
import { calculatePhotoGridItems, INDO_PRESETS } from '../utils/photoGridAndPresets';
import { detectDocumentOriginalSize } from '../utils/paperDetector';
import { PaperSizeModal } from './PaperSizeModal';

interface InteractiveCanvasProps {
  currentFile: FileItem;
  config: JobConfig;
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onPageChange: (pageIndex: number) => void;
  onOrientationChange: (orientation: Orientation) => void;
  onPaperChange: (paperId: string) => void;
  onConfigChange: (updated: Partial<JobConfig>) => void;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  currentFile,
  config,
  transform,
  onTransformChange,
  onPageChange,
  onOrientationChange,
  onPaperChange,
  onConfigChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportZoom, setViewportZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  const paper = PAPER_SIZES.find((p) => p.id === config.paperSizeId) || PAPER_SIZES[0];
  const currentPage = currentFile.pages[currentFile.currentPageIndex] || currentFile.pages[0];

  // Base dimensions
  let widthMm = paper.id === 'custom' ? config.customWidthMm : paper.widthMm;
  let heightMm = paper.id === 'custom' ? config.customHeightMm : paper.heightMm;

  if (config.orientation === 'landscape') {
    const tmp = widthMm;
    widthMm = heightMm;
    heightMm = tmp;
  }

  const pageAspect = widthMm / heightMm;
  const layout = currentPage ? calculateLayout(paper, config, transform, currentPage) : null;

  // Grid calculation if photo grid is active
  const gridItems =
    config.photoGridMode && config.photoGridMode !== 'none'
      ? calculatePhotoGridItems(config.photoGridMode, widthMm, heightMm)
      : [];

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (config.photoGridMode !== 'none') return; // disabled in fixed photo grid mode
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const mmPerPixel = 0.45 / viewportZoom;

    onTransformChange({
      ...transform,
      offsetX: transform.offsetX + dx * mmPerPixel,
      offsetY: transform.offsetY + dy * mmPerPixel,
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCenter = () => {
    onTransformChange({
      ...transform,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handleRotate = () => {
    onTransformChange({
      ...transform,
      rotation: (transform.rotation + 90) % 360,
    });
  };

  // Build CSS filter string
  const getFilterStyle = () => {
    const filters: string[] = [];
    if (config.colorMode === 'grayscale') {
      filters.push('grayscale(100%)');
    }
    if (config.enhanceFilter === 'high_contrast') {
      filters.push('contrast(180%)', 'brightness(95%)');
    } else if (config.enhanceFilter === 'sharpen') {
      filters.push('contrast(130%)', 'brightness(102%)', 'drop-shadow(0 0 0.5px rgba(0,0,0,0.5))');
    } else if (config.enhanceFilter === 'auto_enhance') {
      filters.push('contrast(115%)', 'brightness(105%)', 'saturate(110%)');
    }
    return filters.join(' ') || 'none';
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* 1-Click Indonesian Document Presets Bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/60 overflow-x-auto text-[11px]">
        <span className="text-slate-400 shrink-0 font-medium mr-1">Preset Cepat:</span>
        {INDO_PRESETS.map((preset) => {
          const isActive = config.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                onConfigChange({ ...preset.config, presetId: preset.id });
                onTransformChange({ scale: 1.0, offsetX: 0, offsetY: 0, rotation: 0 });
              }}
              title={preset.description}
              className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Primary Tool Bar: Paper Size & Portrait/Landscape Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2.5">
        {/* Paper Size Quick Selection + Full Catalog Trigger */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onPaperChange('a4');
              onConfigChange({ presetId: undefined });
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.paperSizeId === 'a4'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            A4
          </button>
          <button
            type="button"
            onClick={() => {
              onPaperChange('f4');
              onConfigChange({ presetId: undefined });
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.paperSizeId === 'f4'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            F4 / Folio
          </button>
          <button
            type="button"
            onClick={() => {
              onPaperChange('a3');
              onConfigChange({ presetId: undefined });
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.paperSizeId === 'a3'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            A3
          </button>
          <button
            type="button"
            onClick={() => {
              onPaperChange('a5');
              onConfigChange({ presetId: undefined });
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.paperSizeId === 'a5'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            A5
          </button>
          <button
            type="button"
            onClick={() => {
              onPaperChange('photo_4r');
              onConfigChange({ presetId: undefined });
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.paperSizeId === 'photo_4r'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Foto 4R
          </button>

          {/* Active paper indicator if selected from catalog and not in quick pills */}
          {!['a4', 'f4', 'a3', 'a5', 'photo_4r'].includes(config.paperSizeId) && (
            <span className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-900 text-white shadow-xs flex items-center gap-1">
              <span>{paper.name}</span>
            </span>
          )}

          {/* Prominent Full Catalog Button */}
          <button
            type="button"
            onClick={() => setIsPaperModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
            title="Buka katalog lengkap 30+ ukuran kertas internasional, foto, dan kustom"
          >
            <span>Semua Ukuran (30+) ▾</span>
          </button>
        </div>

        {/* Prominent Portrait / Landscape Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => onOrientationChange('portrait')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.orientation === 'portrait'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="h-3.5 w-2.5 border-2 border-current rounded-xs" />
            <span>Portrait (Tegak)</span>
          </button>

          <button
            type="button"
            onClick={() => onOrientationChange('landscape')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.orientation === 'landscape'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="h-2.5 w-3.5 border-2 border-current rounded-xs" />
            <span>Landscape (Mendatar)</span>
          </button>
        </div>
      </div>

      {/* Advanced Quick Toggles (Grayscale, Sharpen, Crop Marks, Photo Grid) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Grayscale Toggle */}
          <button
            type="button"
            onClick={() =>
              onConfigChange({
                colorMode: config.colorMode === 'grayscale' ? 'color' : 'grayscale',
              })
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              config.colorMode === 'grayscale'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Ubah ke hitam putih untuk menghemat tinta warna"
          >
            <Droplet className="h-3 w-3" />
            <span>{config.colorMode === 'grayscale' ? 'Hitam Putih (Aktif)' : 'Hemat Tinta (B/W)'}</span>
          </button>

          {/* Sharpen / Contrast Filter */}
          <button
            type="button"
            onClick={() => {
              const next: Record<EnhanceFilter, EnhanceFilter> = {
                none: 'sharpen',
                sharpen: 'high_contrast',
                high_contrast: 'auto_enhance',
                auto_enhance: 'none',
              };
              onConfigChange({ enhanceFilter: next[config.enhanceFilter || 'none'] });
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              config.enhanceFilter !== 'none'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Tingkatkan ketajaman foto buram atau teks struk"
          >
            <Sparkles className="h-3 w-3" />
            <span>
              {config.enhanceFilter === 'none' && 'Filter: Asli'}
              {config.enhanceFilter === 'sharpen' && 'Filter: Tajamkan'}
              {config.enhanceFilter === 'high_contrast' && 'Filter: Kontras Pekat'}
              {config.enhanceFilter === 'auto_enhance' && 'Filter: Auto-Enhance'}
            </span>
          </button>

          {/* Cutting Guides / Crop Marks (Corner ticks for paper cutting) */}
          <button
            type="button"
            onClick={() => onConfigChange({ showCropMarks: !config.showCropMarks })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              config.showCropMarks
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Tampilkan tanda siku potong di 4 sudut lembar untuk panduan gunting lurus"
          >
            <Scissors className="h-3 w-3" />
            <span>{config.showCropMarks ? 'Tanda Siku Potong (Aktif)' : 'Garis Siku Potong'}</span>
          </button>

          {/* Photo Grid Multi-Mode (Only for passport photos) */}
          <button
            type="button"
            onClick={() => {
              const nextGrid: Record<PhotoGridMode, PhotoGridMode> = {
                none: 'package_mix',
                package_mix: 'pass_3x4',
                pass_3x4: 'pass_4x6',
                pass_4x6: 'none',
                pass_2x3: 'none',
              };
              onConfigChange({
                photoGridMode: nextGrid[config.photoGridMode || 'none'],
                adjustMode: config.photoGridMode === 'none' ? 'fill' : config.adjustMode,
              });
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              config.photoGridMode !== 'none'
                ? 'bg-amber-800 text-white ring-2 ring-amber-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Khusus foto wajah / pas foto: menduplikasi 1 foto menjadi susunan 12 foto kecil di 1 lembar"
          >
            <Grid className="h-3 w-3" />
            <span>
              {config.photoGridMode === 'none' && 'Pas Foto (12 pcs)'}
              {config.photoGridMode === 'package_mix' && 'Pas Foto: Campur 12 pcs'}
              {config.photoGridMode === 'pass_3x4' && 'Pas Foto: 3×4 (12 pcs)'}
              {config.photoGridMode === 'pass_4x6' && 'Pas Foto: 4×6 (8 pcs)'}
            </span>
          </button>
        </div>

        {/* Viewport Zoom & Align tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewportZoom((z) => Math.max(0.6, z - 0.1))}
            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200"
            title="Perkecil Zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[11px] tabular-nums text-slate-600 w-8 text-center">
            {Math.round(viewportZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setViewportZoom((z) => Math.min(1.8, z + 0.1))}
            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200"
            title="Perbesar Zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="h-3 w-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleCenter}
            className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200"
            title="Posisikan Tengah"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200"
            title="Putar 90 Derajat"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notice if Photo Grid is active */}
      {config.photoGridMode && config.photoGridMode !== 'none' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Mode Pas Foto Aktif:</strong> Berkas sedang diduplikasi menjadi susunan pas foto kecil. Klik tombol kanan untuk kembali ke 1 lembar utuh.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onConfigChange({ photoGridMode: 'none', adjustMode: 'fit' })}
            className="shrink-0 bg-white border border-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
          >
            Kembalikan ke 1 Lembar Penuh (Normal)
          </button>
        </div>
      )}

      {/* Main Interactive Sheet Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative flex-1 min-h-[420px] lg:min-h-[450px] w-full flex items-center justify-center overflow-hidden bg-[#f4f4f6] select-none cursor-grab active:cursor-grabbing p-6"
      >
        {/* Paper Sheet container */}
        <div
          style={{
            transform: `scale(${viewportZoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative flex items-center justify-center"
        >
          {/* Physical Sheet Canvas Representation */}
          <div
            className="relative bg-white shadow-lg transition-all duration-150"
            style={{
              width: `${pageAspect > 1 ? 420 : 420 * pageAspect}px`,
              height: `${pageAspect > 1 ? 420 / pageAspect : 420}px`,
              boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Top Millimeter Ruler Guide */}
            <div className="absolute -top-5 left-0 right-0 h-4 border-b border-slate-300/80 flex justify-between px-1 text-[9px] font-mono text-slate-400">
              <span>0 mm</span>
              <span>{(widthMm / 2).toFixed(0)} mm</span>
              <span>{widthMm.toFixed(0)} mm</span>
            </div>

            {/* Left Millimeter Ruler Guide */}
            <div className="absolute top-0 -left-8 bottom-0 w-7 border-r border-slate-300/80 flex flex-col justify-between py-1 text-[9px] font-mono text-slate-400 text-right pr-1">
              <span>0</span>
              <span>{(heightMm / 2).toFixed(0)}</span>
              <span>{heightMm.toFixed(0)}</span>
            </div>

            {/* Printable Safe Area Guides (Margins) */}
            <div
              className="absolute pointer-events-none border border-dashed border-slate-300 z-10"
              style={{
                top: `${(config.margins.top / heightMm) * 100}%`,
                bottom: `${(config.margins.bottom / heightMm) * 100}%`,
                left: `${(config.margins.left / widthMm) * 100}%`,
                right: `${(config.margins.right / widthMm) * 100}%`,
              }}
            >
              <span className="absolute top-1 left-1.5 font-mono text-[8px] text-slate-400">
                Batas Cetak
              </span>
            </div>

            {/* Content Container: Either Photo Grid or Single Image */}
            {currentPage && (
              <>
                {config.photoGridMode && config.photoGridMode !== 'none' ? (
                  /* Photo Grid N-up Layout */
                  <div className="absolute inset-0">
                    {gridItems.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="absolute border border-dashed border-slate-400/80 overflow-hidden bg-slate-100 flex flex-col items-center justify-center shadow-2xs"
                        style={{
                          left: `${(item.xMm / widthMm) * 100}%`,
                          top: `${(item.yMm / heightMm) * 100}%`,
                          width: `${(item.widthMm / widthMm) * 100}%`,
                          height: `${(item.heightMm / heightMm) * 100}%`,
                        }}
                      >
                        <img
                          src={currentPage.dataUrl}
                          alt={`Pas Foto ${item.label}`}
                          style={{ filter: getFilterStyle() }}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        {/* Size tag watermark */}
                        <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white font-mono text-[8px] px-1 rounded-xs pointer-events-none">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Standard Image Placement */
                  layout && (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      <div
                        style={{
                          transform: `translate(${transform.offsetX * 1.3}px, ${transform.offsetY * 1.3}px) rotate(${transform.rotation}deg) scale(${transform.scale})`,
                          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                          width: `${(layout.contentWidthPt / layout.pageWidthPt) * 100}%`,
                          height: `${(layout.contentHeightPt / layout.pageHeightPt) * 100}%`,
                        }}
                        className="relative flex items-center justify-center"
                      >
                        <img
                          src={currentPage.dataUrl}
                          alt="Konten Pratinjau Cetak"
                          style={{ filter: getFilterStyle() }}
                          className="w-full h-full object-contain pointer-events-none"
                        />

                        {/* Visual Crop Marks in preview */}
                        {config.showCropMarks && (
                          <>
                            <div className="absolute -top-3 -left-3 w-3 h-3 border-t-2 border-l-2 border-slate-800" />
                            <div className="absolute -top-3 -right-3 w-3 h-3 border-t-2 border-r-2 border-slate-800" />
                            <div className="absolute -bottom-3 -left-3 w-3 h-3 border-b-2 border-l-2 border-slate-800" />
                            <div className="absolute -bottom-3 -right-3 w-3 h-3 border-b-2 border-r-2 border-slate-800" />
                          </>
                        )}
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Subtle drag hint */}
        {config.photoGridMode === 'none' && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-white/90 border border-slate-200/80 px-2.5 py-1 text-[11px] text-slate-500 pointer-events-none shadow-xs">
            <Move className="h-3 w-3 text-slate-600" />
            <span>Geser posisi foto langsung di atas kertas</span>
          </div>
        )}
      </div>

      {/* Bottom Slider & Multi-Page Strip */}
      <div className="border-t border-slate-100 bg-white p-3 space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-600 whitespace-nowrap">
            Skala Ukuran:
          </span>
          <input
            type="range"
            min={0.4}
            max={2.5}
            step={0.05}
            value={transform.scale}
            onChange={(e) =>
              onTransformChange({
                ...transform,
                scale: parseFloat(e.target.value),
              })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
          />
          <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums w-12 text-right">
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onTransformChange({ ...transform, scale: 1.0, offsetX: 0, offsetY: 0 })}
            className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded border border-slate-200"
          >
            Reset
          </button>
        </div>

        {/* Multi-Page Navigation for PDF & Documents */}
        {currentFile.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentFile.currentPageIndex === 0}
                onClick={() => onPageChange(currentFile.currentPageIndex - 1)}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-600">
                {currentFile.currentPageIndex + 1} / {currentFile.totalPages}
              </span>
              <button
                type="button"
                disabled={currentFile.currentPageIndex >= currentFile.totalPages - 1}
                onClick={() => onPageChange(currentFile.currentPageIndex + 1)}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {currentFile.pages.map((p, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => onPageChange(pIdx)}
                  className={`h-6 w-5 rounded border overflow-hidden transition-all ${
                    pIdx === currentFile.currentPageIndex
                      ? 'border-slate-900 ring-1 ring-slate-900'
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  <img src={p.dataUrl} alt={`Halaman ${pIdx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Catalog Modal (30+ Paper Sizes) */}
      <PaperSizeModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        currentPaperId={config.paperSizeId}
        customWidthMm={config.customWidthMm}
        customHeightMm={config.customHeightMm}
        onSelectPaper={(paperId, customW, customH) => {
          onPaperChange(paperId);
          if (paperId === 'custom' && customW && customH) {
            onConfigChange({
              customWidthMm: customW,
              customHeightMm: customH,
              presetId: undefined,
            });
          } else {
            onConfigChange({ presetId: undefined });
          }
        }}
      />
    </div>
  );
};
