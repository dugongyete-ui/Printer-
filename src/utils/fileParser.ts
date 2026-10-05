import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { FileItem, ProcessedPage } from '../types/print';

// Set up pdf.js worker using local bundled asset (avoids CDN 404 & dynamic import errors)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Reads an image file and produces a ProcessedPage with natural dimensions and dataUrl
 */
export async function parseImageFile(file: File): Promise<ProcessedPage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        // Normalize any image format (WebP, GIF, progressive JPEG) to standard PNG dataUrl
        const normalizedDataUrl = canvas.toDataURL('image/png');
        resolve({
          pageNumber: 1,
          canvas,
          dataUrl: normalizedDataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          aspectRatio: (img.naturalWidth || 1) / (img.naturalHeight || 1),
        });
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar. Format mungkin rusak.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Parses multi-page PDF using pdfjs-dist and renders pages to canvas thumbnails
 */
export async function parsePdfFile(file: File, maxPages = 15): Promise<ProcessedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  const pages: ProcessedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); // Good resolution for preview
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // White background for preview
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    // Extract text content for autonomous AI analysis
    let pageText = '';
    try {
      const textContentObj = await page.getTextContent();
      pageText = textContentObj.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ')
        .trim();
    } catch (e) {
      console.warn('PDF text extraction note:', e);
    }

    const dataUrl = canvas.toDataURL('image/png');
    pages.push({
      pageNumber: i,
      canvas,
      dataUrl,
      naturalWidth: viewport.width,
      naturalHeight: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      textContent: pageText,
    });
  }

  return pages;
}

/**
 * Splits semantic HTML into logical pages based on content height
 */
function splitHtmlIntoPages(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const children = Array.from(doc.body.children);

  if (children.length === 0) {
    return [html || '<p>Dokumen Kosong</p>'];
  }

  const pages: string[] = [];
  let currentPageElements: string[] = [];
  let currentEstimatedHeight = 0;
  const MAX_PAGE_HEIGHT = 800; // virtual point height per page

  for (const el of children) {
    const tagName = el.tagName.toLowerCase();
    const textLen = el.textContent?.length || 0;

    let elHeight = 35;
    if (tagName === 'h1') elHeight = 85;
    else if (tagName === 'h2') elHeight = 65;
    else if (tagName === 'h3') elHeight = 50;
    else if (tagName === 'p') {
      const lines = Math.max(1, Math.ceil(textLen / 75));
      elHeight = lines * 26 + 18;
    } else if (tagName === 'table') {
      const rows = el.querySelectorAll('tr').length || 1;
      elHeight = rows * 38 + 30;
    } else if (tagName === 'ul' || tagName === 'ol') {
      const items = el.querySelectorAll('li').length || 1;
      elHeight = items * 28 + 18;
    } else {
      elHeight = 45;
    }

    // Push to new page if it overflows, or if it's a major heading near page end
    const isMajorHeading = tagName === 'h1' || tagName === 'h2';
    if (
      currentPageElements.length > 0 &&
      (currentEstimatedHeight + elHeight > MAX_PAGE_HEIGHT ||
        (isMajorHeading && currentEstimatedHeight > 550))
    ) {
      pages.push(currentPageElements.join('\n'));
      currentPageElements = [el.outerHTML];
      currentEstimatedHeight = elHeight;
    } else {
      currentPageElements.push(el.outerHTML);
      currentEstimatedHeight += elHeight;
    }
  }

  if (currentPageElements.length > 0) {
    pages.push(currentPageElements.join('\n'));
  }

  return pages.length > 0 ? pages : [html];
}

/**
 * 100% Pure Native Canvas 2D Renderer for DOCX elements (NEVER taints the canvas)
 */
