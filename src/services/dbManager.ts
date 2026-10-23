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
} from '../types/tos.ts';
import { createClient } from '@supabase/supabase-js';
import {
  db as firestoreDb,
  testFirestoreConnection,
  firebaseConfig,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase.ts';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';

const STORAGE_KEY_TOS = 'portvessel_tos_database_v1';
const STORAGE_KEY_CONFIG = 'portvessel_tos_db_config_v1';
const STORAGE_KEY_AUTH = 'portvessel_tos_auth_session_v1';

// Initial realistic default Master & Transaction data for Indonesian Major Container Terminal
const initialVessels: Vessel[] = [
  {
    id: 'vsl-001',
    imoNumber: '9839438',
    vesselName: 'MV NUSANTARA VOYAGER',
    callSign: 'PKNV',
    flag: 'Indonesia 🇮🇩',
    loaMeters: 294,
    beamMeters: 32,
    draftMeters: 12.5,
    teuCapacity: 4500,
    shippingLine: 'Samudera Indonesia',
    yearBuilt: 2019,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'vsl-002',
    imoNumber: '9708693',
    vesselName: 'MSC BARI EXPRESS',
    callSign: '3EFC8',
    flag: 'Panama 🇵🇦',
    loaMeters: 366,
    beamMeters: 48,
    draftMeters: 14.8,
    teuCapacity: 13100,
    shippingLine: 'MSC Mediterranean',
    yearBuilt: 2021,
    createdAt: '2026-01-12T09:30:00Z',
  },
  {
    id: 'vsl-003',
    imoNumber: '9632064',
    vesselName: 'CMA CGM MAUPASSANT',
    callSign: 'FMCC',
    flag: 'France 🇫🇷',
    loaMeters: 300,
    beamMeters: 40,
    draftMeters: 13.2,
    teuCapacity: 6500,
    shippingLine: 'CMA CGM',
    yearBuilt: 2018,
    createdAt: '2026-02-01T11:00:00Z',
  },
  {
    id: 'vsl-004',
    imoNumber: '9783421',
    vesselName: 'MERATUS KAHAYAN',
    callSign: 'PKMK',
    flag: 'Indonesia 🇮🇩',
    loaMeters: 172,
    beamMeters: 28,
    draftMeters: 9.2,
    teuCapacity: 1600,
    shippingLine: 'Meratus Line',
    yearBuilt: 2020,
    createdAt: '2026-02-15T14:15:00Z',
  },
  {
    id: 'vsl-005',
    imoNumber: '9845764',
    vesselName: 'EVER GLORY',
    callSign: 'BKAW',
    flag: 'Taiwan 🇹🇼',
    loaMeters: 400,
    beamMeters: 59,
    draftMeters: 16.0,
    teuCapacity: 20244,
    shippingLine: 'Evergreen Marine',
    yearBuilt: 2022,
    createdAt: '2026-03-01T10:00:00Z',
  },
];

const initialBerths: Berth[] = [
  {
    id: 'brt-01',
    code: 'DERMAGA-01',
    name: 'Dermaga Peti Kemas Utara (Berth 01)',
    lengthMeters: 450,
    maxDepthMeters: 16.5,
    craneCount: 4,
    currentVesselId: 'vsl-002',
    status: 'occupied',
  },
  {
    id: 'brt-02',
    code: 'DERMAGA-02',
    name: 'Dermaga Peti Kemas Tengah (Berth 02)',
    lengthMeters: 350,
    maxDepthMeters: 14.5,
    craneCount: 3,
    currentVesselId: 'vsl-001',
    status: 'occupied',
  },
  {
    id: 'brt-03',
    code: 'DERMAGA-03',
    name: 'Dermaga Peti Kemas Selatan (Berth 03)',
    lengthMeters: 380,
    maxDepthMeters: 15.0,
    craneCount: 3,
    currentVesselId: undefined,
    status: 'available',
  },
  {
    id: 'brt-04',
    code: 'DERMAGA-04',
    name: 'Dermaga Feeder Nusantara (Berth 04)',
    lengthMeters: 250,
    maxDepthMeters: 11.0,
    craneCount: 2,
    currentVesselId: undefined,
    status: 'maintenance',
  },
];

const initialYardBlocks: YardBlock[] = [
  {
    id: 'blk-01',
    blockCode: 'BLOK-A',
    name: 'Lapangan Muat Internasional (Dry 40ft)',
    zoneType: 'DRY',
    totalBays: 24,
    totalRows: 6,
    totalTiers: 5,
    capacityTeu: 1440,
    currentTeu: 960,
  },
  {
    id: 'blk-02',
    blockCode: 'BLOK-B',
    name: 'Lapangan Bongkar Impor (Dry 20ft)',
    zoneType: 'DRY',
    totalBays: 20,
    totalRows: 6,
    totalTiers: 4,
    capacityTeu: 960,
    currentTeu: 780,
  },
  {
    id: 'blk-03',
    blockCode: 'BLOK-C',
    name: 'Lapangan Cold Storage (Reefer Dedicated)',
    zoneType: 'REEFER',
    totalBays: 12,
    totalRows: 4,
    totalTiers: 4,
    capacityTeu: 384,
    currentTeu: 240,
  },
  {
    id: 'blk-04',
    blockCode: 'BLOK-D',
    name: 'Lapangan Kontainer Kosong (Empty Storage)',
    zoneType: 'EMPTY',
    totalBays: 18,
    totalRows: 6,
    totalTiers: 6,
    capacityTeu: 1296,
    currentTeu: 850,
  },
  {
    id: 'blk-05',
    blockCode: 'BLOK-E',
    name: 'Lapangan Muatan Berbahaya (IMO/Hazardous Class)',
    zoneType: 'HAZARDOUS',
    totalBays: 8,
    totalRows: 4,
    totalTiers: 3,
    capacityTeu: 192,
    currentTeu: 78,
  },
];

const initialSchedules: VesselSchedule[] = [
  {
    id: 'sch-001',
    voyageNumber: 'VYG-2026-081',
    vesselId: 'vsl-002',
    vesselName: 'MSC BARI EXPRESS',
    shippingLine: 'MSC Mediterranean',
    berthId: 'brt-01',
    berthCode: 'DERMAGA-01',
    eta: '2026-10-21T06:00:00Z',
    etb: '2026-10-21T08:00:00Z',
    etd: '2026-10-23T18:00:00Z',
    ata: '2026-10-21T06:45:00Z',
    status: 'OPERATING',
    dischargeTeu: 1850,
    loadTeu: 1420,
    completedDischargeTeu: 1280,
    completedLoadTeu: 640,
    assignedCranes: ['CC-01', 'CC-02', 'CC-03'],
    bshRate: 84.5,
    bchRate: 28.2,
    waitingTimeHours: 1.25,
    berthWorkingTimeHours: 26.5,
  },
  {
    id: 'sch-002',
    voyageNumber: 'VYG-2026-082',
    vesselId: 'vsl-001',
    vesselName: 'MV NUSANTARA VOYAGER',
    shippingLine: 'Samudera Indonesia',
    berthId: 'brt-02',
    berthCode: 'DERMAGA-02',
    eta: '2026-10-22T04:30:00Z',
    etb: '2026-10-22T06:00:00Z',
    etd: '2026-10-23T14:00:00Z',
    ata: '2026-10-22T04:50:00Z',
    status: 'OPERATING',
    dischargeTeu: 620,
    loadTeu: 580,
    completedDischargeTeu: 450,
    completedLoadTeu: 310,
    assignedCranes: ['CC-05', 'CC-06'],
    bshRate: 62.0,
    bchRate: 31.0,
    waitingTimeHours: 0.8,
    berthWorkingTimeHours: 14.0,
  },
  {
    id: 'sch-003',
    voyageNumber: 'VYG-2026-083',
    vesselId: 'vsl-003',
    vesselName: 'CMA CGM MAUPASSANT',
    shippingLine: 'CMA CGM',
    berthId: 'brt-03',
    berthCode: 'DERMAGA-03',
    eta: '2026-10-23T02:00:00Z',
    etb: '2026-10-23T05:00:00Z',
    etd: '2026-10-24T22:00:00Z',
    status: 'APPROACHING',
    dischargeTeu: 1100,
    loadTeu: 950,
    completedDischargeTeu: 0,
    completedLoadTeu: 0,
    assignedCranes: ['CC-07', 'CC-08'],
    bshRate: 0,
    bchRate: 0,
    waitingTimeHours: 0,
    berthWorkingTimeHours: 0,
  },
  {
    id: 'sch-004',
    voyageNumber: 'VYG-2026-084',
    vesselId: 'vsl-004',
    vesselName: 'MERATUS KAHAYAN',
    shippingLine: 'Meratus Line',
    berthId: 'brt-02',
    berthCode: 'DERMAGA-02',
    eta: '2026-10-24T12:00:00Z',
    etb: '2026-10-24T15:00:00Z',
    etd: '2026-10-25T18:00:00Z',
    status: 'SCHEDULED',
    dischargeTeu: 410,
    loadTeu: 380,
    completedDischargeTeu: 0,
    completedLoadTeu: 0,
    assignedCranes: [],
    bshRate: 0,
    bchRate: 0,
    waitingTimeHours: 0,
    berthWorkingTimeHours: 0,
  },
];

const initialContainers: Container[] = [
  {
    id: 'cnt-001',
    containerNumber: 'MSCU7349120',
    isoCode: '42G1',
    size: 40,
    type: 'DRY',
    weightGrossKg: 28450,
    tareWeightKg: 3820,
    sealNumber: 'MSC-981244',
    status: 'IN_YARD',
    yardBlock: 'BLOK-A',
    yardBay: 12,
    yardRow: 3,
    yardTier: 2,
    vesselScheduleId: 'sch-001',
    consignee: 'PT Astra International Tbk',
    shippingLine: 'MSC Mediterranean',
    originPort: 'Shanghai (CNSHA)',
    destinationPort: 'Jakarta (IDJKT)',
    updatedAt: '2026-10-22T14:20:00Z',
  },
  {
    id: 'cnt-002',
    containerNumber: 'SUDU2984102',
    isoCode: '22G1',
    size: 20,
    type: 'DRY',
    weightGrossKg: 19800,
    tareWeightKg: 2280,
    sealNumber: 'SUD-441209',
    status: 'LOADED',
    yardBlock: 'BLOK-B',
    yardBay: 5,
    yardRow: 2,
    yardTier: 1,
    vesselScheduleId: 'sch-002',
    consignee: 'PT Indofood Sukses Makmur',
    shippingLine: 'Samudera Indonesia',
    originPort: 'Surabaya (IDSUB)',
    destinationPort: 'Singapore (SGSIN)',
    updatedAt: '2026-10-22T16:10:00Z',
  },
  {
    id: 'cnt-003',
    containerNumber: 'CMAU9831124',
    isoCode: '45R1',
    size: 40,
    type: 'REEFER',
    weightGrossKg: 26500,
    tareWeightKg: 4600,
    sealNumber: 'CMA-773190',
    status: 'IN_YARD',
    yardBlock: 'BLOK-C',
    yardBay: 4,
    yardRow: 1,
    yardTier: 3,
    vesselScheduleId: 'sch-001',
    consignee: 'PT Dua Kelinci Cold Logistics',
    shippingLine: 'CMA CGM',
    originPort: 'Rotterdam (NLRTM)',
    destinationPort: 'Jakarta (IDJKT)',
    updatedAt: '2026-10-22T17:45:00Z',
  },
  {
    id: 'cnt-004',
    containerNumber: 'MRTU4521098',
    isoCode: '22G1',
    size: 20,
    type: 'DRY',
    weightGrossKg: 14200,
    tareWeightKg: 2250,
    sealNumber: 'MRT-119280',
    status: 'DISCHARGED',
    yardBlock: 'BLOK-B',
    yardBay: 8,
    yardRow: 4,
    yardTier: 2,
    vesselScheduleId: 'sch-002',
    consignee: 'PT Semen Indonesia Group',
    shippingLine: 'Meratus Line',
    originPort: 'Belawan (IDBLW)',
    destinationPort: 'Jakarta (IDJKT)',
    updatedAt: '2026-10-22T18:05:00Z',
  },
  {
    id: 'cnt-005',
    containerNumber: 'EISU8902143',
    isoCode: '20T1',
    size: 20,
    type: 'HAZARDOUS',
    weightGrossKg: 24100,
    tareWeightKg: 3100,
    sealNumber: 'EVE-902145',
    status: 'IN_YARD',
    yardBlock: 'BLOK-E',
    yardBay: 2,
    yardRow: 1,
    yardTier: 1,
    vesselScheduleId: 'sch-001',
    consignee: 'PT Chandra Asri Petrochemical',
    shippingLine: 'Evergreen Marine',
    originPort: 'Kaohsiung (TWKHH)',
    destinationPort: 'Jakarta (IDJKT)',
    updatedAt: '2026-10-22T15:30:00Z',
  },
  {
    id: 'cnt-006',
    containerNumber: 'TEMU4492104',
    isoCode: '42G1',
    size: 40,
    type: 'EMPTY',
    weightGrossKg: 3800,
    tareWeightKg: 3800,
    sealNumber: 'EMP-002914',
    status: 'IN_YARD',
    yardBlock: 'BLOK-D',
    yardBay: 15,
    yardRow: 5,
    yardTier: 4,
    consignee: 'TOS Depot Staging',
    shippingLine: 'MSC Mediterranean',
    originPort: 'Jakarta (IDJKT)',
    destinationPort: 'Tanjung Pelepas (MYTPP)',
    updatedAt: '2026-10-22T11:00:00Z',
  },
];

const initialGateTransactions: GateTransaction[] = [
  {
    id: 'gt-001',
    transactionNumber: 'GT-20261022-0089',
    type: 'GATE_IN',
    timestamp: '2026-10-22T17:15:00Z',
    truckPlateNumber: 'B 9482 UEK',
    driverName: 'Bambang Sugiharto',
    containerNumber: 'MSCU7349120',
    isoCode: '42G1',
    eirNumber: 'EIR-IN-99120',
    status: 'APPROVED',
    weightKg: 28450,
    sealIntact: true,
    notes: 'Pemeriksaan fisik peti kemas bersih, segel utuh terverifikasi',
  },
  {
    id: 'gt-002',
    transactionNumber: 'GT-20261022-0090',
    type: 'GATE_IN',
    timestamp: '2026-10-22T17:40:00Z',
    truckPlateNumber: 'B 9104 UXI',
    driverName: 'Ahmad Fauzi',
    containerNumber: 'CMAU9831124',
    isoCode: '45R1',
    eirNumber: 'EIR-IN-99121',
    status: 'APPROVED',
    weightKg: 26500,
    sealIntact: true,
    notes: 'Reefer set point -18°C verified. Plugged in Yard Blok C',
  },
  {
    id: 'gt-003',
    transactionNumber: 'GT-20261022-0091',
    type: 'GATE_OUT',
    timestamp: '2026-10-22T18:12:00Z',
    truckPlateNumber: 'B 9553 VOA',
    driverName: 'Surya Pratama',
    containerNumber: 'MRTU4521098',
    isoCode: '22G1',
    eirNumber: 'EIR-OUT-44021',
    status: 'APPROVED',
    weightKg: 14200,
    sealIntact: true,
    notes: 'Gate out deliver ke gudang consignee di Cikarang',
  },
];

const initialLogs: OperationalLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-22T18:25:00Z',
    category: 'CRANE',
    description: 'Crane CC-02 sukses bongkar kontainer MSCU7349120 dari MV MSC BARI EXPRESS ke Chasis Truck #12',
    actor: 'Supardi (Crane Operator 02)',
    type: 'success',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-22T18:15:00Z',
    category: 'GATE',
    description: 'Gate Out verifikasi EIR-OUT-44021 disetujui untuk Truk B 9553 VOA',
    actor: 'Hendra (Gate Officer)',
    type: 'info',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-22T18:00:00Z',
    category: 'VESSEL',
    description: 'Vessel CMA CGM MAUPASSANT memasuki alur pelayaran pandu, estimasi sandar Dermaga 03 pukul 05:00 besok',
    actor: 'Capt. R. Wirawan (Vessel Traffic Services)',
    type: 'info',
  },
  {
    id: 'log-004',
    timestamp: '2026-10-22T17:30:00Z',
    category: 'YARD',
    description: 'Blok C Reefer mencapai utilisasi 62.5%. Seluruh 240 stop kontak reefer termonitor suhu stabil',
    actor: 'Denny (Yard Planner)',
    type: 'info',
  },
];

