import React, { useState } from 'react';
import {
  Ship,
  Anchor,
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Vessel, Berth, YardBlock } from '../types/tos.ts';
import { dbManager } from '../services/dbManager.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface MasterDataViewProps {
  vessels: Vessel[];
  berths: Berth[];
  yardBlocks: YardBlock[];
  onRefresh: () => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  vessels,
  berths,
  yardBlocks,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'vessels' | 'berths' | 'yards'>('vessels');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [vesselModalOpen, setVesselModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);

  const [berthModalOpen, setBerthModalOpen] = useState(false);
  const [editingBerth, setEditingBerth] = useState<Berth | null>(null);

  const [yardModalOpen, setYardModalOpen] = useState(false);
  const [editingYard, setEditingYard] = useState<YardBlock | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'vessel' | 'berth' | 'yard';
    id: string;
    name: string;
  }>({ isOpen: false, type: 'vessel', id: '', name: '' });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Filtered lists
  const filteredVessels = vessels.filter(
    (v) =>
      v.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.imoNumber.includes(searchQuery) ||
      v.shippingLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.callSign.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBerths = berths.filter(
    (b) =>
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredYards = yardBlocks.filter(
    (y) =>
      y.blockCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      y.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      y.zoneType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Vessel Form State
  const [vesselForm, setVesselForm] = useState({
    imoNumber: '',
    vesselName: '',
    callSign: '',
    flag: 'Indonesia 🇮🇩',
    loaMeters: 200,
    beamMeters: 30,
    draftMeters: 10,
    teuCapacity: 3000,
    shippingLine: 'Samudera Indonesia',
    yearBuilt: 2020,
  });

  const handleOpenAddVessel = () => {
    setEditingVessel(null);
    setVesselForm({
      imoNumber: '9' + Math.floor(100000 + Math.random() * 900000),
      vesselName: '',
      callSign: '',
      flag: 'Indonesia 🇮🇩',
      loaMeters: 250,
      beamMeters: 32,
      draftMeters: 11.5,
      teuCapacity: 4000,
      shippingLine: 'Samudera Indonesia',
      yearBuilt: 2021,
    });
    setVesselModalOpen(true);
  };

  const handleOpenEditVessel = (v: Vessel) => {
    setEditingVessel(v);
    setVesselForm({
      imoNumber: v.imoNumber,
      vesselName: v.vesselName,
      callSign: v.callSign,
      flag: v.flag,
      loaMeters: v.loaMeters,
      beamMeters: v.beamMeters,
      draftMeters: v.draftMeters,
      teuCapacity: v.teuCapacity,
      shippingLine: v.shippingLine,
      yearBuilt: v.yearBuilt,
    });
    setVesselModalOpen(true);
  };

  const handleSaveVessel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselForm.vesselName.trim() || !vesselForm.imoNumber.trim()) {
      showNotification('Nama Kapal dan Nomor IMO wajib diisi', true);
      return;
    }

    if (editingVessel) {
      dbManager.updateVessel(editingVessel.id, vesselForm);
      showNotification(`Kapal ${vesselForm.vesselName} berhasil diperbarui`);
    } else {
      dbManager.addVessel(vesselForm);
      showNotification(`Kapal ${vesselForm.vesselName} berhasil ditambahkan ke Master Data`);
    }

    setVesselModalOpen(false);
    onRefresh();
  };

  const handleDeleteVessel = (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, type: 'vessel', id, name });
  };

  // Berth Form State
  const [berthForm, setBerthForm] = useState({
    code: '',
    name: '',
    lengthMeters: 300,
    maxDepthMeters: 14.0,
    craneCount: 3,
    status: 'available' as Berth['status'],
  });

  const handleOpenAddBerth = () => {
    setEditingBerth(null);
    setBerthForm({
      code: `DERMAGA-0${berths.length + 1}`,
      name: `Dermaga Baru 0${berths.length + 1}`,
      lengthMeters: 350,
      maxDepthMeters: 14.5,
      craneCount: 3,
      status: 'available',
    });
    setBerthModalOpen(true);
  };

  const handleOpenEditBerth = (b: Berth) => {
    setEditingBerth(b);
    setBerthForm({
      code: b.code,
      name: b.name,
      lengthMeters: b.lengthMeters,
      maxDepthMeters: b.maxDepthMeters,
      craneCount: b.craneCount,
      status: b.status,
    });
    setBerthModalOpen(true);
  };

  const handleSaveBerth = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBerth) {
      dbManager.updateBerth(editingBerth.id, berthForm);
      showNotification(`Dermaga ${berthForm.code} berhasil diperbarui`);
    } else {
      dbManager.addBerth(berthForm);
      showNotification(`Dermaga ${berthForm.code} berhasil ditambahkan`);
    }
    setBerthModalOpen(false);
    onRefresh();
  };

  const handleDeleteBerth = (id: string, code: string) => {
    setDeleteConfirm({ isOpen: true, type: 'berth', id, name: code });
  };

  // Yard Form State
  const [yardForm, setYardForm] = useState({
    blockCode: '',
    name: '',
    zoneType: 'DRY' as YardBlock['zoneType'],
    totalBays: 16,
    totalRows: 6,
    totalTiers: 5,
    capacityTeu: 960,
  });

  const handleOpenAddYard = () => {
    setEditingYard(null);
    setYardForm({
      blockCode: `BLOK-${String.fromCharCode(65 + yardBlocks.length)}`,
      name: `Lapangan Penumpukan Blok ${String.fromCharCode(65 + yardBlocks.length)}`,
      zoneType: 'DRY',
      totalBays: 20,
      totalRows: 6,
      totalTiers: 5,
      capacityTeu: 1200,
    });
    setYardModalOpen(true);
  };

  const handleOpenEditYard = (y: YardBlock) => {
    setEditingYard(y);
    setYardForm({
      blockCode: y.blockCode,
      name: y.name,
      zoneType: y.zoneType,
      totalBays: y.totalBays,
      totalRows: y.totalRows,
      totalTiers: y.totalTiers,
      capacityTeu: y.capacityTeu,
    });
    setYardModalOpen(true);
  };

  const handleSaveYard = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingYard) {
      dbManager.updateYardBlock(editingYard.id, yardForm);
      showNotification(`Blok ${yardForm.blockCode} berhasil diperbarui`);
    } else {
      dbManager.addYardBlock(yardForm);
      showNotification(`Blok ${yardForm.blockCode} berhasil ditambahkan`);
    }
    setYardModalOpen(false);
    onRefresh();
  };

  const handleDeleteYard = (id: string, code: string) => {
    setDeleteConfirm({ isOpen: true, type: 'yard', id, name: code });
  };

  const handleExecuteDelete = () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === 'vessel') {
        dbManager.deleteVessel(deleteConfirm.id);
        showNotification(`Kapal ${deleteConfirm.name} berhasil dihapus`);
      } else if (deleteConfirm.type === 'berth') {
        dbManager.deleteBerth(deleteConfirm.id);
        showNotification(`Dermaga ${deleteConfirm.name} berhasil dihapus`);
      } else {
        dbManager.deleteYardBlock(deleteConfirm.id);
        showNotification(`Blok ${deleteConfirm.name} berhasil dihapus`);
      }
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setDeleteConfirm({ isOpen: false, type: 'vessel', id: '', name: '' });
    }
  };

  const handleExportCsv = () => {
    let headers = '';
    let rows = '';

    if (activeTab === 'vessels') {
      headers = 'IMO Number,Vessel Name,Call Sign,Flag,LOA (m),Beam (m),Draft (m),TEU Capacity,Shipping Line,Year Built\n';
      rows = vessels
        .map(
          (v) =>
            `"${v.imoNumber}","${v.vesselName}","${v.callSign}","${v.flag}",${v.loaMeters},${v.beamMeters},${v.draftMeters},${v.teuCapacity},"${v.shippingLine}",${v.yearBuilt}`
        )
        .join('\n');
    } else if (activeTab === 'berths') {
      headers = 'Code,Name,Length (m),Depth (m),Cranes,Status\n';
      rows = berths
        .map((b) => `"${b.code}","${b.name}",${b.lengthMeters},${b.maxDepthMeters},${b.craneCount},"${b.status}"`)
        .join('\n');
    } else {
      headers = 'Block Code,Name,Zone Type,Bays,Rows,Tiers,Capacity TEU,Current TEU\n';
      rows = yardBlocks
        .map(
          (y) =>
            `"${y.blockCode}","${y.name}","${y.zoneType}",${y.totalBays},${y.totalRows},${y.totalTiers},${y.capacityTeu},${y.currentTeu}`
        )
        .join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `master_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-950/40 border border-rose-800 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/40 border border-emerald-800 p-3 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header & Master Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Master Data Fasilitas & Armada Terminal</h1>
          <p className="text-xs text-slate-400">
            Kelola data induk kapal peti kemas (Vessel), dermaga sandar (Berth), dan lapangan penumpukan (Yard Block) dengan aksi CRUD penuh.
          </p>
        </div>

        {/* Master Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('vessels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'vessels'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ship className="h-3.5 w-3.5" />
            <span>Master Kapal ({vessels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('berths')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'berths'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Anchor className="h-3.5 w-3.5" />
            <span>Dermaga ({berths.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('yards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'yards'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Lapangan ({yardBlocks.length})</span>
          </button>
        </div>
      </div>

      {/* Action Toolbar: Search + Add Button + CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari ${
              activeTab === 'vessels' ? 'nama kapal, IMO, shipping line...' : activeTab === 'berths' ? 'kode dermaga...' : 'blok lapangan...'
            }`}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {activeTab === 'vessels' && (
            <button
              onClick={handleOpenAddVessel}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Kapal Baru</span>
            </button>
          )}

          {activeTab === 'berths' && (
            <button
              onClick={handleOpenAddBerth}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Dermaga</span>
            </button>
          )}

          {activeTab === 'yards' && (
            <button
              onClick={handleOpenAddYard}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Blok Lapangan</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: MASTER VESSELS TABLE */}
      {activeTab === 'vessels' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                <tr>
                  <th className="px-4 py-3">Nama Kapal & IMO</th>
                  <th className="px-4 py-3">Call Sign & Bendera</th>
                  <th className="px-4 py-3">Shipping Line</th>
                  <th className="px-4 py-3 text-right">LOA / Beam / Draft</th>
                  <th className="px-4 py-3 text-right">Kapasitas TEU</th>
                  <th className="px-4 py-3 text-right">Tahun Pembuatan</th>
                  <th className="px-4 py-3 text-center">Aksi (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredVessels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Tidak ada kapal yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredVessels.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Ship className="h-3.5 w-3.5 text-sky-400" />
                          <span>{v.vesselName}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">IMO: {v.imoNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-slate-200">{v.callSign}</div>
                        <div className="text-[11px] text-slate-400">{v.flag}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{v.shippingLine}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-300">
                        {v.loaMeters}m / {v.beamMeters}m / {v.draftMeters}m
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-sky-400 tabular-nums">
                        {v.teuCapacity.toLocaleString()} TEU
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">
                        {v.yearBuilt}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditVessel(v)}
                            title="Edit Kapal"
                            className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVessel(v.id, v.vesselName)}
                            title="Hapus Kapal"
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER BERTHS TABLE */}
      {activeTab === 'berths' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                <tr>
                  <th className="px-4 py-3">Kode Dermaga</th>
                  <th className="px-4 py-3">Nama Fasilitas Dermaga</th>
                  <th className="px-4 py-3 text-right">Panjang (LOA)</th>
                  <th className="px-4 py-3 text-right">Kedalaman Max</th>
                  <th className="px-4 py-3 text-right">Jumlah STS Crane</th>
                  <th className="px-4 py-3">Status Saat Ini</th>
                  <th className="px-4 py-3 text-center">Aksi (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredBerths.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sky-400">{b.code}</td>
                    <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-300">{b.lengthMeters} m</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-300">{b.maxDepthMeters} m</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-300 tabular-nums">
                      {b.craneCount} Unit
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          b.status === 'occupied'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : b.status === 'available'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {b.status === 'occupied' ? 'Sandar Aktif' : b.status === 'available' ? 'Tersedia' : 'Maintenance'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditBerth(b)}
                          title="Edit Dermaga"
                          className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBerth(b.id, b.code)}
                          title="Hapus Dermaga"
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER YARD BLOCKS TABLE */}
      {activeTab === 'yards' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                <tr>
                  <th className="px-4 py-3">Kode Blok</th>
                  <th className="px-4 py-3">Nama Blok Lapangan</th>
                  <th className="px-4 py-3">Zona Muatan</th>
                  <th className="px-4 py-3 text-right">Struktur (Bays x Rows x Tiers)</th>
                  <th className="px-4 py-3 text-right">Kapasitas Desain</th>
                  <th className="px-4 py-3 text-right">Isi Saat Ini (Utilisasi)</th>
                  <th className="px-4 py-3 text-center">Aksi (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredYards.map((y) => {
                  const util = Math.round((y.currentTeu / y.capacityTeu) * 100);
                  return (
                    <tr key={y.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white">{y.blockCode}</td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{y.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            y.zoneType === 'REEFER'
                              ? 'bg-cyan-950 text-cyan-300'
                              : y.zoneType === 'HAZARDOUS'
                              ? 'bg-rose-950 text-rose-300'
                              : y.zoneType === 'EMPTY'
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {y.zoneType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-300">
                        {y.totalBays} Bay · {y.totalRows} Row · {y.totalTiers} Tier
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-sky-400 tabular-nums">
                        {y.capacityTeu.toLocaleString()} TEU
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        <span className="font-bold text-white">{y.currentTeu} TEU</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({util}%)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditYard(y)}
                            title="Edit Blok"
                            className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteYard(y.id, y.blockCode)}
                            title="Hapus Blok"
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT VESSEL */}
      {vesselModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setVesselModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-4">
              {editingVessel ? 'Edit Data Master Kapal' : 'Tambah Kapal Peti Kemas Baru'}
            </h2>

            <form onSubmit={handleSaveVessel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Kapal (Vessel Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="MV NUSANTARA EXPRESS"
                    value={vesselForm.vesselName}
                    onChange={(e) => setVesselForm({ ...vesselForm, vesselName: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nomor IMO</label>
                  <input
                    type="text"
                    required
                    placeholder="9839438"
                    value={vesselForm.imoNumber}
                    onChange={(e) => setVesselForm({ ...vesselForm, imoNumber: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Call Sign</label>
                  <input
                    type="text"
                    placeholder="PKNV"
                    value={vesselForm.callSign}
                    onChange={(e) => setVesselForm({ ...vesselForm, callSign: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bendera Kapal</label>
                  <input
                    type="text"
                    placeholder="Indonesia 🇮🇩"
                    value={vesselForm.flag}
                    onChange={(e) => setVesselForm({ ...vesselForm, flag: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={vesselForm.yearBuilt}
                    onChange={(e) => setVesselForm({ ...vesselForm, yearBuilt: parseInt(e.target.value) || 2020 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Operator / Shipping Line</label>
                  <input
                    type="text"
                    required
                    placeholder="Samudera Indonesia / Meratus"
                    value={vesselForm.shippingLine}
                    onChange={(e) => setVesselForm({ ...vesselForm, shippingLine: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kapasitas Muat (TEU)</label>
                  <input
                    type="number"
                    required
                    value={vesselForm.teuCapacity}
                    onChange={(e) => setVesselForm({ ...vesselForm, teuCapacity: parseInt(e.target.value) || 1000 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Panjang (LOA m)</label>
                  <input
                    type="number"
                    value={vesselForm.loaMeters}
                    onChange={(e) => setVesselForm({ ...vesselForm, loaMeters: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Lebar (Beam m)</label>
                  <input
                    type="number"
                    value={vesselForm.beamMeters}
                    onChange={(e) => setVesselForm({ ...vesselForm, beamMeters: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sarat Air (Draft m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vesselForm.draftMeters}
                    onChange={(e) => setVesselForm({ ...vesselForm, draftMeters: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVesselModalOpen(false)}
                  className="rounded px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-500"
                >
                  {editingVessel ? 'Simpan Perubahan' : 'Daftarkan Kapal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BERTH */}
      {berthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setBerthModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-4">
              {editingBerth ? 'Edit Data Dermaga' : 'Tambah Dermaga Sandar Baru'}
            </h2>

            <form onSubmit={handleSaveBerth} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Kode Dermaga</label>
                <input
                  type="text"
                  required
                  placeholder="DERMAGA-05"
                  value={berthForm.code}
                  onChange={(e) => setBerthForm({ ...berthForm, code: e.target.value.toUpperCase() })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Fasilitas</label>
                <input
                  type="text"
                  required
                  placeholder="Dermaga Multipurpose Dermaga Timur"
                  value={berthForm.name}
                  onChange={(e) => setBerthForm({ ...berthForm, name: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Panjang Dermaga (m)</label>
                  <input
                    type="number"
                    value={berthForm.lengthMeters}
                    onChange={(e) => setBerthForm({ ...berthForm, lengthMeters: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kedalaman Maksimal (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={berthForm.maxDepthMeters}
                    onChange={(e) => setBerthForm({ ...berthForm, maxDepthMeters: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jumlah Derek (Quay Crane)</label>
                  <input
                    type="number"
                    value={berthForm.craneCount}
                    onChange={(e) => setBerthForm({ ...berthForm, craneCount: parseInt(e.target.value) || 1 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Fasilitas</label>
                  <select
                    value={berthForm.status}
                    onChange={(e) => setBerthForm({ ...berthForm, status: e.target.value as Berth['status'] })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="available">Tersedia (Ready)</option>
                    <option value="occupied">Terisi Sandar (Occupied)</option>
                    <option value="maintenance">Perawatan (Maintenance)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBerthModalOpen(false)}
                  className="rounded px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-500"
                >
                  Simpan Dermaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT YARD BLOCK */}
      {yardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setYardModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-4">
              {editingYard ? 'Edit Blok Lapangan' : 'Tambah Blok Lapangan Penumpukan'}
            </h2>

            <form onSubmit={handleSaveYard} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kode Blok</label>
                  <input
                    type="text"
                    required
                    placeholder="BLOK-F"
                    value={yardForm.blockCode}
                    onChange={(e) => setYardForm({ ...yardForm, blockCode: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Zona Muatan</label>
                  <select
                    value={yardForm.zoneType}
                    onChange={(e) => setYardForm({ ...yardForm, zoneType: e.target.value as YardBlock['zoneType'] })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="DRY">Dry Container (Kering)</option>
                    <option value="REEFER">Reefer Container (Berpendingin)</option>
                    <option value="HAZARDOUS">Hazardous / Dangerous Goods (IMO)</option>
                    <option value="EMPTY">Empty Storage (Kontainer Kosong)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Blok</label>
                <input
                  type="text"
                  placeholder="Lapangan Muat Ekspor Dry 40ft"
                  value={yardForm.name}
                  onChange={(e) => setYardForm({ ...yardForm, name: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bays</label>
                  <input
                    type="number"
                    value={yardForm.totalBays}
                    onChange={(e) => {
                      const bays = parseInt(e.target.value) || 1;
                      setYardForm({
                        ...yardForm,
                        totalBays: bays,
                        capacityTeu: bays * yardForm.totalRows * yardForm.totalTiers * 2,
                      });
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Rows</label>
                  <input
                    type="number"
                    value={yardForm.totalRows}
                    onChange={(e) => {
                      const rows = parseInt(e.target.value) || 1;
                      setYardForm({
                        ...yardForm,
                        totalRows: rows,
                        capacityTeu: yardForm.totalBays * rows * yardForm.totalTiers * 2,
                      });
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tiers (Tumpuk)</label>
                  <input
                    type="number"
                    value={yardForm.totalTiers}
                    onChange={(e) => {
                      const tiers = parseInt(e.target.value) || 1;
                      setYardForm({
                        ...yardForm,
                        totalTiers: tiers,
                        capacityTeu: yardForm.totalBays * yardForm.totalRows * tiers * 2,
                      });
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Kapasitas Desain Maksimal (TEU)</label>
                <input
                  type="number"
                  value={yardForm.capacityTeu}
                  onChange={(e) => setYardForm({ ...yardForm, capacityTeu: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setYardModalOpen(false)}
                  className="rounded px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-500"
                >
                  Simpan Blok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={`Konfirmasi Hapus Data ${deleteConfirm.type === 'vessel' ? 'Kapal' : deleteConfirm.type === 'berth' ? 'Dermaga' : 'Blok Lapangan'}`}
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirm.name}" dari sistem? Aksi ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'vessel', id: '', name: '' })}
      />
    </div>
  );
};
