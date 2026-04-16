import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  AnalyticsData,
  AmenitiesGapRow,
  BhkGapRow,
  BudgetDistributionRow,
  BudgetVsPriceRow,
  BuyerRecord,
  CityName,
  DistributionRow,
  LeadConversionRow,
  LeadRecord,
  ListingVsBudgetRow,
  LocalityCountRow,
  MatchQualityOverTimeRow,
  MatchRecord,
  PipelineRow,
  PriceByCityRow,
  PricePerSqFtRow,
  PropertyRecord,
  ScoreComponentCityRow,
  SellerRecord,
  SellerScoreRow,
  SellerTypePerfRow,
  WorkflowEventRecord,
} from '../types/analytics';
import { normalizeText, round1, titleCase } from '../components/analytics/chartUtils';

const STAGES: Array<LeadConversionRow['stage']> = [
  'NEW',
  'ENRICHED',
  'QUALIFIED',
  'NOTIFIED',
  'CONTACTED',
  'CLOSED',
];

const SUPPORTED_CITIES: Array<Exclude<CityName, 'Unknown'>> = ['Mumbai', 'Hyderabad', 'Delhi'];

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as T[];
}

function getResponseArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) {
    return raw as T[];
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return obj.data as T[];
    }
    if (Array.isArray(obj.results)) {
      return obj.results as T[];
    }
    if (Array.isArray(obj.items)) {
      return obj.items as T[];
    }
  }
  return [];
}

function toCity(value: unknown): CityName {
  const raw = normalizeText(value);
  if (raw.includes('mumbai')) return 'Mumbai';
  if (raw.includes('hyderabad')) return 'Hyderabad';
  if (raw.includes('delhi')) return 'Delhi';
  return 'Unknown';
}

