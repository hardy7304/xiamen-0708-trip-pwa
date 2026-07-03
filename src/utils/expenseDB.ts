export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: 'TWD' | 'RMB';
  note?: string;
  photoBase64?: string;
  createdAt: string;
}

const DB_NAME = 'xiamen-trip-db';
const DB_VERSION = 1;
const STORE_NAME = 'expenses';

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, mode);
  return tx.objectStore(STORE_NAME);
}

export async function addExpense(record: ExpenseRecord): Promise<void> {
  try {
    const store = await getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('addExpense error:', e);
    throw e;
  }
}

export async function getAllExpenses(): Promise<ExpenseRecord[]> {
  try {
    const store = await getStore('readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('getAllExpenses error:', e);
    return [];
  }
}

export async function updateExpense(id: string, data: Partial<ExpenseRecord>): Promise<void> {
  try {
    const store = await getStore('readwrite');
    const existing = await new Promise<ExpenseRecord>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (!existing) throw new Error('Expense not found');
    const updated = { ...existing, ...data, id };
    return new Promise((resolve, reject) => {
      const req = store.put(updated);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('updateExpense error:', e);
    throw e;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    const store = await getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('deleteExpense error:', e);
    throw e;
  }
}