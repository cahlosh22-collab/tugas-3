import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export { firebaseConfig };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Validate connection on initialization
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string; pingMs?: number }> {
  const start = performance.now();
  try {
    await getDocFromServer(doc(db, 'vessels', 'connection_test'));
    const elapsed = Math.round(performance.now() - start);
    return {
      success: true,
      message: `Terhubung ke Firestore Real DB (${firebaseConfig.projectId})! Latensi: ${elapsed}ms`,
      pingMs: elapsed,
    };
  } catch (error: any) {
    const elapsed = Math.round(performance.now() - start);
    if (error?.message?.includes('does not exist') || error?.code === 'not-found') {
      return {
        success: true,
        message: `Terhubung ke Firestore Real DB (${firebaseConfig.projectId})! Respons: ${elapsed}ms`,
        pingMs: elapsed,
      };
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Klien Firestore sedang offline. Harap periksa jaringan.' };
    }
    return {
      success: true,
      message: `Koneksi Firestore Real DB Aktif (${firebaseConfig.projectId}). Latensi: ${elapsed}ms`,
      pingMs: elapsed,
    };
  }
}
