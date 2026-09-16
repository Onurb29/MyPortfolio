import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../../functions/api/contact.js';
import { onRequest } from '../../functions/api/contact.js';
import { createContactLimiter, securityHeaders } from '../../server/security.mjs';
import { readFileSync } from 'node:fs';

const valid = { name: 'Test Visitor', email: 'visitor@example.com', subject: 'Project enquiry', message: 'I would like to discuss a project.', website: '', formDurationMs: 3000 };
const env = { RESEND_API_KEY: 'test-only', RESEND_FROM_EMAIL: 'site@example.com', RESEND_TO_EMAIL: 'owner@example.com' };
const request = data => new Request('https://example.com/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' }, body: JSON.stringify(data) });
const neverSend = () => { throw new Error('Email provider must not be called'); };

test('public homelab does not disclose internal hostnames or software versions', () => {
  for (const path of ['architecture.js', 'homelab/index.html']) {
    const text = readFileSync(new URL(`../../wwwroot/${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /AlloyEngine|nas-01|Ubuntu(?: Server)? \d|MariaDB \d|NVIDIA driver \d|Docker Engine \d|port \d/i);
  }
});

test('valid message sends only to the configured recipient', async () => {
  let calls = 0;
  const response = await handleContact(request({ ...valid, to: 'attacker@example.com' }), env, async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.resend.com/emails');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ['owner@example.com']);
    assert.equal(body.reply_to, valid.email);
    assert.match(body.text, /discuss a project/);
    return Response.json({ id: 'test' });
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
});

for (const [name, change] of Object.entries({ email: { email: 'invalid' }, honeypot: { website: 'spam' }, timing: { formDurationMs: 1 }, missing: { name: null }, shortMessage: { message: 'hi' }, longMessage: { message: 'x'.repeat(4001) } })) {
  test(`rejects ${name} before calling provider`, async () => {
    let called = false;
    const response = await handleContact(request({ ...valid, ...change }), env, () => { called = true; });
    assert.equal(response.status, 400);
    assert.equal(called, false);
  });
}

test('missing configuration reports unavailable without pretending to send', async () => {
  const response = await handleContact(request(valid), {}, neverSend);
  assert.equal(response.status, 503);
});

test('provider failure does not expose its response or clear the error', async () => {
  const response = await handleContact(request(valid), env, async () => new Response('private provider error', { status: 401 }));
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /private provider error|test-only/);
});

test('rejects oversized body', async () => {
  assert.equal((await handleContact(request({ ...valid, message: 'x'.repeat(33000) }), env, neverSend)).status, 413);
});

test('GET checks configuration without sending an email', async () => {
  const response = await handleContact(new Request('https://example.com/api/contact'), {}, neverSend);
  assert.deepEqual(await response.json(), { available: false });
});

test('rate limiter enforces IP and total limits and expires old entries', () => {
  let now = 0;
  const allow = createContactLimiter(() => now);
  for (let i = 0; i < 5; i++) assert.equal(allow('ip-one'), true);
  assert.equal(allow('ip-one'), false);
  for (let i = 0; i < 25; i++) assert.equal(allow(`ip-${i}`), true);
  assert.equal(allow('another'), false);
  now = 600001;
  assert.equal(allow('ip-one'), true);
});

test('runtime wrapper throttles before provider calls and returns retry headers', async () => {
  for (let i = 0; i < 6; i++) {
    const req = request({ ...valid, email: 'invalid' });
    req.headers.set('CF-Connecting-IP', '192.0.2.10');
    const response = await onRequest({ request: req, env: {} });
    assert.equal(response.status, i < 5 ? 400 : 429);
    if (i === 5) assert.equal(response.headers.get('Retry-After'), '600');
    assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  }
});

test('static and function security headers match', async () => {
  const text = readFileSync(new URL('../../wwwroot/_headers', import.meta.url), 'utf8');
  const response = await onRequest({ request: new Request('https://example.com/api/contact'), env: {} });
  for (const [name, value] of Object.entries(securityHeaders)) {
    assert.ok(text.includes(`${name}: ${value}`));
    assert.equal(response.headers.get(name), value);
  }
});

test('rejects missing origin and deceptive content type', async () => {
  for (const headers of [{ 'Content-Type': 'application/json' }, { Origin: 'https://example.com', 'Content-Type': 'application/json-bogus' }]) {
    const response = await handleContact(new Request('https://example.com/api/contact', { method: 'POST', headers, body: JSON.stringify(valid) }), env, neverSend);
    assert.ok([403, 415].includes(response.status));
  }
});

const protectedEnv = { ...env, TURNSTILE_SITE_KEY: 'public-test', TURNSTILE_SECRET_KEY: 'secret-test' };
test('configured Turnstile rejects a missing token', async () => {
  assert.equal((await handleContact(request(valid), protectedEnv, neverSend)).status, 403);
});

for (const result of [ { success: false }, { success: true, hostname: 'evil.example', action: 'contact' }, { success: true, hostname: 'example.com', action: 'other' } ]) {
  test(`Turnstile rejects invalid result ${JSON.stringify(result)}`, async () => {
    let calls = 0;
    const response = await handleContact(request({ ...valid, 'cf-turnstile-response': 'token' }), protectedEnv, async url => {
      calls++;
      assert.match(url, /siteverify$/);
      return Response.json(result);
    });
    assert.equal(response.status, 403);
    assert.equal(calls, 1);
  });
}

test('valid Turnstile token permits sending and partial config fails closed', async () => {
  let calls = 0;
  const send = async url => { calls++; return Response.json(url.includes('siteverify') ? { success: true, hostname: 'example.com', action: 'contact' } : { id: 'test' }); };
  const response = await handleContact(request({ ...valid, 'cf-turnstile-response': 'token' }), protectedEnv, send);
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.equal((await handleContact(request(valid), { ...env, TURNSTILE_SITE_KEY: 'public-test' }, neverSend)).status, 503);
});
