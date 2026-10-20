import { FiberNode, Condominium } from '../data/crData';

const DB_NAME = 'FibraCR_DB';
const STORE_NAME = 'network_cache';
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveCachedData(nodes: FiberNode[], condos: Condominium[], fileName: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(nodes, 'nodes');
      store.put(condos, 'condos');
      store.put(fileName, 'fileName');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error("IndexedDB save error:", err);
  }
}

export async function getCachedData(): Promise<{ nodes: FiberNode[]; condos: Condominium[]; fileName: string | null } | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const nodesReq = store.get('nodes');
      const condosReq = store.get('condos');
      const fileReq = store.get('fileName');

      transaction.oncomplete = () => {
        if (nodesReq.result && condosReq.result) {
          resolve({
            nodes: nodesReq.result,
            condos: condosReq.result,
            fileName: fileReq.result || null,
          });
        } else {
          resolve(null);
        }
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error("IndexedDB get error:", err);
    return null;
  }
}
