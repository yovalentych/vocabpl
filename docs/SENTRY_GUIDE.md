# Sentry Guide (Admin)

## What Sentry does
- Captures client + server errors in real time.
- Lets you track regressions and prioritize fixes.

## Where to look
- Open Sentry and go to **Issues** for new errors.
- Use filters by environment and time range.

## Quick test
1. Log in as admin.
2. Open `/sentry-test`.
3. Click **Trigger client error** and **Trigger server error**.
4. Confirm that both issues appear in Sentry.

## Alerts (recommended)
Set alerts in **Sentry → Alerts**:
- New issue created.
- Regressed issue.
- Spikes in error volume.

## Routine
- Daily: check new issues.
- Weekly: resolve and mark fixed in release.
- Monthly: review top recurring errors.
