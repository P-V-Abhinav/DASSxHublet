export type CityName = 'Mumbai' | 'Hyderabad' | 'Delhi' | 'Unknown';

export interface BuyerRecord {
  id: string;
  name: string;
  email?: string;
  localities?: string[];
  bhk?: number;
  budgetMin?: number;
  budgetMax?: number;
  maxBudget?: number;
  amenities?: string[];
}

export interface SellerRecord {
  id: string;
  name: string;
  email?: string;
  sellerType?: string;
  city?: string;
}

export interface PropertyRecord {
  id: string;
  title: string;
  city?: string;
  locality?: string;
  bhk?: number;
  area?: number;
  price?: number;
  amenities?: string[];
  sellerId?: string;
  seller?: {
    id?: string;
    name?: string;
    city?: string;
    sellerType?: string;
  };
}

export interface LeadRecord {
  id: string;
  status?: string;
  state?: string;
}

export interface MatchRecord {
  id?: string;
  buyerId?: string;
  propertyId?: string;
  matchScore?: number;
  locationScore?: number;
  budgetScore?: number;
  sizeScore?: number;
  amenitiesScore?: number;
  propertyPrice?: number;
  buyer?: {
    id?: string;
    name?: string;
    maxBudget?: number;
    budgetMax?: number;
  };
  property?: {
    id?: string;
    title?: string;
    price?: number;
    locality?: string;
    city?: string;
    sellerId?: string;
    seller?: {
      id?: string;
      name?: string;
      city?: string;
      sellerType?: string;
    };
  };
}

export interface WorkflowEventRecord {
  id: string;
  eventType?: string;
  timestamp?: string;
  createdAt?: string;
  metadata?: unknown;
}

export interface Kpis {
  totalBuyers: number;
  totalSellers: number;
  totalProperties: number;
  totalLeads: number;
  avgMatchScorePct: number;
  leadsAbove60Count: number;
  leadsAbove60Pct: number;
}

export interface PriceByCityRow {
  bhk: number;
  Mumbai: number;
  Hyderabad: number;
  Delhi: number;
}

export interface PipelineRow {
  status: 'NEW' | 'ENRICHED' | 'QUALIFIED' | 'NOTIFIED' | 'CONTACTED' | 'CLOSED';
  count: number;
}

export interface DistributionRow {
  band: string;
  count: number;
}

export interface LocalityCountRow {
  locality: string;
  count: number;
}

export interface BudgetVsPriceRow {
  buyerId: string;
  buyerName: string;
  city: CityName;
  maxBudget: number;
  avgMatchedPrice: number;
}

export interface AmenitiesGapRow {
  amenity: string;
  buyerCount: number;
  propertyCount: number;
}

export interface MatchQualityOverTimeRow {
  date: string;
  avgScore: number;
}

export interface LeadConversionRow {
  stage: 'NEW' | 'ENRICHED' | 'QUALIFIED' | 'NOTIFIED' | 'CONTACTED' | 'CLOSED';
  count: number;
  pct: number;
}

export interface PricePerSqFtRow {
  locality: string;
  avgPricePerSqFt: number;
}

export interface SellerScoreRow {
  sellerName: string;
  city: CityName;
  avgMatchScore: number;
}

export interface ListingVsBudgetRow {
  propertyTitle: string;
  price: number;
  avgBuyerMaxBudget: number;
  city: CityName;
}

export interface ScoreComponentCityRow {
  city: CityName;
  locationScore: number;
  budgetScore: number;
  sizeScore: number;
  amenitiesScore: number;
}

export interface BhkGapRow {
  bhk: number;
  buyerCount: number;
  propertyCount: number;
}

export interface SellerTypePerfRow {
  sellerType: string;
  avgMatchScore: number;
}

export interface BudgetDistributionRow {
  city: CityName;
  min: number;
  avg: number;
  max: number;
}

export interface SellerKpis {
  avgSellerMatchScore: number;
  sellersWith80Plus: number;
  avgMatchedBuyerMaxBudget: number;
  bestPerformingCity: CityName;
}

export interface AnalyticsData {
  kpis: Kpis;
  sellerKpis: SellerKpis;
  buyers: BuyerRecord[];
  sellers: SellerRecord[];
  properties: PropertyRecord[];
  leads: LeadRecord[];
  workflowEvents: WorkflowEventRecord[];
  buyerMatchesById: Record<string, MatchRecord[]>;
  sellerMatchesById: Record<string, MatchRecord[]>;
  allBuyerMatches: MatchRecord[];
  allSellerMatches: MatchRecord[];
  priceByCity: PriceByCityRow[];
  leadPipeline: PipelineRow[];
  matchScoreDistribution: DistributionRow[];
  topLocalities: LocalityCountRow[];
  budgetVsPrice: BudgetVsPriceRow[];
  amenitiesGap: AmenitiesGapRow[];
  matchQualityOverTime: MatchQualityOverTimeRow[];
  leadConversionRates: LeadConversionRow[];
  pricePerSqFt: PricePerSqFtRow[];
  unmatchedLocalities: LocalityCountRow[];
  sellerScores: SellerScoreRow[];
  listingVsBudget: ListingVsBudgetRow[];
  scoreComponents: ScoreComponentCityRow[];
  bhkGap: BhkGapRow[];
  sellerTypePerf: SellerTypePerfRow[];
  budgetDistribution: BudgetDistributionRow[];
}
