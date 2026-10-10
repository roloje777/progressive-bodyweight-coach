# Portable TypeScript test harness fix

Replace `tests/workoutCompletionBehavior.test.cjs` with the supplied file. The only code change is to load TypeScript from the project's local dependencies rather than a hard-coded global Node path.

From the project root:

```bash
npm install
node -p "require.resolve('typescript')"
node --test tests/completionLifecycleBaseline.test.cjs tests/workoutCompletionBehavior.test.cjs
```

This does not change application logic or completion policy.
