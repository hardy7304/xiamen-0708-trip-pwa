// GET  /api/expenses  → 從 KV 讀取所有消費記錄
// POST /api/expenses  → 寫入消費記錄（合併模式：只新增不覆蓋）

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
    'Access-Control-Allow-Headers': 'Content-Type',
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
    return new Response(JSON.stringify({ expenses, count: expenses.length }), { status: 200, headers });
  }

  // POST → add expenses (merge by id)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.expenses || !Array.isArray(body.expenses)) {
        return new Response(JSON.stringify({ error: 'Invalid body: expenses array required' }), { status: 400, headers });
      }

      if (!env.SPOTS_KV) {
        return new Response(JSON.stringify({ success: true, count: body.expenses.length, note: 'KV not bound' }), { status: 200, headers });
      }

      const existing = await getAll(env.SPOTS_KV, KEY);
      const existingIds = new Set(existing.map(e => e.id));
      const newItems = body.expenses.filter(e => !existingIds.has(e.id));
      const merged = [...existing, ...newItems];

      await saveAll(env.SPOTS_KV, KEY, merged);
      return new Response(JSON.stringify({ success: true, count: merged.length, added: newItems.length }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}