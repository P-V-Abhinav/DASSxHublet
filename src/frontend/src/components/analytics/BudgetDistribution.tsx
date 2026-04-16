import { Bar } from 'react-chartjs-2';
import { BudgetDistributionRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, formatCr, registerCharts } from './chartUtils';

registerCharts();

export function BudgetDistribution({ data }: { data: BudgetDistributionRow[] }) {
  const filtered = data.filter((row) => row.max > 0);
  if (!filtered.length) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Budget Distribution by City</h3>
        <EmptyState />
      </div>
    );
  }

  const labels = filtered.map((row) => row.city);

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Budget Distribution by City</h3>
      <CustomLegend
        items={[
          { label: 'Range (min to max)', color: '#3266ad' },
          { label: 'Average', color: '#ba7517' },
        ]}
      />
      <div className="analytics-chart-wrap" style={{ height: 300 }}>
        <Bar
          role="img"
          aria-label="Budget range by city with average marker"
          data={{
            labels,
            datasets: [
              {
                label: 'Range',
                data: filtered.map((row) => [row.min, row.max]),
                backgroundColor: ['#3266ad', '#1d9e75', '#d85a30'],
                borderWidth: 0,
              },
              {
                type: 'line',
                label: 'Average',
                data: filtered.map((row) => row.avg),
                borderColor: '#ba7517',
                backgroundColor: '#ba7517',
                pointRadius: 5,
                pointHoverRadius: 6,
                showLine: false,
              } as any,
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: axisTickColor() }, grid: { color: axisGridColor() } },
              y: {
                ticks: { color: axisTickColor(), callback: (value) => formatCr(Number(value)) },
                grid: { color: axisGridColor() },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