function inferCityFromLocality(locality: string, propertyLocalityCityMap: Map<string, CityName>): CityName {
  return propertyLocalityCityMap.get(normalizeText(locality)) || 'Unknown';
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function pickBuyerMaxBudget(buyer: BuyerRecord): number {
  return toNumber(buyer.maxBudget) || toNumber(buyer.budgetMax) || toNumber(buyer.budgetMin);
}

function pickLeadStatus(lead: LeadRecord): string {
  return String(lead.status || lead.state || '').toUpperCase();
}

function parseEventMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) {
    return {};
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === 'object' && parsed ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof metadata === 'object') {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function eventDate(event: WorkflowEventRecord): string {
  const rawDate = event.timestamp || event.createdAt;
  const dt = rawDate ? new Date(rawDate) : new Date();
  if (Number.isNaN(dt.getTime())) {
    return 'Invalid date';
  }
  return dt.toISOString().split('T')[0];
}

function computeData(params: {
  buyers: BuyerRecord[];
  sellers: SellerRecord[];
  properties: PropertyRecord[];
  leads: LeadRecord[];
  workflowEvents: WorkflowEventRecord[];
  buyerMatchesById: Record<string, MatchRecord[]>;
  sellerMatchesById: Record<string, MatchRecord[]>;
}): AnalyticsData {
  const {
    buyers,
    sellers,
    properties,
    leads,
    workflowEvents,
    buyerMatchesById,
    sellerMatchesById,
  } = params;

  const allBuyerMatches = Object.values(buyerMatchesById).flat();
  const allSellerMatches = Object.values(sellerMatchesById).flat();

  const allMatchScores = allBuyerMatches
    .map((m) => toNumber(m.matchScore))
    .filter((score) => score > 0);

  const avgMatchScorePct = round1(average(allMatchScores));
  const leadsAbove60Count = allMatchScores.filter((score) => score >= 60).length;
  const leadsAbove60Pct = allMatchScores.length
    ? round1((leadsAbove60Count / allMatchScores.length) * 100)
    : 0;

  const kpis = {
    totalBuyers: buyers.length,
    totalSellers: sellers.length,
    totalProperties: properties.length,
    totalLeads: leads.length,
    avgMatchScorePct,
    leadsAbove60Count,
    leadsAbove60Pct,
  };

  const cityBhkPriceBuckets = new Map<string, number[]>();
  properties.forEach((property) => {
    const city = toCity(property.city || property.seller?.city || 'Unknown');
    const bhk = toNumber(property.bhk);
    const price = toNumber(property.price);
    if (!SUPPORTED_CITIES.includes(city as Exclude<CityName, 'Unknown'>) || !bhk || !price) {
      return;
    }
    const key = `${city}:${bhk}`;
    const arr = cityBhkPriceBuckets.get(key) || [];
    arr.push(price);
    cityBhkPriceBuckets.set(key, arr);
  });

  const priceByCity: PriceByCityRow[] = [1, 2, 3, 4].map((bhk) => {
    const mumbai = average(cityBhkPriceBuckets.get(`Mumbai:${bhk}`) || []);
    const hyderabad = average(cityBhkPriceBuckets.get(`Hyderabad:${bhk}`) || []);
    const delhi = average(cityBhkPriceBuckets.get(`Delhi:${bhk}`) || []);
    return {
      bhk,
      Mumbai: round1(mumbai),
      Hyderabad: round1(hyderabad),
      Delhi: round1(delhi),
    };
  });

  const leadPipeline: PipelineRow[] = STAGES.map((status) => ({
    status,
    count: leads.filter((lead) => pickLeadStatus(lead) === status).length,
  }));

  const distributionBuckets = new Map<string, number>();
  for (let start = 50; start <= 90; start += 10) {
    const end = start === 90 ? 100 : start + 9;
    distributionBuckets.set(`${start}-${end}`, 0);
  }
  allMatchScores.forEach((score) => {
    if (score < 50) {
      return;
    }
    const floored = Math.floor(score / 10) * 10;
    const start = Math.min(floored, 90);
    const end = start === 90 ? 100 : start + 9;
    const key = `${start}-${end}`;
    distributionBuckets.set(key, (distributionBuckets.get(key) || 0) + 1);
  });

  const matchScoreDistribution: DistributionRow[] = Array.from(distributionBuckets.entries()).map(
    ([band, count]) => ({
      band,
      count,
    }),
  );

  const localityCountMap = new Map<string, number>();
  properties.forEach((property) => {
    const locality = titleCase(String(property.locality || '').trim());
    if (!locality) {
      return;
    }
    localityCountMap.set(locality, (localityCountMap.get(locality) || 0) + 1);
  });

  const topLocalities: LocalityCountRow[] = Array.from(localityCountMap.entries())
    .map(([locality, count]) => ({ locality, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const propertyById = new Map<string, PropertyRecord>();
  properties.forEach((property) => {
    propertyById.set(property.id, property);
  });

  const propertyLocalityCityMap = new Map<string, CityName>();
  properties.forEach((property) => {
    const locality = normalizeText(property.locality);
    if (!locality) {
      return;
    }
    propertyLocalityCityMap.set(locality, toCity(property.city || property.seller?.city));
  });

  const budgetVsPrice: BudgetVsPriceRow[] = buyers
    .map((buyer) => {
      const buyerMatches = buyerMatchesById[buyer.id] || [];
      const avgMatchedPrice = average(
        buyerMatches
          .map((match) => toNumber(match.propertyPrice || match.property?.price))
          .filter((price) => price > 0),
      );
      const localities = safeArray<string>(buyer.localities);
      const inferredCity = localities.length
        ? inferCityFromLocality(localities[0], propertyLocalityCityMap)
        : 'Unknown';
      return {
        buyerId: buyer.id,
        buyerName: buyer.name || 'Buyer',
        city: inferredCity,
        maxBudget: round1(pickBuyerMaxBudget(buyer)),
        avgMatchedPrice: round1(avgMatchedPrice),
      };
    })
    .filter((row) => row.maxBudget > 0 && row.avgMatchedPrice > 0);

  const buyerAmenityDemand = new Map<string, number>();
  buyers.forEach((buyer) => {
    safeArray<string>(buyer.amenities).forEach((amenity) => {
      const key = normalizeText(amenity);
      if (!key) return;
      buyerAmenityDemand.set(key, (buyerAmenityDemand.get(key) || 0) + 1);
    });
  });

  const propertyAmenitySupply = new Map<string, number>();
  properties.forEach((property) => {
    safeArray<string>(property.amenities).forEach((amenity) => {
      const key = normalizeText(amenity);
      if (!key) return;
      propertyAmenitySupply.set(key, (propertyAmenitySupply.get(key) || 0) + 1);
    });
  });

  const topDemandAmenities = Array.from(buyerAmenityDemand.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key]) => key);

  const amenitiesGap: AmenitiesGapRow[] = topDemandAmenities.map((amenity) => ({
    amenity: titleCase(amenity),
    buyerCount: buyerAmenityDemand.get(amenity) || 0,
    propertyCount: propertyAmenitySupply.get(amenity) || 0,
  }));

  const matchQualityMap = new Map<string, number[]>();
  workflowEvents
    .filter((event) => String(event.eventType || '').toUpperCase() === 'MATCH_FOUND')
    .forEach((event) => {
      const metadata = parseEventMetadata(event.metadata);
      const score = toNumber(metadata.matchScore || metadata.score || metadata.totalScore);
      if (!score) {
        return;
      }
      const key = eventDate(event);
      const arr = matchQualityMap.get(key) || [];
      arr.push(score);
      matchQualityMap.set(key, arr);
    });

  const matchQualityOverTime: MatchQualityOverTimeRow[] = Array.from(matchQualityMap.entries())
    .map(([date, values]) => ({
      date,
      avgScore: round1(average(values)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalLeads = leads.length;
  const stageCounts = STAGES.map((stage) => leads.filter((lead) => {
    const current = pickLeadStatus(lead);
    const currentIndex = STAGES.indexOf(current as LeadConversionRow['stage']);
    const stageIndex = STAGES.indexOf(stage);
    return currentIndex >= stageIndex && currentIndex !== -1;
  }).length);

  const leadConversionRates: LeadConversionRow[] = STAGES.map((stage, index) => ({
    stage,
    count: stageCounts[index],
    pct: totalLeads ? round1((stageCounts[index] / totalLeads) * 100) : 0,
  }));

  const localitySqFtMap = new Map<string, number[]>();
  properties.forEach((property) => {
    const locality = titleCase(String(property.locality || '').trim());
    const area = toNumber(property.area);
    const priceCr = toNumber(property.price);
    if (!locality || !area || !priceCr) {
      return;
    }
    const pricePerSqFt = (priceCr * 10000000) / area;
    const arr = localitySqFtMap.get(locality) || [];
    arr.push(pricePerSqFt);
    localitySqFtMap.set(locality, arr);
  });

  const pricePerSqFt: PricePerSqFtRow[] = Array.from(localitySqFtMap.entries())
    .map(([locality, values]) => ({
      locality,
      avgPricePerSqFt: Math.round(average(values)),
    }))
    .sort((a, b) => b.avgPricePerSqFt - a.avgPricePerSqFt)
    .slice(0, 10);

  const buyerLocalityDemand = new Map<string, number>();
  buyers.forEach((buyer) => {
    safeArray<string>(buyer.localities).forEach((loc) => {
      const key = normalizeText(loc);
      if (!key) return;
      buyerLocalityDemand.set(key, (buyerLocalityDemand.get(key) || 0) + 1);
    });
  });

  const propertyLocalities = new Set<string>();
  properties.forEach((property) => {
    const key = normalizeText(property.locality);
    if (!key) return;
    propertyLocalities.add(key);
  });

  const unmatchedLocalities: LocalityCountRow[] = Array.from(buyerLocalityDemand.entries())
    .filter(([locality]) => !propertyLocalities.has(locality))
    .map(([locality, buyerCount]) => ({ locality: titleCase(locality), count: buyerCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const sellerScores: SellerScoreRow[] = sellers.map((seller) => {
    const sellerMatches = sellerMatchesById[seller.id] || [];
    const score = round1(average(sellerMatches.map((m) => toNumber(m.matchScore)).filter((n) => n > 0)));
    const sellerCity = toCity(seller.city);
    return {
      sellerName: seller.name || 'Seller',
      city: sellerCity,
      avgMatchScore: score,
    };
  });

  const listingVsBudget: ListingVsBudgetRow[] = properties
    .map((property) => {
      const propertyId = property.id;
      const sellerId = property.sellerId || property.seller?.id;
      if (!propertyId || !sellerId) {
        return null;
      }
      const sellerMatches = sellerMatchesById[sellerId] || [];
      const propertyMatches = sellerMatches.filter((match) => {
        const matchPropertyId = match.propertyId || match.property?.id;
        return matchPropertyId === propertyId;
      });
      const avgBuyerMaxBudget = average(
        propertyMatches
          .map((match) => toNumber(match.buyer?.maxBudget || match.buyer?.budgetMax))
          .filter((budget) => budget > 0),
      );
      return {
        propertyTitle: property.title || 'Property',
        price: toNumber(property.price),
        avgBuyerMaxBudget: round1(avgBuyerMaxBudget),
        city: toCity(property.city || property.seller?.city),
      };
    })
    .filter((row): row is ListingVsBudgetRow => Boolean(row && row.price > 0 && row.avgBuyerMaxBudget > 0));

  const cityComponentScores = new Map<CityName, Array<{ location: number; budget: number; size: number; amenities: number }>>();
  allBuyerMatches.forEach((match) => {
    const propertyId = match.propertyId || match.property?.id;
    const property = propertyId ? propertyById.get(propertyId) : undefined;
    const city = toCity(match.property?.city || match.property?.seller?.city || property?.city || property?.seller?.city);
    if (city === 'Unknown') {
      return;
    }
    const arr = cityComponentScores.get(city) || [];
    arr.push({
      location: toNumber(match.locationScore),
      budget: toNumber(match.budgetScore),
      size: toNumber(match.sizeScore),
      amenities: toNumber(match.amenitiesScore),
    });
    cityComponentScores.set(city, arr);
  });

  const scoreComponents: ScoreComponentCityRow[] = SUPPORTED_CITIES.map((city) => {
    const values = cityComponentScores.get(city) || [];
    return {
      city,
      locationScore: round1(average(values.map((v) => v.location).filter((n) => n > 0))),
      budgetScore: round1(average(values.map((v) => v.budget).filter((n) => n > 0))),
      sizeScore: round1(average(values.map((v) => v.size).filter((n) => n > 0))),
      amenitiesScore: round1(average(values.map((v) => v.amenities).filter((n) => n > 0))),
    };
  });

  const bhkValues = [1, 2, 3, 4];
  const bhkGap: BhkGapRow[] = bhkValues.map((bhk) => ({
    bhk,
    buyerCount: buyers.filter((buyer) => Math.round(toNumber(buyer.bhk)) === bhk).length,
    propertyCount: properties.filter((property) => Math.round(toNumber(property.bhk)) === bhk).length,
  }));

  const sellerTypeToScores = new Map<string, number[]>();
  sellers.forEach((seller) => {
    const sellerType = titleCase(String(seller.sellerType || 'Unknown'));
    const score = sellerScores.find((entry) => entry.sellerName === seller.name)?.avgMatchScore || 0;
    const arr = sellerTypeToScores.get(sellerType) || [];
    arr.push(score);
    sellerTypeToScores.set(sellerType, arr);
  });

  const sellerTypePerf: SellerTypePerfRow[] = Array.from(sellerTypeToScores.entries()).map(
    ([sellerType, values]) => ({
      sellerType,
      avgMatchScore: round1(average(values.filter((v) => v > 0))),
    }),
  );

  const cityBudgets = new Map<CityName, number[]>();
  buyers.forEach((buyer) => {
    const localities = safeArray<string>(buyer.localities);
    const city = localities.length
      ? inferCityFromLocality(localities[0], propertyLocalityCityMap)
      : 'Unknown';
    if (city === 'Unknown') {
      return;
    }
    const budget = pickBuyerMaxBudget(buyer);
    if (!budget) {
      return;
    }
    const arr = cityBudgets.get(city) || [];
    arr.push(budget);
    cityBudgets.set(city, arr);
  });

  const budgetDistribution: BudgetDistributionRow[] = SUPPORTED_CITIES.map((city) => {
    const budgets = cityBudgets.get(city) || [];
    if (!budgets.length) {
      return { city, min: 0, avg: 0, max: 0 };
    }
    const sorted = [...budgets].sort((a, b) => a - b);
    return {
      city,
      min: Math.round(sorted[0]),
      avg: round1(average(sorted)),
      max: Math.round(sorted[sorted.length - 1]),
    };
  });

  const validSellerScores = sellerScores.map((row) => row.avgMatchScore).filter((v) => v > 0);
  const avgSellerMatchScore = round1(average(validSellerScores));
  const sellersWith80Plus = sellerScores.filter((row) => row.avgMatchScore >= 80).length;
  const avgMatchedBuyerMaxBudget = round1(
    average(
      allSellerMatches
        .map((match) => toNumber(match.buyer?.maxBudget || match.buyer?.budgetMax))
        .filter((value) => value > 0),
    ),
  );

  const cityToSellerScores = new Map<CityName, number[]>();
  sellerScores.forEach((row) => {
    if (row.city === 'Unknown') return;
    const arr = cityToSellerScores.get(row.city) || [];
    arr.push(row.avgMatchScore);
    cityToSellerScores.set(row.city, arr);
  });

  let bestPerformingCity: CityName = 'Unknown';
  let bestCityScore = -1;
  cityToSellerScores.forEach((scores, city) => {
    const score = average(scores.filter((value) => value > 0));
    if (score > bestCityScore) {
      bestCityScore = score;
      bestPerformingCity = city;
    }
  });

  const sellerKpis = {
    avgSellerMatchScore,
    sellersWith80Plus,
    avgMatchedBuyerMaxBudget,
    bestPerformingCity,
  };

  return {
    kpis,
    sellerKpis,
    buyers,
    sellers,
    properties,
    leads,
    workflowEvents,
    buyerMatchesById,
    sellerMatchesById,
    allBuyerMatches,
    allSellerMatches,
    priceByCity,
    leadPipeline,
    matchScoreDistribution,
    topLocalities,
    budgetVsPrice,
    amenitiesGap,
    matchQualityOverTime,
    leadConversionRates,
    pricePerSqFt,
    unmatchedLocalities,
    sellerScores,
    listingVsBudget,
    scoreComponents,
    bhkGap,
    sellerTypePerf,
    budgetDistribution,
  };
}

export function useAnalyticsData() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [buyersRes, sellersRes, propertiesRes, leadsRes, eventsRes] = await Promise.all([
        api.get('/buyers'),
        api.get('/sellers'),
        api.get('/properties'),
        api.get('/leads'),
        api.get('/workflow-events'),
      ]);

      const buyers = getResponseArray<BuyerRecord>(buyersRes.data);
      const sellers = getResponseArray<SellerRecord>(sellersRes.data);
      const properties = getResponseArray<PropertyRecord>(propertiesRes.data);
      const leads = getResponseArray<LeadRecord>(leadsRes.data);
      const workflowEvents = getResponseArray<WorkflowEventRecord>(eventsRes.data);

      const buyerMatchPairs = await Promise.all(
        buyers.map(async (buyer) => {
          try {
            const res = await api.get(`/matches/buyer/${buyer.id}`);
            return [buyer.id, getResponseArray<MatchRecord>(res.data)] as const;
          } catch {
            return [buyer.id, []] as const;
          }
        }),
      );

      const sellerMatchPairs = await Promise.all(
        sellers.map(async (seller) => {
          try {
            const res = await api.get(`/matches/seller/${seller.id}`);
            return [seller.id, getResponseArray<MatchRecord>(res.data)] as const;
          } catch {
            // Fallback path for codebases without /matches/seller/:id route.
            const fallback: MatchRecord[] = [];
            buyerMatchPairs.forEach(([, matches]) => {
              matches.forEach((match) => {
                const sellerId = match.property?.seller?.id || match.property?.sellerId;
                if (sellerId === seller.id) {
                  fallback.push(match);
                }
              });
            });
            return [seller.id, fallback] as const;
          }
        }),
      );

      const buyerMatchesById = Object.fromEntries(buyerMatchPairs);
      const sellerMatchesById = Object.fromEntries(sellerMatchPairs);

      const computed = computeData({
        buyers,
        sellers,
        properties,
        leads,
        workflowEvents,
        buyerMatchesById,
        sellerMatchesById,
      });

      setData(computed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}
