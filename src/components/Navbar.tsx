import React, { useState } from 'react';
import {
  Ship,
  Database,
  LayoutDashboard,
  FolderKanban,
  ArrowLeftRight,
  FileSpreadsheet,
  LogOut,
  UserCheck,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { User, DatabaseConfig } from '../types/tos.ts';

interface NavbarProps {
  currentTab: 'dashboard' | 'master' | 'transaction' | 'reports' | 'database';
  onSelectTab: (tab: 'dashboard' | 'master' | 'transaction' | 'reports' | 'database') => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenDbConfig: () => void;
  dbConfig: DatabaseConfig;
  simulationActive: boolean;
  onToggleSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenDbConfig,
  dbConfig,
  simulationActive,
  onToggleSimulation,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Determine active provider label
  const getProviderBadge = () => {
    switch (dbConfig.activeProvider) {
      case 'supabase':
        return { label: 'Supabase Real-DB', color: 'text-emerald-400' };
      case 'neon':
        return { label: 'Neon PostgreSQL', color: 'text-emerald-400' };
      case 'firebase':
        return { label: 'Firebase Cloud', color: 'text-amber-400' };
      default:
        return { label: 'TOS Local Engine', color: 'text-sky-400' };
    }
  };

  const provider = getProviderBadge();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090e1a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Clean Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
            <Ship className="h-5 w-5" />
          </div>
          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-left font-bold tracking-tight text-white text-base hover:text-sky-300 transition-colors whitespace-nowrap"
          >
            PORTVESSEL TOS
          </button>
        </div>

        {/* Zone 2: 4-5 Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard Analitik
          </button>

          <button
            onClick={() => onSelectTab('master')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'master'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            Master Data
          </button>

          <button
            onClick={() => onSelectTab('transaction')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'transaction'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Transaksi Operasional
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'reports'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Laporan Kinerja
          </button>

          <button
            onClick={() => onSelectTab('database')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'database'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Koneksi Database
          </button>
        </nav>

        {/* Zone 3: Primary Action & User Session */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real-time Crane Simulation Toggle */}
          <button
            onClick={onToggleSimulation}
            title={simulationActive ? 'Hentikan simulasi crane real-time' : 'Aktifkan simulasi crane real-time'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
              simulationActive
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Radio className={`h-3 w-3 ${simulationActive ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
            <span>{simulationActive ? 'Live STS Crane' : 'Simulasi Crane'}</span>
          </button>

          {/* Real DB Connector Quick Button */}
          <button
            onClick={onOpenDbConfig}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
          >
            <Database className="h-3.5 w-3.5 text-sky-400" />
            <span className={provider.color}>{provider.label}</span>
          </button>

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-sky-300">
                  {currentUser.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-200 truncate max-w-[130px]">{currentUser.fullName}</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</div>
                </div>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-800 py-2 shadow-xl z-50 text-xs text-slate-300"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-sky-400 mt-1">{currentUser.department}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onSelectTab('database');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-left"
                  >
                    <Database className="h-3.5 w-3.5 text-slate-400" />
                    Status Real Database
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-950/30 text-rose-400 text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar (Logout)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-sky-600 text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Login Admin
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 bg-[#080d17] overflow-x-auto text-[11px]">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'dashboard' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('master')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'master' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          Master
        </button>
        <button
          onClick={() => onSelectTab('transaction')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'transaction' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          Transaksi
        </button>
        <button
          onClick={() => onSelectTab('reports')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'reports' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          Laporan
        </button>
        <button
          onClick={() => onSelectTab('database')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'database' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
        >
          Database
        </button>
      </div>
    </header>
  );
};
