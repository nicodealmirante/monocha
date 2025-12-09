const crypto = require('crypto');

function base64UrlEncode(data) {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(data) {
  data = data.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (data.length % 4);
  if (pad !== 4) data += '='.repeat(pad);
  return Buffer.from(data, 'base64').toString();
}

function parseExpiresIn(expiresIn) {
  if (typeof expiresIn === 'number') return expiresIn;
  const match = /^([0-9]+)([smhd])$/.exec(expiresIn || '');
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 1);
}

function sign(payload, secret, options = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const seconds = parseExpiresIn(options.expiresIn);
  const body = Object.assign({}, payload);

  if (seconds) {
    body.exp = Math.floor(Date.now() / 1000) + seconds;
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

function verify(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado');

  const [encodedHeader, encodedPayload, receivedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (receivedSignature !== expectedSignature) {
    throw new Error('Firma inválida');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado');
  }

  return payload;
}

module.exports = { sign, verify };
