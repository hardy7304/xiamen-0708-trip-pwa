// GET  /api/budget-settings  → 從 KV 讀取預算設定
// POST /api/budget-settings  → 寫入預算設定

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
    'Access-Control-Allow-Headers': 'Content-Type, x-trip-pin',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const KEY = 'trip:xiamen-0708:budget_settings_v1';

  // GET → return budget settings
  if (request.method === 'GET') {
    if (!env.SPOTS_KV) {
      return new Response(JSON.stringify({ error: 'KV not bound', settings: null }), { status: 500, headers });
    }
    const settings = await getAll(env.SPOTS_KV, KEY);
    return new Response(JSON.stringify({ settings }), { status: 200, headers });
  }

  // POST → save budget settings
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.settings || typeof body.settings.updatedAt !== 'number') {
        return new Response(JSON.stringify({ error: 'Invalid body: settings with updatedAt required' }), { status: 400, headers });
      }

      if (!env.SPOTS_KV) {
        return new Response(JSON.stringify({ success: false, error: 'KV not bound' }), { status: 500, headers });
      }

      await saveAll(env.SPOTS_KV, KEY, body.settings);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}