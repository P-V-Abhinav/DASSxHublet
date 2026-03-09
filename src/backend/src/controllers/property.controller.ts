import { Request, Response } from 'express';
import { PropertyService } from '../services/property.service';

export class PropertyController {
  /**
   * Create a new property
   */
  static async createProperty(req: Request, res: Response) {
    try {
      const {
        sellerId,
        title,
        description,
        locality,
        address,
        area,
        bhk,
        price,
        amenities,
        propertyType,
        contact,
        metadata,
      } = req.body;

      const property = await PropertyService.createProperty({
        sellerId,
        title,
        description,
        locality,
        address,
        area,
        bhk,
        price,
        amenities,
        propertyType,
        contact,
        metadata,
      });

      res.status(201).json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get property by ID
   */
  static async getPropertyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const property = await PropertyService.getPropertyById(id);

      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      res.json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all properties
   */
  static async getAllProperties(req: Request, res: Response) {
    try {
      const {
        locality,
        bhk,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        propertyType,
        isActive,
        limit,
      } = req.query;

      const properties = await PropertyService.getAllProperties({
        locality: locality as string,
        bhk: bhk ? parseInt(bhk as string) : undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        minArea: minArea ? parseInt(minArea as string) : undefined,
        maxArea: maxArea ? parseInt(maxArea as string) : undefined,
        propertyType: propertyType as string,
        isActive: isActive ? isActive === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update property
   */
  static async updateProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const property = await PropertyService.updateProperty(id, req.body);
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete property
   */
  static async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await PropertyService.deleteProperty(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark property as sold
   */
  static async markPropertyAsSold(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const existing = await PropertyService.getPropertyById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Property not found' });
      }
      const mergedMetadata = { ...(existing.metadata || {}), markedAsSold: true };
      const property = await PropertyService.updateProperty(id, { isActive: false, metadata: mergedMetadata });
      res.json({ success: true, property });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
