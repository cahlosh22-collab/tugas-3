import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Server,
  Flame,
  Zap,
  Download,
  Upload,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { dbManager } from '../services/dbManager.ts';
import { DatabaseConfig } from '../types/tos.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onConfigUpdated: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'neon' | 'firebase' | 'schema' | 'backup'>('supabase');

  // Supabase fields
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabase?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(config.supabase?.anonKey || '');
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Neon fields
  const [neonConn, setNeonConn] = useState(config.neon?.connectionString || '');
  const [neonLoading, setNeonLoading] = useState(false);
  const [neonStatus, setNeonStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Firebase fields
  const [firebaseProject, setFirebaseProject] = useState(config.firebase?.projectId || '');
  const [firebaseApiKey, setFirebaseApiKey] = useState(config.firebase?.apiKey || '');
  const [firebaseLoading, setFirebaseLoading] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Copy helper
  const [copied, setCopied] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const handleTestSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseStatus(null);
    const res = await dbManager.testSupabaseConnection(supabaseUrl, supabaseKey);
    setSupabaseLoading(false);
    setSupabaseStatus(res);
    onConfigUpdated();
  };

  const handleTestNeon = async () => {
    setNeonLoading(true);
    setNeonStatus(null);
    const res = await dbManager.testNeonConnection(neonConn);
    setNeonLoading(false);
    setNeonStatus(res);
    onConfigUpdated();
  };

  const handleTestFirebase = async () => {
    setFirebaseLoading(true);
    setFirebaseStatus(null);
    const res = await dbManager.testFirebaseConnection(firebaseProject, firebaseApiKey);
    setFirebaseLoading(false);
    setFirebaseStatus(res);
    onConfigUpdated();
  };

  const handleSwitchToBuiltin = () => {
    dbManager.updateConfig({ activeProvider: 'builtin' });
    onConfigUpdated();
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(dbManager.getSqlSchemaDDL());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const data = {
      vessels: dbManager.getVessels(),
      berths: dbManager.getBerths(),
      yardBlocks: dbManager.getYardBlocks(),
      schedules: dbManager.getSchedules(),
      containers: dbManager.getContainers(),
      gateTransactions: dbManager.getGateTransactions(),
      logs: dbManager.getLogs(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portvessel_tos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#0a0f1d]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-950 border border-sky-800/80 text-sky-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pusat Integrasi Real Database</h2>
              <p className="text-xs text-slate-400">
                Koneksikan terminal peti kemas ke Supabase, Neon DB, atau Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Supabase Database
            {config.supabase?.connected && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('neon')}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'neon'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            Neon PostgreSQL
            {config.neon?.connected && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            Firebase Firestore
            {config.firebase?.connected && (
              <span className="h-2 w-2 rounded-full bg-amber-400 ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="h-3.5 w-3.5" />
            SQL Schema DDL
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor & Cadangan
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Active Provider Banner */}
          <div className="flex items-center justify-between rounded-lg bg-slate-950 p-3 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Database Engine Aktif:</span>
              <span className="font-semibold text-white capitalize bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {config.activeProvider === 'builtin'
                  ? 'Built-in High Performance Engine (Persistent Local)'
                  : config.activeProvider}
              </span>
            </div>
            {config.activeProvider !== 'builtin' && (
              <button
                onClick={handleSwitchToBuiltin}
                className="text-[11px] text-sky-400 hover:underline"
              >
                Ganti ke Engine Bawaan
              </button>
            )}
          </div>

          {/* TAB 1: SUPABASE */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/50 p-3.5 text-emerald-200 leading-relaxed">
                <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  Koneksi Langsung ke Supabase (Real-Time Postgres)
                </div>
                Masukkan <strong>Project URL</strong> dan <strong>Anon Public Key</strong> dari dashboard Supabase Anda (Settings &gt; API). Sistem TOS akan langsung menguji koneksi dan menyinkronkan data kontainer dan jadwal kapal.
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Supabase Anon / Service Role Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {supabaseStatus && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    supabaseStatus.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/40 border-red-800 text-red-300'
                  }`}
                >
                  {supabaseStatus.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{supabaseStatus.message}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTestSupabase}
                  disabled={supabaseLoading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {supabaseLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span>{supabaseLoading ? 'Menguji Koneksi...' : 'Uji & Sambungkan Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSupabaseUrl('https://sample-project.supabase.co');
                    setSupabaseKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample');
                  }}
                  className="text-slate-400 hover:text-slate-200 underline"
                >
                  Isi Contoh Format
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NEON DB */}
          {activeTab === 'neon' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/50 p-3.5 text-emerald-200 leading-relaxed">
                <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <Server className="h-4 w-4" />
                  Koneksi Serverless PostgreSQL Neon DB
                </div>
                Masukkan connection string PostgreSQL dari dashboard Neon Anda. Format standar: <code className="font-mono text-emerald-400">postgresql://user:pass@ep-name.neon.tech/neondb?sslmode=require</code>.
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Neon PostgreSQL Connection String
                </label>
                <textarea
                  rows={3}
                  placeholder="postgresql://neondb_owner:npg_secret@ep-cool-forest-1234.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
                  value={neonConn}
                  onChange={(e) => setNeonConn(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {neonStatus && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    neonStatus.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/40 border-red-800 text-red-300'
                  }`}
                >
                  {neonStatus.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{neonStatus.message}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTestNeon}
                  disabled={neonLoading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {neonLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Server className="h-3.5 w-3.5" />
                  )}
                  <span>{neonLoading ? 'Menguji Koneksi...' : 'Uji & Sambungkan Neon DB'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNeonConn('postgresql://neondb_owner:npg_sample@ep-pacific-port-8821.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
                  }}
                  className="text-slate-400 hover:text-slate-200 underline"
                >
                  Isi Contoh Format
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FIREBASE */}
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-950/20 border border-amber-900/50 p-3.5 text-amber-200 leading-relaxed">
                <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Flame className="h-4 w-4" />
                  Koneksi Real Firebase Firestore Cloud
                </div>
                Sambungkan ke database Cloud Firestore untuk sinkronisasi dokumen pergerakan peti kemas secara real-time.
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Firebase Project ID
                </label>
                <input
                  type="text"
                  placeholder="portvessel-tos-production"
                  value={firebaseProject}
                  onChange={(e) => setFirebaseProject(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Firebase Web API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSyA..."
                  value={firebaseApiKey}
                  onChange={(e) => setFirebaseApiKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {firebaseStatus && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    firebaseStatus.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/40 border-red-800 text-red-300'
                  }`}
                >
                  {firebaseStatus.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{firebaseStatus.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleTestFirebase}
                  disabled={firebaseLoading}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {firebaseLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Flame className="h-3.5 w-3.5" />
                  )}
                  <span>{firebaseLoading ? 'Menguji Koneksi...' : 'Uji & Sinkronkan Firestore'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await dbManager.syncToFirestore();
                    setFirebaseStatus({
                      success: true,
                      message: `Tersinkronisasi ${res.count} dokumen (Kapal, Dermaga, Lapangan, Kontainer) ke Cloud Firestore.`,
                    });
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                  <span>Kirim Data ke Firestore</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SQL SCHEMA DDL */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400">
                  Salin skrip DDL SQL di bawah ini dan jalankan pada <strong>Supabase SQL Editor</strong> atau <strong>Neon SQL Console</strong> untuk membuat tabel Master dan Transaksi otomatis:
                </p>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700 border border-slate-700 shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>
              <pre className="max-h-72 overflow-y-auto rounded-lg bg-slate-950 p-4 font-mono text-[11px] text-sky-300 border border-slate-800">
                {dbManager.getSqlSchemaDDL()}
              </pre>
            </div>
          )}

          {/* TAB 5: BACKUP & EXPORT */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
                <h3 className="font-semibold text-white mb-1">Cadangkan Basis Data Terminal</h3>
                <p className="text-slate-400 mb-3">
                  Unduh seluruh dataset Master Kapal, Dermaga, Lapangan Penumpukan, Transaksi Kontainer, dan Log Operasional dalam format JSON lengkap.
                </p>
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Unduh Snapshot JSON (.json)
                </button>
              </div>

              <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
                <h3 className="font-semibold text-white mb-1">Reset Data ke Default</h3>
                <p className="text-slate-400 mb-3">
                  Kembalikan dataset ke kondisi awal simulasi pelabuhan dengan data kapal Nusantara Voyager, MSC Bari Express, dan Dermaga 01-04.
                </p>
                <button
                  onClick={() => setResetConfirmOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Database Default
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-[#0a0f1d] flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Terakhir disinkronkan: <span className="font-mono text-slate-300">{new Date(config.lastSyncTimestamp).toLocaleTimeString('id-ID')}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetConfirmOpen}
        title="Reset Seluruh Data Terminal?"
        message="Data kapal, dermaga, kontainer, dan pergerakan crane akan dikembalikan ke kondisi awal demonstrasi pelabuhan."
        confirmLabel="Ya, Reset Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          dbManager.resetToDefault();
          onConfigUpdated();
          setResetConfirmOpen(false);
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
};
