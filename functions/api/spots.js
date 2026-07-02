// GET  /api/spots  → 從 KV 讀取所有景點
// POST /api/spots  → 新增一個景點

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1wM-brW_yG22bcphlBbvHyad98Br7YNVdPgkiXsLkV-c/export?format=csv';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
  }
  result.push(current);
  return result;
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('name');
  const latIdx = headers.indexOf('lat');
  const lngIdx = headers.indexOf('lng');
  if (nameIdx === -1 || latIdx === -1 || lngIdx === -1) return [];
  const catIdx = headers.indexOf('category');
  const dayIdx = headers.indexOf('day_label');
  const hoursIdx = headers.indexOf('hours');
  const priceIdx = headers.indexOf('price');
  const tipsIdx = headers.indexOf('tips');
  const warningIdx = headers.indexOf('warning');
  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    return {
      id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: (cols[nameIdx] || '').trim(),
      lat: parseFloat(cols[latIdx] || '0'),
      lng: parseFloat(cols[lngIdx] || '0'),
      category: (cols[catIdx] || '').trim(),
      day_label: (cols[dayIdx] || '').trim(),
      hours: (cols[hoursIdx] || '').trim(),
      price: (cols[priceIdx] || '').trim(),
      tips: (cols[tipsIdx] || '').trim(),
      warning: (cols[warningIdx] || '').trim(),
      source: 'sheets',
    };
  }).filter(r => r.name && !isNaN(r.lat) && !isNaN(r.lng));
}

async function getAll(kv) {
  const raw = await kv.get('spots:all');
  return raw ? JSON.parse(raw) : [];
}
async function saveAll(kv, spots) {
  await kv.put('spots:all', JSON.stringify(spots));
  await kv.put('spots:meta', JSON.stringify({ updated_at: new Date().toISOString(), count: spots.length }));
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

  // GET → return all spots
  if (request.method === 'GET') {
    const spots = env.SPOTS_KV ? await getAll(env.SPOTS_KV) : [];
    const metaRaw = env.SPOTS_KV ? await env.SPOTS_KV.get('spots:meta') : null;
    const meta = metaRaw ? JSON.parse(metaRaw) : {};
    return new Response(JSON.stringify({ spots, meta }), { status: 200, headers });
  }

  // POST → add a spot
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (!body.name || body.lat == null || body.lng == null) {
        return new Response(JSON.stringify({ error: 'name, lat, lng required' }), { status: 400, headers });
      }
      const newSpot = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: body.name,
        lat: parseFloat(body.lat),
        lng: parseFloat(body.lng),
        category: body.category || '',
        day_label: body.day_label || '',
        hours: body.hours || '',
        price: body.price || '',
        tips: body.tips || '',
        warning: body.warning || '',
        source: 'manual',
        created_at: new Date().toISOString(),
      };
      if (!env.SPOTS_KV) {
        return new Response(JSON.stringify({ success: true, spot: newSpot, note: 'KV not bound, spot not persisted' }), { status: 201, headers });
      }
      const spots = await getAll(env.SPOTS_KV);
      spots.push(newSpot);
      await saveAll(env.SPOTS_KV, spots);
      return new Response(JSON.stringify({ success: true, spot: newSpot }), { status: 201, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}