export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'yard_planner' | 'vessel_operator' | 'gate_officer';
  avatarUrl?: string;
  department: string;
  lastLogin: string;
}

export interface Vessel {
  id: string;
  imoNumber: string;
  vesselName: string;
  callSign: string;
  flag: string;
  loaMeters: number;
  beamMeters: number;
  draftMeters: number;
  teuCapacity: number;
  shippingLine: string;
  yearBuilt: number;
  createdAt: string;
}

export interface Berth {
  id: string;
  code: string;
  name: string;
  lengthMeters: number;
  maxDepthMeters: number;
  craneCount: number;
  currentVesselId?: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface YardBlock {
  id: string;
  blockCode: string;
  name: string;
  zoneType: 'DRY' | 'REEFER' | 'HAZARDOUS' | 'EMPTY';
  totalBays: number;
  totalRows: number;
  totalTiers: number;
  capacityTeu: number;
  currentTeu: number;
}

export interface VesselSchedule {
  id: string;
  voyageNumber: string;
  vesselId: string;
  vesselName: string;
  shippingLine: string;
  berthId: string;
  berthCode: string;
  eta: string;
  etb: string;
  etd: string;
  ata?: string;
  atd?: string;
  status: 'SCHEDULED' | 'APPROACHING' | 'BERTHED' | 'OPERATING' | 'COMPLETED';
  dischargeTeu: number;
  loadTeu: number;
  completedDischargeTeu: number;
  completedLoadTeu: number;
  assignedCranes: string[];
  bshRate: number; // Box Ship Hour
  bchRate: number; // Box Crane Hour
  waitingTimeHours: number;
  berthWorkingTimeHours: number;
}

export interface Container {
  id: string;
  containerNumber: string;
  isoCode: string;
  size: 20 | 40 | 45;
  type: 'DRY' | 'REEFER' | 'HAZARDOUS' | 'TANK' | 'OPEN_TOP' | 'EMPTY';
  weightGrossKg: number;
  tareWeightKg: number;
  sealNumber: string;
  status: 'IN_YARD' | 'LOADED' | 'DISCHARGED' | 'GATE_IN' | 'GATE_OUT';
  yardBlock: string;
  yardBay: number;
  yardRow: number;
  yardTier: number;
  vesselScheduleId?: string;
  consignee: string;
  shippingLine: string;
  destinationPort: string;
  originPort: string;
  updatedAt: string;
}

export interface GateTransaction {
  id: string;
  transactionNumber: string;
  type: 'GATE_IN' | 'GATE_OUT';
  timestamp: string;
  truckPlateNumber: string;
  driverName: string;
  containerNumber: string;
  isoCode: string;
  eirNumber: string;
  status: 'APPROVED' | 'INSPECTED' | 'REJECTED';
  weightKg: number;
  sealIntact: boolean;
  notes?: string;
}

export interface OperationalLog {
  id: string;
  timestamp: string;
  category: 'VESSEL' | 'CRANE' | 'YARD' | 'GATE' | 'SYSTEM';
  description: string;
  actor: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface DatabaseConfig {
  activeProvider: 'builtin' | 'supabase' | 'neon' | 'firebase';
  supabase: {
    url: string;
    anonKey: string;
    connected: boolean;
    tableNamePrefix: string;
    lastPingMs?: number;
  };
  neon: {
    connectionString: string;
    connected: boolean;
    lastPingMs?: number;
  };
  firebase: {
    projectId: string;
    apiKey: string;
    connected: boolean;
    lastPingMs?: number;
  };
  lastSyncTimestamp: string;
}
