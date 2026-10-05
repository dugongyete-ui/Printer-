import React from 'react';
import {
  Users,
  GraduationCap,
  Award,
  CreditCard,
  FileCheck,
  FileText,
  Grid,
  Receipt,
  Sparkles,
  Check,
} from 'lucide-react';
import { INDO_PRESETS, IndoPreset } from '../utils/photoGridAndPresets';
import { JobConfig, CanvasTransform } from '../types/print';

interface DocumentPresetBarProps {
  currentConfig: JobConfig;
  onSelectPreset: (preset: IndoPreset) => void;
  onResetTransform: () => void;
}

export const DocumentPresetBar: React.FC<DocumentPresetBarProps> = ({
  currentConfig,
  onSelectPreset,
  onResetTransform,
}) => {
  const getIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-700'}`;
    switch (iconName) {
      case 'Users':
        return <Users className={iconClass} />;
      case 'GraduationCap':
        return <GraduationCap className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'CreditCard':
        return <CreditCard className={iconClass} />;
      case 'FileCheck':
        return <FileCheck className={iconClass} />;
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'Grid':
        return <Grid className={iconClass} />;
      case 'Receipt':
        return <Receipt className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs mb-4">
      {/* Title & Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-xs font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Mode Preset Dokumen Populer
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            · Standar Resmi Percetakan Indonesia
          </span>
        </div>

        {currentConfig.presetId && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
            <Check className="h-3 w-3" />
            <span className="font-semibold">
              Mode Aktif: {INDO_PRESETS.find((p) => p.id === currentConfig.presetId)?.name}
            </span>
          </div>
        )}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {INDO_PRESETS.map((preset) => {
          const isSelected = currentConfig.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                onSelectPreset(preset);
                onResetTransform();
              }}
              title={preset.description}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-slate-800' : 'bg-white border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  {getIcon(preset.iconName, isSelected)}
                </div>

                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>

              <div className="font-bold text-[11px] line-clamp-1 leading-tight font-['Plus_Jakarta_Sans']">
                {preset.name}
              </div>

              <div
                className={`text-[9.5px] mt-0.5 line-clamp-1 ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {preset.badge}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
