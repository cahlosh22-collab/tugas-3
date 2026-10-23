import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Ship,
  Box,
  Anchor,
  Clock,
  Layers,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Vessel,
  Berth,
  YardBlock,
  VesselSchedule,
  Container,
  GateTransaction,
} from '../types/tos.ts';

interface ReportsViewProps {
  vessels: Vessel[];
  berths: Berth[];
  yardBlocks: YardBlock[];
  schedules: VesselSchedule[];
  containers: Container[];
  gateTransactions: GateTransaction[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  vessels,
  berths,
  yardBlocks,
  schedules,
  containers,
  gateTransactions,
}) => {
  const [reportType, setReportType] = useState<'vessel_kpi' | 'container_flow' | 'occupancy' | 'gate'>('vessel_kpi');
  const [dateRange, setDateRange] = useState('Bulan Ini (Oktober 2026)');

  // Calculations for Vessel Performance
  const completedOrActiveSchedules = schedules.filter(
    (s) => s.status === 'OPERATING' || s.status === 'COMPLETED' || s.status === 'BERTHED'
  );

  const totalDischargeTeu = schedules.reduce((a, s) => a + s.completedDischargeTeu, 0);
  const totalLoadTeu = schedules.reduce((a, s) => a + s.completedLoadTeu, 0);
  const totalThroughput = totalDischargeTeu + totalLoadTeu;

  // Container sizing stats
  const count20ft = containers.filter((c) => c.size === 20).length;
  const count40ft = containers.filter((c) => c.size === 40).length;
  const count45ft = containers.filter((c) => c.size === 45).length;

  const countDry = containers.filter((c) => c.type === 'DRY').length;
  const countReefer = containers.filter((c) => c.type === 'REEFER').length;
  const countHazardous = containers.filter((c) => c.type === 'HAZARDOUS').length;
  const countEmpty = containers.filter((c) => c.type === 'EMPTY').length;

  // Gate stats
  const gateInCount = gateTransactions.filter((g) => g.type === 'GATE_IN').length;
  const gateOutCount = gateTransactions.filter((g) => g.type === 'GATE_OUT').length;

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Printing is not supported in sandboxed preview', e);
    }
  };

  const handleExportCSV = () => {
    let csv = '';
    if (reportType === 'vessel_kpi') {
      csv = 'Voyage,Kapal,Shipping Line,Dermaga,Bongkar TEU,Muat TEU,BSH,BCH,Waiting Time (jam),Berth Working Time (jam),Status\n';
      csv += schedules
        .map(
          (s) =>
            `"${s.voyageNumber}","${s.vesselName}","${s.shippingLine}","${s.berthCode}",${s.completedDischargeTeu},${s.completedLoadTeu},${s.bshRate},${s.bchRate},${s.waitingTimeHours},${s.berthWorkingTimeHours},"${s.status}"`
        )
        .join('\n');
    } else {
      csv = 'Container No,ISO,Size,Type,Gross Weight (kg),Seal No,Yard Block,Status,Consignee\n';
      csv += containers
        .map(
          (c) =>
            `"${c.containerNumber}","${c.isoCode}",${c.size},"${c.type}",${c.weightGrossKg},"${c.sealNumber}","${c.yardBlock}","${c.status}","${c.consignee}"`
        )
        .join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan_tos_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Laporan Kinerja &amp; Ekspor Operasional</h1>
          <p className="text-xs text-slate-400">
            Analisis metrik performa operasional kapal, waktu tunggu (waiting time), produktivitas derek, dan utilisasi lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-sky-400" />
            <span>{dateRange}</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setReportType('vessel_kpi')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            reportType === 'vessel_kpi'
              ? 'bg-slate-800 text-sky-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ship className="h-3.5 w-3.5" />
          Kinerja Operasional Kapal (BSH &amp; BCH)
        </button>

        <button
          onClick={() => setReportType('container_flow')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            reportType === 'container_flow'
              ? 'bg-slate-800 text-sky-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="h-3.5 w-3.5" />
          Arus Peti Kemas (Throughput TEU)
        </button>

        <button
          onClick={() => setReportType('occupancy')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            reportType === 'occupancy'
              ? 'bg-slate-800 text-sky-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Utilisasi Fasilitas (BOR &amp; YOR)
        </button>

        <button
          onClick={() => setReportType('gate')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            reportType === 'gate'
              ? 'bg-slate-800 text-sky-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Kinerja Gerbang &amp; TRT
        </button>
      </div>

      {/* REPORT 1: KINERJA OPERASIONAL KAPAL */}
      {reportType === 'vessel_kpi' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Evaluasi Produktivitas Sandar &amp; Quayside Crane</h2>
                <p className="text-[11px] text-slate-400">
                  Standar Ditjen Perhubungan Laut: Box Ship Hour (BSH &ge; 50 box/jam), Box Crane Hour (BCH &ge; 25 box/jam).
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Total Arus Kapal Tercatat:</span>
                <span className="text-xs font-mono font-bold text-sky-400">{schedules.length} Call</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                  <tr>
                    <th className="px-3 py-2.5">Voyage &amp; Nama Kapal</th>
                    <th className="px-3 py-2.5">Dermaga</th>
                    <th className="px-3 py-2.5 text-right">Target Bongkar</th>
                    <th className="px-3 py-2.5 text-right">Target Muat</th>
                    <th className="px-3 py-2.5 text-right">Realisasi TEU</th>
                    <th className="px-3 py-2.5 text-right">BSH (box/jam)</th>
                    <th className="px-3 py-2.5 text-right">BCH (box/jam)</th>
                    <th className="px-3 py-2.5 text-right">Waiting Time</th>
                    <th className="px-3 py-2.5 text-center">Status SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {schedules.map((s) => {
                    const done = s.completedDischargeTeu + s.completedLoadTeu;
                    const isSlaMet = s.bshRate >= 50 || s.status === 'SCHEDULED' || s.status === 'APPROACHING';

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-white">{s.vesselName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{s.voyageNumber} · {s.shippingLine}</div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-sky-300 font-medium">{s.berthCode}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-300">{s.dischargeTeu}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-300">{s.loadTeu}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-white tabular-nums">{done} TEU</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-300 tabular-nums">
                          {s.bshRate > 0 ? `${s.bshRate}` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-300">
                          {s.bchRate > 0 ? `${s.bchRate}` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-300">
                          {s.waitingTimeHours} jam
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              s.status === 'COMPLETED' || s.status === 'OPERATING'
                                ? isSlaMet
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {s.status === 'COMPLETED' || s.status === 'OPERATING'
                              ? isSlaMet ? 'Sesuai Standar' : 'Di Bawah Standar'
                              : 'Terjadwal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: ARUS PETI KEMAS */}
      {reportType === 'container_flow' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box Size Distribution */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <h3 className="font-bold text-white text-xs">Distribusi Ukuran Peti Kemas (Container Size)</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">20 Feet (1 TEU)</span>
                    <span className="font-bold text-sky-400">{count20ft} unit ({Math.round((count20ft / Math.max(1, containers.length)) * 100)}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${(count20ft / Math.max(1, containers.length)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">40 Feet (2 TEU)</span>
                    <span className="font-bold text-emerald-400">{count40ft} unit ({Math.round((count40ft / Math.max(1, containers.length)) * 100)}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(count40ft / Math.max(1, containers.length)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300">45 Feet High Cube</span>
                    <span className="font-bold text-indigo-400">{count45ft} unit ({Math.round((count45ft / Math.max(1, containers.length)) * 100)}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${(count45ft / Math.max(1, containers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Container Commodity Classification */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <h3 className="font-bold text-white text-xs">Klasifikasi Jenis Muatan</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Dry Container</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{countDry}</span>
                  <span className="text-[10px] text-slate-500 block">General Cargo</span>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Reefer Cold Chain</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">{countReefer}</span>
                  <span className="text-[10px] text-slate-500 block">Suhu Terkontrol</span>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Hazardous / B3</span>
                  <span className="text-xl font-bold font-mono text-rose-400">{countHazardous}</span>
                  <span className="text-[10px] text-slate-500 block">IMO Class Dangerous</span>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Empty Storage</span>
                  <span className="text-xl font-bold font-mono text-slate-300">{countEmpty}</span>
                  <span className="text-[10px] text-slate-500 block">Depot Penumpukan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: UTILISASI FASILITAS */}
      {reportType === 'occupancy' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h3 className="font-bold text-white text-xs mb-3">Tingkat Penggunaan Fasilitas (BOR &amp; YOR)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <div className="font-semibold text-slate-200">Berth Occupancy Rate (BOR) per Dermaga:</div>
                {berths.map((b) => (
                  <div key={b.id} className="rounded bg-slate-950 p-2.5 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-sky-400">{b.code}</span>
                      <span className="text-slate-300 ml-2">{b.name}</span>
                    </div>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        b.status === 'occupied' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b.status === 'occupied' ? '100% Terisi' : '0% Kosong'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-200">Yard Occupancy Rate (YOR) per Blok Lapangan:</div>
                {yardBlocks.map((y) => {
                  const util = Math.round((y.currentTeu / y.capacityTeu) * 100);
                  return (
                    <div key={y.id} className="rounded bg-slate-950 p-2.5 border border-slate-800 space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-white">{y.blockCode} ({y.zoneType})</span>
                        <span className="text-slate-300">{y.currentTeu} / {y.capacityTeu} TEU ({util}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${util > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${util}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: KINERJA GERBANG */}
      {reportType === 'gate' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-xs">Arus Truk &amp; Turn Around Time (TRT)</h3>
              <p className="text-[11px] text-slate-400">Rata-rata waktu pelayanan gerbang: 24.5 menit per truk</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">Gate In: {gateInCount} Truk</span>
              <span>·</span>
              <span className="text-indigo-400">Gate Out: {gateOutCount} Truk</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-300">
                <tr>
                  <th className="px-3 py-2">No. EIR</th>
                  <th className="px-3 py-2">Tipe Gerbang</th>
                  <th className="px-3 py-2">Plat Truk &amp; Pengemudi</th>
                  <th className="px-3 py-2">Kontainer</th>
                  <th className="px-3 py-2 text-right">Berat Timbang</th>
                  <th className="px-3 py-2 text-center">Status Segel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {gateTransactions.map((g) => (
                  <tr key={g.id}>
                    <td className="px-3 py-2 font-mono font-bold text-sky-400">{g.eirNumber}</td>
                    <td className="px-3 py-2 font-medium">{g.type}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">{g.truckPlateNumber} ({g.driverName})</td>
                    <td className="px-3 py-2 font-mono text-white">{g.containerNumber}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">{g.weightKg.toLocaleString()} kg</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-emerald-400 font-semibold">Utuh / OK</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
