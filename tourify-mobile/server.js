const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.PORT || 3002);
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.txt');

function readAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) return [];

  return fs.readFileSync(ACCOUNTS_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeAccounts(accounts) {
  const content = accounts.map((account) => JSON.stringify(account)).join('\n');
  fs.writeFileSync(ACCOUNTS_FILE, content ? `${content}\n` : '');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function passwordsMatch(password, account) {
  const candidate = crypto.scryptSync(password, account.salt, 64);
  const stored = Buffer.from(account.passwordHash, 'hex');

  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error('Request too large'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });
    response.end();
    return;
  }

  if (request.method !== 'POST' || !['/register', '/login'].includes(request.url)) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  try {
    const { email, password } = await readBody(request);
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      sendJson(response, 400, { error: 'Enter a valid email address.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      sendJson(response, 400, { error: 'Password must be at least 8 characters.' });
      return;
    }

    const accounts = readAccounts();
    const existingAccount = accounts.find((account) => account.email === normalizedEmail);

    if (request.url === '/register') {
      if (existingAccount) {
        sendJson(response, 409, { error: 'An account with that email already exists.' });
        return;
      }

      const { salt, hash } = hashPassword(password);
      accounts.push({ email: normalizedEmail, salt, passwordHash: hash });
      writeAccounts(accounts);
      sendJson(response, 201, { email: normalizedEmail });
      return;
    }

    if (!existingAccount || !passwordsMatch(password, existingAccount)) {
      sendJson(response, 401, { error: 'Incorrect email or password.' });
      return;
    }

    sendJson(response, 200, { email: normalizedEmail });
  } catch (error) {
    sendJson(response, 400, { error: error.message || 'Request failed.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tourify auth server running on http://0.0.0.0:${PORT}`);
  console.log(`Account hashes are stored in ${ACCOUNTS_FILE}`);
});