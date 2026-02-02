import prisma from '../db/prisma';
import { RuleBasedMatcher, Matcher, BuyerIntent, PropertyData } from '../matchers/rule-based-matcher';
import { WorkflowEventService } from './workflow-event.service';

export class MatchingService {
  private matcher: Matcher;

  constructor(matcher?: Matcher) {
    // Use rule-based matcher by default, but allow injection of different matchers
    this.matcher = matcher || new RuleBasedMatcher();
  }

  /**
   * Find matches for a buyer
   */
  async findMatchesForBuyer(buyerId: string, options?: {
    minScore?: number;
    limit?: number;
  }) {
    const minScore = options?.minScore || 50; // Default minimum score
    const limit = options?.limit || 50;

    // Get buyer with intent
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error(`Buyer ${buyerId} not found`);
    }

    // Get all active properties
    const properties = await prisma.property.findMany({
      where: { isActive: true },
      include: { seller: true },
    });

    // Score each property
    const matches = properties
      .map(property => {
        // Parse JSON strings for SQLite
        const buyerIntent: BuyerIntent = {
          localities: JSON.parse(buyer.localities),
          areaMin: buyer.areaMin || undefined,
          areaMax: buyer.areaMax || undefined,
          bhk: buyer.bhk || undefined,
          budgetMin: buyer.budgetMin || undefined,
          budgetMax: buyer.budgetMax || undefined,
          amenities: JSON.parse(buyer.amenities),
        };

        const propertyData: PropertyData = {
          locality: property.locality,
          area: property.area,
          bhk: property.bhk,
          price: property.price,
          amenities: JSON.parse(property.amenities),
        };

        const matchResult = this.matcher.score(buyerIntent, propertyData);

        return {
          property,
          matchResult,
        };
      })
      .filter(match => match.matchResult.totalScore >= minScore)
      .sort((a, b) => b.matchResult.totalScore - a.matchResult.totalScore)
      .slice(0, limit);

    // Store matches in database
    const storedMatches = await Promise.all(
      matches.map(async match => {
        // Check if match already exists
        const existing = await prisma.match.findUnique({
          where: {
            buyerId_propertyId: {
              buyerId,
              propertyId: match.property.id,
            },
          },
        });

        if (existing) {
          // Update existing match
          return await prisma.match.update({
            where: { id: existing.id },
            data: {
              matchScore: match.matchResult.totalScore,
              locationScore: match.matchResult.locationScore,
              budgetScore: match.matchResult.budgetScore,
              sizeScore: match.matchResult.sizeScore,
              amenitiesScore: match.matchResult.amenitiesScore,
            },
            include: {
              property: {
                include: { seller: true },
              },
            },
          });
        }

        // Create new match
        return await prisma.match.create({
          data: {
            buyerId,
            propertyId: match.property.id,
            matchScore: match.matchResult.totalScore,
            locationScore: match.matchResult.locationScore,
            budgetScore: match.matchResult.budgetScore,
            sizeScore: match.matchResult.sizeScore,
            amenitiesScore: match.matchResult.amenitiesScore,
          },
          include: {
            property: {
              include: { seller: true },
            },
          },
        });
      })
    );

    // Log match generation event
    await WorkflowEventService.logEvent({
      eventType: 'MATCH_GENERATED',
      description: `Generated ${storedMatches.length} matches for buyer ${buyerId}`,
      metadata: {
        buyerId,
        matchCount: storedMatches.length,
        minScore,
      },
    });

    return storedMatches;
  }

  /**
   * Find matches for a property (which buyers might be interested)
   */
  async findMatchesForProperty(propertyId: string, options?: {
    minScore?: number;
    limit?: number;
  }) {
    const minScore = options?.minScore || 50;
    const limit = options?.limit || 50;

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { seller: true },
    });

    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }

    // Get all buyers
    const buyers = await prisma.buyer.findMany();

    // Score each buyer
    const matches = buyers
      .map(buyer => {
        const buyerIntent: BuyerIntent = {
          localities: buyer.localities,
          areaMin: buyer.areaMin || undefined,
          areaMax: buyer.areaMax || undefined,
          bhk: buyer.bhk || undefined,
          budgetMin: buyer.budgetMin || undefined,
          budgetMax: buyer.budgetMax || undefined,
          amenities: buyer.amenities,
        };

        const propertyData: PropertyData = {
          locality: property.locality,
          area: property.area,
          bhk: property.bhk,
          price: property.price,
          amenities: property.amenities,
        };

        const matchResult = this.matcher.score(buyerIntent, propertyData);

        return {
          buyer,
          matchResult,
        };
      })
      .filter(match => match.matchResult.totalScore >= minScore)
      .sort((a, b) => b.matchResult.totalScore - a.matchResult.totalScore)
      .slice(0, limit);

    // Store matches in database
    const storedMatches = await Promise.all(
      matches.map(async match => {
        // Check if match already exists
        const existing = await prisma.match.findUnique({
          where: {
            buyerId_propertyId: {
              buyerId: match.buyer.id,
              propertyId,
            },
          },
        });

        if (existing) {
          return existing;
        }

        // Create new match
        return await prisma.match.create({
          data: {
            buyerId: match.buyer.id,
            propertyId,
            matchScore: match.matchResult.totalScore,
            locationScore: match.matchResult.locationScore,
            budgetScore: match.matchResult.budgetScore,
            sizeScore: match.matchResult.sizeScore,
            amenitiesScore: match.matchResult.amenitiesScore,
          },
          include: {
            buyer: true,
          },
        });
      })
    );

    return storedMatches;
  }

  /**
   * Get all matches for a buyer
   */
  async getMatchesForBuyer(buyerId: string) {
    return await prisma.match.findMany({
      where: { buyerId },
      include: {
        property: {
          include: { seller: true },
        },
      },
      orderBy: { matchScore: 'desc' },
    });
  }

  /**
   * Get all matches for a property
   */
  async getMatchesForProperty(propertyId: string) {
    return await prisma.match.findMany({
      where: { propertyId },
      include: {
        buyer: true,
      },
      orderBy: { matchScore: 'desc' },
    });
  }

  /**
   * Get all matches (Admin)
   */
  async getAllMatches() {
    return await prisma.match.findMany({
      include: {
        buyer: true,
        property: true,
      },
      orderBy: { matchScore: 'desc' },
    });
  }
}
