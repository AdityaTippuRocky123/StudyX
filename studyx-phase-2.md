# StudyX — Phase 2: Focus Timer Heatmap, Study Logs Graph, Final Integration

Stack-agnostic. Assumes Phase 1 is done (data layer, dashboard, subject tracker, chapter list already seeded).

## Core data model (reference)

| Entity | Fields |
| --- | --- |
| StudySession | id, date, startTime, durationMin, subjectId, chapterId (optional), source (timer / manual) |
| Todo | id, text, done, createdAt, subjectId / chapterId (optional) |
| Subject | id, name (Physics / Chemistry / Maths) |
| Chapter | id, subjectId, name, group (Physical / Inorganic / Organic, chemistry only), order |
| ChapterProgress | chapterId, percentDone (0-100), pyq {2022, 2023, 2024, 2025, 2026: bool}, notes (text), completed (derived) |

**Derived values** (never stored, always computed):

- `completed` = percentDone >= 90 and at least one PYQ year ticked
- `dailyMinutes[date]` = sum of StudySession.durationMin for that date
- `todayTotal` = dailyMinutes for today
- `streak` = consecutive days ending today (or yesterday, if today has no session yet) with dailyMinutes > 0

**Interconnection rules:**

1. The focus timer writes a StudySession. The dashboard total, streak, heatmap and study logs graph all read from it.
2. A session tagged with a chapter lets the subject tracker show hours per chapter.
3. A to-do tagged with a chapter can link to that chapter. Completing the chapter can auto-tick linked to-dos.

---

## Step 4. Focus Timer heatmap (last 90 days)

- Grid of 90 cells in week columns by 7 weekday rows, GitHub style. The oldest day is top-left and today is the last cell.
- Intensity buckets from `dailyMinutes` (timer-recorded time plus any manually added study logs): 0 = empty, then 4 levels of darker shade. Use fixed thresholds (for example under 30, 30-90, 90-180, 180+ min) or quartiles of the user's own data. Pick one and keep it consistent.
- Tooltip on hover or tap shows the date and total hours.
- Stopping and saving the timer writes a StudySession, with an optional subject and chapter picker before starting. The heatmap updates immediately.

## Step 5. Study Logs graph (non-smooth, creative)

- Replace the smooth curve with a bar-based visual: rounded vertical bars, each split into stacked Physics / Chemistry / Maths segments. It is not smooth, it carries more information than a plain line, and it uses subject data already in the model.
- Range toggle:
  - **Weekly**: last 7 days, one bar per day
  - **Monthly**: current month, one bar per day
  - **All-time**: one bar per week, or per month once data spans many months
- Show the total, daily average and best day for the selected range above the chart.
- Everything comes from `dailyMinutes` grouped by subject, so no new data is needed.

## Step 6. Integration pass

- Chapter picker in the timer feeds per-chapter hours into the subject tracker detail.
- Test streak edge cases: no session today but one yesterday (streak intact), a gap day (streak resets), and midnight rollover.
- Remove leftover references to the deleted dashboard sections.
- Verify propagation: log a 2-hour session and confirm the dashboard hours, streak, heatmap cell and logs bar all update.

---

## Phase 2 done when

- A single timer session updates all four surfaces: dashboard hours, streak, heatmap and logs graph.
- The heatmap and graph handle empty and sparse data without breaking.
