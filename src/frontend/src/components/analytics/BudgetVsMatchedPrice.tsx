import { Scatter } from 'react-chartjs-2';
import { BudgetVsPriceRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, formatCr, getCityColor, registerCharts } from './chartUtils';

registerCharts();

export function BudgetVsMatchedPrice({ data }: { data: BudgetVsPriceRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card analytics-full-width">
        <h3 className="analytics-chart-title">Buyer Budget vs Avg Matched Property Price</h3>
        <EmptyState />
      </div>
    );
  }

  const maxValue = Math.max(...data.map((row) => Math.max(row.maxBudget, row.avgMatchedPrice)));

  const cityGroups: Record<string, Array<{ x: number; y: number }>> = {
    Mumbai: [],
    Hyderabad: [],
    Delhi: [],
    Unknown: [],
  };

  data.forEach((row) => {
    cityGroups[row.city] = cityGroups[row.city] || [];
    cityGroups[row.city].push({ x: row.maxBudget, y: row.avgMatchedPrice });
  });

  const datasets: any[] = Object.entries(cityGroups)
    .filter(([, points]) => points.length)
    .map(([city, points]) => ({
      label: city,
      data: points,
      backgroundColor: getCityColor(city),
    }));

  datasets.push({
    type: 'line',
    label: 'y = x',
    data: [
      { x: 0, y: 0 },
      { x: maxValue, y: maxValue },
    ],
    borderColor: '#cccccc',
    borderDash: [5, 5],
    pointRadius: 0,
  });

  return (
    <div className="analytics-chart-card analytics-full-width">
      <h3 className="analytics-chart-title">Buyer Budget vs Avg Matched Property Price</h3>
      <CustomLegend
        items={[
          { label: 'Mumbai', color: '#3266ad' },
          { label: 'Hyderabad', color: '#1d9e75' },
          { label: 'Delhi', color: '#d85a30' },
          { label: 'Budget = Price', color: '#cccccc' },
        ]}
      />
      <div className="analytics-chart-wrap" style={{ height: 320 }}>
        <Scatter
          role="img"
          aria-label="Scatter of buyer max budget and average matched property price"
          data={{ datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: { color: axisTickColor(), callback: (value) => formatCr(Number(value)) },
                grid: { color: axisGridColor() },
              },
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
