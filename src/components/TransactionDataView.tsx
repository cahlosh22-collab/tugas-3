import React, { useState } from 'react';
import {
  Ship,
  Box,
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  CheckCircle,
  FileText,
  Printer,
  X,
  AlertCircle,
  QrCode,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
} from 'lucide-react';
import {
  Vessel,
  Berth,
  YardBlock,
  VesselSchedule,
  Container,
  GateTransaction,
} from '../types/tos.ts';
import { dbManager } from '../services/dbManager.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface TransactionDataViewProps {
  vessels: Vessel[];
  berths: Berth[];
  yardBlocks: YardBlock[];
  schedules: VesselSchedule[];
  containers: Container[];
  gateTransactions: GateTransaction[];
  onRefresh: () => void;
}

export const TransactionDataView: React.FC<TransactionDataViewProps> = ({
  vessels,
  berths,
  yardBlocks,
  schedules,
  containers,
  gateTransactions,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'containers' | 'gate'>('schedules');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<VesselSchedule | null>(null);

  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);

  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [viewEirModal, setViewEirModal] = useState<GateTransaction | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'schedule' | 'container';
    id: string;
    label: string;
  }>({ isOpen: false, type: 'schedule', id: '', label: '' });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const notify = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Filters
  const filteredSchedules = schedules.filter(
    (s) =>
      s.voyageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shippingLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.berthCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContainers = containers.filter(
    (c) =>
      c.containerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.isoCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.yardBlock.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGate = gateTransactions.filter(
    (g) =>
      g.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.truckPlateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.containerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.eirNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // SCHEDULE FORM
  const [scheduleForm, setScheduleForm] = useState({
    voyageNumber: '',
    vesselId: vessels[0]?.id || '',
    vesselName: vessels[0]?.vesselName || '',
    shippingLine: vessels[0]?.shippingLine || '',
    berthId: berths[0]?.id || '',
    berthCode: berths[0]?.code || '',
    eta: new Date().toISOString().slice(0, 16),
    etb: new Date().toISOString().slice(0, 16),
    etd: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    status: 'SCHEDULED' as VesselSchedule['status'],
    dischargeTeu: 500,
    loadTeu: 450,
    assignedCranes: ['CC-01', 'CC-02'],
  });

  const handleOpenAddSchedule = () => {
    setEditingSchedule(null);
    const defaultVsl = vessels[0];
    const defaultBrt = berths[0];
    setScheduleForm({
      voyageNumber: `VYG-2026-${Math.floor(100 + Math.random() * 900)}`,
      vesselId: defaultVsl ? defaultVsl.id : '',
      vesselName: defaultVsl ? defaultVsl.vesselName : '',
      shippingLine: defaultVsl ? defaultVsl.shippingLine : '',
      berthId: defaultBrt ? defaultBrt.id : '',
      berthCode: defaultBrt ? defaultBrt.code : '',
      eta: new Date().toISOString().slice(0, 16),
      etb: new Date().toISOString().slice(0, 16),
      etd: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      status: 'SCHEDULED',
      dischargeTeu: 600,
      loadTeu: 550,
      assignedCranes: ['CC-01', 'CC-02'],
    });
    setScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (s: VesselSchedule) => {
    setEditingSchedule(s);
    setScheduleForm({
      voyageNumber: s.voyageNumber,
      vesselId: s.vesselId,
      vesselName: s.vesselName,
      shippingLine: s.shippingLine,
      berthId: s.berthId,
      berthCode: s.berthCode,
      eta: s.eta.slice(0, 16),
      etb: s.etb.slice(0, 16),
      etd: s.etd.slice(0, 16),
      status: s.status,
      dischargeTeu: s.dischargeTeu,
      loadTeu: s.loadTeu,
      assignedCranes: s.assignedCranes,
    });
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      dbManager.updateSchedule(editingSchedule.id, scheduleForm);
      notify(`Jadwal Sandar ${scheduleForm.voyageNumber} diperbarui`);
    } else {
      dbManager.addSchedule(scheduleForm);
      notify(`Rencana Sandar ${scheduleForm.voyageNumber} berhasil ditambahkan`);
    }
    setScheduleModalOpen(false);
    onRefresh();
  };

  const handleDeleteSchedule = (id: string, voy: string) => {
    setDeleteConfirm({ isOpen: true, type: 'schedule', id, label: voy });
  };

  const handleUpdateScheduleStatus = (s: VesselSchedule, newStatus: VesselSchedule['status']) => {
    dbManager.updateSchedule(s.id, { status: newStatus });
    notify(`Status sandar kapal ${s.vesselName} diubah ke ${newStatus}`);
    onRefresh();
  };

  // CONTAINER FORM
  const [containerForm, setContainerForm] = useState({
    containerNumber: '',
    isoCode: '42G1',
    size: 40 as Container['size'],
    type: 'DRY' as Container['type'],
    weightGrossKg: 24000,
    tareWeightKg: 3800,
    sealNumber: '',
    status: 'IN_YARD' as Container['status'],
    yardBlock: yardBlocks[0]?.blockCode || 'BLOK-A',
    yardBay: 4,
    yardRow: 2,
    yardTier: 1,
    consignee: 'PT Berkah Logistik Samudera',
    shippingLine: 'Samudera Indonesia',
    originPort: 'Shanghai (CNSHA)',
    destinationPort: 'Jakarta (IDJKT)',
  });

  const handleOpenAddContainer = () => {
    setEditingContainer(null);
    const prefix = ['MSCU', 'CMAU', 'SUDU', 'MRTU', 'TEMU'][Math.floor(Math.random() * 5)];
    const randNum = Math.floor(1000000 + Math.random() * 9000000);
    setContainerForm({
      containerNumber: `${prefix}${randNum}`,
      isoCode: '42G1',
      size: 40,
      type: 'DRY',
      weightGrossKg: 24500,
      tareWeightKg: 3820,
      sealNumber: `SL-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'IN_YARD',
      yardBlock: yardBlocks[0]?.blockCode || 'BLOK-A',
      yardBay: Math.floor(1 + Math.random() * 12),
      yardRow: Math.floor(1 + Math.random() * 5),
      yardTier: Math.floor(1 + Math.random() * 3),
      consignee: 'PT Astra International Tbk',
      shippingLine: 'MSC Mediterranean',
      originPort: 'Shanghai (CNSHA)',
      destinationPort: 'Jakarta (IDJKT)',
    });
    setContainerModalOpen(true);
  };

  const handleOpenEditContainer = (c: Container) => {
    setEditingContainer(c);
    setContainerForm({
      containerNumber: c.containerNumber,
      isoCode: c.isoCode,
      size: c.size,
      type: c.type,
      weightGrossKg: c.weightGrossKg,
      tareWeightKg: c.tareWeightKg,
      sealNumber: c.sealNumber,
      status: c.status,
      yardBlock: c.yardBlock,
      yardBay: c.yardBay,
      yardRow: c.yardRow,
      yardTier: c.yardTier,
      consignee: c.consignee,
      shippingLine: c.shippingLine,
      originPort: c.originPort,
      destinationPort: c.destinationPort,
    });
    setContainerModalOpen(true);
  };

  const handleSaveContainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContainer) {
      dbManager.updateContainer(editingContainer.id, containerForm);
      notify(`Data kontainer ${containerForm.containerNumber} diperbarui`);
    } else {
      dbManager.addContainer(containerForm);
      notify(`Kontainer ${containerForm.containerNumber} berhasil dicatat di lapangan`);
    }
    setContainerModalOpen(false);
    onRefresh();
  };

  const handleDeleteContainer = (id: string, num: string) => {
    setDeleteConfirm({ isOpen: true, type: 'container', id, label: num });
  };

  const handleExecuteDelete = () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === 'schedule') {
        dbManager.deleteSchedule(deleteConfirm.id);
        notify(`Jadwal ${deleteConfirm.label} berhasil dihapus`);
      } else {
        dbManager.deleteContainer(deleteConfirm.id);
        notify(`Kontainer ${deleteConfirm.label} berhasil dihapus`);
      }
      onRefresh();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setDeleteConfirm({ isOpen: false, type: 'schedule', id: '', label: '' });
    }
  };

  // GATE TRANSACTION FORM
  const [gateForm, setGateForm] = useState({
    type: 'GATE_IN' as GateTransaction['type'],
    truckPlateNumber: 'B 9201 UVE',
    driverName: 'Sutrisno Wibowo',
    containerNumber: containers[0]?.containerNumber || 'MSCU7349120',
    isoCode: '42G1',
    weightKg: 24500,
    sealIntact: true,
    status: 'APPROVED' as GateTransaction['status'],
    notes: 'Pemeriksaan fisik peti kemas bersih dan segel terverifikasi',
  });

  const handleOpenAddGate = () => {
    const c = containers[Math.floor(Math.random() * containers.length)];
    setGateForm({
      type: 'GATE_IN',
      truckPlateNumber: `B 9${Math.floor(100 + Math.random() * 899)} ${['UEK', 'VOA', 'UXI', 'TYR'][Math.floor(Math.random() * 4)]}`,
      driverName: ['Bambang Sugiharto', 'Ahmad Fauzi', 'Surya Pratama', 'Joko Susilo', 'Rian Hidayat'][Math.floor(Math.random() * 5)],
      containerNumber: c ? c.containerNumber : 'MSCU7349120',
      isoCode: c ? c.isoCode : '42G1',
      weightKg: c ? c.weightGrossKg : 25000,
      sealIntact: true,
      status: 'APPROVED',
      notes: 'Pemeriksaan fisik peti kemas bersih dan segel terverifikasi aman',
    });
    setGateModalOpen(true);
  };

  const handleSaveGate = (e: React.FormEvent) => {
    e.preventDefault();
    const trans = dbManager.addGateTransaction(gateForm);
    notify(`Transaksi ${trans.type} sukses (${trans.eirNumber})`);
    setGateModalOpen(false);
    setViewEirModal(trans);
    onRefresh();
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

      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Transaksi Operasional Pelabuhan</h1>
          <p className="text-xs text-slate-400">
            Pencatatan sandar kapal, manifest bongkar muat kontainer, alokasi crane quayside, dan transaksi Gate In/Out EIR.
          </p>
        </div>

        {/* Transaction Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'schedules'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ship className="h-3.5 w-3.5" />
            <span>Sandar Kapal ({schedules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('containers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'containers'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>Manifest Kontainer ({containers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'gate'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Gate &amp; EIR ({gateTransactions.length})</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari di ${
              activeTab === 'schedules' ? 'nomor voyage, nama kapal, dermaga...' : activeTab === 'containers' ? 'nomor kontainer, consignee...' : 'nomor polisi truk, EIR...'
            }`}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'schedules' && (
            <button
              onClick={handleOpenAddSchedule}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Rencana Sandar Baru</span>
            </button>
          )}

          {activeTab === 'containers' && (
            <button
              onClick={handleOpenAddContainer}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Daftarkan Kontainer</span>
            </button>
          )}

          {activeTab === 'gate' && (
            <button
              onClick={handleOpenAddGate}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Transaksi Gate Baru (EIR)</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SCHEDULES TABLE */}
      {activeTab === 'schedules' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                <tr>
                  <th className="px-4 py-3">Voyage No &amp; Kapal</th>
                  <th className="px-4 py-3">Dermaga Sandar</th>
                  <th className="px-4 py-3">Waktu (ETA / ETD)</th>
                  <th className="px-4 py-3 text-right">Rencana Bongkar / Muat</th>
                  <th className="px-4 py-3 text-right">Realisasi (BSH)</th>
                  <th className="px-4 py-3">Status Operasi</th>
                  <th className="px-4 py-3 text-center">Aksi (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSchedules.map((s) => {
                  const total = s.dischargeTeu + s.loadTeu;
                  const done = s.completedDischargeTeu + s.completedLoadTeu;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Ship className="h-3.5 w-3.5 text-sky-400" />
                          <span>{s.vesselName}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {s.voyageNumber} · {s.shippingLine}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-sky-300">{s.berthCode}</span>
                        <div className="text-[10px] text-slate-400">{s.assignedCranes.join(', ')}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                        <div>ETA: {new Date(s.eta).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-slate-400">ETD: {new Date(s.etd).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        <div className="text-emerald-400">Bongkar: {s.dischargeTeu} TEU</div>
                        <div className="text-sky-400">Muat: {s.loadTeu} TEU</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-white">{done} TEU ({pct}%)</div>
                        <div className="text-[10px] text-amber-300">{s.bshRate} box/jam</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={s.status}
                          onChange={(e) => handleUpdateScheduleStatus(s, e.target.value as VesselSchedule['status'])}
                          className={`rounded px-2 py-1 text-[11px] font-semibold border ${
                            s.status === 'OPERATING'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : s.status === 'BERTHED'
                              ? 'bg-sky-950 text-sky-300 border-sky-800'
                              : s.status === 'APPROACHING'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : s.status === 'COMPLETED'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                          }`}
                        >
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="APPROACHING">APPROACHING</option>
                          <option value="BERTHED">BERTHED</option>
                          <option value="OPERATING">OPERATING</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditSchedule(s)}
                            title="Edit Rencana Sandar"
                            className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(s.id, s.voyageNumber)}
                            title="Hapus Rencana"
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

      {/* TAB 2: CONTAINERS TABLE */}
      {activeTab === 'containers' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                <tr>
                  <th className="px-4 py-3">Nomor Kontainer &amp; ISO</th>
                  <th className="px-4 py-3">Ukuran &amp; Tipe</th>
                  <th className="px-4 py-3">Posisi Yard (Blok/Bay/Row/Tier)</th>
                  <th className="px-4 py-3 text-right">Berat Bruto &amp; Segel</th>
                  <th className="px-4 py-3">Consignee &amp; Pelabuhan</th>
                  <th className="px-4 py-3">Status Kontainer</th>
                  <th className="px-4 py-3 text-center">Aksi (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredContainers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        <Box className="h-3.5 w-3.5 text-sky-400" />
                        <span>{c.containerNumber}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">ISO Code: {c.isoCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{c.size} Feet</div>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          c.type === 'REEFER'
                            ? 'bg-cyan-950 text-cyan-300'
                            : c.type === 'HAZARDOUS'
                            ? 'bg-rose-950 text-rose-300'
                            : c.type === 'EMPTY'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-sky-400">{c.yardBlock}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        Bay {c.yardBay} · Row {c.yardRow} · Tier {c.yardTier}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <div className="text-white font-semibold">{c.weightGrossKg.toLocaleString()} kg</div>
                      <div className="text-[10px] text-slate-400 font-mono">Segel: {c.sealNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-medium truncate max-w-[150px]">{c.consignee}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {c.originPort} &rarr; {c.destinationPort}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          c.status === 'IN_YARD'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : c.status === 'LOADED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : c.status === 'DISCHARGED'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditContainer(c)}
                          title="Edit Kontainer / Posisi Yard"
                          className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContainer(c.id, c.containerNumber)}
                          title="Hapus Kontainer"
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

      {/* TAB 3: GATE IN / OUT TABLE */}
      {activeTab === 'gate' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                <tr>
                  <th className="px-4 py-3">No. Transaksi &amp; EIR</th>
                  <th className="px-4 py-3">Tipe Gerbang</th>
                  <th className="px-4 py-3">Truk &amp; Pengemudi</th>
                  <th className="px-4 py-3">Nomor Kontainer</th>
                  <th className="px-4 py-3 text-right">Berat Timbang</th>
                  <th className="px-4 py-3">Waktu Transaksi</th>
                  <th className="px-4 py-3 text-center">Cetak EIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredGate.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white">{g.transactionNumber}</div>
                      <div className="font-mono text-[10px] text-sky-400 font-semibold">{g.eirNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          g.type === 'GATE_IN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {g.type === 'GATE_IN' ? 'Gate In (Masuk)' : 'Gate Out (Keluar)'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-200">{g.truckPlateNumber}</div>
                      <div className="text-[11px] text-slate-400">{g.driverName}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-sky-300">
                      {g.containerNumber} ({g.isoCode})
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-200">
                      {g.weightKg.toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                      {new Date(g.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setViewEirModal(g)}
                        className="flex items-center gap-1 mx-auto rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <FileText className="h-3 w-3 text-sky-400" />
                        <span>Lihat EIR</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SCHEDULE */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setScheduleModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-4">
              {editingSchedule ? 'Edit Rencana Sandar & Bongkar Muat' : 'Jadwalkan Sandar Kapal Baru'}
            </h2>

            <form onSubmit={handleSaveSchedule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nomor Voyage</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.voyageNumber}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, voyageNumber: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pilih Kapal (Master Data)</label>
                  <select
                    value={scheduleForm.vesselId}
                    onChange={(e) => {
                      const v = vessels.find((item) => item.id === e.target.value);
                      if (v) {
                        setScheduleForm({
                          ...scheduleForm,
                          vesselId: v.id,
                          vesselName: v.vesselName,
                          shippingLine: v.shippingLine,
                        });
                      }
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    {vessels.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vesselName} ({v.shippingLine})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dermaga Sandar (Berth)</label>
                  <select
                    value={scheduleForm.berthId}
                    onChange={(e) => {
                      const b = berths.find((item) => item.id === e.target.value);
                      if (b) {
                        setScheduleForm({
                          ...scheduleForm,
                          berthId: b.id,
                          berthCode: b.code,
                        });
                      }
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    {berths.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Operasi</label>
                  <select
                    value={scheduleForm.status}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value as VesselSchedule['status'] })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="SCHEDULED">SCHEDULED (Terjadwal)</option>
                    <option value="APPROACHING">APPROACHING (Menuju Alur)</option>
                    <option value="BERTHED">BERTHED (Telah Sandar)</option>
                    <option value="OPERATING">OPERATING (Bongkar Muat Aktif)</option>
                    <option value="COMPLETED">COMPLETED (Selesai & Berlayar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Waktu Kedatangan (ETA)</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.eta}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, eta: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estimasi Selesai (ETD)</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.etd}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, etd: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Bongkar (Discharge TEU)</label>
                  <input
                    type="number"
                    value={scheduleForm.dischargeTeu}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, dischargeTeu: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Muat (Load TEU)</label>
                  <input
                    type="number"
                    value={scheduleForm.loadTeu}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, loadTeu: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Derek Alokasi (Quay Cranes, pisahkan koma)
                </label>
                <input
                  type="text"
                  placeholder="CC-01, CC-02"
                  value={scheduleForm.assignedCranes.join(', ')}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      assignedCranes: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="rounded px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-500"
                >
                  Simpan Jadwal Sandar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CONTAINER */}
      {containerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setContainerModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-4">
              {editingContainer ? 'Edit Posisi / Data Kontainer' : 'Daftarkan Kontainer Baru'}
            </h2>

            <form onSubmit={handleSaveContainer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nomor Kontainer</label>
                  <input
                    type="text"
                    required
                    placeholder="MSCU7349120"
                    value={containerForm.containerNumber}
                    onChange={(e) => setContainerForm({ ...containerForm, containerNumber: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kode ISO</label>
                  <input
                    type="text"
                    required
                    placeholder="42G1"
                    value={containerForm.isoCode}
                    onChange={(e) => setContainerForm({ ...containerForm, isoCode: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ukuran (Feet)</label>
                  <select
                    value={containerForm.size}
                    onChange={(e) => setContainerForm({ ...containerForm, size: parseInt(e.target.value) as Container['size'] })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value={20}>20 Feet (1 TEU)</option>
                    <option value={40}>40 Feet (2 TEU)</option>
                    <option value={45}>45 Feet High Cube</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tipe Muatan</label>
                  <select
                    value={containerForm.type}
                    onChange={(e) => setContainerForm({ ...containerForm, type: e.target.value as Container['type'] })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="DRY">Dry Standard</option>
                    <option value="REEFER">Reefer (Pendingin)</option>
                    <option value="HAZARDOUS">Hazardous (B3/IMO)</option>
                    <option value="EMPTY">Empty (Kosong)</option>
                    <option value="TANK">ISO Tank</option>
                    <option value="OPEN_TOP">Open Top</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nomor Segel (Seal)</label>
                  <input
                    type="text"
                    placeholder="SL-884102"
                    value={containerForm.sealNumber}
                    onChange={(e) => setContainerForm({ ...containerForm, sealNumber: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
                <div className="font-semibold text-sky-400">Posisi Penumpukan Lapangan (Yard Slot)</div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Blok</label>
                    <select
                      value={containerForm.yardBlock}
                      onChange={(e) => setContainerForm({ ...containerForm, yardBlock: e.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white font-mono focus:border-sky-500 focus:outline-none"
                    >
                      {yardBlocks.map((y) => (
                        <option key={y.id} value={y.blockCode}>
                          {y.blockCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Bay</label>
                    <input
                      type="number"
                      value={containerForm.yardBay}
                      onChange={(e) => setContainerForm({ ...containerForm, yardBay: parseInt(e.target.value) || 1 })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Row</label>
                    <input
                      type="number"
                      value={containerForm.yardRow}
                      onChange={(e) => setContainerForm({ ...containerForm, yardRow: parseInt(e.target.value) || 1 })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tier</label>
                    <input
                      type="number"
                      value={containerForm.yardTier}
                      onChange={(e) => setContainerForm({ ...containerForm, yardTier: parseInt(e.target.value) || 1 })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Berat Bruto (kg)</label>
                  <input
                    type="number"
                    value={containerForm.weightGrossKg}
                    onChange={(e) => setContainerForm({ ...containerForm, weightGrossKg: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Lapangan</label>
                  <select
                    value={containerForm.status}
                    onChange={(e) => setContainerForm({ ...containerForm, status: e.target.value as Container['status'] })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="IN_YARD">IN YARD (Di Lapangan)</option>
                    <option value="LOADED">LOADED (Sudah Naik Kapal)</option>
                    <option value="DISCHARGED">DISCHARGED (Baru Dibongkar)</option>
                    <option value="GATE_IN">GATE IN (Baru Masuk Truk)</option>
                    <option value="GATE_OUT">GATE OUT (Telah Keluar)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setContainerModalOpen(false)}
                  className="rounded px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-500"
                >
                  Simpan Kontainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD GATE TRANSACTION */}
      {gateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setGateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-4">
              Pencatatan Transaksi Gate Terminal (EIR)
            </h2>

            <form onSubmit={handleSaveGate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tipe Transaksi Gerbang</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateForm({ ...gateForm, type: 'GATE_IN' })}
                    className={`rounded py-2 font-semibold border ${
                      gateForm.type === 'GATE_IN'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Gate In (Penerimaan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateForm({ ...gateForm, type: 'GATE_OUT' })}
                    className={`rounded py-2 font-semibold border ${
                      gateForm.type === 'GATE_OUT'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Gate Out (Pengeluaran)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nomor Polisi Truk</label>
                  <input
                    type="text"
                    required
                    placeholder="B 9201 UVE"
                    value={gateForm.truckPlateNumber}
                    onChange={(e) => setGateForm({ ...gateForm, truckPlateNumber: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Pengemudi (Driver)</label>
                  <input
                    type="text"
                    required
                    placeholder="Sutrisno Wibowo"
                    value={gateForm.driverName}
                    onChange={(e) => setGateForm({ ...gateForm, driverName: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nomor Peti Kemas</label>
                <input
                  type="text"
                  required
                  placeholder="MSCU7349120"
                  value={gateForm.containerNumber}
                  onChange={(e) => setGateForm({ ...gateForm, containerNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Berat Jembatan Timbang (kg)</label>
                  <input
                    type="number"
                    value={gateForm.weightKg}
                    onChange={(e) => setGateForm({ ...gateForm, weightKg: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kondisi Segel</label>
                  <select
                    value={gateForm.sealIntact ? 'true' : 'false'}
                    onChange={(e) => setGateForm({ ...gateForm, sealIntact: e.target.value === 'true' })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="true">Segel Utuh &amp; Terverifikasi</option>
                    <option value="false">Segel Rusak / Tidak Ada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Catatan Pemeriksaan Fisik</label>
                <textarea
                  rows={2}
                  value={gateForm.notes}
                  onChange={(e) => setGateForm({ ...gateForm, notes: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setGateModalOpen(false)}
                  className="rounded px-4 py-2 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500"
                >
                  Konfirmasi &amp; Terbitkan EIR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW EIR SLIP (Equipment Interchange Receipt) */}
      {viewEirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-xs shadow-2xl text-slate-200">
            <button
              onClick={() => setViewEirModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Official Print Slip Style */}
            <div className="border border-slate-700 rounded-lg p-5 bg-white text-slate-900 space-y-4">
              <div className="text-center border-b pb-3">
                <div className="font-bold text-sm tracking-wider uppercase">PORTVESSEL TERMINAL OPERATING SYSTEM</div>
                <div className="text-[10px] text-slate-600">EQUIPMENT INTERCHANGE RECEIPT (EIR)</div>
                <div className="font-mono text-xs font-bold text-sky-700 mt-1">{viewEirModal.eirNumber}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Tipe Gerbang:</span>
                  <strong className="text-slate-900">{viewEirModal.type}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Waktu Transaksi:</span>
                  <span className="font-mono font-medium">
                    {new Date(viewEirModal.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor Peti Kemas:</span>
                  <strong className="font-mono text-slate-900">{viewEirModal.containerNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Plat Truk:</span>
                  <strong className="font-mono text-slate-900">{viewEirModal.truckPlateNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Nama Sopir:</span>
                  <span className="font-semibold">{viewEirModal.driverName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Berat Timbang:</span>
                  <span className="font-mono font-semibold">{viewEirModal.weightKg.toLocaleString()} kg</span>
                </div>
              </div>

              <div className="border-t pt-2 text-[10px] text-slate-600">
                <div className="font-medium text-slate-800">Kondisi Fisik:</div>
                <div>{viewEirModal.notes || 'Peti kemas diterima dalam kondisi baik tanpa cacat eksternal.'}</div>
                <div className="mt-1 font-semibold text-emerald-700">
                  Status: {viewEirModal.status} · Segel: {viewEirModal.sealIntact ? 'Utuh Terverifikasi' : 'Rusak'}
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between text-[10px] text-slate-500 text-center">
                <div>
                  <div className="mb-6">Petugas Gate Terminal</div>
                  <div className="font-semibold text-slate-800">Hendra Prasetya</div>
                </div>
                <div>
                  <div className="mb-6">Pengemudi Truk</div>
                  <div className="font-semibold text-slate-800">{viewEirModal.driverName}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.warn('Print blocked by container', e);
                  }
                }}
                className="flex items-center gap-1.5 rounded bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Lembar EIR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={`Konfirmasi Hapus ${deleteConfirm.type === 'schedule' ? 'Rencana Sandar' : 'Kontainer'}`}
        message={`Apakah Anda yakin ingin menghapus data "${deleteConfirm.label}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'schedule', id: '', label: '' })}
      />
    </div>
  );
};
