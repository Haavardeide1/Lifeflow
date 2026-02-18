# Improve18

Date: 2026-02-18

## Summary
- Wishes & Goals feature now exists as its own page (`/wishes`) with add/edit/remove.
- Wishes persist locally (IndexedDB) and sync to Supabase (`public.wishes`).
- Production is deployed on commit `e26fedd` (Fix wishes sync lint).
- UI cleanup pending in this file (see below).

## Code Analysis (Current)
- State management: `src/stores/lifeflowStore.ts` (Zustand) holds `habits`, `entries`, `wishes`, undo/redo history.
- Persistence: `src/hooks/usePersistence.ts`
  - IndexedDB via `src/lib/database.ts` for offline cache.
  - Supabase sync via `src/lib/supabaseSync.ts` for habits, entries, wishes.
  - Wishes are now synced (upsert/delete) and loaded with fallback to local cache.
- Data model:
  - `Wish`: kind `habit` or `metric`, with `targetPerWeek` or `targetValue`.
  - Supabase table: `public.wishes` with RLS policies and index (`idx_wishes_user_id`).
- UI routing:
  - `/wishes` page: `src/app/wishes/page.tsx`
  - Sidebar includes Wishes link.
- Charts:
  - Habit wishes vs actual (weekly count).
  - Overall habit target vs actual (weekly total).
  - Wellbeing goals vs actual (weekly averages).

## UI Cleanup Plan
- Add auto-title behavior (habit name / metric name when title empty).
- Reduce layout overlap in Add/Edit form.
- Disable submit when required inputs are missing.
- Keep edit actions aligned and clear.

## Known Risks / Notes
- Supabase and IndexedDB fallback: when Supabase has no wishes, local wishes are used once.
- Wishes are not included in export (`export.ts`) yet.
- No pagination or filtering for wishes (fine for now).

## Next Steps (Tomorrow)
1. Verify Wishes page UI polish and auto-title behavior.
2. Confirm wishes sync both directions on prod with a test user.
3. Consider adding wishes to export JSON/CSV if needed.
