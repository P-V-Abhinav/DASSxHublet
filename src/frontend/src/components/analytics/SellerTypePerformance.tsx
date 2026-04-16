import { Bar } from 'react-chartjs-2';
import { SellerTypePerfRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

function colorForType(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === 'agent') return '#3266ad';
  if (normalized === 'builder') return '#1d9e75';
  if (normalized === 'owner') return '#ba7517';
  return '#888780';
}

export function SellerTypePerformance({ data }: { data: SellerTypePerfRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Seller Type Performance</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Seller Type Performance</h3>
      <CustomLegend
        items={[
          { label: 'Agent', color: '#3266ad' },
          { label: 'Builder', color: '#1d9e75' },
          { label: 'Owner', color: '#ba7517' },
        ]}
      />
      <div className="analytics-chart-wrap" style={{ height: 280 }}>
        <Bar
          role="img"
          aria-label="Average match score by seller type"
          data={{
            labels: data.map((row) => row.sellerType),
            datasets: [
              {
                data: data.map((row) => row.avgMatchScore),
                backgroundColor: data.map((row) => colorForType(row.sellerType)),
              },
            ],
          }}
          options={{
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
