#!/usr/bin/env node
/**
 * Google Indexing API — submit URLs for rapid Google indexing
 *
 * Setup (one-time):
 *   1. Create a Google Cloud project and enable the Indexing API
 *   2. Create a Service Account and download its JSON key
 *   3. Add the service account email as an Owner in Google Search Console
 *   4. Set GOOGLE_INDEXING_KEY_PATH=/path/to/key.json  (or place key as .google-indexing-key.json in project root)
 *
 * Usage:
 *   node .claude/scripts/google-index.js https://example.com/page1 https://example.com/page2
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

function loadServiceAccount() {
  const keyPath =
    process.env.GOOGLE_INDEXING_KEY_PATH ||
    path.join(process.cwd(), '.google-indexing-key.json');

  if (!fs.existsSync(keyPath)) {
    console.error('❌  Service account key not found.');
    console.error('');
    console.error('Setup steps:');
    console.error('  1. Go to console.cloud.google.com → create a project');
    console.error('  2. Enable the "Web Search Indexing API"');
    console.error('  3. Create a Service Account → download JSON key');
    console.error('  4. In Google Search Console → Settings → Users and permissions');
    console.error('     → Add the service account email as Owner');
    console.error('  5. Save the key as .google-indexing-key.json in your project root');
    console.error('     OR set GOOGLE_INDEXING_KEY_PATH=/path/to/key.json');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(JSON.stringify(input));
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function createJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(header)}.${base64url(payload)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(serviceAccount.private_key);
  return `${unsigned}.${base64url(signature)}`;
}

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken(serviceAccount) {
  const jwt = createJWT(serviceAccount);
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

  const url = new URL(TOKEN_URL);
  const res = await request(
    TOKEN_URL,
    {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body
  );

  const parsed = JSON.parse(res.body);
  if (!parsed.access_token) {
    throw new Error(`Token error: ${res.body}`);
  }
  return parsed.access_token;
}

async function submitURL(url, token) {
  const body = JSON.stringify({ url, type: 'URL_UPDATED' });
  const apiUrl = new URL(INDEXING_API);

  const res = await request(
    INDEXING_API,
    {
      method: 'POST',
      hostname: apiUrl.hostname,
      path: apiUrl.pathname,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body
  );

  return { url, status: res.status, ok: res.status === 200, body: res.body };
}

async function main() {
  const urls = process.argv.slice(2).filter((a) => a.startsWith('http'));

  if (urls.length === 0) {
    console.error('Usage: node .claude/scripts/google-index.js <url1> [url2] ...');
    process.exit(1);
  }

  console.log(`\nGoogle Indexing API — submitting ${urls.length} URL(s)\n`);

  const serviceAccount = loadServiceAccount();
  const token = await getAccessToken(serviceAccount);

  const results = await Promise.all(urls.map((url) => submitURL(url, token)));

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.ok) {
      console.log(`✅  ${r.url}`);
      passed++;
    } else {
      const err = JSON.parse(r.body)?.error?.message || r.body;
      console.log(`❌  ${r.url}`);
      console.log(`    Status ${r.status}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone — ${passed} submitted, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
