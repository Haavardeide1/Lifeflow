'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import type { DailyEntry, DateKey, TimePeriod } from '@/types';
import { getDateRange, getDaysBetween, parseDate } from '@/lib/dateUtils';

interface TrendLinesProps {
  entries: Record<DateKey, DailyEntry>;
  period: TimePeriod;
}

const METRICS = [
  { key: 'mood' as const, label: 'Mood', color: '#3b82f6' },
  { key: 'energy' as const, label: 'Energy', color: '#f97316' },
  { key: 'sleep' as const, label: 'Sleep', color: '#a855f7' },
];

export function TrendLines({ entries, period }: TrendLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(['mood', 'energy', 'sleep'])
  );

  const dataPoints = useMemo(() => {
    const { start, end } = getDateRange(period);
    const dates = getDaysBetween(start, end);
    return dates.filter(d => entries[d]).map(d => ({ date: d, entry: entries[d] }));
  }, [entries, period]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || dataPoints.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 240;
    const margin = { top: 10, right: 16, bottom: 30, left: 36 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(dataPoints, d => parseDate(d.date)) as [Date, Date])
      .range([0, innerW]);

    const yScale = d3.scaleLinear().domain([0, 10]).range([innerH, 0]);

    // Grid
    [2, 4, 6, 8].forEach(v => {
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(v)).attr('y2', yScale(v))
        .attr('stroke', 'rgba(255,255,255,0.04)')
        .attr('stroke-dasharray', '4,4');
    });

    // Lines
    METRICS.forEach(metric => {
      if (!visibleMetrics.has(metric.key)) return;

      const line = d3.line<typeof dataPoints[0]>()
        .x(d => xScale(parseDate(d.date)))
        .y(d => yScale(d.entry[metric.key]))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(dataPoints)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', metric.color)
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.8);

      // Dots
      if (dataPoints.length <= 30) {
        g.selectAll(`.dot-${metric.key}`)
          .data(dataPoints)
          .enter()
          .append('circle')
          .attr('cx', d => xScale(parseDate(d.date)))
          .attr('cy', d => yScale(d.entry[metric.key]))
          .attr('r', 3)
          .attr('fill', metric.color)
          .attr('stroke', '#0a0a0a')
          .attr('stroke-width', 1.5);
      }
    });

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => d3.timeFormat('%b %d')(d as Date)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '11px'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '11px'));

  }, [dataPoints, visibleMetrics]);

  const toggleMetric = (key: string) => {
    setVisibleMetrics(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-white/30 text-[13px]">
        No data for this period.
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-3 px-5 pb-3">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`flex items-center gap-1.5 text-[11px] font-medium transition-opacity ${
              visibleMetrics.has(m.key) ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
            {m.label}
          </button>
        ))}
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}
