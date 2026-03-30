/**
 * Client-only: persist last successful parse in IndexedDB (not sent to the server).
 */

export type StoredParse = {
  originalName: string;
  parsedText: string;
  savedAt: number;
};

const DB_NAME = "liteparse-ui-v1";
const STORE = "parses";
const LAST_KEY = "last";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as T | undefined);
  });
}

function idbPut<T>(db: IDBDatabase, key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.put(value, key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.delete(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

export async function loadLastParse(): Promise<StoredParse | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    const row = await idbGet<StoredParse>(db, LAST_KEY);
    db.close();
    return row ?? null;
  } catch {
    return null;
  }
}

export async function saveLastParse(data: {
  originalName: string;
  parsedText: string;
}): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const row: StoredParse = {
    ...data,
    savedAt: Date.now(),
  };
  try {
    const db = await openDb();
    await idbPut(db, LAST_KEY, row);
    db.close();
  } catch {
    // ignore quota / private mode
  }
}

export async function clearLastParse(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await idbDelete(db, LAST_KEY);
    db.close();
  } catch {
    // ignore
  }
}
