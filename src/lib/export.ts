import type { Habit, DailyEntry, DateKey, Wish } from '@/types';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV(
  habits: Record<string, Habit>,
  entries: Record<DateKey, DailyEntry>
): string {
  const activeHabits = Object.values(habits).filter(h => h.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const headers = ['Date', 'Mood', 'Energy', 'Sleep', 'Consistency Score', ...activeHabits.map(h => h.name), 'Notes'];

  const rows = Object.values(entries)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => {
      const habitCols = activeHabits.map(h => {
        const hc = entry.habitCompletions.find(c => c.habitId === h.id);
        return hc?.completed ? 'true' : 'false';
      });
      return [
        entry.date,
        entry.mood.toString(),
        entry.energy.toString(),
        entry.sleep.toString(),
        entry.healthScore.toString(),
        ...habitCols,
        escapeCSV(entry.notes),
      ].join(',');
    });

  return [headers.join(','), ...rows].join('\n');
}

export function exportToJSON(
  habits: Record<string, Habit>,
  entries: Record<DateKey, DailyEntry>,
  wishes?: Record<string, Wish>
): string {
  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    habits: Object.values(habits),
    wishes: wishes ? Object.values(wishes) : [],
    entries: Object.values(entries).sort((a, b) => a.date.localeCompare(b.date)),
  }, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(habits: Record<string, Habit>, entries: Record<DateKey, DailyEntry>): void {
  downloadFile(exportToCSV(habits, entries), 'lifeflow-export.csv', 'text/csv;charset=utf-8;');
}

export function downloadJSON(
  habits: Record<string, Habit>,
  entries: Record<DateKey, DailyEntry>,
  wishes?: Record<string, Wish>
): void {
  downloadFile(exportToJSON(habits, entries, wishes), 'lifeflow-export.json', 'application/json');
}
