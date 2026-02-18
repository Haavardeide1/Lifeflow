'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { Habit, DailyEntry, DateKey, TimePeriod } from '@/types';
import { getDateRange, getDaysBetween, parseDate } from '@/lib/dateUtils';

interface HabitHeatmapProps {
  habits: Record<string, Habit>;
  entries: Record<DateKey, DailyEntry>;
  period: TimePeriod;
}

export function HabitHeatmap({ habits, entries, period }: HabitHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const activeHabits = useMemo(
    () => Object.values(habits).filter(h => h.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [habits]
  );

  const dates = useMemo(() => {
    const { start, end } = getDateRange(period);
    return getDaysBetween(start, end);
  }, [period]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || activeHabits.length === 0) return;

    const cellSize = 14;
    const cellGap = 2;
    const labelWidth = 140;
    const margin = { top: 24, right: 10, bottom: 10, left: labelWidth };
    const width = margin.left + margin.right + dates.length * (cellSize + cellGap);
    const height = margin.top + margin.bottom + activeHabits.length * (cellSize + cellGap);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', Math.max(width, containerRef.current.clientWidth)).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Month labels on top
    let lastMonth = '';
    dates.forEach((date, i) => {
      const d = parseDate(date);
      const month = d3.timeFormat('%b')(d);
      if (month !== lastMonth) {
        g.append('text')
          .attr('x', i * (cellSize + cellGap))
          .attr('y', -8)
          .attr('fill', 'rgba(255,255,255,0.25)')
          .attr('font-size', '10px')
          .text(month);
        lastMonth = month;
      }
    });

    // Habit labels
    activeHabits.forEach((habit, row) => {
      g.append('text')
        .attr('x', -8)
        .attr('y', row * (cellSize + cellGap) + cellSize / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', 'rgba(255,255,255,0.5)')
        .attr('font-size', '11px')
        .text(habit.name.length > 18 ? habit.name.slice(0, 16) + '...' : habit.name);
    });

    // Cells
    activeHabits.forEach((habit, row) => {
      dates.forEach((date, col) => {
        const entry = entries[date];
        const hc = entry?.habitCompletions.find(c => c.habitId === habit.id);
        const completed = hc?.completed ?? false;
        const hasEntry = !!entry;

        let fill = '#1f2937'; // no entry - dark gray
        if (hasEntry && completed) {
          fill = habit.type === 'good' ? '#22c55e' : '#ef4444';
        } else if (hasEntry && !completed) {
          fill = habit.type === 'good' ? '#1f2937' : '#1a2e1a'; // avoided bad = subtle green
        }

        const opacity = hasEntry ? (completed ? 0.7 : 0.2) : 0.15;

        g.append('rect')
          .attr('x', col * (cellSize + cellGap))
          .attr('y', row * (cellSize + cellGap))
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('rx', 2)
          .attr('fill', fill)
          .attr('opacity', opacity);
      });
    });

  }, [activeHabits, dates, entries]);

  if (activeHabits.length === 0) {
    return (
      <div className="flex items-center justify-center h-[100px] text-gray-400 dark:text-white/30 text-[13px]">
        No active habits.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg ref={svgRef} />
    </div>
  );
}
