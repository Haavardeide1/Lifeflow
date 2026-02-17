import type { Habit, DailyEntry, DateKey, HabitCorrelation } from '@/types';

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;

  return numerator / denom;
}

export function calculateCorrelations(
  habits: Record<string, Habit>,
  entries: Record<DateKey, DailyEntry>
): HabitCorrelation[] {
  const entryList = Object.values(entries).sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  if (entryList.length < 3) return [];

  const moodArr = entryList.map(e => e.mood);
  const energyArr = entryList.map(e => e.energy);
  const scoreArr = entryList.map(e => e.healthScore);

  return Object.values(habits)
    .filter(h => h.active)
    .map(habit => {
      const completionArr = entryList.map(entry => {
        const hc = entry.habitCompletions.find(c => c.habitId === habit.id);
        return hc?.completed ? 1 : 0;
      });

      const completionCount = completionArr.filter(v => v === 1).length;

      return {
        habitId: habit.id,
        habitName: habit.name,
        habitType: habit.type,
        correlationWithMood: pearsonCorrelation(completionArr, moodArr),
        correlationWithEnergy: pearsonCorrelation(completionArr, energyArr),
        correlationWithHealthScore: pearsonCorrelation(completionArr, scoreArr),
        completionCount,
        totalDays: entryList.length,
        completionRate: (completionCount / entryList.length) * 100,
      };
    })
    .sort((a, b) =>
      Math.abs(b.correlationWithMood) - Math.abs(a.correlationWithMood)
    );
}