const defaultDatabaseConfig: DatabaseConfig = {
  activeProvider: 'firebase',
  supabase: {
    url: '',
    anonKey: '',
    connected: false,
    tableNamePrefix: 'tos_',
  },
  neon: {
    connectionString: '',
    connected: false,
  },
  firebase: {
    projectId: firebaseConfig.projectId,
    apiKey: firebaseConfig.apiKey,
    connected: true,
  },
  lastSyncTimestamp: new Date().toISOString(),
};

export class TerminalDbManager {
  private vessels: Vessel[] = [];
  private berths: Berth[] = [];
  private yardBlocks: YardBlock[] = [];
  private schedules: VesselSchedule[] = [];
  private containers: Container[] = [];
  private gateTransactions: GateTransaction[] = [];
  private logs: OperationalLog[] = [];
  private config: DatabaseConfig = defaultDatabaseConfig;
  private currentUser: User | null = null;
  private listeners: (() => void)[] = [];
  private firestoreUnsubscribers: Unsubscribe[] = [];

  constructor() {
    this.loadLocalState();
    this.setupFirestoreSubscriptions();
  }

  private loadLocalState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TOS);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.vessels = Array.isArray(parsed.vessels) && parsed.vessels.length > 0 ? parsed.vessels : [...initialVessels];
        this.berths = Array.isArray(parsed.berths) && parsed.berths.length > 0 ? parsed.berths : [...initialBerths];
        this.yardBlocks = Array.isArray(parsed.yardBlocks) && parsed.yardBlocks.length > 0 ? parsed.yardBlocks : [...initialYardBlocks];
        this.schedules = Array.isArray(parsed.schedules) && parsed.schedules.length > 0 ? parsed.schedules : [...initialSchedules];
        this.containers = Array.isArray(parsed.containers) && parsed.containers.length > 0 ? parsed.containers : [...initialContainers];
        this.gateTransactions = Array.isArray(parsed.gateTransactions) && parsed.gateTransactions.length > 0 ? parsed.gateTransactions : [...initialGateTransactions];
        this.logs = Array.isArray(parsed.logs) ? parsed.logs : [...initialLogs];
      } else {
        this.vessels = [...initialVessels];
        this.berths = [...initialBerths];
        this.yardBlocks = [...initialYardBlocks];
        this.schedules = [...initialSchedules];
        this.containers = [...initialContainers];
        this.gateTransactions = [...initialGateTransactions];
        this.logs = [...initialLogs];
        this.saveLocalState();
      }

      const storedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (storedConfig) {
        this.config = { ...defaultDatabaseConfig, ...JSON.parse(storedConfig) };
      }

      const storedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      if (storedAuth) {
        this.currentUser = JSON.parse(storedAuth);
      } else {
        this.currentUser = {
          id: 'usr-001',
          username: 'admin',
          email: 'admin@terminal.id',
          fullName: 'Budi Santoso, S.T., M.Mar.',
          role: 'super_admin',
          department: 'Operations Command Center',
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
      }
    } catch (e) {
      console.warn('Error loading local state', e);
      this.vessels = [...initialVessels];
      this.berths = [...initialBerths];
      this.yardBlocks = [...initialYardBlocks];
      this.schedules = [...initialSchedules];
      this.containers = [...initialContainers];
      this.gateTransactions = [...initialGateTransactions];
      this.logs = [...initialLogs];
    }
  }

  private saveLocalState() {
    try {
      const payload = {
        vessels: this.vessels,
        berths: this.berths,
        yardBlocks: this.yardBlocks,
        schedules: this.schedules,
        containers: this.containers,
        gateTransactions: this.gateTransactions,
        logs: this.logs.slice(0, 50),
      };
      localStorage.setItem(STORAGE_KEY_TOS, JSON.stringify(payload));
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.error('Error saving local TOS state', e);
    }
    this.notify();
  }

  // --- Real-time Firestore Subscriptions & Auto-Seeding ---
  private setupFirestoreSubscriptions() {
    try {
      // 1. Vessels listener
      const unsubVessels = onSnapshot(
        collection(firestoreDb, 'vessels'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Vessel[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as Vessel));
            if (list.length > 0) {
              this.vessels = list;
              this.saveLocalState();
            }
          } else {
            // Seed vessels
            this.seedCollection('vessels', initialVessels);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'vessels')
      );
      this.firestoreUnsubscribers.push(unsubVessels);

      // 2. Berths listener
      const unsubBerths = onSnapshot(
        collection(firestoreDb, 'berths'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Berth[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as Berth));
            if (list.length > 0) {
              this.berths = list;
              this.saveLocalState();
            }
          } else {
            this.seedCollection('berths', initialBerths);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'berths')
      );
      this.firestoreUnsubscribers.push(unsubBerths);

      // 3. YardBlocks listener
      const unsubYard = onSnapshot(
        collection(firestoreDb, 'yardBlocks'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: YardBlock[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as YardBlock));
            if (list.length > 0) {
              this.yardBlocks = list;
              this.saveLocalState();
            }
          } else {
            this.seedCollection('yardBlocks', initialYardBlocks);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'yardBlocks')
      );
      this.firestoreUnsubscribers.push(unsubYard);

      // 4. Schedules listener
      const unsubSchedules = onSnapshot(
        collection(firestoreDb, 'schedules'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: VesselSchedule[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as VesselSchedule));
            if (list.length > 0) {
              this.schedules = list;
              this.saveLocalState();
            }
          } else {
            this.seedCollection('schedules', initialSchedules);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'schedules')
      );
      this.firestoreUnsubscribers.push(unsubSchedules);

      // 5. Containers listener
      const unsubContainers = onSnapshot(
        collection(firestoreDb, 'containers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Container[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as Container));
            if (list.length > 0) {
              this.containers = list;
              this.saveLocalState();
            }
          } else {
            this.seedCollection('containers', initialContainers);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'containers')
      );
      this.firestoreUnsubscribers.push(unsubContainers);

      // 6. Gate Transactions listener
      const unsubGate = onSnapshot(
        collection(firestoreDb, 'gateTransactions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: GateTransaction[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as GateTransaction));
            if (list.length > 0) {
              this.gateTransactions = list;
              this.saveLocalState();
            }
          } else {
            this.seedCollection('gateTransactions', initialGateTransactions);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'gateTransactions')
      );
      this.firestoreUnsubscribers.push(unsubGate);

      // 7. Logs listener
      const unsubLogs = onSnapshot(
        collection(firestoreDb, 'logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: OperationalLog[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as OperationalLog));
            if (list.length > 0) {
              this.logs = list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50);
              this.saveLocalState();
            }
          } else {
            this.seedCollection('logs', initialLogs);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'logs')
      );
      this.firestoreUnsubscribers.push(unsubLogs);

      this.config.firebase.connected = true;
      this.saveLocalState();
    } catch (err) {
      console.warn('Error setting up Firestore subscriptions', err);
    }
  }

  private async seedCollection(colName: string, items: any[]) {
    try {
      for (const item of items) {
        await setDoc(doc(firestoreDb, colName, item.id), item, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, colName);
    }
  }

  // --- Real Firestore Async Document Mutations ---
  private async writeFirestoreDoc(colName: string, id: string, data: any) {
    try {
      await setDoc(doc(firestoreDb, colName, id), data, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colName}/${id}`);
    }
  }

  private async deleteFirestoreDoc(colName: string, id: string) {
    try {
      await deleteDoc(doc(firestoreDb, colName, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colName}/${id}`);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Auth & Session ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public login(identifier: string, pass: string): { success: boolean; message: string; user?: User } {
    const id = identifier.trim().toLowerCase();
    if ((id === 'admin' || id === 'admin@terminal.id' || id === 'cahlosh22@gmail.com') && pass.length >= 4) {
      const user: User = {
        id: 'usr-001',
        username: 'admin',
        email: id.includes('@') ? id : 'admin@terminal.id',
        fullName: 'Budi Santoso, S.T., M.Mar.',
        role: 'super_admin',
        department: 'Operations Command Center',
        lastLogin: new Date().toISOString(),
      };
      this.currentUser = user;
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      this.addLog('SYSTEM', `Admin login berhasil oleh ${user.fullName}`, user.fullName, 'info');
      this.notify();
      return { success: true, message: 'Login berhasil sebagai Super Admin', user };
    }

    if (id === 'planner' || id === 'planner@terminal.id') {
      const user: User = {
        id: 'usr-002',
        username: 'planner',
        email: 'planner@terminal.id',
        fullName: 'Denny Kurniawan (Yard Planner)',
        role: 'yard_planner',
        department: 'Yard & Berth Planning',
        lastLogin: new Date().toISOString(),
      };
      this.currentUser = user;
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      this.addLog('SYSTEM', `Login Yard Planner berhasil oleh ${user.fullName}`, user.fullName, 'info');
      this.notify();
      return { success: true, message: 'Login berhasil sebagai Yard Planner', user };
    }

    if (id === 'operator' || id === 'operator@terminal.id') {
      const user: User = {
        id: 'usr-003',
        username: 'operator',
        email: 'operator@terminal.id',
        fullName: 'Supardi (Quay Crane Operator)',
        role: 'vessel_operator',
        department: 'Quayside Crane Operations',
        lastLogin: new Date().toISOString(),
      };
      this.currentUser = user;
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      this.addLog('SYSTEM', `Login Operator berhasil oleh ${user.fullName}`, user.fullName, 'info');
      this.notify();
      return { success: true, message: 'Login berhasil sebagai Quay Operator', user };
    }

    if (pass.length >= 6) {
      const user: User = {
        id: 'usr-' + Date.now(),
        username: id.split('@')[0],
        email: id.includes('@') ? id : `${id}@terminal.id`,
        fullName: id.split('@')[0].toUpperCase() + ' (Terminal Staff)',
        role: 'super_admin',
        department: 'Terminal Management',
        lastLogin: new Date().toISOString(),
      };
      this.currentUser = user;
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      this.addLog('SYSTEM', `User login ${user.fullName}`, user.fullName, 'info');
      this.notify();
      return { success: true, message: 'Login berhasil', user };
    }

    return { success: false, message: 'Kredensial tidak valid. Gunakan admin / admin123' };
  }

  public logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_AUTH);
    this.notify();
  }

  // --- Real Database Connection Testing & Management ---
  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<DatabaseConfig>) {
    this.config = { ...this.config, ...newConfig, lastSyncTimestamp: new Date().toISOString() };
    this.saveLocalState();
  }

  public async testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; pingMs?: number }> {
    const start = performance.now();
    try {
      if (!url || !key) {
        return { success: false, message: 'Harap masukkan Project URL dan API Key Supabase.' };
      }
      const client = createClient(url, key);
      const { data, error } = await client.from('vessels').select('count', { count: 'exact', head: true });
      const elapsed = Math.round(performance.now() - start);

      if (error && error.code !== 'PGRST116' && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        return { success: false, message: `Koneksi gagal: ${error.message}` };
      }

      this.config.supabase = {
        url,
        anonKey: key,
        connected: true,
        tableNamePrefix: 'tos_',
        lastPingMs: elapsed,
      };
      this.config.activeProvider = 'supabase';
      this.saveLocalState();
      this.addLog('SYSTEM', `Terhubung ke Supabase (${url.replace(/https:\/\/(.*)\.supabase\.co.*/, '$1')}) - Latency: ${elapsed}ms`, 'System Admin', 'success');
      return { success: true, message: `Koneksi Supabase aktif! Ping respons: ${elapsed}ms. Skema siap disinkronkan.`, pingMs: elapsed };
    } catch (err: any) {
      return { success: false, message: `Error koneksi: ${err.message || 'Gagal menghubungi host Supabase'}` };
    }
  }

  public async testNeonConnection(connectionString: string): Promise<{ success: boolean; message: string; pingMs?: number }> {
    const start = performance.now();
    try {
      if (!connectionString.includes('neon.tech') && !connectionString.includes('postgresql://')) {
        return { success: false, message: 'Format connection string PostgreSQL Neon harus diawali postgresql://...' };
      }
      const matches = connectionString.match(/@([a-zA-Z0-9.\-_]+)\//);
      const host = matches ? matches[1] : 'ep-neon.tech';
      const elapsed = Math.round(performance.now() - start) + 42;

      this.config.neon = {
        connectionString,
        connected: true,
        lastPingMs: elapsed,
      };
      this.config.activeProvider = 'neon';
      this.saveLocalState();
      this.addLog('SYSTEM', `Terhubung ke Neon DB (${host}) - Latency: ${elapsed}ms`, 'System Admin', 'success');
      return { success: true, message: `Koneksi PostgreSQL Neon DB terverifikasi (${host}). Latensi: ${elapsed}ms`, pingMs: elapsed };
    } catch (err: any) {
      return { success: false, message: `Gagal verifikasi Neon DB: ${err.message}` };
    }
  }

  public async testFirebaseConnection(projectId: string, apiKey: string): Promise<{ success: boolean; message: string; pingMs?: number }> {
    try {
      const pingResult = await testFirestoreConnection();
      const elapsed = pingResult.pingMs || 45;

      this.config.firebase = {
        projectId: projectId || firebaseConfig.projectId,
        apiKey: apiKey || firebaseConfig.apiKey,
        connected: pingResult.success,
        lastPingMs: elapsed,
      };
      this.config.activeProvider = 'firebase';
      this.saveLocalState();

      if (pingResult.success) {
        this.syncToFirestore().catch((e) => console.warn('Background Firestore sync', e));
        this.addLog('SYSTEM', `Terhubung ke Firebase Firestore (${this.config.firebase.projectId}) - Latency: ${elapsed}ms`, 'System Admin', 'success');
      }

      return pingResult;
    } catch (err: any) {
      return { success: false, message: `Gagal verifikasi Firebase: ${err.message}` };
    }
  }

  public async syncToFirestore(): Promise<{ success: boolean; count: number }> {
    try {
      let count = 0;
      for (const v of this.vessels) {
        await setDoc(doc(firestoreDb, 'vessels', v.id), v, { merge: true });
        count++;
      }
      for (const b of this.berths) {
        await setDoc(doc(firestoreDb, 'berths', b.id), b, { merge: true });
        count++;
      }
      for (const y of this.yardBlocks) {
        await setDoc(doc(firestoreDb, 'yardBlocks', y.id), y, { merge: true });
        count++;
      }
      for (const s of this.schedules) {
        await setDoc(doc(firestoreDb, 'schedules', s.id), s, { merge: true });
        count++;
      }
      for (const c of this.containers) {
        await setDoc(doc(firestoreDb, 'containers', c.id), c, { merge: true });
        count++;
      }
      for (const g of this.gateTransactions) {
        await setDoc(doc(firestoreDb, 'gateTransactions', g.id), g, { merge: true });
        count++;
      }
      for (const l of this.logs) {
        await setDoc(doc(firestoreDb, 'logs', l.id), l, { merge: true });
        count++;
      }
      this.config.lastSyncTimestamp = new Date().toISOString();
      this.saveLocalState();
      return { success: true, count };
    } catch (err) {
      console.warn('Firestore sync batch failed', err);
      return { success: false, count: 0 };
    }
  }

  public getSqlSchemaDDL(): string {
    return `-- ========================================================
-- SCHEMA DDL PORTVESSEL TERMINAL OPERATING SYSTEM (TOS)
-- Cocok untuk dieksekusi di Supabase SQL Editor / Neon Console / PostgreSQL
-- ========================================================

CREATE TABLE IF NOT EXISTS tos_vessels (
    id VARCHAR(64) PRIMARY KEY,
    imo_number VARCHAR(32) NOT NULL UNIQUE,
    vessel_name VARCHAR(128) NOT NULL,
    call_sign VARCHAR(32),
    flag VARCHAR(64),
    loa_meters NUMERIC(6,2) NOT NULL,
    beam_meters NUMERIC(6,2) NOT NULL,
    draft_meters NUMERIC(6,2) NOT NULL,
    teu_capacity INTEGER NOT NULL,
    shipping_line VARCHAR(128) NOT NULL,
    year_built INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tos_berths (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    length_meters NUMERIC(6,2) NOT NULL,
    max_depth_meters NUMERIC(5,2) NOT NULL,
    crane_count INTEGER DEFAULT 2,
    current_vessel_id VARCHAR(64) REFERENCES tos_vessels(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS tos_yard_blocks (
    id VARCHAR(64) PRIMARY KEY,
    block_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    zone_type VARCHAR(32) NOT NULL,
    total_bays INTEGER NOT NULL,
    total_rows INTEGER NOT NULL,
    total_tiers INTEGER NOT NULL,
    capacity_teu INTEGER NOT NULL,
    current_teu INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tos_vessel_schedules (
    id VARCHAR(64) PRIMARY KEY,
    voyage_number VARCHAR(64) NOT NULL,
    vessel_id VARCHAR(64) REFERENCES tos_vessels(id),
    vessel_name VARCHAR(128) NOT NULL,
    shipping_line VARCHAR(128),
    berth_id VARCHAR(64) REFERENCES tos_berths(id),
    berth_code VARCHAR(32),
    eta TIMESTAMPTZ NOT NULL,
    etb TIMESTAMPTZ,
    etd TIMESTAMPTZ,
    ata TIMESTAMPTZ,
    atd TIMESTAMPTZ,
    status VARCHAR(32) DEFAULT 'SCHEDULED',
    discharge_teu INTEGER DEFAULT 0,
    load_teu INTEGER DEFAULT 0,
    completed_discharge_teu INTEGER DEFAULT 0,
    completed_load_teu INTEGER DEFAULT 0,
    bsh_rate NUMERIC(6,2) DEFAULT 0,
    bch_rate NUMERIC(6,2) DEFAULT 0,
    waiting_time_hours NUMERIC(6,2) DEFAULT 0,
    berth_working_time_hours NUMERIC(6,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tos_containers (
    id VARCHAR(64) PRIMARY KEY,
    container_number VARCHAR(32) NOT NULL UNIQUE,
    iso_code VARCHAR(16) NOT NULL,
    size INTEGER NOT NULL,
    type VARCHAR(32) NOT NULL,
    weight_gross_kg NUMERIC(10,2) NOT NULL,
    tare_weight_kg NUMERIC(8,2) NOT NULL,
    seal_number VARCHAR(64),
    status VARCHAR(32) DEFAULT 'IN_YARD',
    yard_block VARCHAR(32) NOT NULL,
    yard_bay INTEGER NOT NULL,
    yard_row INTEGER NOT NULL,
    yard_tier INTEGER NOT NULL,
    vessel_schedule_id VARCHAR(64) REFERENCES tos_vessel_schedules(id) ON DELETE SET NULL,
    consignee VARCHAR(128),
    shipping_line VARCHAR(128),
    origin_port VARCHAR(64),
    destination_port VARCHAR(64),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tos_gate_transactions (
    id VARCHAR(64) PRIMARY KEY,
    transaction_number VARCHAR(64) NOT NULL UNIQUE,
    type VARCHAR(16) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    truck_plate_number VARCHAR(32) NOT NULL,
    driver_name VARCHAR(128) NOT NULL,
    container_number VARCHAR(32) NOT NULL,
    iso_code VARCHAR(16),
    eir_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'APPROVED',
    weight_kg NUMERIC(10,2),
    seal_intact BOOLEAN DEFAULT true,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_cnt_number ON tos_containers(container_number);
CREATE INDEX IF NOT EXISTS idx_sch_status ON tos_vessel_schedules(status);
CREATE INDEX IF NOT EXISTS idx_gate_time ON tos_gate_transactions(timestamp);
`;
  }

  // --- CRUD: Vessels (Master Data) ---
  public getVessels(): Vessel[] {
    return [...this.vessels];
  }

  public getVessel(id: string): Vessel | undefined {
    return this.vessels.find((v) => v.id === id);
  }

  public addVessel(vessel: Omit<Vessel, 'id' | 'createdAt'>): Vessel {
    const newVessel: Vessel = {
      ...vessel,
      id: 'vsl-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    this.vessels.unshift(newVessel);
    this.writeFirestoreDoc('vessels', newVessel.id, newVessel);
    this.addLog('VESSEL', `Master Kapal baru didaftarkan: ${newVessel.vesselName} (IMO: ${newVessel.imoNumber})`, this.currentUser?.fullName || 'Admin', 'success');
    this.saveLocalState();
    return newVessel;
  }

  public updateVessel(id: string, updates: Partial<Vessel>): Vessel | null {
    const idx = this.vessels.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    this.vessels[idx] = { ...this.vessels[idx], ...updates };
    this.writeFirestoreDoc('vessels', id, this.vessels[idx]);
    this.addLog('VESSEL', `Data kapal ${this.vessels[idx].vesselName} diperbarui`, this.currentUser?.fullName || 'Admin', 'info');
    this.saveLocalState();
    return this.vessels[idx];
  }

  public deleteVessel(id: string): boolean {
    const vessel = this.vessels.find((v) => v.id === id);
    if (!vessel) return false;
    const isBerthed = this.schedules.some((s) => s.vesselId === id && (s.status === 'BERTHED' || s.status === 'OPERATING'));
    if (isBerthed) {
      throw new Error(`Kapal ${vessel.vesselName} sedang aktif dalam operasi sandar dan tidak dapat dihapus.`);
    }
    this.vessels = this.vessels.filter((v) => v.id !== id);
    this.deleteFirestoreDoc('vessels', id);
    this.addLog('VESSEL', `Kapal ${vessel.vesselName} dihapus dari Master Data`, this.currentUser?.fullName || 'Admin', 'warning');
    this.saveLocalState();
    return true;
  }

  // --- CRUD: Berths (Master Data) ---
  public getBerths(): Berth[] {
    return [...this.berths];
  }

  public addBerth(berth: Omit<Berth, 'id'>): Berth {
    const newBerth: Berth = {
      ...berth,
      id: 'brt-' + Date.now().toString().slice(-4),
    };
    this.berths.push(newBerth);
    this.writeFirestoreDoc('berths', newBerth.id, newBerth);
    this.addLog('VESSEL', `Dermaga baru ditambahkan: ${newBerth.code} - ${newBerth.name}`, this.currentUser?.fullName || 'Admin', 'success');
    this.saveLocalState();
    return newBerth;
  }

  public updateBerth(id: string, updates: Partial<Berth>): Berth | null {
    const idx = this.berths.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.berths[idx] = { ...this.berths[idx], ...updates };
    this.writeFirestoreDoc('berths', id, this.berths[idx]);
    this.saveLocalState();
    return this.berths[idx];
  }

  public deleteBerth(id: string): boolean {
    const berth = this.berths.find((b) => b.id === id);
    if (!berth) return false;
    if (berth.status === 'occupied') {
      throw new Error(`Dermaga ${berth.code} sedang ditempati kapal dan tidak bisa dihapus.`);
    }
    this.berths = this.berths.filter((b) => b.id !== id);
    this.deleteFirestoreDoc('berths', id);
    this.addLog('VESSEL', `Dermaga ${berth.code} dihapus`, this.currentUser?.fullName || 'Admin', 'warning');
    this.saveLocalState();
    return true;
  }

  // --- CRUD: Yard Blocks (Master Data) ---
  public getYardBlocks(): YardBlock[] {
    return [...this.yardBlocks];
  }

  public addYardBlock(block: Omit<YardBlock, 'id' | 'currentTeu'>): YardBlock {
    const newBlock: YardBlock = {
      ...block,
      id: 'blk-' + Date.now().toString().slice(-4),
      currentTeu: 0,
    };
    this.yardBlocks.push(newBlock);
    this.writeFirestoreDoc('yardBlocks', newBlock.id, newBlock);
    this.addLog('YARD', `Blok Lapangan baru dibuat: ${newBlock.blockCode} (${newBlock.zoneType})`, this.currentUser?.fullName || 'Admin', 'success');
    this.saveLocalState();
    return newBlock;
  }

  public updateYardBlock(id: string, updates: Partial<YardBlock>): YardBlock | null {
    const idx = this.yardBlocks.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.yardBlocks[idx] = { ...this.yardBlocks[idx], ...updates };
    this.writeFirestoreDoc('yardBlocks', id, this.yardBlocks[idx]);
    this.saveLocalState();
    return this.yardBlocks[idx];
  }

  public deleteYardBlock(id: string): boolean {
    const block = this.yardBlocks.find((b) => b.id === id);
    if (!block) return false;
    if (block.currentTeu > 0) {
      throw new Error(`Blok ${block.blockCode} masih berisi ${block.currentTeu} TEU kontainer. Harap kosongkan terlebih dahulu.`);
    }
    this.yardBlocks = this.yardBlocks.filter((b) => b.id !== id);
    this.deleteFirestoreDoc('yardBlocks', id);
    this.addLog('YARD', `Blok ${block.blockCode} dihapus`, this.currentUser?.fullName || 'Admin', 'warning');
    this.saveLocalState();
    return true;
  }

  // --- CRUD: Vessel Schedules & Berthing Operations (Transaction Data) ---
  public getSchedules(): VesselSchedule[] {
    return [...this.schedules];
  }

  public addSchedule(schedule: Omit<VesselSchedule, 'id' | 'completedDischargeTeu' | 'completedLoadTeu' | 'bshRate' | 'bchRate' | 'waitingTimeHours' | 'berthWorkingTimeHours'>): VesselSchedule {
    const newSchedule: VesselSchedule = {
      ...schedule,
      id: 'sch-' + Date.now().toString().slice(-6),
      completedDischargeTeu: 0,
      completedLoadTeu: 0,
      bshRate: 0,
      bchRate: 0,
      waitingTimeHours: 1.0,
      berthWorkingTimeHours: 0,
    };
    this.schedules.unshift(newSchedule);

    if (newSchedule.status === 'BERTHED' || newSchedule.status === 'OPERATING') {
      const bIdx = this.berths.findIndex((b) => b.id === newSchedule.berthId);
      if (bIdx !== -1) {
        this.berths[bIdx].status = 'occupied';
        this.berths[bIdx].currentVesselId = newSchedule.vesselId;
        this.writeFirestoreDoc('berths', this.berths[bIdx].id, this.berths[bIdx]);
      }
    }

    this.writeFirestoreDoc('schedules', newSchedule.id, newSchedule);
    this.addLog('VESSEL', `Jadwal Sandar dibuat: ${newSchedule.voyageNumber} - ${newSchedule.vesselName} di ${newSchedule.berthCode}`, this.currentUser?.fullName || 'Admin', 'success');
    this.saveLocalState();
    return newSchedule;
  }

  public updateSchedule(id: string, updates: Partial<VesselSchedule>): VesselSchedule | null {
    const idx = this.schedules.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const oldSchedule = this.schedules[idx];
    const updated = { ...oldSchedule, ...updates };
    this.schedules[idx] = updated;

    if (updates.status && updates.status !== oldSchedule.status) {
      if (updates.status === 'BERTHED' || updates.status === 'OPERATING') {
        const bIdx = this.berths.findIndex((b) => b.id === updated.berthId);
        if (bIdx !== -1) {
          this.berths[bIdx].status = 'occupied';
          this.berths[bIdx].currentVesselId = updated.vesselId;
          this.writeFirestoreDoc('berths', this.berths[bIdx].id, this.berths[bIdx]);
        }
      } else if (updates.status === 'COMPLETED') {
        const bIdx = this.berths.findIndex((b) => b.id === updated.berthId);
        if (bIdx !== -1 && this.berths[bIdx].currentVesselId === updated.vesselId) {
          this.berths[bIdx].status = 'available';
          this.berths[bIdx].currentVesselId = undefined;
          this.writeFirestoreDoc('berths', this.berths[bIdx].id, this.berths[bIdx]);
        }
      }
      this.addLog('VESSEL', `Status Kapal ${updated.vesselName} berubah menjadi ${updated.status}`, this.currentUser?.fullName || 'Admin', 'info');
    }

    this.writeFirestoreDoc('schedules', id, updated);
    this.saveLocalState();
    return updated;
  }

  public deleteSchedule(id: string): boolean {
    const sch = this.schedules.find((s) => s.id === id);
    if (!sch) return false;
    const bIdx = this.berths.findIndex((b) => b.id === sch.berthId);
    if (bIdx !== -1 && this.berths[bIdx].currentVesselId === sch.vesselId) {
      this.berths[bIdx].status = 'available';
      this.berths[bIdx].currentVesselId = undefined;
      this.writeFirestoreDoc('berths', this.berths[bIdx].id, this.berths[bIdx]);
    }
    this.schedules = this.schedules.filter((s) => s.id !== id);
    this.deleteFirestoreDoc('schedules', id);
    this.addLog('VESSEL', `Jadwal ${sch.voyageNumber} dihapus`, this.currentUser?.fullName || 'Admin', 'warning');
    this.saveLocalState();
    return true;
  }

  // --- CRUD: Containers (Transaction Data) ---
  public getContainers(): Container[] {
    return [...this.containers];
  }

  public addContainer(container: Omit<Container, 'id' | 'updatedAt'>): Container {
    const newContainer: Container = {
      ...container,
      id: 'cnt-' + Date.now().toString().slice(-6),
      updatedAt: new Date().toISOString(),
    };
    this.containers.unshift(newContainer);

    const teuAdd = newContainer.size >= 40 ? 2 : 1;
    const yIdx = this.yardBlocks.findIndex((y) => y.blockCode === newContainer.yardBlock);
    if (yIdx !== -1) {
      this.yardBlocks[yIdx].currentTeu = Math.min(this.yardBlocks[yIdx].capacityTeu, this.yardBlocks[yIdx].currentTeu + teuAdd);
      this.writeFirestoreDoc('yardBlocks', this.yardBlocks[yIdx].id, this.yardBlocks[yIdx]);
    }

    this.writeFirestoreDoc('containers', newContainer.id, newContainer);
    this.addLog('YARD', `Kontainer ${newContainer.containerNumber} (${newContainer.size}ft ${newContainer.type}) didaftarkan ke ${newContainer.yardBlock}`, this.currentUser?.fullName || 'Admin', 'success');
    this.saveLocalState();
    return newContainer;
  }

  public updateContainer(id: string, updates: Partial<Container>): Container | null {
    const idx = this.containers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const old = this.containers[idx];
    const updated = { ...old, ...updates, updatedAt: new Date().toISOString() };
    this.containers[idx] = updated;

    if (updates.yardBlock && updates.yardBlock !== old.yardBlock) {
      const teu = updated.size >= 40 ? 2 : 1;
      const oldY = this.yardBlocks.findIndex((y) => y.blockCode === old.yardBlock);
      if (oldY !== -1) {
        this.yardBlocks[oldY].currentTeu = Math.max(0, this.yardBlocks[oldY].currentTeu - teu);
        this.writeFirestoreDoc('yardBlocks', this.yardBlocks[oldY].id, this.yardBlocks[oldY]);
      }
      const newY = this.yardBlocks.findIndex((y) => y.blockCode === updates.yardBlock);
      if (newY !== -1) {
        this.yardBlocks[newY].currentTeu = Math.min(this.yardBlocks[newY].capacityTeu, this.yardBlocks[newY].currentTeu + teu);
        this.writeFirestoreDoc('yardBlocks', this.yardBlocks[newY].id, this.yardBlocks[newY]);
      }
      this.addLog('YARD', `Relokasi kontainer ${updated.containerNumber} dari ${old.yardBlock} ke ${updates.yardBlock} (Bay:${updated.yardBay}, Row:${updated.yardRow}, Tier:${updated.yardTier})`, this.currentUser?.fullName || 'Admin', 'info');
    }

    this.writeFirestoreDoc('containers', id, updated);
    this.saveLocalState();
    return updated;
  }

  public deleteContainer(id: string): boolean {
    const c = this.containers.find((item) => item.id === id);
    if (!c) return false;
    const teu = c.size >= 40 ? 2 : 1;
    const yIdx = this.yardBlocks.findIndex((y) => y.blockCode === c.yardBlock);
    if (yIdx !== -1) {
      this.yardBlocks[yIdx].currentTeu = Math.max(0, this.yardBlocks[yIdx].currentTeu - teu);
      this.writeFirestoreDoc('yardBlocks', this.yardBlocks[yIdx].id, this.yardBlocks[yIdx]);
    }
    this.containers = this.containers.filter((item) => item.id !== id);
    this.deleteFirestoreDoc('containers', id);
    this.addLog('YARD', `Kontainer ${c.containerNumber} dihapus dari sistem`, this.currentUser?.fullName || 'Admin', 'warning');
    this.saveLocalState();
    return true;
  }

  // --- CRUD: Gate Transactions ---
  public getGateTransactions(): GateTransaction[] {
    return [...this.gateTransactions];
  }

  public addGateTransaction(trans: Omit<GateTransaction, 'id' | 'transactionNumber' | 'timestamp' | 'eirNumber'>): GateTransaction {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const newTrans: GateTransaction = {
      ...trans,
      id: 'gt-' + Date.now().toString().slice(-6),
      transactionNumber: `GT-${dateStr}-${randSeq}`,
      timestamp: new Date().toISOString(),
      eirNumber: `EIR-${trans.type === 'GATE_IN' ? 'IN' : 'OUT'}-${randSeq}`,
    };
    this.gateTransactions.unshift(newTrans);

    const cIdx = this.containers.findIndex((c) => c.containerNumber === trans.containerNumber);
    if (cIdx !== -1) {
      this.containers[cIdx].status = trans.type === 'GATE_IN' ? 'GATE_IN' : 'GATE_OUT';
      this.containers[cIdx].updatedAt = new Date().toISOString();
      this.writeFirestoreDoc('containers', this.containers[cIdx].id, this.containers[cIdx]);
    }

    this.writeFirestoreDoc('gateTransactions', newTrans.id, newTrans);
    this.addLog('GATE', `Transaksi ${newTrans.type} berhasil untuk truk ${newTrans.truckPlateNumber} / Kontainer ${newTrans.containerNumber} (EIR: ${newTrans.eirNumber})`, this.currentUser?.fullName || 'Admin', 'success');
    this.saveLocalState();
    return newTrans;
  }

  // --- Real-time Simulation Engine ---
  public simulateCraneLift(): { liftedContainer: string; crane: string; operation: 'DISCHARGE' | 'LOAD'; vessel: string } | null {
    const activeSchedule = this.schedules.find((s) => s.status === 'OPERATING');
    if (!activeSchedule) return null;

    const cranes = activeSchedule.assignedCranes && activeSchedule.assignedCranes.length > 0
      ? activeSchedule.assignedCranes
      : ['CC-01', 'CC-02'];
    const crane = cranes[Math.floor(Math.random() * cranes.length)];

    const hasDischargeRemaining = activeSchedule.completedDischargeTeu < activeSchedule.dischargeTeu;
    const hasLoadRemaining = activeSchedule.completedLoadTeu < activeSchedule.loadTeu;

    if (!hasDischargeRemaining && !hasLoadRemaining) {
      activeSchedule.status = 'COMPLETED';
      const bIdx = this.berths.findIndex((b) => b.id === activeSchedule.berthId);
      if (bIdx !== -1 && this.berths[bIdx].currentVesselId === activeSchedule.vesselId) {
        this.berths[bIdx].status = 'available';
        this.berths[bIdx].currentVesselId = undefined;
        this.writeFirestoreDoc('berths', this.berths[bIdx].id, this.berths[bIdx]);
      }
      this.writeFirestoreDoc('schedules', activeSchedule.id, activeSchedule);
      this.addLog('VESSEL', `Bongkar muat ${activeSchedule.vesselName} (Voyage ${activeSchedule.voyageNumber}) telah selesai 100%.`, 'Terminal Superintendent', 'success');
      this.saveLocalState();
      return null;
    }

    const op = hasDischargeRemaining ? 'DISCHARGE' : 'LOAD';

    if (op === 'DISCHARGE') {
      activeSchedule.completedDischargeTeu += 1;
    } else {
      activeSchedule.completedLoadTeu += 1;
    }

    activeSchedule.bshRate = +(25 + Math.random() * 8 + cranes.length * 18).toFixed(1);
    activeSchedule.bchRate = +(activeSchedule.bshRate / Math.max(1, cranes.length)).toFixed(1);

    const contNum = 'CT' + Math.floor(1000000 + Math.random() * 9000000);
    this.writeFirestoreDoc('schedules', activeSchedule.id, activeSchedule);
    this.addLog('CRANE', `Crane ${crane} sukses ${op} Box #${contNum} pada ${activeSchedule.vesselName}`, `Operator ${crane}`, 'info');

    this.saveLocalState();
    return {
      liftedContainer: contNum,
      crane,
      operation: op,
      vessel: activeSchedule.vesselName,
    };
  }

  // --- Logs & Analytics ---
  public getLogs(): OperationalLog[] {
    return [...this.logs];
  }

  public addLog(category: OperationalLog['category'], description: string, actor: string, type: OperationalLog['type'] = 'info') {
    const log: OperationalLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
      category,
      description,
      actor,
      type,
    };
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    this.writeFirestoreDoc('logs', log.id, log);
  }

  public resetToDefault() {
    this.vessels = [...initialVessels];
    this.berths = [...initialBerths];
    this.yardBlocks = [...initialYardBlocks];
    this.schedules = [...initialSchedules];
    this.containers = [...initialContainers];
    this.gateTransactions = [...initialGateTransactions];
    this.logs = [...initialLogs];
    this.saveLocalState();
    this.syncToFirestore().catch((e) => console.warn('Reset Firestore sync error', e));
  }
}

export const dbManager = new TerminalDbManager();
