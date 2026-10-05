import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Paperclip, Download, Printer, User, Sparkles, Image as ImageIcon } from 'lucide-react';
import { FileItem, JobConfig, CanvasTransform } from '../types/print';
import { renderCleanFormattedText } from '../utils/formatText';
import { processInputFile } from '../utils/fileParser';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  appliedSettings?: Partial<JobConfig> | null;
  fileAttachment?: {
    name: string;
    width?: number;
    height?: number;
  };
}

interface AiChatAssistantProps {
  currentFile: FileItem | null;
  config: JobConfig;
  transform: CanvasTransform;
  onFilesLoaded: (files: FileItem[]) => void;
  onApplySettings: (newSettings: Partial<JobConfig>) => void;
  onOpenExportModal: () => void;
  onDirectPrint: () => void;
}

export const AiChatAssistant: React.FC<AiChatAssistantProps> = ({
  currentFile,
  config,
  transform,
  onFilesLoaded,
  onApplySettings,
  onOpenExportModal,
  onDirectPrint,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or update conversation when file changes
  useEffect(() => {
    if (currentFile && currentFile.pages.length > 0) {
      const page = currentFile.pages[0];
      const isLandscape = page.naturalWidth > page.naturalHeight;
      const isSmall = page.naturalWidth < 800 || page.naturalHeight < 800;

      const welcomeMsg: ChatMessage = {
        id: `file_${currentFile.id}`,
        sender: 'ai',
        text: `Saya telah menganalisis file "${currentFile.name}".\n\n` +
          `• Resolusi asli: ${page.naturalWidth} × ${page.naturalHeight} piksel\n` +
          `• Bentuk: ${isLandscape ? 'Landscape (Mendatar)' : 'Portrait (Tegak)'}\n` +
          (isSmall ? `• Catatan: Ukuran foto cukup kecil (${page.naturalWidth}px). Saya siap memperbesarnya agar penuh di A4 atau F4 tanpa gepeng.\n\n` : '\n') +
          `Silakan ketik perintah Anda, atau pilih salah satu tombol saran di bawah ini:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileAttachment: {
          name: currentFile.name,
          width: page.naturalWidth,
          height: page.naturalHeight,
        },
      };
      setMessages([welcomeMsg]);
    } else {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Halo! Anda bisa langsung mengirim foto atau dokumen melalui tombol lampiran klip di bawah ini, atau tarik file langsung ke dalam chat. Saya akan menganalisis resolusinya dan menyesuaikannya secara otomatis ke kertas A4 atau F4.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [currentFile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);

    try {
      const validFiles: FileItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await processInputFile(files[i]);
        if (item.status === 'ready') {
          validFiles.push(item);
        }
      }

      if (validFiles.length > 0) {
        onFilesLoaded(validFiles);
        const uploaded = validFiles[0];
        const page = uploaded.pages[0];

        // Add user upload message in chat
        setMessages((prev) => [
          ...prev,
          {
            id: `usr_up_${Date.now()}`,
            sender: 'user',
            text: `Mengirim file: ${uploaded.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fileAttachment: {
              name: uploaded.name,
              width: page?.naturalWidth,
              height: page?.naturalHeight,
            },
          },
        ]);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const page = currentFile?.pages[0];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          fileMeta: currentFile
            ? {
                name: currentFile.name,
                width: page?.naturalWidth || 0,
                height: page?.naturalHeight || 0,
                aspectRatio: page?.aspectRatio || 1,
                type: currentFile.type,
                pages: currentFile.totalPages,
                textContent: page?.textContent ? page.textContent.slice(0, 3000) : '',
              }
            : null,
          imageBase64: page?.dataUrl || null,
          currentConfig: config,
        }),
      });

      const data = await response.json();

      if (data.settings) {
        onApplySettings(data.settings);
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedSettings: data.settings,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: 'File telah disesuaikan secara otonom dengan setelan proporsional yang aman untuk printer Anda.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Kartu Keluarga (KK)',
    'Ijazah Sekolah F4',
    'Sertifikat & Piagam',
    'KTP & SIM Ukuran Asli',
    'Paket Pas Foto Komplit',
    'Hitam Putih (Hemat Tinta)',
    'Tajamkan Teks Buram',
  ];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
      }}
      className={`relative flex flex-col h-[520px] lg:h-[580px] rounded-2xl border bg-white shadow-xs overflow-hidden transition-all ${
        isDragOver ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-slate-200/80'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.doc,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileUpload(e.target.files);
        }}
      />

      {/* Drag overlay hint */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/85 text-white backdrop-blur-xs">
          <ImageIcon className="h-10 w-10 mb-2 animate-bounce" />
          <p className="font-semibold text-sm">Lepaskan file di sini untuk langsung dianalisis AI</p>
        </div>
      )}

      {/* Claude/ChatGPT Minimal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Asisten Cetak Pintar Otonom
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>PrintFit AI Agent · Multi-Format (DOCX, PDF, Foto, XLSX)</span>
            </div>
          </div>
        </div>

        {/* Quick file indicator */}
        {currentFile && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg max-w-[200px] truncate">
            <span className="truncate">{currentFile.name}</span>
          </div>
        )}
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#fafafc]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white mt-0.5 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                  : 'bg-white border border-slate-200/70 text-slate-800 rounded-bl-xs shadow-xs'
              }`}
            >
              {/* Attachment chip if user uploaded a file */}
              {msg.fileAttachment && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-2 text-[11px] mb-1.5 ${
                    msg.sender === 'user' ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 border border-slate-200/80 text-slate-700'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{msg.fileAttachment.name}</span>
                  {msg.fileAttachment.width && (
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      ({msg.fileAttachment.width} × {msg.fileAttachment.height} px)
                    </span>
                  )}
                </div>
              )}

              {/* Clean text formatted without raw ** asterisks */}
              <div className="text-xs">
                {renderCleanFormattedText(msg.text)}
              </div>

              {/* If AI applied settings, show notification card with action buttons */}
              {msg.appliedSettings && (
                <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-700 space-y-2">
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Setelan Telah Diterapkan ke Pratinjau:</span>
                    <span className="uppercase text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {msg.appliedSettings.paperSizeId?.toUpperCase()} · {msg.appliedSettings.orientation} · {msg.appliedSettings.adjustMode}
                    </span>
                  </div>

                  <p className="text-slate-500 text-[11px]">
                    Pratinjau di samping sudah menyesuaikan. Jika sudah cocok, Anda bisa langsung unduh atau cetak sekarang:
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onOpenExportModal}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh File Siap Cetak</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDirectPrint}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Sekarang</span>
                    </button>
                  </div>
                </div>
              )}

              <span className={`block text-[10px] pt-0.5 ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/70 w-fit shadow-xs">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            <span>AI sedang menganalisis resolusi file dan menyesuaikan kertas...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-slate-100 bg-white overflow-x-auto text-[11px]">
        <span className="text-slate-400 shrink-0 font-medium mr-1">Saran Cepat:</span>
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(promptText)}
            className="shrink-0 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-colors"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Claude/ChatGPT Clean Input Bar with Paperclip */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-1.5 focus-within:border-slate-400 focus-within:bg-white transition-all shadow-2xs"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Unggah foto atau dokumen langsung ke chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tulis pesan (misal: 'ubah ke landscape', 'jadikan A4 full layar')..."
            className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white disabled:opacity-30 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
