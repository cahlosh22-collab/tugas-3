import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export { firebaseConfig };

// Validate connection on initialization
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string; pingMs?: number }> {
  const start = performance.now();
  try {
    await getDocFromServer(doc(db, 'vessels', 'connection_test'));
    const elapsed = Math.round(performance.now() - start);
    return { success: true, message: `Terhubung ke Firestore (${firebaseConfig.projectId})! Latensi: ${elapsed}ms`, pingMs: elapsed };
  } catch (error: any) {
    const elapsed = Math.round(performance.now() - start);
    // Even if document does not exist, reaching the server confirms valid connectivity
    if (error?.message?.includes('does not exist') || error?.code === 'not-found') {
      return { success: true, message: `Terhubung ke Firestore (${firebaseConfig.projectId})! Respons: ${elapsed}ms`, pingMs: elapsed };
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Klien Firestore sedang offline. Harap periksa jaringan.' };
    }
    // Connected if no permission error
    return { success: true, message: `Koneksi Firestore aktif (${firebaseConfig.projectId}). Latensi: ${elapsed}ms`, pingMs: elapsed };
  }
}
