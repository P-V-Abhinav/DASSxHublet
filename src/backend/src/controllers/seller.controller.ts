import { Request, Response } from 'express';
import { SellerService } from '../services/seller.service';

export class SellerController {
  /**
   * Create a new seller
   */
  static async createSeller(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        phone,
        sellerType,
        rating,
        completedDeals,
        metadata,
      } = req.body;

      const seller = await SellerService.createSeller({
        name,
        email,
        phone,
        sellerType,
        rating,
        completedDeals,
        metadata,
      });

      res.status(201).json(seller);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get seller by ID
   */
  static async getSellerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const seller = await SellerService.getSellerById(id);

      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      res.json(seller);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all sellers
   */
  static async getAllSellers(req: Request, res: Response) {
    try {
      const { minTrustScore, sellerType, limit } = req.query;

      const sellers = await SellerService.getAllSellers({
        minTrustScore: minTrustScore ? parseInt(minTrustScore as string) : undefined,
        sellerType: sellerType as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(sellers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update seller
   */
  static async updateSeller(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const seller = await SellerService.updateSeller(id, req.body);
      res.json(seller);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete seller
   */
  static async deleteSeller(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await SellerService.deleteSeller(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
