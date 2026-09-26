import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cases = [
  ['confirm-signup.html', 'Confirmar mi correo'],
  ['reset-password.html', 'Cambiar mi contraseña'],
];

for (const [file, cta] of cases) {
  const html = readFileSync(join(here, file), 'utf8');
  assert.match(html, /<meta name="viewport"[^>]*width=device-width/i, `${file}: mobile viewport required`);
  assert.match(html, /role="presentation"/i, `${file}: table-based email layout required`);
  assert.equal((html.match(/{{\s*\.ConfirmationURL\s*}}/g) ?? []).length, 3, `${file}: CTA href, fallback href and visible fallback must use ConfirmationURL`);
  assert.match(html, new RegExp(`>\\s*${cta}\\s*<`, 'i'), `${file}: expected CTA copy missing`);
  assert.doesNotMatch(html, /<script\b/i, `${file}: scripts are forbidden`);
  assert.doesNotMatch(html, /{{\s*\.Token(?:Hash)?\s*}}/i, `${file}: literal token placeholders are forbidden`);
  assert.doesNotMatch(html, /https?:\/\/(?![^"'\s]*ConfirmationURL)/i, `${file}: external HTTP assets/links are forbidden`);
}
console.log(`auth-email templates: ${cases.length} contracts PASS`);
