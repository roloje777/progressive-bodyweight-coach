# PBH v1.0 — Release Cleanup #3

Date: 20 September 2026

## Changes

- Added Android `blockedPermissions` for `android.permission.RECORD_AUDIO` as a defence-in-depth release safeguard.
- Removed obsolete generated `docs/tree.html` development artefact.
- Added `PLAY_CONSOLE_PREPARATION.md` with the current-code Play Console declaration baseline and pre-AAB checklist.
- Added `docs/public/privacy-policy.html`, a web-ready copy of the in-app PBH Privacy Policy for later publication at a stable HTTPS URL.

## No behavioural changes

This cleanup does not change workout/program behaviour, progression, recovery, history, audio playback, exports or user settings.

## Still to do outside this commit

- Choose/confirm the final Play Store target audience selection.
- Host `docs/public/privacy-policy.html` at a public HTTPS URL.
- Create the first production AAB and inspect its merged manifest/permissions.
- Complete Play Console declarations against the exact submitted build.
