// POST /api/sync-sheets → 從 Google Sheets CSV 同步至 KV
// 自動套用 amap_keyword 對照表與 map_provider 判斷

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1wM-brW_yG22bcphlBbvHyad98Br7YNVdPgkiXsLkV-c/export?format=csv';

// Coordinate corrections applied after CSV parse (override Sheets values)
const COORD_FIXES = {
  '曾厝垵文創漁村': { lat: 24.4489, lng: 118.1389 },
  '南普陀寺': { lat: 24.4623, lng: 118.0823 },
  '沙坡尾文創區': { lat: 24.4489, lng: 118.0823 },
  '環島路': { lat: 24.4178, lng: 118.1523 },
  '黃厝沙灘': { lat: 24.4156, lng: 118.1589 },
  '鷺江夜遊': { lat: 24.4489, lng: 118.0712 },
  '鼓浪嶼碼頭': { lat: 24.4534, lng: 118.0712 },
  '大輪碼頭夜市': { lat: 24.4512, lng: 118.0712 },
};

// amap_keyword mapping: sheets name → 高德搜尋關鍵字
const AMAP_KEYWORD_MAP = {
  '廈門五通碼頭': '廈門五通碼頭',
  '五緣灣濕地公園': '廈門五緣灣濕地公園',
  '五緣灣': '廈門五緣灣',
  '湖里區': '廈門湖里區',
  'SM城市廣場': '廈門SM城市廣場',
  '廈門SM城市廣場': '廈門SM城市廣場',
  '萬象城': '廈門萬象城',
  '廈門萬象城': '廈門萬象城',
  '誠品生活': '廈門誠品生活',
  '廈門誠品書店': '廈門誠品生活',
  '廈門銀行': '廈門銀行 五緣灣',
  '中國建設銀行': '中國建設銀行 湖里 廈門',
  '中國銀行': '中國銀行 廈門 湖里',
  '富邦華一銀行': '富邦華一銀行 廈門',
  '南普陀寺': '廈門南普陀寺',
  '廈門大學': '廈門大學',
  '沙坡尾': '廈門沙坡尾',
  '沙坡尾文創區': '廈門沙坡尾藝術西區',
  '中山路步行街': '廈門中山路步行街',
  '廈門老城區騎樓': '廈門中山路騎樓',
  '大輪碼頭夜市': '廈門大輪碼頭',
  '鷺江夜遊': '廈門鷺江夜遊',
  '和平码頭': '廈門和平码頭',
  '胡里山炮台': '廈門胡里山炮台',
  '環島路': '廈門環島路',
  '曾厝垵': '廈門曾厝垵',
  '曾厝垵文創漁村': '廈門曾厝垵文創村',
  '文曾路咖啡街': '廈門文曾路',
  '黃厝沙灘': '廈門黃厝沙灘',
  '黃厝海灘': '廈門黃厝海灘',
  '廈門植物園': '廈門園林植物園',
  '第八市場（八市）': '廈門第八市場',
  '八市': '廈門八市',
  '第八市場': '廈門第八市場',
  '廈門火車站商圈': '廈門火車站',
  '火車站商圈': '廈門火車站',
  '手佳健康會所': '手佳健康會所松柏港龍店',
  '手佳健康會所松柏港龍店': '手佳健康會所 松柏港龍店',
  '松柏': '廈門松柏',
  '蓮花路口': '廈門蓮花路口',
  '鼓浪嶼碼頭': '廈門鼓浪嶼三丘田碼頭',
  '廈鼓碼頭': '廈門郵輪中心廈鼓碼頭',
  '郵輪中心廈鼓碼頭': '廈門郵輪中心廈鼓碼頭',
  '集美學村': '廈門集美學村',
  '廈門北站': '廈門北站',
  '高崎機場': '廈門高崎國際機場',
  '廈門大學': '廈門大學',
  '廈門萬象城': '廈門萬象城',
};

// Xiamen location keywords (for auto-detecting map_provider)
const XIAMEN_KEYWORDS = ['廈門', '思明', '湖里', '五通', '五緣灣', '沙坡尾', '中山路', '環島路', '黃厝', '曾厝垵', '松柏', '集美', '萬象城', 'SM'];
const KINMEN_KEYWORDS = ['金門', '尚義', '水頭', '金城', '金湖', '金寧'];

