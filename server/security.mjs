export const securityHeaders = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://www.openstreetmap.org https://challenges.cloudflare.com; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000'
};

// Best-effort abuse control per isolate, NOT a distributed quota.
// Fixed bounds and expiry prevent an unbounded IP dictionary.
export function createContactLimiter(now = Date.now) {
  const buckets = new Map();
  let total = 0, expires = 0;
  return ip => {
    const time = now();
    if (time >= expires) { buckets.clear(); total = 0; expires = time + 600000; }
    const count = buckets.get(ip) || 0;
    if (count >= 5 || total >= 30 || (!buckets.has(ip) && buckets.size >= 2048)) return false;
    buckets.set(ip, count + 1);
    total++;
    return true;
  };
}
