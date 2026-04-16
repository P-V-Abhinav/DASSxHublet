import { Doughnut } from 'react-chartjs-2';
import { PipelineRow } from '../../types/analytics';
import { CustomLegend, EmptyState, registerCharts } from './chartUtils';

registerCharts();

const statusColors: Record<string, string> = {
  NEW: '#3266ad',
  ENRICHED: '#1d9e75',
  QUALIFIED: '#ba7517',
  NOTIFIED: '#d4537e',
  CONTACTED: '#7f77dd',
  CLOSED: '#888780',
};

export function LeadPipeline({ data }: { data: PipelineRow[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  if (!data.length || total === 0) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Lead Pipeline Funnel</h3>
        <EmptyState />
      </div>
    );
  }

  const chartData = {
    labels: data.map((row) => row.status),
    datasets: [
      {
        data: data.map((row) => row.count),
        backgroundColor: data.map((row) => statusColors[row.status]),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title">Lead Pipeline Funnel</h3>
      <CustomLegend
        items={data.map((row) => ({
          label: row.status,
          color: statusColors[row.status],
          value: `${Math.round(row.count)}`,
        }))}
      />
      <div className="analytics-chart-wrap" style={{ height: 280 }}>
        <Doughnut
          role="img"
          aria-label="Lead distribution across pipeline statuses"
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { display: false } },
          }}
        />
      </div>
    </div>
  );
}
