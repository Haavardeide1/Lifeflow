# Lifeflow - Continue Here

Last updated: 2026-02-18

## Current status
- Latest deployed commit: `a023ba1` (home hero polish + Slopify footer).
- New wishes/goals feature added (local + Supabase sync):
  - New `Wishes` page with add/edit/remove, 3 graph sections (habit vs actual, overall total, wellbeing goals).
  - Wishes stored in local IndexedDB and synced to Supabase.
  - Supabase schema updated to include `public.wishes` + RLS policies + index.

## Files touched (most recent)
- `src/components/wishes/WishesPage.tsx`
- `src/app/wishes/page.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/types/index.ts`
- `src/stores/lifeflowStore.ts`
- `src/hooks/usePersistence.ts`
- `src/lib/database.ts`
- `src/lib/supabaseSync.ts`
- `supabase-setup.sql`

## What to do next
1. Commit and push to GitHub to trigger Vercel deploy.
2. If any issues with wishes in prod, verify Supabase table `public.wishes` exists and RLS policies are enabled.

## Notes
- Supabase schema was updated earlier to include columns on `habit_completions`:
  `emotional_tags`, `energy`, `mood`, `note`.
- PWA manifest now uses `icon.svg`.
- Service worker avoids caching Supabase requests and caches `/profile`.
