// GET  /api/expenses  → 從 KV 讀取所有消費記錄
// POST /api/expenses  → 寫入消費記錄（合併模式：只新增不覆蓋，支援新欄位）

async function getAll(kv, key) {
  const raw = await kv.get(key);
  return raw ? JSON.parse(raw) : [];
}
async function saveAll(kv, key, data) {
  await kv.put(key, JSON.stringify(data));
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-trip-pin',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const KEY = 'expenses-list';

  // GET → return all expenses
  if (request.method === 'GET') {
    if (!env.SPOTS_KV) {
      return new Response(JSON.stringify({ expenses: [] }), { status: 200, headers });
    }
    const expenses = await getAll(env.SPOTS_KV, KEY);
    // Migrate old records
    const migrated = expenses.map(migrateExpense);
    return new Response(JSON.stringify({ expenses: migrated, count: migrated.length }), { status: 200, headers });
  }

  // POST → add expenses (merge by id, support new fields)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.expenses || !Array.isArray(body.expenses)) {
        return new Response(JSON.stringify({ error: 'Invalid body: expenses array required' }), { status: 400, headers });
      }

      if (!env.SPOTS_KV) {
        return new Response(JSON.stringify({ success: false, error: 'KV not bound — configure SPOTS_KV in Cloudflare Pages Functions settings', count: body.expenses.length }), { status: 500, headers });
      }

      const existing = await getAll(env.SPOTS_KV, KEY);
      const existingIds = new Set(existing.map(e => e.id));
      const migrated = body.expenses.map(migrateExpense);
      const newItems = migrated.filter(e => !existingIds.has(e.id));
      const merged = [...existing, ...newItems];

      await saveAll(env.SPOTS_KV, KEY, merged);
      return new Response(JSON.stringify({ success: true, count: merged.length, added: newItems.length }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}

/** Migrate old expense records */
function migrateExpense(expense) {
  // Already has new fields
  if (expense.paidBy && expense.expenseFor) return expense;

  const oldPayer = expense.payer || '';
  let paidBy = 'me';
  let expenseFor = 'self';

  if (oldPayer === '我' || oldPayer === 'me') { paidBy = 'me'; expenseFor = 'self'; }
  else if (oldPayer === '妹妹' || oldPayer === '翊婷' || oldPayer === 'yiting') { paidBy = 'yiting'; expenseFor = 'yiting'; }
  else if (oldPayer === '一起' || oldPayer === 'shared') { paidBy = 'me'; expenseFor = 'shared'; }

  return {
    ...expense,
    paidBy: expense.paidBy || paidBy,
    expenseFor: expense.expenseFor || expenseFor,
    paymentMethod: expense.paymentMethod || 'cash_cny',
    currency: expense.currency === 'RMB' ? 'CNY' : (expense.currency || 'CNY'),
  };
}