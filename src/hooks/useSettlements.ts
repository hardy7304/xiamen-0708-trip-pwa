import { useState, useEffect, useCallback } from 'react';
import { getPin } from '../utils/pin';

export interface SettlementRecord {
  id: string;
  from: string;
  to: string;
  currency: 'CNY' | 'TWD';
  amount: number;
  method?: '現金' | '微信' | '支付寶' | '信用卡' | '其他';
  note?: string;
  createdAt: string;
  status: 'settled';
}

const STORE_KEY = 'settlements-local';

function loadLocal(): SettlementRecord[] {
  try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveLocal(data: SettlementRecord[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function useSettlements() {
  const [settlements, setSettlements] = useState<SettlementRecord[]>(() => loadLocal());

  const pullFromKV = useCallback(async () => {
    try {
      const resp = await fetch('/api/settlements');
      const data = await resp.json();
      if (data.settlements !== undefined) {
        setSettlements(data.settlements);
        saveLocal(data.settlements);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { pullFromKV(); }, [pullFromKV]);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') pullFromKV(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pullFromKV]);

  const pushToKV = useCallback(async (records: SettlementRecord[], mode: 'merge' | 'replace' = 'merge') => {
    try {
      await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-trip-pin': getPin() || '' },
        body: JSON.stringify({ settlements: records, mode }),
      });
    } catch { /* ignore */ }
  }, []);

  const addSettlement = useCallback(async (record: SettlementRecord) => {
    const next = [...settlements, record];
    setSettlements(next);
    saveLocal(next);
    await pushToKV([record], 'merge');
    await pullFromKV();
  }, [settlements, pushToKV, pullFromKV]);

  const removeSettlement = useCallback(async (id: string) => {
    const next = settlements.filter(s => s.id !== id);
    setSettlements(next);
    saveLocal(next);
    await pushToKV(next, 'replace');
    await pullFromKV();
  }, [settlements, pushToKV, pullFromKV]);

  return { settlements, addSettlement, removeSettlement };
}