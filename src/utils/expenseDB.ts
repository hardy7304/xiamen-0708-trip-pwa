export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: 'TWD' | 'CNY';
  paidBy: 'me' | 'yiting';
  expenseFor: 'self' | 'shared' | 'yiting';
  paymentMethod: 'cash_cny' | 'wechat' | 'alipay' | 'credit_card' | 'cash_twd' | 'other';
  note?: string;
  photoBase64?: string;
  photoKey?: string;
  createdAt: string;
}

const DB_NAME = 'xiamen-trip-db';
const DB_VERSION = 2;
const STORE_NAME = 'expenses';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
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
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

export async function initDB(): Promise<IDBDatabase> { return getDB(); }

export function migrateRecord(record: any): ExpenseRecord {
  if (record.paidBy && record.expenseFor) return record as ExpenseRecord;
  const oldPayer: string = record.payer || '';
  let paidBy: 'me' | 'yiting' = 'me';
  let expenseFor: 'self' | 'shared' | 'yiting' = 'self';
  if (oldPayer === '我' || oldPayer === 'me') { paidBy = 'me'; expenseFor = 'self'; }
  else if (oldPayer === '妹妹' || oldPayer === '翊婷' || oldPayer === 'yiting') { paidBy = 'yiting'; expenseFor = 'yiting'; }
  else if (oldPayer === '一起' || oldPayer === 'shared') { paidBy = 'me'; expenseFor = 'shared'; }
  return {
    ...record,
    paidBy: record.paidBy || paidBy,
    expenseFor: record.expenseFor || expenseFor,
    paymentMethod: record.paymentMethod || 'cash_cny',
    currency: record.currency === 'RMB' ? 'CNY' : (record.currency || 'CNY'),
  } as ExpenseRecord;
}

export async function addExpense(record: ExpenseRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).add(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function putExpense(record: ExpenseRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Replace ALL local data with KV snapshot */
export async function replaceAllExpenses(records: ExpenseRecord[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Clear all
    const clearReq = store.clear();
    clearReq.onsuccess = () => {
      // Insert fresh data
      records.forEach(r => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    clearReq.onerror = () => reject(clearReq.error);
  });
}

export async function addExpenses(records: ExpenseRecord[]): Promise<void> {
  if (records.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    records.forEach(r => store.put(r));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllExpenses(): Promise<ExpenseRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result || []).map(migrateRecord));
    req.onerror = () => reject(req.error);
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}