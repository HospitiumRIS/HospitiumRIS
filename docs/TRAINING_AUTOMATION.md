# Training automation

One hourly job keeps trainings moving without anyone pressing buttons (#110).

| | |
| --- | --- |
| URL | `GET` or `POST /api/cron/training` with `Authorization: Bearer $CRON_SECRET` |
| Ops job | `training_automation` on **Operations › Jobs** (run history, overdue warning, *Run now*) |
| Code | `src/lib/training-automation.js` (planning, pure) and `src/lib/training-automation-server.js` (runner) |

## What each run does

1. **Closes ended trainings.** `PUBLISHED` trainings whose end date has passed become `COMPLETED`. The update only applies while the training is still `PUBLISHED`, and each change is written to the activity log as *Status changed automatically* by System.
2. **Decides completion** for trainings that ended in the last 120 days and have completion rules (attendance, modules, assessments, feedback). Certificates are issued for trainings in automatic mode.
3. **Session reminders** to people holding a place (`REGISTERED`):
   - *Tomorrow* reminder: the session starts within 24 hours but more than 75 minutes from now.
   - *Starting soon* reminder: the session starts within 75 minutes.
   - *Check-in is open*: inside the session's check-in window, for in-person and hybrid sessions.
   - Cancelled sessions, and sessions of draft or cancelled trainings, get nothing.
4. **Compliance notices** (#103): due in 7 days and weekly overdue reminders for assigned trainings; certificate expiring (30 days before) and re-training due (on the day it expires).
5. **Feedback requests** (#106) for trainings that ended in the last 14 days, to people who haven't answered.

## Never twice

Every notice has a dedupe key, stored on the in-app notification:

| Notice | Key |
| --- | --- |
| Tomorrow reminder | `reminder-24h:<sessionId>` |
| Starting soon | `reminder-1h:<sessionId>` |
| Check-in open | `checkin-open:<sessionId>` |
| Due soon / overdue | `due:<registrationId>:<dueDate>` / `overdue:<registrationId>:<dueDate>:w<weeks>` |
| Certificate expiring / expired | `cert-expiring:<certificateId>` / `retraining:<certificateId>` |
| Feedback request | `feedback:<registrationId>` |

Before sending, the person's notifications are checked for the key, so re-running the job (or running it late) sends nothing that already went out. A second run in the same server process while one is in progress returns *Already running*. `tests/training-automation.test.js` re-runs the plan to prove it.

## Without a scheduler

The job also runs:

- in the background when someone opens the training catalogue or their learning hub, at most every 15 minutes per server;
- when a training admin presses **Run automation now** on a training's **Activity** tab (or *Run now* on Operations › Jobs).

So reminders keep going before `CRON_SECRET` is set. A real hourly schedule makes them punctual:

```cron
5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://hospitium.hospitiumris.org/api/cron/training
```

## Activity log

Each training's **Activity** tab lists its audit log (newest first). It can be filtered by action, by who made the change (me / System), by date and by record id or reason. Each entry shows what changed, and the list exports to CSV (up to 10,000 entries).
