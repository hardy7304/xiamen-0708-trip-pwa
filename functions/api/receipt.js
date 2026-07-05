// GET /api/receipt?key=receipts/xxx.jpg
// Requires x-trip-pin header for authentication

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'x-trip-pin',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Use GET' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // PIN check
  const pin = request.headers.get('x-trip-pin') || '';
  if (!env.TRIP_PIN || pin !== env.TRIP_PIN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing ?key=' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (!env.TRIP_FILES) {
    return new Response(JSON.stringify({ error: 'R2 not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const object = await env.TRIP_FILES.get(key);
    if (!object) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const respHeaders = new Headers();
    object.writeHttpMetadata(respHeaders);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Cache-Control', 'public, max-age=86400');
    return new Response(object.body, { headers: respHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Read failed: ${e.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}