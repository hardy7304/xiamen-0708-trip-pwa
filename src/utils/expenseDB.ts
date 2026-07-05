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
  photoBase64?: string;   // legacy — kept for display
  photoKey?: string;       // R2 key
  createdAt: string;
}

const DB_NAME = 'xiamen-trip-db';
const DB_VERSION = 2;  // bumped from 1
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

/** Migrate old records on load */
export function migrateRecord(record: any): ExpenseRecord {
  // If already has new fields, return as-is
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
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error('addExpense error:', e); throw e; }
}

export async function putExpense(record: ExpenseRecord): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error('putExpense error:', e); throw e; }
}

export async function addExpenses(records: ExpenseRecord[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      records.forEach(r => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { console.error('addExpenses error:', e); throw e; }
}

export async function getAllExpenses(): Promise<ExpenseRecord[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).map(migrateRecord));
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error('getAllExpenses error:', e); return []; }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error('deleteExpense error:', e); throw e; }
}