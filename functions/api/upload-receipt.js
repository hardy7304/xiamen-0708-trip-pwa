// POST /api/upload-receipt  → 接收前端壓縮後的照片，上傳至 R2

export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-trip-pin',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405, headers });
  }

  // PIN check
  const pin = request.headers.get('x-trip-pin') || '';
  if (!env.TRIP_PIN || pin !== env.TRIP_PIN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  if (!env.TRIP_FILES) {
    return new Response(JSON.stringify({ error: 'R2 not bound' }), { status: 500, headers });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Expect JSON body with { filename, data }' }), { status: 400, headers });
    }

    const body = await request.json();
    const { filename, data } = body;
    if (!filename || !data) {
      return new Response(JSON.stringify({ error: 'filename and data (base64) required' }), { status: 400, headers });
    }

    // Decode base64
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const binary = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const key = `receipts/${filename}`;
    await env.TRIP_FILES.put(key, binary, {
      httpMetadata: { contentType: 'image/jpeg' },
    });

    return new Response(JSON.stringify({ success: true, key }), { status: 201, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Upload failed: ${e.message}` }), { status: 500, headers });
  }
}