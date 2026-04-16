import { Bar } from 'react-chartjs-2';
import { PriceByCityRow } from '../../types/analytics';
import {
  axisGridColor,
  axisTickColor,
  CustomLegend,
  EmptyState,
  formatCr,
  registerCharts,
} from './chartUtils';

registerCharts();

export function PriceByCity({ data }: { data: PriceByCityRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Avg Property Price by City and BHK</h3>
        <EmptyState />
      </div>
    );
  }

  const labels = data.map((row) => `${row.bhk} BHK`);
  const chartData = {
    labels,
    datasets: [
      { label: 'Mumbai', data: data.map((row) => row.Mumbai), backgroundColor: '#3266ad' },
      { label: 'Hyderabad', data: data.map((row) => row.Hyderabad), backgroundColor: '#1d9e75' },
      { label: 'Delhi', data: data.map((row) => row.Delhi), backgroundColor: '#d85a30' },
    ],
  };

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Avg Property Price by City and BHK</h3>
      <CustomLegend
        items={[
          { label: 'Mumbai', color: '#3266ad' },
          { label: 'Hyderabad', color: '#1d9e75' },
          { label: 'Delhi', color: '#d85a30' },
        ]}
      />
      <div className="analytics-chart-wrap" style={{ height: 310 }}>
        <Bar
          role="img"
          aria-label="Average property price grouped by city and bhk"
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: { color: axisTickColor() },
                grid: { color: axisGridColor() },
              },
              y: {
                ticks: {
                  color: axisTickColor(),
                  callback: (value) => formatCr(Number(value)),
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
