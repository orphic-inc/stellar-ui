import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * The panel-plus-line-chart scaffolding both stats history pages render.
 *
 * There were three copies of it — two in `SiteStatsHistoryPage`, one in
 * `UserStatsHistoryPage` — identical down to the grid stroke, the tick fill and
 * the tooltip's border radius, and differing only in the heading, the chart
 * height, and which series get drawn. Recharts needs its axis and tooltip
 * children spelled out on every chart, so that boilerplate multiplies per panel
 * rather than per page, and the copies had already started to drift (only one
 * carried a `YAxis` unit).
 *
 * Deliberately local to `stats/` rather than added to the ADR-0007 kit in
 * `components/ui/`: that kit is presentational primitives emitting the
 * `data-st` token contract, and a recharts wrapper is neither presentational
 * nor token-shaped. It is a stats-feature component that happens to be shared
 * by the feature's two pages.
 *
 * The chart palette stays hard-coded hex rather than `var(--st-*)`: recharts
 * renders to SVG attributes it reads back as values, so a CSS custom property
 * would break the legend swatches. That is pre-existing, unchanged here, and
 * the reason this panel is not theme-reactive.
 */

export type StatsChartSeries = {
  dataKey: string;
  stroke: string;
  /** Renders the line dashed — used to mark a derived series (e.g. Buffer). */
  dashed?: boolean;
};

type StatsChartPanelProps = {
  title: string;
  /** Row objects keyed by series `dataKey`, plus the `time` axis key. */
  data: Record<string, string | number | null>[];
  series: StatsChartSeries[];
  height?: number;
  /** Appended to Y-axis ticks, e.g. `" GB"`. */
  yAxisUnit?: string;
};

const StatsChartPanel = ({
  title,
  data,
  series,
  height = 300,
  yAxisUnit
}: StatsChartPanelProps) => (
  <div data-st="panel" className="rounded-lg p-4">
    <h3 data-st="prose" data-st-strong className="text-sm mb-4">
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} unit={yAxisUnit} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: '6px'
          }}
          labelStyle={{ color: '#e5e7eb' }}
        />
        <Legend />
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            stroke={s.stroke}
            dot={false}
            strokeWidth={2}
            {...(s.dashed ? { strokeDasharray: '4 2' } : {})}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default StatsChartPanel;
