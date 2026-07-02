// GET  /api/trip-data  → 讀取所有使用者行程資料（住宿/自訂/隱藏）
// POST /api/trip-data  → 儲存所有使用者行程資料

async function getAll(kv, key) {
  const raw = await kv.get(key);
  return raw ? JSON.parse(raw) : null;
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

  const KEY = 'trip-user-data';

  // GET → return user data
  if (request.method === 'GET') {
    if (!env.SPOTS_KV) {
      return new Response(JSON.stringify({ data: null, note: 'KV not bound' }), { status: 200, headers });
    }
    const data = await getAll(env.SPOTS_KV, KEY);
    return new Response(JSON.stringify({ data: data || { hotelNames: {}, customItems: [], hiddenDays: [] } }), { status: 200, headers });
  }

  // POST → save user data (full replace)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!env.SPOTS_KV) {
        return new Response(JSON.stringify({ success: true, note: 'KV not bound, data not persisted' }), { status: 200, headers });
      }
      const existing = await getAll(env.SPOTS_KV, KEY) || {};
      const merged = {
        hotelNames: { ...existing.hotelNames, ...(body.hotelNames || {}) },
        customItems: body.customItems || existing.customItems || [],
        hiddenDays: body.hiddenDays || existing.hiddenDays || [],
        updated_at: new Date().toISOString(),
      };
      await saveAll(env.SPOTS_KV, KEY, merged);
      return new Response(JSON.stringify({ success: true, data: merged }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}