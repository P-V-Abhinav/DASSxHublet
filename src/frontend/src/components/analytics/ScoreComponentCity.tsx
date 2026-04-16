import { Bar } from 'react-chartjs-2';
import { ScoreComponentCityRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

export function ScoreComponentCity({ data }: { data: ScoreComponentCityRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Match Score Component Breakdown by City</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Match Score Component Breakdown by City</h3>
      <CustomLegend
        items={[
          { label: 'Location', color: '#3266ad' },
          { label: 'Budget', color: '#1d9e75' },
          { label: 'Size', color: '#ba7517' },
          { label: 'Amenities', color: '#d4537e' },
        ]}
      />
      <div className="analytics-chart-wrap" style={{ height: 300 }}>
        <Bar
          role="img"
          aria-label="Grouped bar chart of average score components by city"
          data={{
            labels: data.map((row) => row.city),
            datasets: [
              { label: 'Location', data: data.map((row) => row.locationScore), backgroundColor: '#3266ad' },
              { label: 'Budget', data: data.map((row) => row.budgetScore), backgroundColor: '#1d9e75' },
              { label: 'Size', data: data.map((row) => row.sizeScore), backgroundColor: '#ba7517' },
              { label: 'Amenities', data: data.map((row) => row.amenitiesScore), backgroundColor: '#d4537e' },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: axisTickColor() }, grid: { color: axisGridColor() } },
              y: {
                min: 0,
                max: 100,
                ticks: { color: axisTickColor(), callback: (value) => `${Math.round(Number(value))}%` },
                grid: { color: axisGridColor() },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
