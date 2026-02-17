'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { Habit, DailyEntry, DateKey, TimePeriod } from '@/types';
import { getDateRange, getDaysBetween } from '@/lib/dateUtils';

interface RadarChartProps {
  habits: Record<string, Habit>;
  entries: Record<DateKey, DailyEntry>;
  period: TimePeriod;
}

export function RadarChart({ habits, entries, period }: RadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const data = useMemo(() => {
    const { start, end } = getDateRange(period);
    const dates = getDaysBetween(start, end);
    const periodEntries = dates.map(d => entries[d]).filter(Boolean);
    if (periodEntries.length === 0) return [];

    return Object.values(habits)
      .filter(h => h.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(habit => {
        let completed = 0;
        periodEntries.forEach(e => {
          const hc = e.habitCompletions.find(c => c.habitId === habit.id);
          if (hc?.completed) completed++;
        });
        const rate = completed / periodEntries.length;
        return {
          name: habit.name.length > 14 ? habit.name.slice(0, 12) + '...' : habit.name,
          rate,
          type: habit.type,
          color: habit.color,
        };
      });
  }, [habits, entries, period]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length < 3) return;

    const size = Math.min(containerRef.current.clientWidth, 360);
    const margin = 60;
    const radius = (size - margin * 2) / 2;
    const center = size / 2;
    const angleSlice = (2 * Math.PI) / data.length;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size);

    const g = svg.append('g').attr('transform', `translate(${center},${center})`);

    const rScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);

    // Concentric circles
    [0.25, 0.5, 0.75, 1].forEach(level => {
      g.append('circle')
        .attr('r', rScale(level))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.06)')
        .attr('stroke-dasharray', level < 1 ? '3,3' : 'none');

      if (level < 1) {
        g.append('text')
          .attr('x', 4)
          .attr('y', -rScale(level) - 2)
          .attr('fill', 'rgba(255,255,255,0.15)')
          .attr('font-size', '9px')
          .text(`${Math.round(level * 100)}%`);
      }
    });

    // Axis lines and labels
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', x).attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.06)');

      const labelRadius = radius + 16;
      const lx = Math.cos(angle) * labelRadius;
      const ly = Math.sin(angle) * labelRadius;

      g.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('dy', '0.35em')
        .attr('text-anchor', Math.abs(lx) < 5 ? 'middle' : lx > 0 ? 'start' : 'end')
        .attr('fill', d.type === 'good' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)')
        .attr('font-size', '10px')
        .text(d.name);
    });

    // Filled area
    const radarLine = d3.lineRadial<typeof data[0]>()
      .angle((_, i) => angleSlice * i)
      .radius(d => rScale(d.type === 'good' ? d.rate : 1 - d.rate))
      .curve(d3.curveCardinalClosed.tension(0.3));

    g.append('path')
      .datum(data)
      .attr('d', radarLine)
      .attr('fill', 'rgba(34,197,94,0.12)')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Dots
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const val = d.type === 'good' ? d.rate : 1 - d.rate;
      const x = Math.cos(angle) * rScale(val);
      const y = Math.sin(angle) * rScale(val);

      g.append('circle')
        .attr('cx', x).attr('cy', y)
        .attr('r', 4)
        .attr('fill', d.type === 'good' ? '#22c55e' : '#ef4444')
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 2);
    });

  }, [data]);

  if (data.length < 3) {
    return (
      <div className="flex items-center justify-center h-[200px] text-white/30 text-[13px]">
        Need at least 3 habits to show radar chart.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex justify-center">
      <svg ref={svgRef} />
    </div>
  );
}
