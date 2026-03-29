// utils/assert.ts
export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
}