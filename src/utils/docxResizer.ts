import JSZip from 'jszip';
import { PaperSize, JobConfig } from '../types/print';

// 1 mm = 56.6929133858 dxa (twips in OOXML)
const MM_TO_DXA = 56.6929133858;

/**
 * Resizes a DOCX file directly in its OpenXML package without modifying or touching
 * any text, tables, styles, fonts, images, or document contents.
 * Only the page dimension (<w:pgSz>) and margin (<w:pgMar>) tags are updated.
 */
export async function resizeDocxFile(
  file: File,
  paper: PaperSize,
  config: JobConfig
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Berkas bukan format DOCX yang valid (word/document.xml tidak ditemukan)');
  }

  let docXml = await docXmlFile.async('string');

  let widthMm = paper.id === 'custom' ? config.customWidthMm : paper.widthMm;
  let heightMm = paper.id === 'custom' ? config.customHeightMm : paper.heightMm;

  if (config.orientation === 'landscape') {
    const temp = widthMm;
    widthMm = heightMm;
    heightMm = temp;
  }

  const widthDxa = Math.round(widthMm * MM_TO_DXA);
  const heightDxa = Math.round(heightMm * MM_TO_DXA);

  const topMarDxa = Math.round(config.margins.top * MM_TO_DXA);
  const bottomMarDxa = Math.round(config.margins.bottom * MM_TO_DXA);
  const leftMarDxa = Math.round(config.margins.left * MM_TO_DXA);
  const rightMarDxa = Math.round(config.margins.right * MM_TO_DXA);

  const orientAttr = config.orientation === 'landscape' ? ' w:orient="landscape"' : '';

  const newPgSz = `<w:pgSz w:w="${widthDxa}" w:h="${heightDxa}"${orientAttr}/>`;
  const newPgMar = `<w:pgMar w:top="${topMarDxa}" w:bottom="${bottomMarDxa}" w:left="${leftMarDxa}" w:right="${rightMarDxa}" w:header="720" w:footer="720" w:gutter="0"/>`;

  // Update or insert <w:pgSz> in all section properties
  if (/<w:pgSz[^>]*\/>/.test(docXml)) {
    docXml = docXml.replace(/<w:pgSz[^>]*\/>/g, newPgSz);
  } else if (/<w:sectPr[^>]*>/.test(docXml)) {
    docXml = docXml.replace(/(<w:sectPr[^>]*>)/g, `$1${newPgSz}`);
  }

  // Update or insert <w:pgMar> in all section properties
  if (/<w:pgMar[^>]*\/>/.test(docXml)) {
    docXml = docXml.replace(/<w:pgMar[^>]*\/>/g, newPgMar);
  } else if (/<w:pgSz[^>]*\/>/.test(docXml)) {
    docXml = docXml.replace(/(<w:pgSz[^>]*\/>)/g, `$1${newPgMar}`);
  }

  zip.file('word/document.xml', docXml);

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
