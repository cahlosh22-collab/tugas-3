import React, { useState } from 'react';
import {
  Ship,
  Anchor,
  Box,
  Truck,
  Activity,
  Gauge,
  Clock,
  Compass,
  ArrowDownToLine,
  ArrowUpFromLine,
  Play,
  Pause,
  AlertTriangle,
  Layers,
  ChevronRight,
  User,
} from 'lucide-react';
import heroVesselImg from '../assets/images/hero_vessel_terminal_1792727947187.jpg';
import adminAvatarImg from '../assets/images/avatar_terminal_admin_1792727947367.jpg';
import {
  Vessel,
  Berth,
  YardBlock,
  VesselSchedule,
  Container,
  OperationalLog,
} from '../types/tos.ts';

interface DashboardProps {
  vessels: Vessel[];
  berths: Berth[];
  yardBlocks: YardBlock[];
  schedules: VesselSchedule[];
  containers: Container[];
  logs: OperationalLog[];
  simulationActive: boolean;
  onToggleSimulation: () => void;
  onNavigateToTab: (tab: 'master' | 'transaction' | 'reports') => void;
  onSelectSchedule?: (schedule: VesselSchedule) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  vessels,
  berths,
  yardBlocks,
  schedules,
  containers,
  logs,
  simulationActive,
  onToggleSimulation,
  onNavigateToTab,
}) => {
  // Compute Key Port Operational Indicators (KPIs)
  const occupiedBerthsCount = berths.filter((b) => b.status === 'occupied').length;
  const berthOccupancyRate = berths.length > 0 ? Math.round((occupiedBerthsCount / berths.length) * 100) : 0;

  const totalYardCapacity = yardBlocks.reduce((acc, y) => acc + y.capacityTeu, 0);
  const totalYardCurrent = yardBlocks.reduce((acc, y) => acc + y.currentTeu, 0);
  const yardOccupancyRate = totalYardCapacity > 0 ? Math.round((totalYardCurrent / totalYardCapacity) * 100) : 0;

  // Active Operating Vessels
  const operatingSchedules = schedules.filter((s) => s.status === 'OPERATING' || s.status === 'BERTHED');
  const avgBsh = operatingSchedules.length > 0
    ? (operatingSchedules.reduce((acc, s) => acc + s.bshRate, 0) / operatingSchedules.length).toFixed(1)
    : '73.2';

  // Total TEU Handled
  const totalDischarged = schedules.reduce((acc, s) => acc + s.completedDischargeTeu, 0);
  const totalLoaded = schedules.reduce((acc, s) => acc + s.completedLoadTeu, 0);
  const totalThroughput = totalDischarged + totalLoaded;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Operational Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#090f1d] shadow-xl">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src={heroVesselImg}
            alt="Terminal Peti Kemas Modern"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090f1d] via-[#090f1d]/85 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-sky-400">TERMINAL OPERATING SYSTEM</span>
              <span aria-hidden="true">·</span>
              <span>Pelabuhan Internasional Utama</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-400">Vessel Operations Live</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white text-balance">
              Pusat Komando Operasional Terminal Peti Kemas
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pemantauan performa sandar kapal real-time, produktivitas derek dermaga (Quay Crane BSH/BCH), utilisasi lapangan penumpukan (YOR), dan transaksi container gate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onToggleSimulation}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-md transition-colors whitespace-nowrap ${
                simulationActive
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-sky-600 text-white hover:bg-sky-500'
              }`}
            >
              {simulationActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{simulationActive ? 'Jeda Simulasi Crane' : 'Mulai Simulasi Real-Time'}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <span>Lihat Laporan Kinerja</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Single-Elevation, Tabular figures) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* KPI 1: BOR */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Berth Occupancy (BOR)</span>
            <Anchor className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{berthOccupancyRate}%</span>
            <span className={`text-[10px] font-semibold ${berthOccupancyRate > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {berthOccupancyRate > 70 ? 'Padat' : 'Optimal'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            {occupiedBerthsCount} dari {berths.length} dermaga sandar
          </div>
        </div>

        {/* KPI 2: YOR */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Yard Occupancy (YOR)</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{yardOccupancyRate}%</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Terkendali</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-mono tabular-nums">
            {totalYardCurrent.toLocaleString()} / {totalYardCapacity.toLocaleString()} TEU
          </div>
        </div>

        {/* KPI 3: BSH Crane Productivity */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Produktivitas BSH</span>
            <Gauge className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">{avgBsh}</span>
            <span className="text-[10px] text-slate-400">box/jam</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Target standar &ge; 50 box/ship/hour
          </div>
        </div>

        {/* KPI 4: Total Throughput */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Throughput TEU</span>
            <Box className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalThroughput.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">TEU</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>Bongkar: {totalDischarged}</span>
            <span>·</span>
            <span>Muat: {totalLoaded}</span>
          </div>
        </div>

        {/* KPI 5: Active Vessels */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Kapal Sandar Aktif</span>
            <Ship className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">{operatingSchedules.length}</span>
            <span className="text-[10px] text-slate-400">Kapal</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            {schedules.filter((s) => s.status === 'APPROACHING').length} kapal menuju dermaga
          </div>
        </div>

        {/* KPI 6: Truck Turn Around Time */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Truck Turn Around (TRT)</span>
            <Truck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">24.5</span>
            <span className="text-[10px] text-slate-400">menit</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Standar SLA &lt; 35 menit/truk
          </div>
        </div>
      </div>

      {/* Main Grid: Berthing Master Visualizer (Seaside Layout) & Yard Spatial Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Seaside Berth & Crane Activity Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white">Visualisasi Dermaga Sandar & Quayside Crane</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Operasi Aktif
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  Tersedia
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Pemeliharaan
                </span>
              </div>
            </div>

            {/* Berths Graphic Representation */}
            <div className="space-y-4">
              {berths.map((berth) => {
                const assignedSchedule = schedules.find(
                  (s) => s.berthId === berth.id && (s.status === 'OPERATING' || s.status === 'BERTHED')
                );
                const assignedVessel = assignedSchedule ? vessels.find((v) => v.id === assignedSchedule.vesselId) : null;
                const totalWork = assignedSchedule ? assignedSchedule.dischargeTeu + assignedSchedule.loadTeu : 0;
                const doneWork = assignedSchedule ? assignedSchedule.completedDischargeTeu + assignedSchedule.completedLoadTeu : 0;
                const progressPct = totalWork > 0 ? Math.round((doneWork / totalWork) * 100) : 0;

                return (
                  <div
                    key={berth.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="px-2 py-0.5 rounded bg-slate-800 font-mono text-xs font-semibold text-sky-400 border border-slate-700">
                          {berth.code}
                        </div>
                        <span className="font-semibold text-white text-xs">{berth.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          (Panjang: {berth.lengthMeters}m · Kedalaman: {berth.maxDepthMeters}m · {berth.craneCount} Crane)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {berth.status === 'occupied' && assignedSchedule && (
                          <span className="text-xs font-mono text-emerald-400 font-medium">
                            {assignedSchedule.assignedCranes.join(', ')} Aktif
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${
                            berth.status === 'occupied'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                              : berth.status === 'available'
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {berth.status === 'occupied' ? 'Sandar' : berth.status === 'available' ? 'Siap Sandar' : 'Maintenance'}
                        </span>
                      </div>
                    </div>

                    {/* Vessel Moored Card inside berth */}
                    {assignedSchedule && assignedVessel ? (
                      <div className="rounded-lg border border-slate-800/80 bg-[#0d1627] p-3.5 space-y-2.5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Ship className="h-4 w-4 text-sky-400 shrink-0" />
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-2">
                                <span>{assignedSchedule.vesselName}</span>
                                <span className="font-mono text-[10px] text-slate-400 font-normal">
                                  [{assignedSchedule.voyageNumber}]
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {assignedVessel.shippingLine} · LOA: {assignedVessel.loaMeters}m · Draft: {assignedVessel.draftMeters}m · Flag: {assignedVessel.flag}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <div>
                              <div className="text-[10px] text-slate-400">BSH Productivity</div>
                              <div className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                                {assignedSchedule.bshRate} box/jam
                              </div>
                            </div>
                            <div className="border-l border-slate-800 pl-3">
                              <div className="text-[10px] text-slate-400">Estimasi Selesai (ETD)</div>
                              <div className="font-mono text-xs font-semibold text-slate-300">
                                {new Date(assignedSchedule.etd).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar of Loading / Discharge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>
                              Progres Bongkar Muat:{' '}
                              <strong className="text-white font-mono">{doneWork}</strong> dari{' '}
                              <span className="font-mono">{totalWork} TEU</span>
                            </span>
                            <span className="font-mono font-semibold text-sky-400">{progressPct}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                            <span className="flex items-center gap-1">
                              <ArrowDownToLine className="h-3 w-3 text-emerald-400" />
                              Bongkar: {assignedSchedule.completedDischargeTeu} / {assignedSchedule.dischargeTeu} TEU
                            </span>
                            <span className="flex items-center gap-1">
                              <ArrowUpFromLine className="h-3 w-3 text-sky-400" />
                              Muat: {assignedSchedule.completedLoadTeu} / {assignedSchedule.loadTeu} TEU
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-xs text-slate-500">
                        {berth.status === 'maintenance'
                          ? 'Dermaga sedang dalam perawatan berkala fasilitas fender dan bollard.'
                          : 'Dermaga kosong siap menerima alur kedatangan kapal berikutnya.'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Yard Penumpukan (CY - Container Yard Overview) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Status Lapangan Penumpukan (Container Yard)</h2>
              </div>
              <button
                onClick={() => onNavigateToTab('transaction')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                Kelola Posisi Kontainer &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {yardBlocks.map((block) => {
                const util = Math.round((block.currentTeu / block.capacityTeu) * 100);
                const isHigh = util > 80;
                return (
                  <div
                    key={block.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">{block.blockCode}</span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          block.zoneType === 'REEFER'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : block.zoneType === 'HAZARDOUS'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : block.zoneType === 'EMPTY'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {block.zoneType}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">{block.name}</div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Utilisasi:</span>
                        <span className={`font-bold tabular-nums ${isHigh ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {util}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${isHigh ? 'bg-rose-500' : 'bg-emerald-500'} transition-all`}
                          style={{ width: `${util}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 text-right tabular-nums">
                        {block.currentTeu} / {block.capacityTeu} TEU
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Real-Time Operations Feed & Duty Officer */}
        <div className="space-y-4">
          {/* Duty Officer Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src={adminAvatarImg}
                alt="Harbor Master Director"
                className="h-12 w-12 rounded-full object-cover border border-slate-700 bg-slate-800"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h3 className="font-bold text-white text-xs">Capt. Dewi Anggraini, M.Mar.</h3>
                <p className="text-[11px] text-sky-400 font-medium">Duty Terminal Superintendent</p>
                <p className="text-[10px] text-slate-400">Shift 1 (07:00 - 19:00 WIB) · Command Room</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800/80 pt-3">
              <div className="text-slate-400">
                Alur Pandu: <span className="font-semibold text-emerald-400">Lancar (Clear)</span>
              </div>
              <div className="text-slate-400">
                Pasang Surut: <span className="font-mono text-slate-200">+2.4m High</span>
              </div>
            </div>
          </div>

          {/* Operational Activity Stream */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-400" />
                <h3 className="font-bold text-white text-xs">Log Operasional Terminal Real-Time</h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">50 Terkini</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {logs.map((log) => {
                const badgeColor =
                  log.category === 'VESSEL'
                    ? 'text-sky-400 bg-sky-950/60 border-sky-800/60'
                    : log.category === 'CRANE'
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                    : log.category === 'GATE'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                    : log.category === 'YARD'
                    ? 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60'
                    : 'text-slate-400 bg-slate-800 border-slate-700';

                return (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-2.5 space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                        {log.category}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{log.description}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Operator:</span>
                      <span className="text-slate-300 font-medium">{log.actor}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