function renderStructuredCanvas(
  ctx: CanvasRenderingContext2D,
  pageHtml: string,
  docTitle: string,
  pageNum: number,
  totalPages: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(pageHtml, 'text/html');
  const elements = Array.from(doc.body.children);

  const leftMargin = 110;
  const rightMargin = canvasWidth - 110;
  const contentWidth = rightMargin - leftMargin;
  let y = 120; // Pure document content without artificial headers/footers

  for (const el of elements) {
    if (y > canvasHeight - 90) break;
    const tag = el.tagName.toLowerCase();
    const rawText = el.textContent?.trim() || '';
    if (!rawText) continue;

    if (tag === 'h1') {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText(rawText, leftMargin, y);
      y += 18;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(leftMargin + Math.min(rawText.length * 22, contentWidth), y);
      ctx.stroke();
      y += 44;
    } else if (tag === 'h2') {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 28px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText(rawText, leftMargin, y);
      y += 40;
    } else if (tag === 'h3') {
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 24px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText(rawText, leftMargin, y);
      y += 34;
    } else if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr'));
      const colCount = Math.max(...rows.map((r) => r.children.length), 1);
      const colWidth = contentWidth / colCount;
      const rowHeight = 44;

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        if (y > canvasHeight - 120) break;
        const row = rows[rIdx];
        const cells = Array.from(row.children);
        const isHeader = rIdx === 0 || cells[0]?.tagName.toLowerCase() === 'th';

        if (isHeader) {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(leftMargin, y, contentWidth, rowHeight);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 18px "Plus Jakarta Sans", -apple-system, sans-serif';
        } else {
          ctx.fillStyle = rIdx % 2 === 1 ? '#f8fafc' : '#ffffff';
          ctx.fillRect(leftMargin, y, contentWidth, rowHeight);
          ctx.fillStyle = '#334155';
          ctx.font = '18px "Plus Jakarta Sans", -apple-system, sans-serif';
        }

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftMargin, y, contentWidth, rowHeight);

        for (let cIdx = 0; cIdx < cells.length; cIdx++) {
          const cellText = cells[cIdx]?.textContent?.trim() || '';
          const maxCellChars = Math.floor(colWidth / 11);
          const truncated = cellText.length > maxCellChars ? cellText.slice(0, maxCellChars - 2) + '..' : cellText;
          ctx.fillText(truncated, leftMargin + cIdx * colWidth + 12, y + 28);
        }
        y += rowHeight;
      }
      y += 24;
    } else if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.querySelectorAll('li'));
      ctx.font = '22px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillStyle = '#334155';

      for (let iIdx = 0; iIdx < items.length; iIdx++) {
        if (y > canvasHeight - 120) break;
        const itemText = items[iIdx]?.textContent?.trim() || '';
        const bullet = tag === 'ol' ? `${iIdx + 1}. ` : '• ';
        ctx.fillText(bullet + itemText, leftMargin + 20, y);
        y += 34;
      }
      y += 16;
    } else {
      // Standard paragraph
      ctx.fillStyle = '#334155';
      ctx.font = '22px "Plus Jakarta Sans", -apple-system, sans-serif';
      const words = rawText.split(' ');
      let line = '';
      for (const w of words) {
        const testLine = line + w + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > contentWidth && line !== '') {
          ctx.fillText(line, leftMargin, y);
          y += 34;
          line = w + ' ';
          if (y > canvasHeight - 120) break;
        } else {
          line = testLine;
        }
      }
      if (line && y <= canvasHeight - 90) {
        ctx.fillText(line, leftMargin, y);
        y += 42;
      }
    }
  }
}

/**
 * Renders a single HTML page to high-res canvas using 100% native Canvas 2D
 */
function renderHtmlPageToCanvas(
  pageHtml: string,
  docTitle: string,
  pageNum: number,
  totalPages: number,
  canvasWidth = 1654,
  canvasHeight = 2339
): { canvas: HTMLCanvasElement; dataUrl: string } {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  renderStructuredCanvas(
    ctx,
    pageHtml,
    docTitle,
    pageNum,
    totalPages,
    canvasWidth,
    canvasHeight
  );

  const dataUrl = canvas.toDataURL('image/png');
  return { canvas, dataUrl };
}

/**
 * Parses DOCX document using mammoth with multi-page structure preservation
 */
