(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('contact-status');
  const button = form.querySelector('[type="submit"]');
  let started = Date.now();
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
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
    }
  });
})();
