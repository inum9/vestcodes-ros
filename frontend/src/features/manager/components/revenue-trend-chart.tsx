import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, type RevenueTrendPoint } from '@/lib/manager-api';
import { cn } from '@/lib/utils';

type RevenueTrendChartProps = {
  daily: RevenueTrendPoint[];
  weekly: RevenueTrendPoint[];
  loading?: boolean;
};

const CHART = {
  width: 420,
  height: 168,
  padX: 8,
  padY: 20,
  padBottom: 8,
};

type PlotPoint = RevenueTrendPoint & { x: number; y: number; index: number };

function buildPlotPoints(data: RevenueTrendPoint[], max: number): PlotPoint[] {
  const plotW = CHART.width - CHART.padX * 2;
  const plotH = CHART.height - CHART.padY - CHART.padBottom;
  const count = data.length;

  return data.map((point, index) => ({
    ...point,
    index,
    x: CHART.padX + (count <= 1 ? plotW / 2 : (index / (count - 1)) * plotW),
    y: CHART.padY + plotH - (point.value / max) * plotH,
  }));
}

function linePath(points: PlotPoint[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function areaPath(points: PlotPoint[]): string {
  if (points.length === 0) return '';
  const baseline = CHART.height - CHART.padBottom;
  let d = `M ${points[0].x} ${baseline} L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  d += ` L ${points[points.length - 1].x} ${baseline} Z`;
  return d;
}

export default function RevenueTrendChart({ daily, weekly, loading }: RevenueTrendChartProps) {
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = mode === 'daily' ? daily : weekly;
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const points = useMemo(() => buildPlotPoints(data, max), [data, max]);
  const activeIndex = hoveredIndex ?? points.length - 1;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const plotH = CHART.height - CHART.padY - CHART.padBottom;
    return CHART.padY + plotH * (1 - ratio);
  });

  return (
    <Card className="border-app-border bg-app-card shadow-soft transition-shadow duration-300 hover:shadow-card">
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-app-text-title">
            <TrendingUp className="h-4 w-4 text-primary-dark" />
            Revenue trend
          </CardTitle>
          <p className="mt-1 text-sm text-app-text-secondary">
            {mode === 'daily' ? 'Last 7 days' : 'Last 4 weeks'} · served orders
          </p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'daily' | 'weekly')}>
          <TabsList className="h-9 rounded-xl bg-app-surface">
            <TabsTrigger value="daily" className="rounded-lg text-xs">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg text-xs">
              Weekly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="mx-auto h-3 flex-1 rounded" />
              ))}
            </div>
          </div>
        ) : total === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-surface/50 text-center">
            <BarChart3 className="mb-2 h-8 w-8 text-app-text-muted" />
            <p className="text-sm font-medium text-app-text-secondary">No revenue data yet</p>
            <p className="mt-1 text-xs text-app-text-muted">Trends appear after orders are served</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl bg-gradient-to-b from-primary-light/30 to-transparent px-1 pt-7">
              {activeIndex >= 0 && points[activeIndex] && (
                <div
                  className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-full border border-primary/20 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-primary-dark shadow-soft backdrop-blur-sm transition-all duration-200 sm:text-xs"
                  style={{
                    left: `${points.length <= 1 ? 50 : (activeIndex / (points.length - 1)) * 100}%`,
                  }}
                >
                  {formatCurrency(points[activeIndex].value)}
                </div>
              )}

              <svg
                viewBox={`0 0 ${CHART.width} ${CHART.height}`}
                className="h-40 w-full overflow-visible"
                role="img"
                aria-label="Revenue trend line chart"
              >
                <defs>
                  <linearGradient id="revenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#728246" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#728246" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {gridLines.map((y, i) => (
                  <line
                    key={i}
                    x1={CHART.padX}
                    y1={y}
                    x2={CHART.width - CHART.padX}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 6"
                    className="text-app-border/80"
                    strokeWidth="1"
                  />
                ))}

                <path d={areaPath(points)} fill="url(#revenueAreaFill)" className="transition-all duration-500" />

                <path
                  d={linePath(points)}
                  fill="none"
                  stroke="#728246"
                  strokeWidth="2.5"
                  strokeDasharray="2 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />

                {points.map((point) => {
                  const isActive = point.index === activeIndex;
                  const isLatest = point.index === points.length - 1;
                  return (
                    <g
                      key={`${point.label}-${point.index}`}
                      onMouseEnter={() => setHoveredIndex(point.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      {isActive && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="10"
                          fill="#728246"
                          fillOpacity="0.12"
                          className="transition-all duration-200"
                        />
                      )}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isActive ? 5.5 : 4}
                        fill="white"
                        stroke="#728246"
                        strokeWidth={isActive || isLatest ? 2.5 : 2}
                        className="transition-all duration-200"
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isActive ? 2.5 : 1.75}
                        fill="#728246"
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex gap-1.5 sm:gap-2">
              {data.map((point, index) => {
                const isHighlight = index === activeIndex;
                return (
                  <Button
                    key={`label-${point.label}-${index}`}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                    className="h-auto min-w-0 flex-1 flex-col px-1 py-1"
                  >
                    <p
                      className={cn(
                        'text-[10px] font-semibold transition-colors sm:text-xs',
                        isHighlight ? 'text-primary-dark' : 'text-app-text-secondary',
                      )}
                    >
                      {point.label}
                    </p>
                    {point.sublabel && (
                      <p className="hidden truncate text-[10px] text-app-text-muted sm:block">
                        {point.sublabel}
                      </p>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
