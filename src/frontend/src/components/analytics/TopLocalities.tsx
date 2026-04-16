import { Bar } from 'react-chartjs-2';
import { LocalityCountRow } from '../../types/analytics';
import {
  axisGridColor,
  axisTickColor,
  CustomLegend,
  emptyChartHeight,
  EmptyState,
  registerCharts,
} from './chartUtils';

registerCharts();

export function TopLocalities({ data }: { data: LocalityCountRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Top Localities by Listing Count</h3>
        <EmptyState />
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.count - a.count);

  const chartData = {
    labels: sorted.map((row) => row.locality),
    datasets: [
      {
        data: sorted.map((row) => row.count),
        backgroundColor: '#3266ad',
      },
    ],
  };

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Top Localities by Listing Count</h3>
      <CustomLegend items={[{ label: 'Listings', color: '#3266ad' }]} />
      <div className="analytics-chart-wrap" style={{ height: emptyChartHeight(sorted.length) }}>
        <Bar
          role="img"
          aria-label="Top localities by property listing count"
          data={chartData}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: axisTickColor() }, grid: { color: axisGridColor() } },
              y: { ticks: { color: axisTickColor() }, grid: { color: axisGridColor() } },
            },
          }}
        />
      </div>
    </div>
  );
}
