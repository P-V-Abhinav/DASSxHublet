import { KpiCard } from '../components/analytics/KpiCard';
import { SectionHeading } from '../components/analytics/SectionHeading';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import '../components/analytics/analytics.css';
import { PriceByCity } from '../components/analytics/PriceByCity';
import { LeadPipeline } from '../components/analytics/LeadPipeline';
import { MatchScoreDistribution } from '../components/analytics/MatchScoreDistribution';
import { TopLocalities } from '../components/analytics/TopLocalities';
import { BudgetVsMatchedPrice } from '../components/analytics/BudgetVsMatchedPrice';
import { AmenitiesGap } from '../components/analytics/AmenitiesGap';
import { MatchQualityOverTime } from '../components/analytics/MatchQualityOverTime';
import { LeadConversionFunnel } from '../components/analytics/LeadConversionFunnel';
import { PricePerSqFt } from '../components/analytics/PricePerSqFt';
import { UnmatchedLocalities } from '../components/analytics/UnmatchedLocalities';
import { SellerMatchScore } from '../components/analytics/SellerMatchScore';
import { ListingVsBudget } from '../components/analytics/ListingVsBudget';
import { ScoreComponentCity } from '../components/analytics/ScoreComponentCity';
import { BhkGap } from '../components/analytics/BhkGap';
import { SellerTypePerformance } from '../components/analytics/SellerTypePerformance';
import { BudgetDistribution } from '../components/analytics/BudgetDistribution';
import { useState } from 'react';

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'seller'>('overview');
  const { data, loading, error, refetch } = useAnalyticsData();

  return (
    <div className="analytics-page">
      <h1 className="analytics-header">Hublet Analytics Dashboard</h1>

      {loading ? (
        <div className="analytics-loading-wrap">
          <span className="analytics-spinner" aria-hidden="true" />
          <span>Loading analytics...</span>
        </div>
      ) : null}

      {error ? (
        <div className="analytics-error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => void refetch()} className="analytics-retry-btn">
            Retry
          </button>
        </div>
      ) : null}

      {!data || loading ? null : (
        <>
          <div className="analytics-tabs">
            <button
              type="button"
              className={`analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Admin overview
            </button>
            <button
              type="button"
              className={`analytics-tab ${activeTab === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveTab('seller')}
            >
              Seller insights
            </button>
          </div>

          {activeTab === 'overview' ? (
            <>
              <SectionHeading title="Admin Overview" />
              <div className="analytics-kpi-grid">
                <KpiCard label="Total buyers" value={`${Math.round(data.kpis.totalBuyers)}`} />
                <KpiCard label="Total sellers" value={`${Math.round(data.kpis.totalSellers)}`} />
                <KpiCard label="Total properties" value={`${Math.round(data.kpis.totalProperties)}`} />
                <KpiCard label="Total leads" value={`${Math.round(data.kpis.totalLeads)}`} />
                <KpiCard label="Avg site-wide match score" value={`${data.kpis.avgMatchScorePct.toFixed(1)}%`} />
                <KpiCard
                  label="Leads with score >= 60%"
                  value={`${Math.round(data.kpis.leadsAbove60Count)} (${data.kpis.leadsAbove60Pct.toFixed(1)}%)`}
                />
              </div>

              <div className="analytics-grid">
                <PriceByCity data={data.priceByCity} />
                <LeadPipeline data={data.leadPipeline} />
                <MatchScoreDistribution data={data.matchScoreDistribution} />
                <TopLocalities data={data.topLocalities} />
                <BudgetVsMatchedPrice data={data.budgetVsPrice} />
                <AmenitiesGap data={data.amenitiesGap} />
                <MatchQualityOverTime data={data.matchQualityOverTime} />
                <LeadConversionFunnel data={data.leadConversionRates} />
                <PricePerSqFt data={data.pricePerSqFt} />
                <UnmatchedLocalities data={data.unmatchedLocalities} />
              </div>
            </>
          ) : (
            <>
              <SectionHeading title="Seller Insights" />
              <div className="analytics-kpi-grid">
                <KpiCard
                  label="Avg match score across all sellers"
                  value={`${data.sellerKpis.avgSellerMatchScore.toFixed(1)}%`}
                />
                <KpiCard
                  label="Sellers with at least one 80%+ match"
                  value={`${Math.round(data.sellerKpis.sellersWith80Plus)}`}
                />
                <KpiCard
                  label="Avg matched buyer max budget"
                  value={`₹${Math.round(data.sellerKpis.avgMatchedBuyerMaxBudget).toLocaleString('en-IN')}`}
                />
                <KpiCard label="Best performing city" value={data.sellerKpis.bestPerformingCity} />
              </div>

              <div className="analytics-grid">
                <SellerMatchScore data={data.sellerScores} />
                <ListingVsBudget data={data.listingVsBudget} />
                <ScoreComponentCity data={data.scoreComponents} />
                <BhkGap data={data.bhkGap} />
                <SellerTypePerformance data={data.sellerTypePerf} />
                <BudgetDistribution data={data.budgetDistribution} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
