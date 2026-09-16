# Security controls and remaining configuration

## Contact handler on Cloudflare

The existing Resend settings are unchanged. Requests have bounded bodies and field lengths, exact JSON media types, browser-origin checks, plain-text email, a fixed recipient, generic errors, and no response caching. Origin and client-reported time are screening measures, not proof that a request is human.

The runtime wrapper adds a bounded per-isolate fixed-window limiter: 5 POST attempts per IP and 30 total per ten minutes. Cloudflare supplies the client IP. Rejected and malformed attempts count. Expired entries are removed. This is immediate best-effort protection, NOT a global quota: multiple isolates, restarts, and window boundaries can permit extra traffic.

### Complete edge abuse protection

In Cloudflare, add a rate-limit rule scoped to hostname `jimmyperron.com`, POST, and path `/api/contact` or `/api/contact/`. Target 5 attempts per IP per 10 minutes, with a 10-minute block, adapting to the periods available in your plan. Verify the rule is active. Configure Resend usage alerts/budgets where available. The repository cannot enable an account-level rule; this remains an operator action.

### Enable Turnstile

1. Create a Managed Turnstile widget with allowed hostname `jimmyperron.com` (add `www.jimmyperron.com` only if you serve it).
2. In Pages Production Variables and Secrets, add `TURNSTILE_SITE_KEY` as Text and `TURNSTILE_SECRET_KEY` as Secret. Save both and redeploy. Keep all existing Resend values.
3. The form retrieves the public site key and renders the widget. The handler verifies its token with Cloudflare, including expected hostname and action `contact`. Expired/replayed/invalid tokens and verification outages cannot send email. Retries reset the widget.
4. Test an actual submission and check delivery. Do not use production secrets or unrestricted production widgets for previews; use separate preview settings/test keys.

Until both keys are supplied, the form keeps working with its existing validation and the per-isolate limiter. If only one key is configured, delivery fails closed. Turnstile is not claimed active merely because its code is present. The retained .NET development host does not implement this Cloudflare Turnstile or rate-limit wrapper and must not be used as an alternate public route around it.

## Browser protections

`wwwroot/_headers` applies CSP, anti-framing, MIME sniffing protection, a restricted referrer policy, disabled device permissions, and HSTS to static responses. The contact function sets matching headers itself because Pages static header rules do not apply to function responses. HSTS intentionally does not cover subdomains.

Scripts are limited to this site and Cloudflare's challenge host; connections to the same origins; frames to OpenStreetMap and Turnstile. Inline styles are permitted for widget compatibility; inline scripts and eval are not. Browser tests serve these headers locally so navigation, diagrams and the contact form are exercised under CSP. Changing third-party resources requires reviewing this allowlist.

Public pages omit exact software versions and service ports. Hardware model descriptions remain intentional portfolio content. These edits do not erase previously public Git history; hostnames and software versions are not credentials. Architecture-script revalidation reduces stale detail text.

## Future data collection

See [authenticated ingestion design](AUTHENTICATED-INGESTION.md). No ingestion route is deployed. Administrative services and databases remain private by design.

References: [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
