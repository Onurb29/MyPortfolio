(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('contact-status');
  const button = form.querySelector('[type="submit"]');
  let started = Date.now();
  let pending = false;
  let widget;
  const setup = fetch('/api/contact', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    .then(response => response.json()).then(config => {
      if (!config.siteKey) return;
      const container = document.createElement('div');
      button.before(container);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Verification unavailable')), 10000);
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.onload = () => {
          clearTimeout(timeout);
          widget = window.turnstile.render(container, { sitekey: config.siteKey, action: 'contact', theme: 'dark', size: 'flexible' });
          resolve();
        };
        script.onerror = () => { clearTimeout(timeout); reject(new Error('Verification unavailable')); };
        document.head.append(script);
      });
    }).catch(() => { /* Server still enforces verification if configured. */ });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true;
    await setup;
    pending = false;
    const data = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(data)) data[key] = data[key].trim();
    data.formDurationMs = Math.min(Date.now() - started, 600000);
    if (data.formDurationMs < 2500) {
      status.textContent = 'Please take a moment to review your message, then send it.';
      return;
    }
    pending = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your message…';
    try {
      const response = await fetch(form.action, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: AbortSignal.timeout(15000)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.message !== 'Message sent successfully.') {
        throw new Error(response.status === 429
          ? 'Too many attempts. Please wait a few minutes and try again.'
          : 'Your message could not be sent. Please try again later or contact me on LinkedIn.');
      }
      form.reset();
      started = Date.now();
      status.textContent = 'Thanks! Your message was sent successfully.';
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'Could not confirm delivery. Your message is still here—please try again later or use LinkedIn.'
        : error.message;
    } finally {
      pending = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
      if (widget !== undefined) window.turnstile.reset(widget);
    }
  });
})();
