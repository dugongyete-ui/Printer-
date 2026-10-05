import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';
const TEXT_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const VISION_MODEL = 'meta/llama-3.2-11b-vision-instruct';
const DEFAULT_NVIDIA_KEY = process.env.NVIDIA_API_KEY || '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';

// Initialize Gemini if GEMINI_API_KEY is available
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI() : null;

app.post('/api/chat', async (req, res) => {
  const { prompt = '', fileMeta, imageBase64, currentConfig } = req.body;
  const lowerPrompt = prompt.toLowerCase();
  const fileName = (fileMeta?.name || '').toLowerCase();
  const fileText = (fileMeta?.textContent || '').toLowerCase();

  const systemPrompt = `Anda adalah PrintFit Autonomous AI Agent — asisten percetakan digital profesional (standar kertas A4 210×297 mm, F4/Folio Indonesia 215,9×330,2 mm, dokumen Word/PDF/Foto, printer Epson L3110/L3210 & Inkjet).

ATURAN UTAMA:
1. Berkas pengguna SUDAH DIUNGGAH dan SEDANG DIBUKA di dalam aplikasi PrintFit.
2. DILARANG KERAS menyuruh pengguna login ke akun Google, membuka Google Drive, Google Docs, atau aplikasi lain! Seluruh proses cetak dan download PDF terjadi langsung di PrintFit.
3. BACA DAN ANALISIS ISI BERKAS (textContent dan nama file):
   - Jika berkas adalah DOCX / PDF tugas kuliah / makalah / laporan (misal tugas kodefikasi SNOMED CT, skripsi, makalah): Kenali ini sebagai tugas akademik. Gunakan Kertas A4 Portrait, margin kiri 15 mm untuk staples/jilid, kertas HVS 75/80 GSM.
   - Jika Kartu Keluarga (KK): Gunakan Kertas F4 Folio Landscape, margin 6 mm.
   - Jika Ijazah / Sertifikat: Gunakan Kertas F4 Folio atau A4, margin 12 mm aman dari map.
   - Jika Pas Foto: Atur photoGridMode jika pengguna meminta susunan 12 foto.
   - Jika KTP / SIM: Atur skala fisik 100% di tengah kertas dengan garis potong.
4. Gaya komunikasi: Sopan, terstruktur, cerdas, solutif seperti Claude / ChatGPT. Jangan gunakan tanda bintang berlebihan.
   Struktur jawaban:
   - Analisis Berkas & Isi Dokumen (sebutkan nama file & topik isi yang Anda baca).
   - Rekomendasi Format Cetak (Kertas A4/F4, Orientasi, Margin Jilid, Tipe Kertas).
   - Panduan Mesin Printer (Epson L3110: Setting Plain Paper, Skala 100%).
   - Konfirmasi Aksi: Nyatakan bahwa setelan sudah otomatis diterapkan ke kanvas dan tombol unduh/cetak siap digunakan.
5. Di akhir respon, SELALU sertakan blok JSON berikut dengan tepat:
\`\`\`json
{
  "explanation": "Ringkasan setelan",
  "settings": {
    "paperSizeId": "a4",
    "orientation": "portrait",
    "adjustMode": "fit",
    "margins": {
      "top": 10,
      "bottom": 10,
      "left": 15,
      "right": 10,
      "linked": false
    },
    "scale": 1.0,
    "qualityDpi": 300,
    "mediaTypeId": "hvs",
    "gsm": 75,
    "colorMode": "color",
    "enhanceFilter": "none",
    "showCropMarks": false,
    "photoGridMode": "none"
  }
}
\`\`\``;

  // 1. Try Gemini 3.8 Flash first if configured
  if (genAI) {
    try {
      const parts: any[] = [];

      // If image is present, send image data
      if (imageBase64 && imageBase64.startsWith('data:image')) {
        const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      // Add detailed document metadata and extracted text
      parts.push({
        text: `Data Berkas Terunggah:
Nama Berkas: ${fileMeta?.name || 'Dokumen'}
Tipe Format: ${fileMeta?.type || 'Dokumen'}
Halaman: ${fileMeta?.pages || 1}
Dimensi Gambar/Kanvas: ${fileMeta?.width || 0} × ${fileMeta?.height || 0} px
Isi Teks Berkas yang Diekstrak:
"""
${fileMeta?.textContent ? fileMeta.textContent.slice(0, 3500) : '(Tidak ada teks terdeteksi, gunakan visual dokumen)'}
"""

Setelan Aktif Saat Ini: Kertas ${currentConfig?.paperSizeId || 'a4'}, Orientasi ${currentConfig?.orientation || 'portrait'}
Permintaan Pengguna: ${prompt || 'Bantu rekomendasi saya akan langsung download'}`
      });

      const geminiResponse = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: parts,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });

      const rawAnswer = geminiResponse.text || '';
      let parsedSettings = null;
      const jsonMatch = rawAnswer.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          parsedSettings = parsed.settings;
        } catch (e) {
          console.warn('JSON parsing from Gemini error:', e);
        }
      }

      const displayText = rawAnswer.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim();
      return res.json({
        text: displayText,
        settings: parsedSettings,
        modelUsed: 'Google Gemini 3.8 Flash',
      });
    } catch (geminiErr: any) {
      console.warn('Gemini generateContent error, falling back to NVIDIA/Local:', geminiErr?.message);
    }
  }

  // 2. Try NVIDIA API with strict context and extracted text
  try {
    const userMessageContent: any[] = [];
    let chosenModel = TEXT_MODEL;

    const docContext = `Data Berkas: Nama: ${fileMeta?.name || 'Dokumen'}, Format: ${fileMeta?.type || 'Dokumen'}, Total Halaman: ${fileMeta?.pages || 1}.
Isi Dokumen yang Diekstrak:
"""
${fileMeta?.textContent ? fileMeta.textContent.slice(0, 2000) : '(Teks kosong)'}
"""
Permintaan User: ${prompt || 'Bantu rekomendasi saya akan langsung download'}`;

    if (imageBase64 && imageBase64.startsWith('data:image')) {
      chosenModel = VISION_MODEL;
      userMessageContent.push({ type: 'text', text: docContext });
      userMessageContent.push({
        type: 'image_url',
        image_url: { url: imageBase64 },
      });
    } else {
      userMessageContent.push({ type: 'text', text: docContext });
    }

    const payload = {
      model: chosenModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    };

    const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEFAULT_NVIDIA_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const rawAnswer = data.choices?.[0]?.message?.content || '';

      let parsedSettings = null;
      const jsonMatch = rawAnswer.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          parsedSettings = parsed.settings;
        } catch (e) {
          console.warn('Could not parse JSON settings from LLM:', e);
        }
      }

      const displayText = rawAnswer.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim();
      return res.json({
        text: displayText || 'Pengaturan telah berhasil disesuaikan dengan isi dokumen Anda.',
        settings: parsedSettings,
        modelUsed: chosenModel,
      });
    }
  } catch (nvidiaErr: any) {
    console.warn('NVIDIA API error, activating autonomous rule-based engine:', nvidiaErr?.message);
  }

  // 3. Autonomous Rule-Based Heuristic (reads content, never fails)
  const isKK = fileName.includes('keluarga') || fileName.includes('kk') || fileText.includes('kartu keluarga');
  const isIjazah = fileName.includes('ijazah') || fileName.includes('sertifikat') || fileText.includes('ijazah') || fileText.includes('sertifikat');
  const isAcademicDocx =
    fileName.includes('tugas') ||
    fileName.includes('makalah') ||
    fileName.includes('skripsi') ||
    fileName.includes('laporan') ||
    fileName.includes('snomed') ||
    fileName.includes('kodefikasi') ||
    fileName.includes('.docx') ||
    fileName.includes('.doc') ||
    fileText.includes('tugas') ||
    fileText.includes('kodefikasi');

  const isKtp = fileName.includes('ktp') || fileName.includes('sim') || fileText.includes('nik');
  const isPhotoGrid = lowerPrompt.includes('pas foto') || lowerPrompt.includes('foto 3x4') || lowerPrompt.includes('foto 4x6');
  const isGrayscale = lowerPrompt.includes('hitam putih') || lowerPrompt.includes('grayscale') || lowerPrompt.includes('b/w');
  const isSharpen = lowerPrompt.includes('tajam') || lowerPrompt.includes('kontras') || lowerPrompt.includes('buram');

  let paperSizeId = 'a4';
  let orientation: 'portrait' | 'landscape' = 'portrait';
  let margins = { top: 10, bottom: 10, left: 15, right: 10, linked: false };
  let docTitle = fileMeta?.name || 'Dokumen';
  let docTypeDesc = 'Dokumen Umum';
  let gsm = 75;
  let mediaTypeId = 'hvs';

  if (isKK) {
    paperSizeId = 'f4';
    orientation = 'landscape';
    margins = { top: 6, bottom: 6, left: 6, right: 6, linked: true };
    docTypeDesc = 'Kartu Keluarga (KK)';
  } else if (isIjazah) {
    paperSizeId = 'f4';
    orientation = 'portrait';
    margins = { top: 12, bottom: 12, left: 12, right: 12, linked: true };
    docTypeDesc = 'Ijazah / Sertifikat Resmi';
    gsm = 80;
  } else if (isAcademicDocx) {
    paperSizeId = 'a4';
    orientation = 'portrait';
    margins = { top: 10, bottom: 10, left: 18, right: 10, linked: false }; // margin jilid 18 mm
    docTypeDesc = 'Tugas Akademik / Laporan Resmi (.docx)';
    gsm = 75;
  } else if (isKtp) {
    paperSizeId = 'a4';
    margins = { top: 20, bottom: 20, left: 20, right: 20, linked: true };
    docTypeDesc = 'Kartu Identitas (KTP / SIM)';
  }

  const autonomousSettings = {
    paperSizeId,
    orientation,
    adjustMode: isKtp ? 'actual' : 'fit',
    margins,
    scale: 1.0,
    qualityDpi: 300,
    mediaTypeId,
    gsm,
    colorMode: isGrayscale ? 'grayscale' : 'color',
    enhanceFilter: isSharpen ? 'high_contrast' : 'none',
    showCropMarks: isKtp,
    photoGridMode: isPhotoGrid ? 'package_mix' : 'none',
  };

  const responseText = `Saya telah menganalisis isi berkas Anda: **${docTitle}**.

1. **Identifikasi Dokumen:**
Berkas ini dikenali sebagai **${docTypeDesc}**. Isi dokumen terstruktur rapi untuk pencetakan dokumen dinas/akademik.

2. **Rekomendasi Setelan Cetak:**
• **Ukuran Kertas:** ${paperSizeId === 'f4' ? 'F4 / Folio (215,9 × 330,2 mm)' : 'A4 (210 × 297 mm)'}
• **Orientasi:** ${orientation === 'landscape' ? 'Mendatar (Landscape)' : 'Tegak (Portrait)'}
• **Margin Khusus:** Kiri ${margins.left} mm (margin aman untuk staples & jilid), Atas/Bawah/Kanan ${margins.top} mm
• **Tipe Kertas:** Kertas HVS ${gsm} GSM (Epson: Plain Paper)
• **Skala Fisik:** 100% (Fit Anti-Gepeng, proporsional)

3. **Status Aksi Otonom:**
Semua pengaturan di atas telah **langsung diterapkan ke kanvas pratinjau**. Berkas Anda sudah siap diunduh! Silakan klik tombol **Download PDF Siap Cetak** atau **Cetak Langsung** sekarang.`;

  return res.json({
    text: responseText,
    settings: autonomousSettings,
    modelUsed: 'PrintFit-Autonomous-Engine',
  });
});

// Setup Vite dev server middleware or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrintFit server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
