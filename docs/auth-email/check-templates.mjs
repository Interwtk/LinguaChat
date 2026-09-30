import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const locales = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar'];
const cases = [
  ['confirm-signup.html', ['Confirm my email', 'Confirmar mi correo', 'メールを確認する', 'تأكيد بريدي الإلكتروني']],
  ['reset-password.html', ['Change my password', 'Cambiar mi contraseña', 'パスワードを変更', 'تغيير كلمة المرور']],
];

function channel(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map((part) => channel(Number.parseInt(part, 16)));
  return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]);
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

assert.ok(contrast('#FFFFFF', '#A9563A') >= 4.5, 'CTA white/deep-terracotta contrast must be WCAG AA for normal text');

for (const [file, expectedCtas] of cases) {
  const html = readFileSync(join(here, file), 'utf8');
  assert.match(html, /<meta name="viewport"[^>]*width=device-width/i, `${file}: mobile viewport required`);
  assert.match(html, /role="presentation"/i, `${file}: table-based email layout required`);
  assert.equal((html.match(/{{\s*\.ConfirmationURL\s*}}/g) ?? []).length, 3, `${file}: CTA href, fallback href and visible fallback must use ConfirmationURL`);
  assert.match(html, /background:#A9563A;border-radius:12px/i, `${file}: accessible CTA background required`);
  assert.doesNotMatch(html, /background:#C86B4A;border-radius:12px/i, `${file}: low-contrast CTA color must not return`);
  for (const locale of locales) {
    assert.match(html, new RegExp(`eq \\.Data\\.language "${locale}"`), `${file}: locale branch ${locale} missing`);
  }
  for (const cta of expectedCtas) assert.ok(html.includes(cta), `${file}: expected localized CTA missing: ${cta}`);
  assert.doesNotMatch(html, /<script\b/i, `${file}: scripts are forbidden`);
  assert.doesNotMatch(html, /{{\s*\.Token(?:Hash)?\s*}}/i, `${file}: literal token placeholders are forbidden`);
  assert.doesNotMatch(html, /https?:\/\/(?![^"'\s]*ConfirmationURL)/i, `${file}: external HTTP assets/links are forbidden`);
}

console.log(`auth-email templates: ${cases.length} templates, 8 locales and accessible CTA contracts PASS`);
