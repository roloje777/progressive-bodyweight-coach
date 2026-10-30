const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const reasons = ['history','persistent','form','resolved'];
test('all immediate Pain Coach decision reasons have EN and pt-PT translations', () => {
  const en = read('i18n/locales/en.ts');
  const pt = read('i18n/locales/pt-PT.ts');
  const screen = read('app/screens/painCoach.tsx');
  for (const reason of reasons) {
    const key = `painCoach.reason.${reason}`;
    assert.ok(en.includes(`'${key}':`), `Missing EN ${key}`);
    assert.ok(pt.includes(`'${key}':`), `Missing pt-PT ${key}`);
    assert.ok(screen.includes(`"${key}"`), `Missing UI mapping ${key}`);
  }
  assert.match(screen, /t\(PAIN_REASON_KEYS\[/);
});

test('translation keys occur exactly once per locale', () => {
  for (const locale of ['en', 'pt-PT']) {
    const content = read(`i18n/locales/${locale}.ts`);
    for (const reason of reasons) {
      const matches = content.match(new RegExp(`'painCoach\\.reason\\.${reason}':`, 'g')) || [];
      assert.equal(matches.length, 1, `${locale} duplicate key for ${reason}`);
    }
  }
});
