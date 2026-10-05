import { PDFDocument, rgb } from 'pdf-lib';
import { JobConfig, CanvasTransform, ProcessedPage, PaperSize } from '../types/print';
import { PAPER_SIZES } from '../constants/paperCatalog';
import { calculatePhotoGridItems } from './photoGridAndPresets';

// MM to Points conversion constant (72 points / 25.4 mm)
export const MM_TO_PT = 72 / 25.4;

export interface RenderDimensions {
  pageWidthPt: number;
  pageHeightPt: number;
  pageWidthMm: number;
  pageHeightMm: number;
  contentXPt: number;
  contentYPt: number;
  contentWidthPt: number;
  contentHeightPt: number;
  isCropped: boolean;
  effectiveDpi: number;
}

/**
 * Calculates physical layout points and placement for page rendering
 */
export function calculateLayout(
  paper: PaperSize,
  config: JobConfig,
  transform: CanvasTransform,
  page: ProcessedPage
): RenderDimensions {
  // Base dimensions in mm
  let widthMm = paper.id === 'custom' ? config.customWidthMm : paper.widthMm;
  let heightMm = paper.id === 'custom' ? config.customHeightMm : paper.heightMm;

  // Swap for landscape
  if (config.orientation === 'landscape') {
    const temp = widthMm;
    widthMm = heightMm;
    heightMm = temp;
  }

  const pageWidthPt = widthMm * MM_TO_PT;
  const pageHeightPt = heightMm * MM_TO_PT;

  // Printable area inside margins in Pt
  const marginLeftPt = config.margins.left * MM_TO_PT;
  const marginRightPt = config.margins.right * MM_TO_PT;
  const marginTopPt = config.margins.top * MM_TO_PT;
  const marginBottomPt = config.margins.bottom * MM_TO_PT;

  const printableWidthPt = Math.max(10, pageWidthPt - marginLeftPt - marginRightPt);
  const printableHeightPt = Math.max(10, pageHeightPt - marginTopPt - marginBottomPt);

  const imgAspect = page.aspectRatio;
  const printableAspect = printableWidthPt / printableHeightPt;

  let baseContentWidthPt = printableWidthPt;
  let baseContentHeightPt = printableHeightPt;
  let isCropped = false;

  switch (config.adjustMode) {
    case 'fit':
      if (imgAspect > printableAspect) {
        // Limited by width
        baseContentWidthPt = printableWidthPt;
        baseContentHeightPt = printableWidthPt / imgAspect;
      } else {
        // Limited by height
        baseContentHeightPt = printableHeightPt;
        baseContentWidthPt = printableHeightPt * imgAspect;
      }
      break;

    case 'fill':
      if (imgAspect > printableAspect) {
        // Limited by height, width overflows and crops
        baseContentHeightPt = printableHeightPt;
        baseContentWidthPt = printableHeightPt * imgAspect;
      } else {
        // Limited by width, height overflows and crops
        baseContentWidthPt = printableWidthPt;
        baseContentHeightPt = printableWidthPt / imgAspect;
      }
      isCropped = true;
      break;

    case 'stretch':
      baseContentWidthPt = printableWidthPt;
      baseContentHeightPt = printableHeightPt;
      break;

    case 'actual':
      // 100% scale at standard 300 DPI
      baseContentWidthPt = (page.naturalWidth / 300) * 72;
      baseContentHeightPt = (page.naturalHeight / 300) * 72;
      break;
  }

  // Apply user transform scaling
  const finalWidthPt = baseContentWidthPt * transform.scale;
  const finalHeightPt = baseContentHeightPt * transform.scale;

  // Center within printable margins + user manual offset
  const centerBaseXPt = marginLeftPt + (printableWidthPt - finalWidthPt) / 2;
  const centerBaseYPt = marginBottomPt + (printableHeightPt - finalHeightPt) / 2;

  const contentXPt = centerBaseXPt + transform.offsetX * MM_TO_PT;
  const contentYPt = centerBaseYPt + transform.offsetY * MM_TO_PT;

  // Calculate actual printed DPI
  const printedWidthInches = finalWidthPt / 72;
  const effectiveDpi = Math.round(page.naturalWidth / Math.max(0.1, printedWidthInches));

  return {
    pageWidthPt,
    pageHeightPt,
    pageWidthMm: widthMm,
    pageHeightMm: heightMm,
    contentXPt,
    contentYPt,
    contentWidthPt: finalWidthPt,
    contentHeightPt: finalHeightPt,
    isCropped,
    effectiveDpi,
  };
}

