// POST /api/sync-sheets → 從 Google Sheets CSV 同步至 KV

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed, use POST' }), { status: 405, headers });
  }

  if (!env.SPOTS_KV) {
    // Fallback: parse CSV directly and return
    try {
      const resp = await fetch(CSV_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const csvText = await resp.text();
      const sheetSpots = parseCSV(csvText);
      return new Response(JSON.stringify({
        success: true,
        sheets_count: sheetSpots.length,
        manual_count: 0,
        count: sheetSpots.length,
        updated_at: new Date().toISOString(),
        note: 'KV not bound, returning parse-only result',
      }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: `Sync failed: ${e.message}` }), { status: 500, headers });
    }
  }

  try {
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();
    const sheetSpots = parseCSV(csvText);

    const existing = await getAll(env.SPOTS_KV);
    const manualSpots = existing.filter(s => s.source === 'manual');
    const merged = [...sheetSpots, ...manualSpots];

    await saveAll(env.SPOTS_KV, merged);
    const meta = {
      success: true,
      sheets_count: sheetSpots.length,
      manual_count: manualSpots.length,
      count: merged.length,
      updated_at: new Date().toISOString(),
    };
    await env.SPOTS_KV.put('spots:meta', JSON.stringify(meta));
    return new Response(JSON.stringify(meta), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Sync failed: ${e.message}` }), { status: 500, headers });
  }
}