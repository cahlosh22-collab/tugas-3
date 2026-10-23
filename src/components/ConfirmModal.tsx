import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
              isDestructive
                ? 'bg-rose-950/60 border-rose-800/80 text-rose-400'
                : 'bg-amber-950/60 border-amber-800/80 text-amber-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-sky-600 hover:bg-sky-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
