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

assert.ok(contrast('#1C2333', '#D98A66') >= 4.5, 'CTA dark-ink/warm-terracotta contrast must be WCAG AA for normal text');
assert.ok(contrast('#9BB093', '#1C2333') >= 4.5, 'Footer sage/night contrast must be WCAG AA for normal text');
assert.ok(contrast('#F1EEE8', '#262E42') >= 4.5, 'Primary copy on elevated night surface must be WCAG AA');

for (const [file, expectedCtas] of cases) {
  const html = readFileSync(join(here, file), 'utf8');
  assert.match(html, /<meta name="viewport"[^>]*width=device-width/i, `${file}: mobile viewport required`);
  assert.match(html, /role="presentation"/i, `${file}: table-based email layout required`);
  assert.doesNotMatch(html, /<div\s+role="article"[^>]*aria-label=/i, `${file}: article accessible name must not be hardcoded in a different locale`);
  assert.equal((html.match(/{{\s*\.ConfirmationURL\s*}}/g) ?? []).length, 3, `${file}: CTA href, fallback href and visible fallback must use ConfirmationURL`);
  const hrefs = [...html.matchAll(/href="([^"]+)"/gi)].map((match) => match[1].trim());
  assert.equal(hrefs.length, 2, `${file}: exactly two link destinations are expected`);
  for (const href of hrefs) assert.equal(href, '{{ .ConfirmationURL }}', `${file}: every href must be exactly ConfirmationURL with no wrapper or external origin`);
  assert.match(html, /background:#D98A66;border-radius:14px/i, `${file}: current night-theme CTA background required`);
  assert.match(html, /dir="{{ if eq \.Data\.language "ar" }}rtl{{ else }}ltr{{ end }}"/i, `${file}: Arabic RTL direction contract required`);
  assert.match(html, /background:#1C2333/i, `${file}: current night-theme page background required`);
  assert.match(html, /background:#262E42;border:1px solid #3D4658;border-radius:22px/i, `${file}: elevated night card required`);
  assert.match(html, /font-size:12px;color:#9BB093;font-weight:700/i, `${file}: accessible footer tagline color required`);
  for (const locale of locales) {
    assert.match(html, new RegExp(`eq \\.Data\\.language "${locale}"`), `${file}: locale branch ${locale} missing`);
  }
  for (const cta of expectedCtas) assert.ok(html.includes(cta), `${file}: expected localized CTA missing: ${cta}`);
  assert.doesNotMatch(html, /<script\b/i, `${file}: scripts are forbidden`);
  assert.doesNotMatch(html, /{{\s*\.Token(?:Hash)?\s*}}/i, `${file}: literal token placeholders are forbidden`);
  assert.doesNotMatch(html, /https?:\/\//i, `${file}: literal external HTTP(S) URLs are forbidden; only ConfirmationURL may supply the sensitive destination`);
}

console.log(`auth-email templates: ${cases.length} templates, 8 locales and accessible CTA contracts PASS`);
