# PBH v1.0 — Play Store Release Cleanup #1

## Changes

- Removed explicit Android `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` permissions.
- Configured `expo-audio` with `recordAudioAndroid: false` and `microphonePermission: false` for playback-only use.
- Removed verbose development logging from `preWorkoutOverView.tsx`, `workoutRunner.tsx`, and normal lifecycle logs in the active `SoundManager.ts` while retaining warning/error handling.
- Moved routable development/test screens out of the Expo Router `app/` tree into `dev-tools/screens/` so they are not production routes.
- Removed hidden long-press navigation to the old test route from `TopProgressBar`.
- Removed obsolete `SoundManager_old.ts` and `SoundManagerExpoAv_old.ts` backups.
- Removed `assets/videos/test.mp4` and cleared the six remaining `videoKey: "test"` placeholders from exercise guide data.
- Removed the now-unused local test-video rendering branch from `exerciseGuideScreen.tsx`; external exercise video links remain unchanged.

## Verification note

The supplied ZIP did not contain `node_modules`, so a full TypeScript/Expo validation cannot be run in this extracted copy until dependencies are installed. Run the project's normal install/typecheck/lint/start workflow after copying these changes into the development checkout.

## Development test access adjustment

- Added `app/screens/devTools.tsx` as a single development-only gateway to the preserved test screens under `dev-tools/`.
- Restored long-press access from `TopProgressBar` only when `__DEV__` is true (for example Expo Go/development builds).
- Production builds do not attach the long-press developer navigation, and direct access to the gateway redirects to the normal app.
- Corrected relative imports in moved legacy/test files so their new `dev-tools/` location does not break module resolution.
