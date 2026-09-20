# PBH v1.0 — Play Store Release Cleanup #2

Date: 19 September 2026

## Implemented

- Replaced the Help & About support placeholder with PBH support details.
- Added one-tap support email to `pbh.coach@gmail.com` and identifies the developer as João Rolo.
- Added an in-app Privacy Policy covering PBH 1.0's local training storage, exports/sharing, external links, retention/deletion, security, fitness information and contact details.
- Added in-app Terms of Use with exercise/medical disclaimer, adaptive-coaching limitations, local-data considerations, intellectual property, availability, liability and Portugal governing-law language subject to mandatory consumer rights.
- Added an Open-Source Licences screen generated from the resolved `package-lock.json` dependency tree for this release.
- Added Legal & Privacy navigation from Help & About.

## Still required before Google Play submission

1. Host the final Privacy Policy on a public, active, non-geofenced, non-editable web URL. Google Play requires the privacy policy in Play Console as well as access within the app. The in-app policy added here does not replace that external URL requirement.
2. Re-check the Privacy Policy and Data Safety answers against the final release AAB and final SDK/dependency set.
3. Consider legal review of Terms/Privacy before commercial release, particularly before subscriptions/accounts/cloud services are introduced.
4. For third-party notices, re-run the licence inventory whenever dependencies change. Before the production AAB, verify package-distributed LICENSE/NOTICE files where required; the current screen is generated from lockfile licence metadata and is not a substitute for a dependency's specific notice obligations.
