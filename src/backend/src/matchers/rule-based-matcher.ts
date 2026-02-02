// Pluggable matcher interface
export interface Matcher {
  score(buyerIntent: BuyerIntent, property: PropertyData): MatchResult;
}

export interface BuyerIntent {
  localities: string[];
  areaMin?: number;
  areaMax?: number;
  bhk?: number;
  budgetMin?: number;
  budgetMax?: number;
  amenities: string[];
}

export interface PropertyData {
  locality: string;
  area: number;
  bhk: number;
  price: number;
  amenities: string[];
}

export interface MatchResult {
  totalScore: number;
  locationScore: number;
  budgetScore: number;
  sizeScore: number;
  amenitiesScore: number;
}

/**
 * Rule-based matcher with weighted scoring
 * This is a placeholder that can be replaced with ML-based matching later
 */
export class RuleBasedMatcher implements Matcher {
  // Weights for different criteria
  private readonly WEIGHTS = {
    location: 0.35,  // 35%
    budget: 0.30,    // 30%
    size: 0.20,      // 20%
    amenities: 0.15, // 15%
  };

  score(buyerIntent: BuyerIntent, property: PropertyData): MatchResult {
    const locationScore = this.scoreLocation(buyerIntent, property);
    const budgetScore = this.scoreBudget(buyerIntent, property);
    const sizeScore = this.scoreSize(buyerIntent, property);
    const amenitiesScore = this.scoreAmenities(buyerIntent, property);

    const totalScore =
      locationScore * this.WEIGHTS.location +
      budgetScore * this.WEIGHTS.budget +
      sizeScore * this.WEIGHTS.size +
      amenitiesScore * this.WEIGHTS.amenities;

    return {
      totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimals
      locationScore,
      budgetScore,
      sizeScore,
      amenitiesScore,
    };
  }

  /**
   * Score location match (0-100)
   */
  private scoreLocation(buyerIntent: BuyerIntent, property: PropertyData): number {
    // Check if property locality matches any of buyer's preferred localities
    const normalizedBuyerLocalities = buyerIntent.localities.map(l => l.toLowerCase().trim());
    const normalizedPropertyLocality = property.locality.toLowerCase().trim();

    // Exact match
    if (normalizedBuyerLocalities.includes(normalizedPropertyLocality)) {
      return 100;
    }

    // Partial match (locality contains buyer preference or vice versa)
    for (const buyerLocality of normalizedBuyerLocalities) {
      if (
        normalizedPropertyLocality.includes(buyerLocality) ||
        buyerLocality.includes(normalizedPropertyLocality)
      ) {
        return 70;
      }
    }

    return 0;
  }

  /**
   * Score budget match (0-100)
   */
  private scoreBudget(buyerIntent: BuyerIntent, property: PropertyData): number {
    // If no budget specified, neutral score
    if (!buyerIntent.budgetMin && !buyerIntent.budgetMax) {
      return 50;
    }

    const propertyPrice = property.price;

    // Within range
    if (
      (!buyerIntent.budgetMin || propertyPrice >= buyerIntent.budgetMin) &&
      (!buyerIntent.budgetMax || propertyPrice <= buyerIntent.budgetMax)
    ) {
      return 100;
    }

    // Calculate how far off the price is
    if (buyerIntent.budgetMax && propertyPrice > buyerIntent.budgetMax) {
      const overage = ((propertyPrice - buyerIntent.budgetMax) / buyerIntent.budgetMax) * 100;
      // Within 10% over budget still gets decent score
      if (overage <= 10) return 70;
      if (overage <= 20) return 40;
      return 10;
    }

    if (buyerIntent.budgetMin && propertyPrice < buyerIntent.budgetMin) {
      const underage = ((buyerIntent.budgetMin - propertyPrice) / buyerIntent.budgetMin) * 100;
      // Within 10% under budget still gets decent score
      if (underage <= 10) return 70;
      if (underage <= 20) return 40;
      return 10;
    }

    return 30;
  }

  /**
   * Score size match (0-100)
   */
  private scoreSize(buyerIntent: BuyerIntent, property: PropertyData): number {
    let score = 0;

    // BHK match
    if (buyerIntent.bhk) {
      if (property.bhk === buyerIntent.bhk) {
        score += 50;
      } else if (Math.abs(property.bhk - buyerIntent.bhk) === 1) {
        score += 25; // One BHK difference
      }
    } else {
      score += 25; // No preference specified
    }

    // Area match
    if (buyerIntent.areaMin || buyerIntent.areaMax) {
      const propertyArea = property.area;

      if (
        (!buyerIntent.areaMin || propertyArea >= buyerIntent.areaMin) &&
        (!buyerIntent.areaMax || propertyArea <= buyerIntent.areaMax)
      ) {
        score += 50;
      } else {
        // Partial score if close
        const minDiff = buyerIntent.areaMin ? Math.abs(propertyArea - buyerIntent.areaMin) : 0;
        const maxDiff = buyerIntent.areaMax ? Math.abs(propertyArea - buyerIntent.areaMax) : 0;
        const closestDiff = Math.min(minDiff || Infinity, maxDiff || Infinity);
        
        if (closestDiff < 200) score += 25;
        else if (closestDiff < 500) score += 10;
      }
    } else {
      score += 25; // No area preference specified
    }

    return Math.min(score, 100);
  }

  /**
   * Score amenities match (0-100)
   */
  private scoreAmenities(buyerIntent: BuyerIntent, property: PropertyData): number {
    if (!buyerIntent.amenities || buyerIntent.amenities.length === 0) {
      return 50; // No preference specified
    }

    const normalizedBuyerAmenities = buyerIntent.amenities.map(a => a.toLowerCase().trim());
    const normalizedPropertyAmenities = property.amenities.map(a => a.toLowerCase().trim());

    let matchCount = 0;
    for (const amenity of normalizedBuyerAmenities) {
      if (normalizedPropertyAmenities.includes(amenity)) {
        matchCount++;
      }
    }

    const matchPercentage = (matchCount / normalizedBuyerAmenities.length) * 100;
    return Math.round(matchPercentage);
  }
}
