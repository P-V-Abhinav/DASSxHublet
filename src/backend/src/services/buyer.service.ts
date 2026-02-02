import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';

export class BuyerService {
  /**
   * Create a new buyer with intent
   */
  static async createBuyer(data: {
    name: string;
    email: string;
    phone?: string;
    localities: string[];
    areaMin?: number;
    areaMax?: number;
    bhk?: number;
    budgetMin?: number;
    budgetMax?: number;
    amenities?: string[];
    rawPreferences?: string;
    metadata?: any;
  }) {
    return await prisma.buyer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        localities: JSON.stringify(data.localities), // SQLite: store as JSON string
        areaMin: data.areaMin,
        areaMax: data.areaMax,
        bhk: data.bhk,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        amenities: JSON.stringify(data.amenities || []), // SQLite: store as JSON string
        rawPreferences: data.rawPreferences,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null, // SQLite: store as JSON string
      },
    });
  }

  /**
   * Get buyer by ID
   */
  static async getBuyerById(id: string) {
    const buyer = await prisma.buyer.findUnique({
      where: { id },
      include: {
        leads: {
          include: {
            property: true,
          },
        },
        matches: {
          include: {
            property: {
              include: {
                seller: true,
              },
            },
          },
          orderBy: {
            matchScore: 'desc',
          },
        },
      },
    });
    
    if (!buyer) return null;
    
    // Parse JSON strings back to arrays/objects
    return {
      ...buyer,
      localities: JSON.parse(buyer.localities),
      amenities: JSON.parse(buyer.amenities),
      metadata: buyer.metadata ? JSON.parse(buyer.metadata) : null,
    };
  }

  /**
   * Get all buyers
   */
  static async getAllBuyers(filters?: {
    bhk?: number;
    localities?: string[];
    limit?: number;
  }) {
    const where: any = {};
    
    if (filters?.bhk) {
      where.bhk = filters.bhk;
    }
    
    // For SQLite, we can't use hasSome on JSON strings
    // We'll filter in memory or skip this filter for now

    const buyers = await prisma.buyer.findMany({
      where,
      take: filters?.limit || 100,
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse JSON strings and optionally filter by localities
    let result = buyers.map((buyer: any) => ({
      ...buyer,
      localities: JSON.parse(buyer.localities),
      amenities: JSON.parse(buyer.amenities),
      metadata: buyer.metadata ? JSON.parse(buyer.metadata) : null,
    }));
    
    // Filter by localities in memory if needed
    if (filters?.localities && filters.localities.length > 0) {
      result = result.filter((buyer: any) => 
        buyer.localities.some((loc: string) => filters.localities!.includes(loc))
      );
    }
    
    return result;
  }

  /**
   * Update buyer
   */
  static async updateBuyer(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    localities: string[];
    areaMin: number;
    areaMax: number;
    bhk: number;
    budgetMin: number;
    budgetMax: number;
    amenities: string[];
    rawPreferences: string;
    metadata: any;
  }>) {
    // Convert arrays to JSON strings for SQLite
    const updateData: any = { ...data };
    if (data.localities) {
      updateData.localities = JSON.stringify(data.localities);
    }
    if (data.amenities) {
      updateData.amenities = JSON.stringify(data.amenities);
    }
    if (data.metadata) {
      updateData.metadata = JSON.stringify(data.metadata);
    }
    
    return await prisma.buyer.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete buyer
   */
  static async deleteBuyer(id: string) {
    return await prisma.buyer.delete({
      where: { id },
    });
  }
}
