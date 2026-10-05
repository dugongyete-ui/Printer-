import { ProcessedPage } from '../types/print';

/**
 * Creates a sample small image (e.g. 500x350 px) that users frequently complain
 * gets printed tiny on an A4 sheet, illustrating the exact core problem solved by PrintFit.
 */
export function createSampleReceiptImage(): ProcessedPage {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 420;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Header band
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(16, 16, canvas.width - 32, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('BUKTI TRANSAKSI PEMBAYARAN', 40, 65);

  // Details
  ctx.fillStyle = '#0f172a';
  ctx.font = '18px monospace';
  ctx.fillText('No. Ref    : INV-202610-0988', 40, 140);
  ctx.fillText('Tanggal    : 04 Oktober 2026', 40, 175);
  ctx.fillText('Nama       : Bpk. H. Rahmat Hidayat', 40, 210);
  ctx.fillText('Keperluan  : Pembelian Kertas HVS & Tinta 003', 40, 245);
  ctx.fillText('Total      : Rp 385.000 (LUNAS)', 40, 280);

  // Small stamp
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.strokeRect(380, 220, 180, 70);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('LUNAS / VERIFIED', 390, 260);

  // Note at bottom
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 14px sans-serif';
  ctx.fillText('* Resolusi asli 600 × 420 px (Kecil jika dicetak tanpa Fit)', 40, 370);

  const dataUrl = canvas.toDataURL('image/png');
  return {
    pageNumber: 1,
    canvas,
    dataUrl,
    naturalWidth: canvas.width,
    naturalHeight: canvas.height,
    aspectRatio: canvas.width / canvas.height,
  };
}

/**
 * Creates a sample photo card (e.g. Pas Foto atau Sertifikat landscape)
 */
export function createSampleCertificateImage(): ProcessedPage {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d')!;

  // Parchment style background
  ctx.fillStyle = '#fffdfa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Double decorative border
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

  // Title
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 44px serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERTIFIKAT PENGHARGAAN', canvas.width / 2, 140);

  ctx.font = 'italic 20px serif';
  ctx.fillStyle = '#92400e';
  ctx.fillText('Diberikan dengan bangga kepada:', canvas.width / 2, 190);

  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('NURUL ANGGRAINI, S.Kom.', canvas.width / 2, 270);

  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Atas kelulusan Uji Kompetensi Desain Grafis & Cetak Digital', canvas.width / 2, 330);
  ctx.fillText('Tingkat Mahir dengan Predikat Sangat Memuaskan.', canvas.width / 2, 365);

  // Seals & signatures
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText('Jakarta, 04 Oktober 2026', 120, 520);
  ctx.fillText('Ketua Panitia Penguji', 120, 590);

  ctx.textAlign = 'right';
  ctx.fillText('Direktur Lembaga', canvas.width - 120, 590);

  const dataUrl = canvas.toDataURL('image/png');
  return {
    pageNumber: 1,
    canvas,
    dataUrl,
    naturalWidth: canvas.width,
    naturalHeight: canvas.height,
    aspectRatio: canvas.width / canvas.height,
  };
}
