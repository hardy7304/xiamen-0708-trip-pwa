// GET  /api/settlements  → 從 KV 讀取所有結算紀錄
// POST /api/settlements  → 寫入結算紀錄
//   mode: "merge"  (default) → 合併新增
//   mode: "replace"           → 完整覆蓋 KV

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

  const KEY = 'settlements-list';

  if (request.method === 'GET') {
    if (!env.SPOTS_KV) {
      return new Response(JSON.stringify({ settlements: [] }), { status: 200, headers });
    }
    const settlements = await getAll(env.SPOTS_KV, KEY);
    return new Response(JSON.stringify({ settlements, count: settlements.length }), { status: 200, headers });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.settlements || !Array.isArray(body.settlements)) {
        return new Response(JSON.stringify({ error: 'Invalid body: settlements array required' }), { status: 400, headers });
      }

      if (!env.SPOTS_KV) {
        return new Response(JSON.stringify({ success: false, error: 'KV not bound', count: body.settlements.length }), { status: 500, headers });
      }

      const mode = body.mode || 'merge';

      if (mode === 'replace') {
        await saveAll(env.SPOTS_KV, KEY, body.settlements);
        return new Response(JSON.stringify({
          success: true, mode: 'replace', count: body.settlements.length,
        }), { status: 200, headers });
      }

      // merge
      const existing = await getAll(env.SPOTS_KV, KEY);
      const existingIds = new Set(existing.map(s => s.id));
      const newItems = body.settlements.filter(s => !existingIds.has(s.id));
      const merged = [...existing, ...newItems];
      await saveAll(env.SPOTS_KV, KEY, merged);
      return new Response(JSON.stringify({
        success: true, mode: 'merge', count: merged.length, added: newItems.length,
      }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}