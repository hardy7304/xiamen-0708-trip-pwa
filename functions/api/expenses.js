// GET  /api/expenses  → 從 KV 讀取所有消費記錄
// POST /api/expenses  → 寫入消費記錄
//   mode: "merge"  (default) → 合併新增
//   mode: "replace"           → 完整覆蓋 KV（刪除時用）

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
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const KEY = 'expenses-list';

  // GET → return all expenses
  if (request.method === 'GET') {
    if (!env.SPOTS_KV) {
      return new Response(JSON.stringify({ error: 'KV not bound', expenses: [], count: 0 }), { status: 500, headers });
    }
    const expenses = await getAll(env.SPOTS_KV, KEY);
    const migrated = expenses.map(migrateExpense);
    return new Response(JSON.stringify({ expenses: migrated, count: migrated.length }), { status: 200, headers });
  }

  // POST
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.expenses || !Array.isArray(body.expenses)) {
        return new Response(JSON.stringify({ error: 'Invalid body: expenses array required' }), { status: 400, headers });
      }

      if (!env.SPOTS_KV) {
        return new Response(JSON.stringify({ success: false, error: 'KV not bound — configure SPOTS_KV in Cloudflare Pages Functions settings', count: body.expenses.length }), { status: 500, headers });
      }

      const mode = body.mode || 'merge';
      const migrated = body.expenses.map(migrateExpense);

      if (mode === 'replace') {
        // 直接覆蓋 KV —— 允許空陣列（刪除全部）
        await saveAll(env.SPOTS_KV, KEY, migrated);
        return new Response(JSON.stringify({
          success: true,
          mode: 'replace',
          count: migrated.length,
          ids: migrated.map(e => e.id)
        }), { status: 200, headers });
      }

      // mode === "merge" (default) — upsert by id so edits are persisted
      // Future enhancement: updatedAt-based conflict resolution for concurrent edits
      const existing = await getAll(env.SPOTS_KV, KEY);
      const map = new Map(existing.map(e => [e.id, e]));
      for (const e of migrated) {
        map.set(e.id, e); // overwrite if id already exists, add if new
      }
      const merged = Array.from(map.values());

      await saveAll(env.SPOTS_KV, KEY, merged);
      return new Response(JSON.stringify({
        success: true,
        mode: 'merge',
        count: merged.length,
      }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}

/** Migrate old expense records */
function migrateExpense(expense) {
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