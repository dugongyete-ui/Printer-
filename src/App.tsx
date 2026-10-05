import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SmartControlPanel } from './components/SmartControlPanel';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { ExportModal } from './components/ExportModal';
import { EpsonGuideModal } from './components/EpsonGuideModal';
import { AiChatAssistant } from './components/AiChatAssistant';
import { FileItem, JobConfig, CanvasTransform, Orientation } from './types/print';
import { getSmartRecommendation, SmartRecommendation } from './utils/smartRecommender';
import { triggerDirectBrowserPrint } from './utils/pdfGenerator';
import { PAPER_SIZES } from './constants/paperCatalog';
import { DocumentPresetBar } from './components/DocumentPresetBar';
import { IndoPreset } from './utils/photoGridAndPresets';
import { FileCheck, Bot, Sliders, ArrowRight, Eye, MessageSquare } from 'lucide-react';

const INITIAL_CONFIG: JobConfig = {
  paperSizeId: 'a4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'portrait',
  mediaTypeId: 'hvs',
  gsm: 75,
  printerProfileId: 'epson_l3110',
  adjustMode: 'fit',
  margins: {
    top: 5,
    bottom: 5,
    left: 5,
    right: 5,
    linked: true,
  },
  qualityDpi: 300,
  backgroundColor: '#ffffff',
  allPages: true,
  targetPageIndex: 0,
  colorMode: 'color',
  enhanceFilter: 'none',
  showCropMarks: false,
  photoGridMode: 'none',
  presetId: undefined,
};