export async function parseDocxFile(file: File): Promise<ProcessedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = result.value || '<p>Dokumen kosong</p>';

  // Clean text for AI reasoning
  const textOnly = htmlContent
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const docTitle = file.name.replace(/\.[^/.]+$/, '');
  const htmlPages = splitHtmlIntoPages(htmlContent);
  const totalPages = htmlPages.length;
  const processedPages: ProcessedPage[] = [];

  for (let i = 0; i < totalPages; i++) {
    const pageHtml = htmlPages[i];
    const { canvas, dataUrl } = renderHtmlPageToCanvas(
      pageHtml,
      docTitle,
      i + 1,
      totalPages
    );

    processedPages.push({
      pageNumber: i + 1,
      canvas,
      dataUrl,
      naturalWidth: canvas.width,
      naturalHeight: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      textContent: i === 0 ? textOnly : `Halaman ${i + 1}`,
    });
  }

  return processedPages;
}

/**
 * Parses XLSX spreadsheet using SheetJS and renders a clean spreadsheet table
 */
export async function parseXlsxFile(file: File): Promise<ProcessedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const pages: ProcessedPage[] = [];

  // Parse first 3 sheets maximum
  const sheetNames = workbook.SheetNames.slice(0, 3);
  for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
    const sheetName = sheetNames[sIdx];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    const canvas = document.createElement('canvas');
    canvas.width = 2339; // Landscape orientation preferred for tables
    canvas.height = 1654;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${file.name} — [${sheetName}]`, 80, 110);

    ctx.fillStyle = '#64748b';
    ctx.font = '22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Total ${jsonData.length} baris data · PrintFit Spreadsheet Layout`, 80, 150);

    // Table drawing
    const startX = 80;
    let startY = 190;
    const rowsToDraw = Math.min(jsonData.length, 30);
    const maxCols = 10;
    const colWidth = (canvas.width - 160) / maxCols;
    const rowHeight = 42;

    for (let r = 0; r < rowsToDraw; r++) {
      const row = jsonData[r] || [];
      const isHeader = r === 0;

      // Row background
      if (isHeader) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(startX, startY, canvas.width - 160, rowHeight);
      } else if (r % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(startX, startY, canvas.width - 160, rowHeight);
      }

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, startY, canvas.width - 160, rowHeight);

      // Cells
      for (let c = 0; c < maxCols; c++) {
        const val = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
        ctx.fillStyle = isHeader ? '#0f172a' : '#334155';
        ctx.font = isHeader ? 'bold 18px "Plus Jakarta Sans", sans-serif' : '17px "JetBrains Mono", monospace';

        // Truncate cell text
        const cellX = startX + c * colWidth + 10;
        const cellY = startY + 27;
        const maxChars = Math.floor(colWidth / 11);
        const truncated = val.length > maxChars ? val.substring(0, maxChars - 2) + '..' : val;
        ctx.fillText(truncated, cellX, cellY);
      }

      startY += rowHeight;
    }

    const dataUrl = canvas.toDataURL('image/png');
    pages.push({
      pageNumber: sIdx + 1,
      canvas,
      dataUrl,
      naturalWidth: canvas.width,
      naturalHeight: canvas.height,
      aspectRatio: canvas.width / canvas.height,
    });
  }

  return pages;
}

/**
 * Universal file processor supporting multiple types
 */
export async function processInputFile(file: File): Promise<FileItem> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const item: FileItem = {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    extension: ext,
    totalPages: 0,
    currentPageIndex: 0,
    pages: [],
    status: 'parsing',
  };

  try {
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext) || file.type.startsWith('image/')) {
      const page = await parseImageFile(file);
      item.pages = [page];
      item.totalPages = 1;
      item.status = 'ready';
    } else if (ext === 'pdf' || file.type === 'application/pdf') {
      const pages = await parsePdfFile(file);
      item.pages = pages;
      item.totalPages = pages.length;
      item.status = 'ready';
    } else if (['docx', 'doc'].includes(ext)) {
      const pages = await parseDocxFile(file);
      item.pages = pages;
      item.totalPages = pages.length;
      item.status = 'ready';
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      const pages = await parseXlsxFile(file);
      item.pages = pages;
      item.totalPages = pages.length;
      item.status = 'ready';
    } else {
      throw new Error(`Format file .${ext.toUpperCase()} belum didukung. Silakan gunakan JPG, PNG, WEBP, PDF, DOCX, atau XLSX.`);
    }
  } catch (err: unknown) {
    item.status = 'error';
    item.errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses file.';
  }

  return item;
}
