const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('Pain Coach introduction is future-proof in EN and pt-PT', () => {
  const screen = fs.readFileSync(path.join(root, 'app/screens/painCoach.tsx'), 'utf8');
  assert.match(screen, /t\("painCoach\.lead"\)/);
  for (const locale of ['en', 'pt-PT']) {
    const content = fs.readFileSync(path.join(root, `i18n/locales/${locale}.ts`), 'utf8');
    const match = content.match(/'painCoach\.lead':\s*'([^']+)'/);
    assert.ok(match, `Missing introduction in ${locale}`);
    assert.doesNotMatch(match[1], /two quick answers|duas respostas rápidas/i);
    assert.match(match[1], locale === 'en' ? /following questions/ : /seguintes perguntas/);
  }
});
