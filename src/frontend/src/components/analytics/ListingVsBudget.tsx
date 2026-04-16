import { Scatter } from 'react-chartjs-2';
import { ListingVsBudgetRow } from '../../types/analytics';
import { axisGridColor, axisTickColor, CustomLegend, EmptyState, formatCr, getCityColor, registerCharts } from './chartUtils';

registerCharts();

export function ListingVsBudget({ data }: { data: ListingVsBudgetRow[] }) {
  if (!data.length) {
    return (
      <div className="analytics-chart-card analytics-full-width">
        <h3 className="analytics-chart-title">Listing Price vs Matched Buyer Avg Max Budget</h3>
        <EmptyState />
      </div>
    );
  }

  const maxValue = Math.max(...data.map((row) => Math.max(row.price, row.avgBuyerMaxBudget)));

  const cityGroups: Record<string, Array<{ x: number; y: number; title: string }>> = {
    Mumbai: [],
    Hyderabad: [],
    Delhi: [],
    Unknown: [],
  };

  data.forEach((row) => {
    cityGroups[row.city] = cityGroups[row.city] || [];
    cityGroups[row.city].push({ x: row.price, y: row.avgBuyerMaxBudget, title: row.propertyTitle });
  });

  const datasets: any[] = Object.entries(cityGroups)
    .filter(([, values]) => values.length)
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
      <h3 className="analytics-chart-title">Listing Price vs Matched Buyer Avg Max Budget</h3>
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
          aria-label="Scatter of listing price and average matched buyer max budget"
          data={{ datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const raw = items[0]?.raw as { title?: string } | undefined;
                    return raw?.title || 'Property';
                  },
                  label: (ctx) => {
                    const raw = ctx.raw as { x?: number; y?: number };
                    return `Price ${formatCr(Number(raw.x || 0))} | Avg budget ${formatCr(Number(raw.y || 0))}`;
                  },
                },
              },
            },
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
