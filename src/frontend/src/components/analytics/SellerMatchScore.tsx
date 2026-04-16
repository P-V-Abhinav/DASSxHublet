import { Bar } from 'react-chartjs-2';
import { SellerScoreRow } from '../../types/analytics';
import {
  axisGridColor,
  axisTickColor,
  CustomLegend,
  emptyChartHeight,
  EmptyState,
  getCityColor,
  registerCharts,
} from './chartUtils';

registerCharts();

export function SellerMatchScore({ data }: { data: SellerScoreRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card analytics-full-width">
        <h3 className="analytics-chart-title">Per-Seller Avg Match Score</h3>
        <EmptyState />
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.avgMatchScore - a.avgMatchScore);

  return (
    <div className="analytics-chart-card analytics-full-width">
      <h3 className="analytics-chart-title">Per-Seller Avg Match Score</h3>
      <CustomLegend
        items={[
          { label: 'Mumbai', color: '#3266ad' },
          { label: 'Hyderabad', color: '#1d9e75' },
          { label: 'Delhi', color: '#d85a30' },
        ]}
      />
      <div className="analytics-chart-wrap" style={{ height: emptyChartHeight(sorted.length) }}>
        <Bar
          role="img"
          aria-label="Average match score for each seller"
          data={{
            labels: sorted.map((row) => row.sellerName),
            datasets: [
              {
                data: sorted.map((row) => row.avgMatchScore),
                backgroundColor: sorted.map((row) => getCityColor(row.city)),
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
                  label: (ctx) => `${Number(ctx.raw).toFixed(1)}%`,
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
