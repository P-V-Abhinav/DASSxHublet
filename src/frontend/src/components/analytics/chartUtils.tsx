import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

let hasRegistered = false;

export function registerCharts(): void {
  if (hasRegistered) {
    return;
  }
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
  );
  hasRegistered = true;
}

export function isDarkMode(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function axisGridColor(): string {
  return isDarkMode() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
}

export function axisTickColor(): string {
  return isDarkMode() ? '#a0a09a' : '#73726c';
}

export function round1(value: number): number {
  return Number(value.toFixed(1));
}

export function formatPct(value: number): string {
  return `${round1(value).toFixed(1)}%`;
}

export function formatCr(value: number): string {
  return `₹${round1(value).toFixed(1)} Cr`;
}

export function formatCount(value: number): string {
  return `${Math.round(value)}`;
}

export function formatCurrencyCompact(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function normalizeText(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export function titleCase(value: string): string {
  if (!value) {
    return value;
  }
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

export function getCityColor(city: string): string {
  const normalized = normalizeText(city);
  if (normalized.includes('mumbai')) return '#3266ad';
  if (normalized.includes('hyderabad')) return '#1d9e75';
  if (normalized.includes('delhi')) return '#d85a30';
  return '#888780';
}

export function emptyChartHeight(count: number): number {
  return Math.max(count * 40 + 80, 220);
}

export function EmptyState({ message = 'No data available yet' }: { message?: string }) {
  return <div className="analytics-empty-state">{message}</div>;
}

export function CustomLegend({
  items,
}: {
  items: Array<{ label: string; color: string; value?: string }>;
}) {
  return (
    <div className="analytics-legend">
      {items.map((item) => (
        <div key={item.label} className="analytics-legend-item">
          <span className="analytics-legend-swatch" style={{ background: item.color }} />
          <span className="analytics-legend-label">{item.label}</span>
          {item.value ? <span className="analytics-legend-value">{item.value}</span> : null}
        </div>
      ))}
    </div>
  );
}
