# PBH v1.0 — Play Console Preparation

Prepared: 20 September 2026

This file records the recommended Play Console declarations for the current PBH v1.0 codebase. Re-check these answers if the app gains accounts, cloud sync, analytics, advertising, billing, new permissions, or third-party SDKs before submission.

## Release identity

- App version: 1.0.0
- Android application ID: `com.roloje777.progressivebodyweightcoach`
- EAS app version source: remote
- EAS production build: `autoIncrement: true`
- Developer: João Rolo
- Support: pbh.coach@gmail.com
- Ads in current v1.0: No
- PBH account/login in current v1.0: No

## Permissions

PBH audio coaching is playback-only. `expo-audio` is configured with `recordAudioAndroid: false` and `microphonePermission: false`.

`android.permission.RECORD_AUDIO` is additionally listed in Expo `android.blockedPermissions` so it cannot be introduced into the merged Android manifest by a library dependency.

The final AAB manifest must still be inspected before submission.

## Health Apps declaration

Recommended category for current v1.0:

- Health and fitness → Activity and Fitness: YES

PBH records exercise routines/workouts and uses training performance/feedback to provide progression, recovery and adaptive coaching. It is not presented as a medical device, diagnostic service, treatment service, physical-therapy service, or clinical decision-support product.

Do not select additional health categories unless the shipped app changes.

## Ads declaration

Recommended answer: NO — PBH v1.0 does not contain advertising.

Re-check before submission if an advertising SDK is introduced.

## App access

Current v1.0 has no PBH account, login, membership gate or otherwise restricted core app access.

Recommended answer: all functionality is available without special access credentials.

## Target audience

PBH is a structured hypertrophy/bodyweight training product, not a children's app. Do not select child age groups merely to maximise availability because selecting child audiences can trigger Google Play Families requirements.

Choose the final adult/older-user age group(s) in Play Console based on the intended marketed audience. If the intention is to make PBH adults-only, select only the applicable adult group and use Play Console's minor-access restriction where appropriate. This is a product/publishing decision rather than a code-derived fact.

## Content rating

Complete Google's IARC content-rating questionnaire truthfully from the final build. PBH is a fitness/training app; no content-rating result is hard-coded in this project.

## Data Safety — current-code assessment

Current source audit found:

- no PBH cloud backend;
- no PBH user account;
- no advertising SDK;
- no behavioural advertising;
- no Firebase/remote analytics service in the current dependency/application code;
- core training/history/preferences stored locally with AsyncStorage;
- workout exports are created locally and shared only after the user explicitly invokes export/share;
- exercise guides may open external web links after a user action;
- support email opens the user's mail client after a user action.

Google's Data Safety form uses specific definitions and exemptions. User-initiated transfer to another app/service is not automatically the same as developer collection/sharing. Complete the form against the final AAB and current Google definitions at submission time.

For the present codebase, there is no evidence that PBH itself collects workout/health data off-device for the developer. Do not add a collection declaration merely because data is stored locally on-device. If Play Console asks about a data type because of a future SDK or feature, reassess before answering.

## Privacy Policy

The in-app Privacy Policy is implemented at:

`app/screens/legal/privacy.tsx`

Google Play also requires an active public, non-geofenced, non-editable web URL for the Privacy Policy. For health apps the URL must not be a PDF. A web-ready copy is included at:

`docs/public/privacy-policy.html`

That file is a publication source only; it does not become a public URL until hosted. Enter the final hosted HTTPS URL in Play Console.

## Terms and licences

- Terms of Use: `app/screens/legal/terms.tsx`
- Open-source licences: `app/screens/legal/licenses.tsx`

## Closed testing

For a qualifying new personal developer account, complete the required closed test before applying for production access. Keep testing records and genuine tester feedback for the production-access application.

## Final checks before first AAB submission

1. Run `npx tsc --noEmit`.
2. Run `npx expo-doctor` and review every warning.
3. Run the PBH regression/scenario tests.
4. Create the production Android App Bundle with the production EAS profile.
5. Inspect the generated AAB/merged manifest, especially permissions, package ID, version name/version code and SDK levels.
6. Install/test the Play-distributed build through an internal/closed track rather than relying only on Expo Go.
7. Re-check Data Safety and Health Apps declarations against the exact build being submitted.
8. Publish the Privacy Policy to a stable HTTPS URL and enter it in Play Console.
