import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Operation Types for Hardened Error Reporting
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot (from SKILL.md)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Conexión activa con Cloud Firestore.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] El cliente está en modo offline o sin red.');
      return false;
    }
    // Permissions error on /test/connection is normal if read rules don't permit it, but client is online
    console.log('[Firebase] Verificación de red exitosa.');
    return true;
  }
}

// Synchronize or create user profile in /users/{userId}
export async function syncUserProfile(user: FirebaseUser) {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Usuario ADN',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('[Firebase] Perfil de usuario creado con éxito.');
    } else {
      // Update display name or photo if modified
      await setDoc(userRef, {
        displayName: user.displayName || snap.data()?.displayName || 'Usuario ADN',
        photoURL: user.photoURL || snap.data()?.photoURL || '',
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Save validation evaluation record
export interface ValidationRecordData {
  id?: string;
  ticketId: string;
  lat: number;
  lng: number;
  status: 'con_cobertura' | 'al_borde' | 'sin_cobertura';
  distanceToNet: number;
  distanceToNode?: number;
  nearestNode?: string;
  nearestLine?: string;
  colloquialAddress?: string;
  clientName?: string;
}

export async function saveValidationRecord(data: ValidationRecordData) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('[Firebase] Usuario no autenticado; registro en memoria local únicamente.');
    return null;
  }

  // Ensure user profile document exists (Master Gate requirement)
  await syncUserProfile(currentUser);

  const validationId = data.id || `val_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const path = `users/${currentUser.uid}/validations/${validationId}`;
  const docRef = doc(db, 'users', currentUser.uid, 'validations', validationId);

  try {
    const payload: Record<string, unknown> = {
      id: validationId,
      userId: currentUser.uid,
      ticketId: data.ticketId.slice(0, 64),
      lat: Number(data.lat),
      lng: Number(data.lng),
      status: data.status,
      distanceToNet: Math.round(Number(data.distanceToNet) * 10) / 10,
      createdAt: serverTimestamp()
    };

    if (data.distanceToNode !== undefined) {
      payload.distanceToNode = Math.round(Number(data.distanceToNode) * 10) / 10;
    }
    if (data.nearestNode) {
      payload.nearestNode = String(data.nearestNode).slice(0, 256);
    }
    if (data.nearestLine) {
      payload.nearestLine = String(data.nearestLine).slice(0, 256);
    }
    if (data.colloquialAddress) {
      payload.colloquialAddress = String(data.colloquialAddress).slice(0, 512);
    }
    if (data.clientName) {
      payload.clientName = String(data.clientName).slice(0, 128);
    }

    await setDoc(docRef, payload);
    console.log('[Firebase] Validación persistida en Firestore:', validationId);
    return validationId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return null;
  }
}

// Save certificate record
export interface CertificateRecordData {
  id?: string;
  ticketId: string;
  clientName?: string;
  lat: number;
  lng: number;
  status: string;
  distanceToNet: number;
  colloquialAddress?: string;
}

export async function saveCertificateRecord(data: CertificateRecordData) {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  await syncUserProfile(currentUser);

  const certId = data.id || `cert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const path = `users/${currentUser.uid}/certificates/${certId}`;
  const docRef = doc(db, 'users', currentUser.uid, 'certificates', certId);

  try {
    const payload: Record<string, unknown> = {
      id: certId,
      userId: currentUser.uid,
      ticketId: data.ticketId.slice(0, 64),
      lat: Number(data.lat),
      lng: Number(data.lng),
      status: String(data.status).slice(0, 64),
      distanceToNet: Math.round(Number(data.distanceToNet) * 10) / 10,
      createdAt: serverTimestamp()
    };

    if (data.clientName) {
      payload.clientName = String(data.clientName).slice(0, 128);
    }
    if (data.colloquialAddress) {
      payload.colloquialAddress = String(data.colloquialAddress).slice(0, 512);
    }

    await setDoc(docRef, payload);
    console.log('[Firebase] Certificado guardado en Firestore:', certId);
    return certId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return null;
  }
}

// Subscribe to real-time user validation history
export function subscribeToUserValidations(
  onUpdate: (validations: any[]) => void,
  onError?: (err: unknown) => void
) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    onUpdate([]);
    return () => {};
  }

  const path = `users/${currentUser.uid}/validations`;
  const q = query(
    collection(db, 'users', currentUser.uid, 'validations'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  );
}

// Google Sign-In with Popup
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (err) {
    console.error('[Firebase Auth] Error durante inicio de sesión con Google:', err);
    throw err;
  }
}

// Sign-Out
export async function signOutUser() {
  try {
    await signOut(auth);
    console.log('[Firebase Auth] Sesión cerrada con éxito.');
  } catch (err) {
    console.error('[Firebase Auth] Error al cerrar sesión:', err);
    throw err;
  }
}

// Boot connection check
testConnection();
