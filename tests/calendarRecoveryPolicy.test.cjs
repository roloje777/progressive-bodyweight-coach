const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const os = require("node:os");
const source = path.join(__dirname,"../engine/CalendarRecoveryPolicy.ts");
// Transpile the pure policy with the installed TypeScript CLI, then execute it.
const dir = fs.mkdtempSync(path.join(os.tmpdir(),"pbh-calendar-"));
try {
  execFileSync(process.execPath,[require.resolve("typescript/bin/tsc"),source,"--target","ES2020","--module","commonjs","--outDir",dir,"--skipLibCheck"],{stdio:"pipe"});
  const {localDateKey,recoveryUnlockDate,recoveryPending,matchesRecovery} = require(path.join(dir,"CalendarRecoveryPolicy.js"));
  test("one full recovery day unlocks Thursday at local midnight after Tuesday",()=>{
    assert.equal(recoveryUnlockDate("2026-10-13",1),"2026-10-15");
  });
  test("two full recovery days unlock Friday after Tuesday",()=>{
    assert.equal(recoveryUnlockDate("2026-10-13",2),"2026-10-16");
  });
  test("scheduled recovery plus extra day adds rather than replaces",()=>{
    assert.equal(recoveryUnlockDate("2026-10-13",2),"2026-10-16");
  });
  test("calendar comparison and identity prevent unrelated locks",()=>{
    const lock={programId:"level1",weekIndex:2,dayIndex:1,sourceDay:"2026-10-13",recoveryDays:2,kind:"retry"};
    assert.equal(matchesRecovery(lock,{programId:"level1",weekIndex:2,dayIndex:1}),true);
    assert.equal(matchesRecovery(lock,{programId:"level1",weekIndex:2,dayIndex:2}),false);
    assert.equal(recoveryPending(lock,new Date(2026,9,15,23,59)),true);
    assert.equal(recoveryPending(lock,new Date(2026,9,16,0,0)),false);
  });
  test("local date rollover works across DST",()=>{
    assert.equal(recoveryUnlockDate("2026-10-24",2),"2026-10-27");
    assert.equal(recoveryUnlockDate("2026-03-28",1),"2026-03-30");
  });
} finally { /* temporary compiled policy is isolated from the project */ }
