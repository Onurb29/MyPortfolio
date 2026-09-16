import { securityHeaders, createContactLimiter } from '../../server/security.mjs';

const unavailable = 'Messages are temporarily unavailable. Please contact me on LinkedIn.';
const json = (status, message) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
const configured = env => ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'RESEND_TO_EMAIL'].every(key => typeof env[key] === 'string' && env[key].trim());

export async function handleContact(request, env, send = fetch) {
  const hasTurnstile = Boolean(env.TURNSTILE_SITE_KEY || env.TURNSTILE_SECRET_KEY);
  const turnstileReady = Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
  if (request.method === 'GET') return Response.json({ available: Boolean(configured(env) && (!hasTurnstile || turnstileReady)), ...(hasTurnstile ? { siteKey: env.TURNSTILE_SITE_KEY || '' } : {}) }, { headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json(403, 'Submission rejected.');
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json(415, 'JSON required.');
  // Bound memory use even when Content-Length is absent or incorrect.
  const reader = request.body?.getReader();
  if (!reader) return json(400, 'A message is required.');
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 32768) { await reader.cancel(); return json(413, 'Message is too large.'); }
    chunks.push(value);
  }
  let data;
  try { data = JSON.parse(await new Blob(chunks).text()); }
  catch { return json(400, 'Invalid message.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json(400, 'Invalid message.');
  const limits = { name: [2, 120], email: [3, 200], subject: [2, 200], message: [10, 4000] };
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (typeof data[key] !== 'string') return json(400, 'Please complete all fields.');
    data[key] = data[key].trim();
    if (data[key].length < min || data[key].length > max) return json(400, 'Please check your message length.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || /[\r\n]/.test(data.subject + data.name)) return json(400, 'Please check your contact details.');
  if ((data.website !== undefined && data.website !== '') || !Number.isInteger(data.formDurationMs) || data.formDurationMs < 2500 || data.formDurationMs > 600000) return json(400, 'Submission rejected. Please review your message.');
  if (!configured(env)) return json(503, unavailable);
  if (hasTurnstile) {
    if (!turnstileReady) return json(503, unavailable);
    const token = data['cf-turnstile-response'];
    if (typeof token !== 'string' || !token || token.length > 2048) return json(403, 'Please complete the verification.');
    try {
      const verification = await send('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') || undefined }),
        signal: AbortSignal.timeout(5000)
      });
      if (!verification.ok) return json(503, unavailable);
      const result = await verification.json();
      if (result.success !== true || result.hostname !== new URL(request.url).hostname || result.action !== 'contact') return json(403, 'Verification failed. Please try again.');
    } catch { return json(503, unavailable); }
  }
  try {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: [env.RESEND_TO_EMAIL], reply_to: data.email,
        subject: `Portfolio Contact: ${data.subject}`,
        text: `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}` }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return json(502, unavailable);
    return json(200, 'Message sent successfully.');
  } catch { return json(502, unavailable); }
}

const allow = createContactLimiter();
export async function onRequest({ request, env }) {
  let response;
  try {
    // CF-Connecting-IP is set by Cloudflare, not a user-supplied forwarding header.
    response = request.method === 'POST' && !allow(request.headers.get('CF-Connecting-IP') || 'unknown')
      ? new Response(JSON.stringify({ message: 'Too many attempts. Please try again later.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '600' } })
      : await handleContact(request, env);
  } catch { response = json(400, 'Invalid request.'); }
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, headers });
}
