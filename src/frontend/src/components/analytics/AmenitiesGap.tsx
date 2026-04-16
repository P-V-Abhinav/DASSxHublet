import { Bar } from 'react-chartjs-2';
import { AmenitiesGapRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

export function AmenitiesGap({ data }: { data: AmenitiesGapRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Amenities Demand vs Supply</h3>
        <EmptyState />
      </div>
    );
  }

  const chartData = {
    labels: data.map((row) => row.amenity),
    datasets: [
      { label: 'Buyers', data: data.map((row) => row.buyerCount), backgroundColor: '#3266ad' },
      { label: 'Properties', data: data.map((row) => row.propertyCount), backgroundColor: '#1d9e75' },
    ],
  };

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Amenities Demand vs Supply</h3>
      <CustomLegend
        items={[
          { label: 'Buyers', color: '#3266ad' },
          { label: 'Properties', color: '#1d9e75' },
        ]}
      />
      <div className="analytics-chart-wrap" style={{ height: 300 }}>
        <Bar
          role="img"
          aria-label="Grouped bar chart of amenities demand versus property supply"
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
