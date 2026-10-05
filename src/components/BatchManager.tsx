import React from 'react';
import { FileItem } from '../types/print';
import { FileText, Image as ImageIcon, Trash2, Plus, CopyCheck } from 'lucide-react';

interface BatchManagerProps {
  files: FileItem[];
  currentFileId: string;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onAddFilesClick: () => void;
  onApplyToAll: () => void;
}

export const BatchManager: React.FC<BatchManagerProps> = ({
  files,
  currentFileId,
  onSelectFile,
  onRemoveFile,
  onAddFilesClick,
  onApplyToAll,
}) => {
  if (files.length <= 1) return null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Antrean File ({files.length})</span>
          <span className="text-xs text-neutral-400">·</span>
          <span className="text-[11px] text-neutral-400">Pilih file untuk menyesuaikan pratinjau</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApplyToAll}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
            title="Terapkan ukuran kertas dan mode ke seluruh file antrean"
          >
            <CopyCheck className="h-3 w-3 text-indigo-400" />
            <span>Terapkan ke Semua</span>
          </button>
          <button
            type="button"
            onClick={onAddFilesClick}
            className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:border-indigo-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* File List Strip */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {files.map((item) => {
          const isSelected = item.id === currentFileId;
          const isDoc = ['pdf', 'docx', 'doc', 'xlsx'].includes(item.extension);

          return (
            <div
              key={item.id}
              onClick={() => onSelectFile(item.id)}
              className={`group relative flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                  : 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                {isDoc ? <FileText className="h-4 w-4 text-rose-400" /> : <ImageIcon className="h-4 w-4 text-blue-400" />}
              </div>

              <div className="max-w-[130px]">
                <div className="truncate text-xs font-medium text-neutral-200">{item.name}</div>
                <div className="text-[10px] text-neutral-500">
                  {item.totalPages} hlm · {(item.size / 1024).toFixed(0)} KB
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                title="Hapus dari antrean"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
