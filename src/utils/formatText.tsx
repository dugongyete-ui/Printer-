import React from 'react';

/**
 * Parses markdown-like text (bold **text**, bullets • or *, headers) into clean React elements
 * without showing raw markdown syntax like ** or ###.
 */
export function renderCleanFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  // Split lines
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Check if it's a bullet point
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const content = isBullet ? trimmed.replace(/^([•\-*]\s*)/, '') : trimmed;

        // Parse bold elements **...**
        const parts = content.split(/(\*\*.*?\*\*)/g);
        const renderedContent = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2).replace(/\*\*/g, '');
            return (
              <span key={pIdx} className="font-semibold text-slate-900">
                {boldText}
              </span>
            );
          }
          // Remove any stray single asterisks
          return part.replace(/\*/g, '');
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <div className="flex-1">{renderedContent}</div>
            </div>
          );
        }

        return <div key={lineIdx}>{renderedContent}</div>;
      })}
    </div>
  );
}
