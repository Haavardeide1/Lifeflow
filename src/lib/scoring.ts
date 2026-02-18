import type { Habit, HabitCompletion } from '@/types';

export interface HabitImpact {
  weight: number;
  direction: 1 | -1;
}

export function buildHabitImpactMap(habits: Record<string, Habit>): Record<string, HabitImpact> {
  const map: Record<string, HabitImpact> = {};
  for (const habit of Object.values(habits)) {
    if (!habit.active) continue;
    map[habit.id] = {
      weight: habit.weight,
      direction: habit.type === 'good' ? 1 : -1,
    };
  }
  return map;
}

export function calculateHealthScoreFromMap(
  mood: number,
  energy: number,
  sleep: number,
  habitCompletions: HabitCompletion[],
  impactMap: Record<string, HabitImpact>
): number {
  // Base score from subjective ratings (each 1-10, averaged)
  const subjectiveBase = (mood + energy + sleep) / 3;

  // Habit contribution: sum of (weight * direction) for completed habits
  let habitDelta = 0;
  let maxPossibleDelta = 0;

  for (const hc of habitCompletions) {
    const impact = impactMap[hc.habitId];
    if (!impact) continue;

    maxPossibleDelta += impact.weight;

    if (hc.completed) {
      habitDelta += impact.weight * impact.direction;
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

export function calculateHealthScore(
  mood: number,
  energy: number,
  sleep: number,
  habitCompletions: HabitCompletion[],
  habits: Record<string, Habit>
): number {
  return calculateHealthScoreFromMap(
    mood,
    energy,
    sleep,
    habitCompletions,
    buildHabitImpactMap(habits)
  );
}