const INITIAL_TRANSFORM: CanvasTransform = {
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string>('');
  const [config, setConfig] = useState<JobConfig>(INITIAL_CONFIG);
  const [transform, setTransform] = useState<CanvasTransform>(INITIAL_TRANSFORM);
  const [activeTab, setActiveTab] = useState<'chat' | 'controls'>('chat');
  const [mobileView, setMobileView] = useState<'left' | 'preview'>('left');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEpsonModalOpen, setIsEpsonModalOpen] = useState(false);

  const currentFile = files.find((f) => f.id === currentFileId) || files[0] || null;

  // Active smart recommendation based on current file & selected paper
  const targetSize = (config.paperSizeId === 'f4' ? 'f4' : 'a4') as 'a4' | 'f4';
  const recommendation: SmartRecommendation = getSmartRecommendation(currentFile, targetSize);

  // When files are loaded, automatically analyze and apply smart recommendations autonomously
  const handleFilesLoaded = (newFiles: FileItem[]) => {
    setFiles((prev) => {
      // Avoid duplicate IDs
      const existingIds = new Set(prev.map((f) => f.id));
      const filtered = newFiles.filter((f) => !existingIds.has(f.id));
      return [...prev, ...filtered];
    });

    const firstNewFile = newFiles[0];
    if (firstNewFile) {
      setCurrentFileId(firstNewFile.id);

      // Autonomous initial detection if no preset is actively selected
      if (!config.presetId) {
        const autoRec = getSmartRecommendation(firstNewFile, 'a4');
        setConfig((prev) => ({
          ...prev,
          paperSizeId: autoRec.paperSizeId,
          orientation: autoRec.orientation,
          adjustMode: autoRec.adjustMode,
          margins: autoRec.margins,
          mediaTypeId: autoRec.mediaTypeId,
          gsm: autoRec.gsm,
        }));
      }
      setTransform(INITIAL_TRANSFORM);
    }
  };

  const handleSelectPreset = (preset: IndoPreset) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
      presetId: preset.id,
    }));
    setTransform(INITIAL_TRANSFORM);
  };

  const handleReset = () => {
    setFiles([]);
    setCurrentFileId('');
    setConfig(INITIAL_CONFIG);
    setTransform(INITIAL_TRANSFORM);
  };

  const handleConfigChange = (updated: Partial<JobConfig>) => {
    if (updated.paperSizeId && updated.paperSizeId !== config.paperSizeId) {
      const newTarget = updated.paperSizeId === 'f4' ? 'f4' : 'a4';
      const newRec = getSmartRecommendation(currentFile, newTarget);
      setConfig((prev) => ({
        ...prev,
        ...updated,
        orientation: newRec.orientation,
        adjustMode: newRec.adjustMode,
        margins: newRec.margins,
        mediaTypeId: newRec.mediaTypeId,
        gsm: newRec.gsm,
      }));
      setTransform(INITIAL_TRANSFORM);
    } else {
      setConfig((prev) => ({ ...prev, ...updated }));
    }
  };

  const handleApplyRecommendation = (rec: SmartRecommendation) => {
    setConfig((prev) => ({
      ...prev,
      paperSizeId: rec.paperSizeId,
      orientation: rec.orientation,
      adjustMode: rec.adjustMode,
      margins: rec.margins,
      mediaTypeId: rec.mediaTypeId,
      gsm: rec.gsm,
    }));
    setTransform(INITIAL_TRANSFORM);
  };

  const handleApplyAiSettings = (newSettings: Partial<JobConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const handleDirectPrint = () => {
    if (!currentFile || currentFile.pages.length === 0) return;
    const page = currentFile.pages[currentFile.currentPageIndex] || currentFile.pages[0];
    const paper = PAPER_SIZES.find((p) => p.id === config.paperSizeId) || PAPER_SIZES[0];
    let w = paper.id === 'custom' ? config.customWidthMm : paper.widthMm;
    let h = paper.id === 'custom' ? config.customHeightMm : paper.heightMm;
    triggerDirectBrowserPrint(page.dataUrl, paper.name, w, h, config.orientation);
  };

  const handleTransformChange = (newTransform: CanvasTransform) => {
    setTransform(newTransform);
  };

  const handleOrientationChange = (newOrientation: Orientation) => {
    setConfig((prev) => ({
      ...prev,
      orientation: newOrientation,
    }));
  };

  const handlePaperChange = (newPaperId: string) => {
    handleConfigChange({ paperSizeId: newPaperId });
  };

  const handlePageChange = (pageIndex: number) => {
    if (!currentFile) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === currentFile.id ? { ...f, currentPageIndex: pageIndex } : f))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans'] flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Calm Header */}
      <Header
        onOpenEpsonGuide={() => setIsEpsonModalOpen(true)}
        onReset={handleReset}
        hasFile={files.length > 0}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 md:py-6">
        {/* Mobile View Toggle Switcher (visible only on mobile) */}
        {currentFile && (
          <div className="flex lg:hidden items-center justify-center mb-4">
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl w-full max-w-xs justify-between">
              <button
                type="button"
                onClick={() => setMobileView('left')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mobileView === 'left'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat & Setelan</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileView('preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mobileView === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Pratinjau Kertas</span>
              </button>
            </div>
          </div>
        )}

        {/* Prominent Popular Indonesian Document Presets Bar */}
        <DocumentPresetBar
          currentConfig={config}
          onSelectPreset={handleSelectPreset}
          onResetTransform={() => setTransform(INITIAL_TRANSFORM)}
        />

        <div className="space-y-4">
          {/* Mode Switcher Tabs (Chat AI vs Pilihan Cepat) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-indigo-600" />
                <span>Mode Chat AI</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('controls')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'controls'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="h-3.5 w-3.5 text-slate-600" />
                <span>Pilihan Cepat (A4 / F4)</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500">
              Lampirkan foto langsung di chat atau seret file ke layar
            </span>
          </div>

          {/* Guided Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: AI Chat or Smart Controls (5 cols) */}
            <div
              className={`lg:col-span-5 space-y-4 ${
                mobileView === 'preview' && currentFile ? 'hidden lg:block' : 'block'
              }`}
            >
              {activeTab === 'chat' ? (
                <AiChatAssistant
                  currentFile={currentFile}
                  config={config}
                  transform={transform}
                  onFilesLoaded={handleFilesLoaded}
                  onApplySettings={handleApplyAiSettings}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  onDirectPrint={handleDirectPrint}
                />
              ) : (
                <>
                  {currentFile ? (
                    <SmartControlPanel
                      config={config}
                      currentFile={currentFile}
                      recommendation={recommendation}
                      onChange={handleConfigChange}
                      onApplyRecommendation={handleApplyRecommendation}
                    />
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">
                      Silakan unggah file terlebih dahulu untuk memilih pengaturan manual.
                    </div>
                  )}

                  {currentFile && (
                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
                    >
                      <FileCheck className="h-4 w-4 text-emerald-400" />
                      <span>Buat File Siap Print Sekarang</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Clean Interactive Canvas or Empty Upload Zone (7 cols) */}
            <div
              className={`lg:col-span-7 space-y-4 ${
                mobileView === 'left' && currentFile ? 'hidden lg:block' : 'block'
              }`}
            >
              {currentFile ? (
                <>
                  <InteractiveCanvas
                    currentFile={currentFile}
                    config={config}
                    transform={transform}
                    onTransformChange={handleTransformChange}
                    onPageChange={handlePageChange}
                    onOrientationChange={handleOrientationChange}
                    onPaperChange={handlePaperChange}
                    onConfigChange={handleConfigChange}
                  />

                  {/* Bottom Bar: Action & File Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                        {currentFile.name}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {(currentFile.size / 1024).toFixed(0)} KB
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      className="flex items-center gap-1.5 font-bold text-slate-900 hover:text-slate-700"
                    >
                      <span>Lanjut ke Unduh & Cetak</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <UploadZone onFilesLoaded={handleFilesLoaded} isLoading={false} />

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500 shadow-sm">
                    <p className="font-medium text-slate-700">
                      Anda juga dapat melampirkan foto langsung lewat tombol klip di dalam chat di sebelah kiri.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      AI akan membaca resolusi asli foto dan memposisikannya langsung ke kertas A4 atau F4.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PrintFit · Asisten Cetak A4 & F4 Presisi</span>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Didukung AI Vision & Nemotron</span>
            <span>·</span>
            <span>Kompatibel Epson EcoTank L3110 / L3210</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isExportModalOpen && currentFile && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          fileItem={currentFile}
          config={config}
          transform={transform}
        />
      )}

      <EpsonGuideModal
        isOpen={isEpsonModalOpen}
        onClose={() => setIsEpsonModalOpen(false)}
      />
    </div>
  );
}
