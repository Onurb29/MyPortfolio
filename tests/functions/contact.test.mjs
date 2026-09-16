import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../../functions/api/contact.js';

const valid = { name: 'Test Visitor', email: 'visitor@example.com', subject: 'Project enquiry', message: 'I would like to discuss a project.', website: '', formDurationMs: 3000 };
const env = { RESEND_API_KEY: 'test-only', RESEND_FROM_EMAIL: 'site@example.com', RESEND_TO_EMAIL: 'owner@example.com' };
const request = data => new Request('https://example.com/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' }, body: JSON.stringify(data) });
const neverSend = () => { throw new Error('Email provider must not be called'); };

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