function detectMapProvider(name, address, dayLabel) {
  const text = [name, address, dayLabel].filter(Boolean).join(' ');
  if (KINMEN_KEYWORDS.some(k => text.includes(k))) return 'google';
  if (XIAMEN_KEYWORDS.some(k => text.includes(k))) return 'amap';
  return 'amap'; // default to amap (廈門 trip)
}

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
  const addrIdx = headers.indexOf('address');
  const mpIdx = headers.indexOf('map_provider');
  const amapKwIdx = headers.indexOf('amap_keyword');
  const amapCityIdx = headers.indexOf('amap_city');
  const googleKwIdx = headers.indexOf('google_keyword');
  const navNoteIdx = headers.indexOf('navigation_note');

  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    const rawName = (cols[nameIdx] || '').trim();
    const fix = COORD_FIXES[rawName];
    const address = addrIdx >= 0 ? (cols[addrIdx] || '').trim() : '';

    // Determine map_provider
    let mapProvider = mpIdx >= 0 ? (cols[mpIdx] || '').trim() : '';
    if (!mapProvider) {
      mapProvider = detectMapProvider(rawName, address, dayIdx >= 0 ? (cols[dayIdx] || '').trim() : '');
    }

    // Auto-fill amap_keyword from mapping table if not provided
    let amapKeyword = amapKwIdx >= 0 ? (cols[amapKwIdx] || '').trim() : '';
    if (!amapKeyword) {
      amapKeyword = AMAP_KEYWORD_MAP[rawName] || '';
    }
    if (!amapKeyword && mapProvider === 'amap') {
      amapKeyword = '廈門' + rawName;
    }

    const amapCity = amapCityIdx >= 0 ? (cols[amapCityIdx] || '').trim() || '廈門' : '廈門';
    const googleKeyword = googleKwIdx >= 0 ? (cols[googleKwIdx] || '').trim() || (mapProvider === 'google' ? '金門 ' + rawName : '');
    const navNote = navNoteIdx >= 0 ? (cols[navNoteIdx] || '').trim()
      : (mapProvider === 'amap' ? '廈門建議使用高德地圖搜尋定位，避免 Google 座標偏移' : '金門建議使用 Google Maps');

    return {
      id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: rawName,
      lat: fix ? fix.lat : parseFloat(cols[latIdx] || '0'),
      lng: fix ? fix.lng : parseFloat(cols[lngIdx] || '0'),
      category: catIdx >= 0 ? (cols[catIdx] || '').trim() : '',
      day_label: dayIdx >= 0 ? (cols[dayIdx] || '').trim() : '',
      hours: hoursIdx >= 0 ? (cols[hoursIdx] || '').trim() : '',
      price: priceIdx >= 0 ? (cols[priceIdx] || '').trim() : '',
      tips: tipsIdx >= 0 ? (cols[tipsIdx] || '').trim() : '',
      warning: warningIdx >= 0 ? (cols[warningIdx] || '').trim() : '',
      address: address,
      map_provider: mapProvider,
      amap_keyword: amapKeyword,
      amap_city: amapCity,
      google_keyword: googleKeyword,
      navigation_note: navNote,
      source: 'sheets',
    };
  }).filter(r => r.name && !isNaN(r.lat) && !isNaN(r.lng));
}

async function getAll(kv) { const raw = await kv.get('spots:all'); return raw ? JSON.parse(raw) : []; }
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
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405, headers });

  try {
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();
    const sheetSpots = parseCSV(csvText);

    if (!env.SPOTS_KV) {
      return new Response(JSON.stringify({ success: true, sheets_count: sheetSpots.length, count: sheetSpots.length, note: 'KV not bound' }), { status: 200, headers });
    }

    const existing = await getAll(env.SPOTS_KV);
    const manualSpots = existing.filter(s => s.source === 'manual');
    const merged = [...sheetSpots, ...manualSpots];
    await saveAll(env.SPOTS_KV, merged);
    const meta = { success: true, sheets_count: sheetSpots.length, manual_count: manualSpots.length, count: merged.length, updated_at: new Date().toISOString() };
    await env.SPOTS_KV.put('spots:meta', JSON.stringify(meta));
    return new Response(JSON.stringify(meta), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Sync failed: ${e.message}` }), { status: 500, headers });
  }
}