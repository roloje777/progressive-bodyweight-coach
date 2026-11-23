const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
test('Help screen renders five additional Pain Coach and recovery FAQs', () => {
  const screen = read('app/screens/helpAbout.tsx');
  for (let i=19;i<=23;i++) assert.match(screen, new RegExp('help\\.topic'+i+'\\.title'));
});
test('EN and pt-PT include equivalent recovery education keys', () => {
  for(const locale of ['en','pt-PT']) {
    const s=read('i18n/locales/'+locale+'.ts');
    for(const key of ['help.topic5.body','help.topic7.body','home.welcome.coachingBody','home.welcome.helpBody',...Array.from({length:5},(_,i)=>'help.topic'+(i+19)+'.title'),...Array.from({length:5},(_,i)=>'help.topic'+(i+19)+'.body')]) {
      assert.equal(s.split("'"+key+"':").length-1,1,locale+' '+key);
    }
    assert.match(s,/Medical Recovery|Recuperação Médica/);
    assert.match(s,/Pain Week|Semana de Dor/);
  }
});
