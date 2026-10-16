const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const src = fs.readFileSync(path.join(__dirname,"../engine/RetryRecoveryPolicy.ts"),"utf8");
const js = src.replace(/export type RetryRecoveryLock = Readonly<\{[\s\S]*?\}>;/, "")
  .replace(/export function createRetryRecoveryLock\(input: \{[\s\S]*?\}\): RetryRecoveryLock/,"function createRetryRecoveryLock(input)")
  .replace(/export function isRetryLocked\(lock: RetryRecoveryLock \| null, current: \{[\s\S]*?\}\): boolean/,"function isRetryLocked(lock, current)");
const {createRetryRecoveryLock, isRetryLocked} = new Function(js+"\nreturn {createRetryRecoveryLock,isRetryLocked};")();
const now=1700000000000, lock=createRetryRecoveryLock({programId:"L1",weekIndex:5,dayIndex:3,now,hours:24});
test("24h lock is exact and persists via epoch timestamp",()=>{assert.equal(lock.unlockAt-now,86400000);assert.equal(isRetryLocked(lock,{programId:"L1",weekIndex:5,dayIndex:3,now:now+86399999,enabled:true}),true);assert.equal(isRetryLocked(lock,{programId:"L1",weekIndex:5,dayIndex:3,now:now+86400000,enabled:true}),false)});
test("lock cannot affect another workout",()=>assert.equal(isRetryLocked(lock,{programId:"L1",weekIndex:5,dayIndex:2,now,enabled:true}),false));
test("optional enforcement can be disabled",()=>assert.equal(isRetryLocked(lock,{programId:"L1",weekIndex:5,dayIndex:3,now,enabled:false}),false));
test("12h and 48h configurations",()=>[12,48].forEach(hours=>assert.equal(createRetryRecoveryLock({programId:"L1",weekIndex:0,dayIndex:0,now,hours}).unlockAt-now,hours*3600000)));
