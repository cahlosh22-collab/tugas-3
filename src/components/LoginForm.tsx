import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { dbManager } from '../services/dbManager.ts';
import { User as UserType } from '../types/tos.ts';

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [identifier, setIdentifier] = useState('admin@terminal.id');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const res = dbManager.login(identifier, password);
      setLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    }, 300);
  };

  const handleQuickFill = (role: 'admin' | 'planner' | 'operator') => {
    if (role === 'admin') {
      setIdentifier('admin@terminal.id');
      setPassword('admin123');
    } else if (role === 'planner') {
      setIdentifier('planner@terminal.id');
      setPassword('planner123');
    } else {
      setIdentifier('operator@terminal.id');
      setPassword('operator123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950 border border-sky-800/80 text-sky-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Login Petugas Terminal (TOS)</h2>
            <p className="text-xs text-slate-400">Masuk dengan kredensial Admin / Operator</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email atau Username Admin
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@terminal.id"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-600 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem TOS'}
            </button>
          </div>
        </form>

        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className="text-[11px] font-medium text-slate-400 mb-2">Akun Contoh Cepat (Demo Presets):</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="rounded border border-slate-700 bg-slate-800/80 p-2 text-center hover:bg-slate-700/80 transition-colors"
            >
              <div className="text-[11px] font-semibold text-white">Super Admin</div>
              <div className="text-[10px] text-slate-400">admin / admin123</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('planner')}
              className="rounded border border-slate-700 bg-slate-800/80 p-2 text-center hover:bg-slate-700/80 transition-colors"
            >
              <div className="text-[11px] font-semibold text-white">Yard Planner</div>
              <div className="text-[10px] text-slate-400">planner123</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('operator')}
              className="rounded border border-slate-700 bg-slate-800/80 p-2 text-center hover:bg-slate-700/80 transition-colors"
            >
              <div className="text-[11px] font-semibold text-white">Quay Operator</div>
              <div className="text-[10px] text-slate-400">operator123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
