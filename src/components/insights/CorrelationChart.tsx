'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { Habit, DailyEntry, DateKey } from '@/types';
import { calculateCorrelations } from '@/lib/correlation';

interface CorrelationChartProps {
  habits: Record<string, Habit>;
  entries: Record<DateKey, DailyEntry>;
}

export function CorrelationChart({ habits, entries }: CorrelationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const correlations = useMemo(
    () => calculateCorrelations(habits, entries),
    [habits, entries]
  );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || correlations.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const barHeight = 36;
    const margin = { top: 10, right: 60, bottom: 30, left: 160 };
    const height = margin.top + margin.bottom + correlations.length * barHeight;
    const innerW = width - margin.left - margin.right;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, innerW]);

    const yScale = d3.scaleBand()
      .domain(correlations.map(c => c.habitId))
      .range([0, correlations.length * barHeight])
      .padding(0.25);

    // Center line
    g.append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', 0)
      .attr('y2', correlations.length * barHeight)
      .attr('stroke', 'rgba(255,255,255,0.1)');

    // Bars
    g.selectAll('rect')
      .data(correlations)
      .enter()
      .append('rect')
      .attr('x', d => d.correlationWithMood >= 0 ? xScale(0) : xScale(d.correlationWithMood))
      .attr('y', d => yScale(d.habitId)!)
      .attr('width', d => Math.abs(xScale(d.correlationWithMood) - xScale(0)))
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => d.correlationWithMood >= 0 ? '#22c55e' : '#ef4444')
      .attr('opacity', 0.7);

    // Labels (habit names)
    g.selectAll('.label')
      .data(correlations)
      .enter()
      .append('text')
      .attr('x', -8)
      .attr('y', d => yScale(d.habitId)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(255,255,255,0.6)')
      .attr('font-size', '12px')
      .text(d => d.habitName.length > 22 ? d.habitName.slice(0, 20) + '...' : d.habitName);

    // Value labels
    g.selectAll('.value')
      .data(correlations)
      .enter()
      .append('text')
      .attr('x', d => d.correlationWithMood >= 0
        ? xScale(d.correlationWithMood) + 6
        : xScale(d.correlationWithMood) - 6)
      .attr('y', d => yScale(d.habitId)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.correlationWithMood >= 0 ? 'start' : 'end')
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('font-size', '11px')
      .text(d => d.correlationWithMood.toFixed(2));

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${correlations.length * barHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.06)'))
      .call(g => g.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '10px'));

  }, [correlations]);

  if (correlations.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-white/30 text-[13px]">
        Need at least 3 days of data to show correlations.
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
