import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

export function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function maskEmail(email) {
  if (!email) return email;
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  if (name.length <= 2) return name[0] + '***@' + parts[1];
  return name[0] + '***' + name[name.length - 1] + '@' + parts[1];
}

export function escapeHtml(text) {
  if (!text) return text;
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return String(text).replace(/[&<>"'`=/]/g, (chr) => htmlEscapes[chr]);
}

export function unescapeHtml(text) {
  if (!text) return text;
  const htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  return String(text).replace(/&(amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, (match) => htmlUnescapes[match] || match);
}

export function escapeLikeQuery(text) {
  if (!text) return text;
  return String(text).replace(/[%_\\]/g, (chr) => '\\' + chr);
}
