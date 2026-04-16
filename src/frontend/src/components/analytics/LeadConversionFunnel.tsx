import { Bar } from 'react-chartjs-2';
import { LeadConversionRow } from '../../types/analytics';
import {
  axisGridColor,
  axisTickColor,
  CustomLegend,
  emptyChartHeight,
  EmptyState,
  registerCharts,
} from './chartUtils';

registerCharts();

const colors = ['#3266ad', '#4f78a8', '#6d8aa2', '#8a9b9d', '#a8ad97', '#c5be92'];

export function LeadConversionFunnel({ data }: { data: LeadConversionRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Lead Conversion Drop-off Rate</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Lead Conversion Drop-off Rate</h3>
      <CustomLegend
        items={data.map((row, index) => ({ label: row.stage, color: colors[index] || '#3266ad' }))}
      />
      <div className="analytics-chart-wrap" style={{ height: emptyChartHeight(data.length) }}>
        <Bar
          role="img"
          aria-label="Lead conversion percentage by stage"
          data={{
            labels: data.map((row) => row.stage),
            datasets: [
              {
                data: data.map((row) => row.pct),
                backgroundColor: data.map((_, i) => colors[i] || '#3266ad'),
              },
            ],
          }}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${Math.round(Number(ctx.raw))}%`,
                },
              },
            },
            scales: {
              x: {
                min: 0,
                max: 100,
                ticks: { color: axisTickColor(), callback: (value) => `${Math.round(Number(value))}%` },
                grid: { color: axisGridColor() },
              },
              y: { ticks: { color: axisTickColor() }, grid: { color: axisGridColor() } },
            },
          }}
        />
      </div>
    </div>
  );
}
