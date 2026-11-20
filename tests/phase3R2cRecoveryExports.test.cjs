const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const helperSource = fs.readFileSync(path.join(root, 'utils/recoveryHistoryExport.ts'), 'utf8');
const screenSource = fs.readFileSync(path.join(root, 'app/screens/recoveryHistory.tsx'), 'utf8');
const compiled = ts.transpileModule(helperSource, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}, reportDiagnostics: true});
const exported = {};
vm.runInNewContext(compiled.outputText, {exports: exported, require: () => ({exportWorkoutReport: async () => {}}), Date});
const {buildRecoveryHistoryReport} = exported;
const sample = [
  {id:'a',kind:'abort',time:1000,title:'Aborted',summary:'Other',details:['Note: <hello> & "world"']},
  {id:'m',kind:'medical',time:2000,title:'Medical',summary:'Pain 0/10',details:['Clearance: Yes'],privateDetails:['Treatment: SECRET TREATMENT','Private notes: SECRET NOTES']},
];
test('all scopes include both entries; selected scope limits entries', () => {
  const all = buildRecoveryHistoryReport(sample,'all',false,false);
  assert.match(all.text,/Aborted/); assert.match(all.text,/Medical/);
  const filtered = buildRecoveryHistoryReport(sample,'abort',false,false);
  assert.match(filtered.text,/Aborted/); assert.doesNotMatch(filtered.text,/Medical/);
});
test('medical private information is excluded by default and included only on opt-in', () => {
  const safe = buildRecoveryHistoryReport(sample,'all',false,false);
  for(const output of [safe.text,safe.html]) { assert.doesNotMatch(output,/SECRET TREATMENT|SECRET NOTES/); }
  const explicit = buildRecoveryHistoryReport(sample,'all',true,false);
  assert.match(explicit.text,/SECRET TREATMENT/); assert.match(explicit.html,/SECRET NOTES/);
});
test('HTML escapes user data; newest first; Portuguese headings', () => {
  const report = buildRecoveryHistoryReport(sample,'all',false,true);
  assert.match(report.html,/&lt;hello&gt; &amp; &quot;world&quot;/);
  assert.ok(report.text.indexOf('Medical') < report.text.indexOf('Aborted'));
  assert.match(report.text,/Histórico de dor e recuperação/);
});
test('screen provides scope, formats and private toggle reset on focus', () => {
  assert.match(screenSource,/\["pdf", "html", "txt"\]/);
  assert.match(screenSource,/exportScope === "all" \? "all" : filter/);
  assert.match(screenSource,/setIncludePrivate\(false\); void load\(\)/);
  assert.match(screenSource,/<Switch value=\{includePrivate\}/);
  const syntax = ts.transpileModule(screenSource,{fileName:'recoveryHistory.tsx',compilerOptions:{jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
  assert.equal(syntax.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
});
