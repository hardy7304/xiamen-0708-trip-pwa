// GET /api/debug-env → check bindings status (no secret values exposed)
export async function onRequest(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    hasSPOTS_KV: !!env.SPOTS_KV,
    hasTRIP_FILES: !!env.TRIP_FILES,
    hasTRIP_PIN: !!env.TRIP_PIN,
  }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}