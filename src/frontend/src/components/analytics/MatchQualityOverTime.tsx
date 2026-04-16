import { Line } from 'react-chartjs-2';
import { MatchQualityOverTimeRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

export function MatchQualityOverTime({ data }: { data: MatchQualityOverTimeRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card analytics-full-width">
        <h3 className="analytics-chart-title">Match Quality Over Time</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="analytics-chart-card analytics-full-width">
      <h3 className="analytics-chart-title">Match Quality Over Time</h3>
      <CustomLegend items={[{ label: 'Avg match score', color: '#7f77dd' }]} />
      <div className="analytics-chart-wrap" style={{ height: 300 }}>
        <Line
          role="img"
          aria-label="Line chart of average match quality over time"
          data={{
            labels: data.map((row) => row.date),
            datasets: [
              {
                label: 'Avg match score',
                data: data.map((row) => row.avgScore),
                borderColor: '#7f77dd',
                backgroundColor: 'rgba(127,119,221,0.15)',
                fill: true,
                tension: 0.4,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: axisTickColor() }, grid: { color: axisGridColor() } },
              y: {
                ticks: {
                  color: axisTickColor(),
                  callback: (value) => `${Math.round(Number(value))}%`,
                },
                grid: { color: axisGridColor() },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
