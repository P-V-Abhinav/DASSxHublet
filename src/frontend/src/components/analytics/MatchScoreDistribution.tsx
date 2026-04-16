import { Bar } from 'react-chartjs-2';
import { DistributionRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

const colors = ['#e09595', '#e8b46a', '#3266ad', '#1d9e75', '#7f77dd'];

export function MatchScoreDistribution({ data }: { data: DistributionRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card analytics-full-width">
        <h3 className="analytics-chart-title">Match Score Distribution</h3>
        <EmptyState />
      </div>
    );
  }

  const labels = data.map((row) => row.band.replace('-', '–') + '%');
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Matches',
        data: data.map((row) => row.count),
        backgroundColor: colors,
      },
    ],
  };

  return (
    <div className="analytics-chart-card analytics-full-width">
      <h3 className="analytics-chart-title">Match Score Distribution</h3>
      <CustomLegend
        items={labels.map((label, index) => ({ label, color: colors[index] || '#3266ad' }))}
      />
      <div className="analytics-chart-wrap" style={{ height: 290 }}>
        <Bar
          role="img"
          aria-label="Histogram of match score bands from 50 to 100"
          data={chartData}
          options={{
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
