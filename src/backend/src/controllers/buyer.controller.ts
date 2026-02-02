import { Request, Response } from 'express';
import { BuyerService } from '../services/buyer.service';
import { KeywordIntentParser } from '../parsers/intent-parser';

const intentParser = new KeywordIntentParser();

export class BuyerController {
  /**
   * Create a new buyer
   */
  static async createBuyer(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        phone,
        localities,
        areaMin,
        areaMax,
        bhk,
        budgetMin,
        budgetMax,
        amenities,
        rawPreferences,
        metadata,
      } = req.body;

      // If raw preferences are provided, parse them
      let parsedIntent;
      if (rawPreferences) {
        parsedIntent = intentParser.parse(rawPreferences);
      }

      const buyer = await BuyerService.createBuyer({
        name,
        email,
        phone,
        localities: localities || parsedIntent?.localities || [],
        areaMin: areaMin || parsedIntent?.areaMin,
        areaMax: areaMax || parsedIntent?.areaMax,
        bhk: bhk || parsedIntent?.bhk,
        budgetMin: budgetMin || parsedIntent?.budgetMin,
        budgetMax: budgetMax || parsedIntent?.budgetMax,
        amenities: amenities || parsedIntent?.amenities || [],
        rawPreferences,
        metadata,
      });

      res.status(201).json(buyer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get buyer by ID
   */
  static async getBuyerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const buyer = await BuyerService.getBuyerById(id);

      if (!buyer) {
        return res.status(404).json({ error: 'Buyer not found' });
      }

      res.json(buyer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all buyers
   */
  static async getAllBuyers(req: Request, res: Response) {
    try {
      const { bhk, localities, limit } = req.query;

      const buyers = await BuyerService.getAllBuyers({
        bhk: bhk ? parseInt(bhk as string) : undefined,
        localities: localities ? (localities as string).split(',') : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(buyers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update buyer
   */
  static async updateBuyer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const buyer = await BuyerService.updateBuyer(id, req.body);
      res.json(buyer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete buyer
   */
  static async deleteBuyer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await BuyerService.deleteBuyer(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
