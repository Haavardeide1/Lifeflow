import type { Habit, HabitCompletion } from '@/types';

export function calculateHealthScore(
  mood: number,
  energy: number,
  sleep: number,
  habitCompletions: HabitCompletion[],
  habits: Record<string, Habit>
): number {
  // Base score from subjective ratings (each 1-10, averaged)
  const subjectiveBase = (mood + energy + sleep) / 3;

  // Habit contribution: sum of (weight * direction) for completed habits
  let habitDelta = 0;
  let maxPossibleDelta = 0;

  for (const hc of habitCompletions) {
    const habit = habits[hc.habitId];
    if (!habit || !habit.active) continue;

    maxPossibleDelta += habit.weight;

    if (hc.completed) {
      const direction = habit.type === 'good' ? 1 : -1;
      habitDelta += habit.weight * direction;
    }
  }

  // Normalize habit delta to -5 to +5 range
  const normalizedDelta = maxPossibleDelta > 0
    ? (habitDelta / maxPossibleDelta) * 5
    : 0;

  // Final score clamped to 0-10
  const raw = subjectiveBase + normalizedDelta;
  return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
}