/**
 * Converts and normalizes any image format (WebP, GIF, Progressive JPEG, etc.)
 * into a pristine, standard PNG DataURL with optional color & sharpening filters applied.
 * This guarantees 100% compatibility with pdf-lib and prevents "SOI not found in JPEG" errors.
 */
export async function processImageDataUrl(
  dataUrl: string,
  colorMode: string = 'color',
  enhanceFilter: string = 'none'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Build CSS filter
      const filters: string[] = [];
      if (colorMode === 'grayscale') {
        filters.push('grayscale(100%)');
      }
      if (enhanceFilter === 'high_contrast') {
        filters.push('contrast(180%)', 'brightness(95%)');
      } else if (enhanceFilter === 'sharpen') {
        filters.push('contrast(130%)', 'brightness(102%)');
      } else if (enhanceFilter === 'auto_enhance') {
        filters.push('contrast(115%)', 'brightness(105%)', 'saturate(110%)');
      }

      ctx.filter = filters.join(' ') || 'none';
      ctx.drawImage(img, 0, 0);

      // ALWAYS return clean, lossless PNG - 100% accepted by pdf-lib without SOI error!
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      console.warn('Image load error during processing, returning original URL');
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

/**
 * Builds a 100% physically accurate PDF document using pdf-lib
 */
export async function generatePrintReadyPdf(
  pages: ProcessedPage[],
  config: JobConfig,
  transform: CanvasTransform,
  onProgress?: (percent: number, statusText: string) => void,
  originalFile?: File
): Promise<Uint8Array> {
  const paper = PAPER_SIZES.find((p) => p.id === config.paperSizeId) || PAPER_SIZES[0];
  const pdfDoc = await PDFDocument.create();

  // Document metadata
  pdfDoc.setTitle(`PrintFit - ${paper.name} (${config.orientation})`);
  pdfDoc.setProducer('PrintFit Professional Print Engine');
  pdfDoc.setCreator('PrintFit');

  const isOriginalPdf =
    originalFile &&
    (originalFile.name.toLowerCase().endsWith('.pdf') || originalFile.type === 'application/pdf');

  // If input is an original PDF, embed original vector pages directly without lossy rasterization!
  if (isOriginalPdf && (!config.photoGridMode || config.photoGridMode === 'none')) {
    try {
      const buffer = await originalFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(buffer);
      const totalPages = sourcePdf.getPageCount();

      const pageIndices = config.allPages
        ? Array.from({ length: totalPages }, (_, i) => i)
        : [Math.min(config.targetPageIndex, totalPages - 1)];

      const embeddedPages = await pdfDoc.embedPdf(sourcePdf, pageIndices);

      for (let idx = 0; idx < embeddedPages.length; idx++) {
        const embeddedPage = embeddedPages[idx];
        const sourcePage = sourcePdf.getPage(pageIndices[idx]);
        const srcWidth = sourcePage.getWidth();
        const srcHeight = sourcePage.getHeight();

        const progress = Math.round(((idx + 1) / embeddedPages.length) * 85);
        onProgress?.(progress, `Menyusun halaman PDF vektor asli ${idx + 1} dari ${embeddedPages.length}...`);

        const layout = calculateLayout(paper, config, transform, {
          pageNumber: idx + 1,
          canvas: null,
          dataUrl: '',
          naturalWidth: srcWidth,
          naturalHeight: srcHeight,
          aspectRatio: srcWidth / srcHeight,
        });

        const pdfPage = pdfDoc.addPage([layout.pageWidthPt, layout.pageHeightPt]);

        if (config.backgroundColor && config.backgroundColor !== 'transparent') {
          const isBlack = config.backgroundColor === '#000000';
          pdfPage.drawRectangle({
            x: 0,
            y: 0,
            width: layout.pageWidthPt,
            height: layout.pageHeightPt,
            color: isBlack ? rgb(0, 0, 0) : rgb(1, 1, 1),
          });
        }

        // Draw the 100% original vector PDF page!
        pdfPage.drawPage(embeddedPage, {
          x: layout.contentXPt,
          y: layout.contentYPt,
          width: layout.contentWidthPt,
          height: layout.contentHeightPt,
        });

        // Crop marks if requested
        if (config.showCropMarks) {
          const markLen = 12;
          const gap = 4;
          const x1 = layout.contentXPt;
          const y1 = layout.contentYPt;
          const x2 = layout.contentXPt + layout.contentWidthPt;
          const y2 = layout.contentYPt + layout.contentHeightPt;
          const stroke = 0.6;
          const strokeColor = rgb(0.2, 0.2, 0.2);

          pdfPage.drawLine({ start: { x: x1 - gap - markLen, y: y1 }, end: { x: x1 - gap, y: y1 }, thickness: stroke, color: strokeColor });
          pdfPage.drawLine({ start: { x: x1, y: y1 - gap - markLen }, end: { x: x1, y: y1 - gap }, thickness: stroke, color: strokeColor });
          pdfPage.drawLine({ start: { x: x2 + gap, y: y1 }, end: { x: x2 + gap + markLen, y: y1 }, thickness: stroke, color: strokeColor });
          pdfPage.drawLine({ start: { x: x2, y: y1 - gap - markLen }, end: { x: x2, y: y1 - gap }, thickness: stroke, color: strokeColor });
          pdfPage.drawLine({ start: { x: x1 - gap - markLen, y: y2 }, end: { x: x1 - gap, y: y2 }, thickness: stroke, color: strokeColor });
          pdfPage.drawLine({ start: { x: x1, y: y2 + gap }, end: { x: x1, y: y2 + gap + markLen }, thickness: stroke, color: strokeColor });
          pdfPage.drawLine({ start: { x: x2 + gap, y: y2 }, end: { x: x2 + gap + markLen, y: y2 }, thickness: stroke, color: strokeColor });
          pdfPage.drawLine({ start: { x: x2, y: y2 + gap }, end: { x: x2, y: y2 + gap + markLen }, thickness: stroke, color: strokeColor });
        }
      }

      onProgress?.(95, 'Menyelesaikan file PDF vektor asli...');
      const pdfBytes = await pdfDoc.save();
      onProgress?.(100, 'Selesai!');
      return pdfBytes;
    } catch (vectorErr) {
      console.warn('Vector PDF embedding fallback:', vectorErr);
    }
  }

  const pagesToProcess = config.allPages
    ? pages
    : [pages[Math.min(config.targetPageIndex, pages.length - 1)]];

  const total = pagesToProcess.length;

  for (let idx = 0; idx < total; idx++) {
    const pageItem = pagesToProcess[idx];
    const progress = Math.round(((idx + 1) / total) * 85);
    onProgress?.(progress, `Menyusun dan memproses halaman ${idx + 1} dari ${total}...`);

    const layout = calculateLayout(paper, config, transform, pageItem);
    const pdfPage = pdfDoc.addPage([layout.pageWidthPt, layout.pageHeightPt]);

    // Background color
    if (config.backgroundColor && config.backgroundColor !== 'transparent') {
      const isBlack = config.backgroundColor === '#000000';
      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width: layout.pageWidthPt,
        height: layout.pageHeightPt,
        color: isBlack ? rgb(0, 0, 0) : rgb(1, 1, 1),
      });
    }

    // Process image with filters (Grayscale, Sharpen, High Contrast) and normalize to clean PNG
    const filteredUrl = await processImageDataUrl(
      pageItem.dataUrl,
      config.colorMode || 'color',
      config.enhanceFilter || 'none'
    );

    // Safely embed image into pdf-lib (always prefer embedPng for guaranteed compatibility)
    let embeddedImg;
    try {
      if (filteredUrl.startsWith('data:image/png')) {
        embeddedImg = await pdfDoc.embedPng(filteredUrl);
      } else {
        try {
          embeddedImg = await pdfDoc.embedJpg(filteredUrl);
        } catch {
          // If JPEG embed fails (e.g. WebP or corrupted header), convert to clean PNG
          const pngUrl = await processImageDataUrl(filteredUrl);
          embeddedImg = await pdfDoc.embedPng(pngUrl);
        }
      }
    } catch (embedErr) {
      console.warn('Initial embed failed, using safe canvas PNG conversion:', embedErr);
      const safePng = await processImageDataUrl(pageItem.dataUrl);
      embeddedImg = await pdfDoc.embedPng(safePng);
    }

    // Check if Photo Grid Mode is active
    if (config.photoGridMode && config.photoGridMode !== 'none') {
      const gridItems = calculatePhotoGridItems(
        config.photoGridMode,
        layout.pageWidthMm,
        layout.pageHeightMm
      );

      for (const item of gridItems) {
        const itemXPt = item.xMm * MM_TO_PT;
        // PDF-lib Y starts from bottom
        const itemYPt = layout.pageHeightPt - (item.yMm + item.heightMm) * MM_TO_PT;
        const itemWPt = item.widthMm * MM_TO_PT;
        const itemHPt = item.heightMm * MM_TO_PT;

        pdfPage.drawImage(embeddedImg, {
          x: itemXPt,
          y: itemYPt,
          width: itemWPt,
          height: itemHPt,
        });

        // Cutting border
        pdfPage.drawRectangle({
          x: itemXPt,
          y: itemYPt,
          width: itemWPt,
          height: itemHPt,
          borderWidth: 0.5,
          borderColor: rgb(0.7, 0.7, 0.7),
        });
      }
    } else {
      // Standard Single / Scaled Image
      pdfPage.drawImage(embeddedImg, {
        x: layout.contentXPt,
        y: layout.contentYPt,
        width: layout.contentWidthPt,
        height: layout.contentHeightPt,
      });

      // Draw Crop Marks if enabled
      if (config.showCropMarks) {
        const markLen = 12; // points
        const gap = 4;
        const x1 = layout.contentXPt;
        const y1 = layout.contentYPt;
        const x2 = layout.contentXPt + layout.contentWidthPt;
        const y2 = layout.contentYPt + layout.contentHeightPt;
        const stroke = 0.6;
        const strokeColor = rgb(0.2, 0.2, 0.2);

        // Bottom-Left
        pdfPage.drawLine({ start: { x: x1 - gap - markLen, y: y1 }, end: { x: x1 - gap, y: y1 }, thickness: stroke, color: strokeColor });
        pdfPage.drawLine({ start: { x: x1, y: y1 - gap - markLen }, end: { x: x1, y: y1 - gap }, thickness: stroke, color: strokeColor });

        // Bottom-Right
        pdfPage.drawLine({ start: { x: x2 + gap, y: y1 }, end: { x: x2 + gap + markLen, y: y1 }, thickness: stroke, color: strokeColor });
        pdfPage.drawLine({ start: { x: x2, y: y1 - gap - markLen }, end: { x: x2, y: y1 - gap }, thickness: stroke, color: strokeColor });

        // Top-Left
        pdfPage.drawLine({ start: { x: x1 - gap - markLen, y: y2 }, end: { x: x1 - gap, y: y2 }, thickness: stroke, color: strokeColor });
        pdfPage.drawLine({ start: { x: x1, y: y2 + gap }, end: { x: x1, y: y2 + gap + markLen }, thickness: stroke, color: strokeColor });

        // Top-Right
        pdfPage.drawLine({ start: { x: x2 + gap, y: y2 }, end: { x: x2 + gap + markLen, y: y2 }, thickness: stroke, color: strokeColor });
        pdfPage.drawLine({ start: { x: x2, y: y2 + gap }, end: { x: x2, y: y2 + gap + markLen }, thickness: stroke, color: strokeColor });
      }
    }
  }

  onProgress?.(95, 'Mengompres dan memfinalisasi PDF...');
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, 'Selesai!');

  return pdfBytes;
}

/**
 * Triggers direct browser print window formatted with exact page size CSS
 */
export function triggerDirectBrowserPrint(
  previewCanvasDataUrl: string,
  paperName: string,
  widthMm: number,
  heightMm: number,
  orientation: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir oleh browser. Harap izinkan pop-up untuk mencetak langsung.');
    return;
  }

  const w = orientation === 'landscape' ? heightMm : widthMm;
  const h = orientation === 'landscape' ? widthMm : heightMm;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PrintFit - Cetak ${paperName}</title>
        <style>
          @page {
            size: ${w}mm ${h}mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            background: #fff;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          img {
            width: ${w}mm;
            height: ${h}mm;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${previewCanvasDataUrl}" onload="window.print();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}
