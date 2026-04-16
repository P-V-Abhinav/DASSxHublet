import { Bar } from 'react-chartjs-2';
import { LocalityCountRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

export function UnmatchedLocalities({ data }: { data: LocalityCountRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Top Unmatched Buyer Localities</h3>
        <p className="analytics-chart-desc">
          Localities buyers want but where zero property inventory currently exists.
        </p>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Top Unmatched Buyer Localities</h3>
      <p className="analytics-chart-desc">
        Localities buyers want but where zero property inventory currently exists.
      </p>
      <CustomLegend items={[{ label: 'Buyer demand with zero listings', color: '#d4537e' }]} />
      <div className="analytics-chart-wrap" style={{ height: 280 }}>
        <Bar
          role="img"
          aria-label="Top unmatched localities requested by buyers"
          data={{
            labels: data.map((row) => row.locality),
            datasets: [
              {
                data: data.map((row) => row.count),
                backgroundColor: '#d4537e',
              },
            ],
          }}
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
