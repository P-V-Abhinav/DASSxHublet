import { Bar } from 'react-chartjs-2';
import { BhkGapRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

export function BhkGap({ data }: { data: BhkGapRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">BHK Demand vs Supply Gap</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">BHK Demand vs Supply Gap</h3>
      <CustomLegend
        items={[
          { label: 'Demand', color: '#3266ad' },
          { label: 'Supply', color: '#d85a30' },
        ]}
      />
      <div style={{ marginBottom: '0.5rem' }}>
        {data
          .filter((row) => row.buyerCount > row.propertyCount)
          .map((row) => (
            <span key={row.bhk} className="analytics-badge-gap">
              {row.bhk} BHK gap
            </span>
          ))}
      </div>
      <div className="analytics-chart-wrap" style={{ height: 300 }}>
        <Bar
          role="img"
          aria-label="Grouped bar chart of buyer demand and property supply by bhk"
          data={{
            labels: data.map((row) => `${row.bhk} BHK`),
            datasets: [
              { label: 'Demand', data: data.map((row) => row.buyerCount), backgroundColor: '#3266ad' },
              { label: 'Supply', data: data.map((row) => row.propertyCount), backgroundColor: '#d85a30' },
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
