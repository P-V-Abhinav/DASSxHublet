import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';

export class PropertyService {
  /**
   * Create a new property
   */
  static async createProperty(data: {
    sellerId: string;
    title: string;
    description?: string;
    locality: string;
    address?: string;
    area: number;
    bhk: number;
    price: number;
    amenities?: string[];
    propertyType?: string;
    metadata?: any;
  }) {
    return await prisma.property.create({
      data: {
        sellerId: data.sellerId,
        title: data.title,
        description: data.description,
        locality: data.locality,
        address: data.address,
        area: data.area,
        bhk: data.bhk,
        price: data.price,
        amenities: JSON.stringify(data.amenities || []), // SQLite: store as JSON string
        propertyType: data.propertyType || 'apartment',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null, // SQLite: store as JSON string
        isActive: true,
      },
      include: {
        seller: true,
      },
    });
  }

  /**
   * Get property by ID
   */
  static async getPropertyById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        seller: true,
        matches: {
          include: {
            buyer: true,
          },
          orderBy: {
            matchScore: 'desc',
          },
        },
      },
    });
    
    if (!property) return null;
    
    // Parse JSON strings back to arrays/objects
    return {
      ...property,
      amenities: JSON.parse(property.amenities),
      metadata: property.metadata ? JSON.parse(property.metadata) : null,
    };
  }

  /**
   * Get all properties with filters
   */
  static async getAllProperties(filters?: {
    locality?: string;
    bhk?: number;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    propertyType?: string;
    isActive?: boolean;
    limit?: number;
  }) {
    const where: any = {
      isActive: filters?.isActive ?? true,
    };
    
    if (filters?.locality) {
      where.locality = {
        contains: filters.locality,
        mode: 'insensitive',
      };
    }
    
    if (filters?.bhk) {
      where.bhk = filters.bhk;
    }
    
    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {
        ...(filters?.minPrice && { gte: filters.minPrice }),
        ...(filters?.maxPrice && { lte: filters.maxPrice }),
      };
    }
    
    if (filters?.minArea || filters?.maxArea) {
      where.area = {
        ...(filters?.minArea && { gte: filters.minArea }),
        ...(filters?.maxArea && { lte: filters.maxArea }),
      };
    }
    
    if (filters?.propertyType) {
      where.propertyType = filters.propertyType;
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        seller: true,
      },
      take: filters?.limit || 100,
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse JSON strings back to arrays/objects
    return properties.map((property: any) => ({
      ...property,
      amenities: JSON.parse(property.amenities),
      metadata: property.metadata ? JSON.parse(property.metadata) : null,
    }));
  }

  /**
   * Update property
   */
  static async updateProperty(id: string, data: Partial<{
    title: string;
    description: string;
    locality: string;
    address: string;
    area: number;
    bhk: number;
    price: number;
    amenities: string[];
    propertyType: string;
    isActive: boolean;
    metadata: any;
  }>) {
    // Convert arrays to JSON strings for SQLite
    const updateData: any = { ...data };
    if (data.amenities) {
      updateData.amenities = JSON.stringify(data.amenities);
    }
    if (data.metadata) {
      updateData.metadata = JSON.stringify(data.metadata);
    }
    
    return await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        seller: true,
      },
    });
  }

  /**
   * Delete property
   */
  static async deleteProperty(id: string) {
    return await prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Search properties by localities
   */
  static async searchByLocalities(localities: string[], limit = 50) {
    return await prisma.property.findMany({
      where: {
        isActive: true,
        locality: {
          in: localities,
        },
      },
      include: {
        seller: true,
      },
      take: limit,
    });
  }
}
