'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import type { DailyEntry, DateKey, TimePeriod } from '@/types';
import { getDateRange, getDaysBetween, parseDate, formatShortDate } from '@/lib/dateUtils';

interface HealthScoreGraphProps {
  entries: Record<DateKey, DailyEntry>;
  period: TimePeriod;
}

export function HealthScoreGraph({ entries, period }: HealthScoreGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; entry: DailyEntry;
  } | null>(null);

  const dataPoints = useMemo(() => {
    const { start, end } = getDateRange(period);
    const dates = getDaysBetween(start, end);
    return dates
      .filter(d => entries[d])
      .map(d => ({ date: d, entry: entries[d] }));
  }, [entries, period]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (dataPoints.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 280;
    const margin = { top: 20, right: 20, bottom: 30, left: 36 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(dataPoints, d => parseDate(d.date)) as [Date, Date])
      .range([0, innerW]);

    const yScale = d3.scaleLinear()
      .domain([0, 10])
      .range([innerH, 0]);

    // Background zones
    const zones = [
      { y0: 0, y1: 3, color: '#ef4444', opacity: 0.04 },
      { y0: 3, y1: 7, color: '#eab308', opacity: 0.03 },
      { y0: 7, y1: 10, color: '#22c55e', opacity: 0.04 },
    ];

    zones.forEach(z => {
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(z.y1))
        .attr('width', innerW)
        .attr('height', yScale(z.y0) - yScale(z.y1))
        .attr('fill', z.color)
        .attr('opacity', z.opacity);
    });

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data([2, 4, 6, 8])
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'rgba(255,255,255,0.04)')
      .attr('stroke-dasharray', '4,4');

    // Area
    const area = d3.area<typeof dataPoints[0]>()
      .x(d => xScale(parseDate(d.date)))
      .y0(innerH)
      .y1(d => yScale(d.entry.healthScore))
      .curve(d3.curveMonotoneX);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'health-gradient')
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.02);

    g.append('path')
      .datum(dataPoints)
      .attr('d', area)
      .attr('fill', 'url(#health-gradient)');

    // Line
    const line = d3.line<typeof dataPoints[0]>()
      .x(d => xScale(parseDate(d.date)))
      .y(d => yScale(d.entry.healthScore))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round');

    // Dots
    g.selectAll('circle')
      .data(dataPoints)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(parseDate(d.date)))
      .attr('cy', d => yScale(d.entry.healthScore))
      .attr('r', dataPoints.length > 30 ? 2.5 : 4)
      .attr('fill', '#22c55e')
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          entry: d.entry,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => {
        const date = d as Date;
        return d3.timeFormat('%b %d')(date);
      }))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '11px'));

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '11px'));

  }, [dataPoints]);

  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-white/30 text-[14px]">
        No entries yet. Start by checking in today.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="w-full" />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-xl z-10"
          style={{
            left: tooltip.x,
            top: tooltip.y - 80,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="text-[11px] text-gray-500 dark:text-white/50">{formatShortDate(tooltip.entry.date)}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/40">Consistency</p>
          <p className="text-[16px] font-bold text-emerald-400">{tooltip.entry.healthScore}</p>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-blue-400">Mood {tooltip.entry.mood}</span>
            <span className="text-[10px] text-orange-400">Energy {tooltip.entry.energy}</span>
            <span className="text-[10px] text-purple-400">Sleep {tooltip.entry.sleep}</span>
          </div>
        </div>
      )}
    </div>
  );
}
