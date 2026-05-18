import type { ReactNode } from 'react';

interface Props { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; }

export default function Modal({ open, onClose, title, subtitle, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">
        {/* header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 ml-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-gray-500">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {/* body */}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
