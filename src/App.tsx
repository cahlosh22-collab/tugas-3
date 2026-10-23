import React, { useState, useEffect } from 'react';
import { dbManager } from './services/dbManager.ts';
import {
  Vessel,
  Berth,
  YardBlock,
  VesselSchedule,
  Container,
  GateTransaction,
  OperationalLog,
  DatabaseConfig,
  User,
} from './types/tos.ts';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { MasterDataView } from './components/MasterDataView.tsx';
import { TransactionDataView } from './components/TransactionDataView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { LoginForm } from './components/LoginForm.tsx';
import { DatabaseConfigModal } from './components/DatabaseConfigModal.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'master' | 'transaction' | 'reports' | 'database'>('dashboard');

  // Unified State from TerminalDbManager
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [yardBlocks, setYardBlocks] = useState<YardBlock[]>([]);
  const [schedules, setSchedules] = useState<VesselSchedule[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [gateTransactions, setGateTransactions] = useState<GateTransaction[]>([]);
  const [logs, setLogs] = useState<OperationalLog[]>([]);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(dbManager.getConfig());
  const [currentUser, setCurrentUser] = useState<User | null>(dbManager.getCurrentUser());

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);

  // Real-time Crane Simulation toggle
  const [simulationActive, setSimulationActive] = useState(true);

  const refreshData = () => {
    setVessels(dbManager.getVessels());
    setBerths(dbManager.getBerths());
    setYardBlocks(dbManager.getYardBlocks());
    setSchedules(dbManager.getSchedules());
    setContainers(dbManager.getContainers());
    setGateTransactions(dbManager.getGateTransactions());
    setLogs(dbManager.getLogs());
    setDbConfig(dbManager.getConfig());
    setCurrentUser(dbManager.getCurrentUser());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = dbManager.subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  // Real-time background crane simulation
  useEffect(() => {
    if (!simulationActive) return;
    const interval = setInterval(() => {
      dbManager.simulateCraneLift();
    }, 4500);
    return () => clearInterval(interval);
  }, [simulationActive]);

  const handleLogout = () => {
    dbManager.logout();
    refreshData();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Bar Contract Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'database') {
            setDbModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenDbConfig={() => setDbModalOpen(true)}
        dbConfig={dbConfig}
        simulationActive={simulationActive}
        onToggleSimulation={() => setSimulationActive(!simulationActive)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            vessels={vessels}
            berths={berths}
            yardBlocks={yardBlocks}
            schedules={schedules}
            containers={containers}
            logs={logs}
            simulationActive={simulationActive}
            onToggleSimulation={() => setSimulationActive(!simulationActive)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'master' && (
          <MasterDataView
            vessels={vessels}
            berths={berths}
            yardBlocks={yardBlocks}
            onRefresh={refreshData}
          />
        )}

        {currentTab === 'transaction' && (
          <TransactionDataView
            vessels={vessels}
            berths={berths}
            yardBlocks={yardBlocks}
            schedules={schedules}
            containers={containers}
            gateTransactions={gateTransactions}
            onRefresh={refreshData}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            vessels={vessels}
            berths={berths}
            yardBlocks={yardBlocks}
            schedules={schedules}
            containers={containers}
            gateTransactions={gateTransactions}
          />
        )}
      </main>

      {/* Modals */}
      <LoginForm
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshData();
        }}
      />

      <DatabaseConfigModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
        config={dbConfig}
        onConfigUpdated={refreshData}
      />
    </div>
  );
}
