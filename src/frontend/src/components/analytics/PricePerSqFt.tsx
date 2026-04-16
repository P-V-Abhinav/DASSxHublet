import { Bar } from 'react-chartjs-2';
import { PricePerSqFtRow } from '../../types/analytics';
import {
  axisGridColor,
  axisTickColor,
  CustomLegend,
  emptyChartHeight,
  EmptyState,
  registerCharts,
} from './chartUtils';

registerCharts();

export function PricePerSqFt({ data }: { data: PricePerSqFtRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Price per Sq Ft by Locality</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Price per Sq Ft by Locality</h3>
      <CustomLegend items={[{ label: 'Avg ₹/sq ft', color: '#ba7517' }]} />
      <div className="analytics-chart-wrap" style={{ height: emptyChartHeight(data.length) }}>
        <Bar
          role="img"
          aria-label="Average price per square foot by locality"
          data={{
            labels: data.map((row) => row.locality),
            datasets: [
              {
                data: data.map((row) => row.avgPricePerSqFt),
                backgroundColor: '#ba7517',
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
                  label: (ctx) => `₹${Math.round(Number(ctx.raw)).toLocaleString('en-IN')}/sq ft`,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  color: axisTickColor(),
                  callback: (value) => `₹${Math.round(Number(value)).toLocaleString('en-IN')}`,
                },
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
