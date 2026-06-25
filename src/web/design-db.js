const DB_NAME = 'unified_ble_designs_db';
const DB_VERSION = 1;
const STORE_NAME = 'designs';

let openPromise = null;

function openDatabase() {
  if (openPromise) return openPromise;
  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open design database'));
  });
  return openPromise;
}

export async function putDesignRecord(name, record) {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record, name);
    request.onerror = () => reject(request.error || new Error('Failed to save design record'));
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error || new Error('Design database transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('Design database transaction aborted'));
  });
}

export async function getDesignRecord(name) {
  const db = await openDatabase();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(name);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Failed to read design record'));
    tx.onerror = () => reject(tx.error || new Error('Design database transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('Design database transaction aborted'));
  });
}

export async function deleteDesignRecord(name) {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(name);
    request.onerror = () => reject(request.error || new Error('Failed to delete design record'));
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error || new Error('Design database transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('Design database transaction aborted'));
  });
}
