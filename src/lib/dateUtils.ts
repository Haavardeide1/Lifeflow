import type { DateKey, TimePeriod } from '@/types';

export function formatDate(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): DateKey {
  return formatDate(new Date());
}

export function parseDate(dateKey: DateKey): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateKey: DateKey, days: number): DateKey {
  const d = parseDate(dateKey);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function getDateRange(period: TimePeriod): { start: DateKey; end: DateKey } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':  start.setDate(end.getDate() - 7); break;
    case '30d': start.setDate(end.getDate() - 30); break;
    case '90d': start.setDate(end.getDate() - 90); break;
    case 'all': start.setFullYear(2020); break;
  }

  return { start: formatDate(start), end: formatDate(end) };
}

export function getDaysBetween(start: DateKey, end: DateKey): DateKey[] {
  const dates: DateKey[] = [];
  const current = parseDate(start);
  const endDate = parseDate(end);
  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function formatDisplayDate(dateKey: DateKey): string {
  const d = parseDate(dateKey);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(dateKey: DateKey): string {
  const d = parseDate(dateKey);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isToday(dateKey: DateKey): boolean {
  return dateKey === today();
}

export function isFuture(dateKey: DateKey): boolean {
  return dateKey > today();
}
