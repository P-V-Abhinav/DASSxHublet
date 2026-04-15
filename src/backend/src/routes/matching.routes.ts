import { Router, Request, Response } from 'express';
import { MatchingController } from '../controllers/matching.controller';
import { requireRoles } from '../middleware/auth.middleware';
import { requireBuyerSelfOrAdmin, requirePropertyOwnerOrAdmin } from '../middleware/access.middleware';
import { MatchingService } from '../services/matching.service';
import { BuyerService } from '../services/buyer.service';

const router = Router();

// Find new matches
router.post('/buyer/:buyerId/find', requireRoles('admin', 'buyer'), requireBuyerSelfOrAdmin('buyerId'), MatchingController.findMatchesForBuyer);
router.post('/property/:propertyId/find', requireRoles('admin', 'seller'), requirePropertyOwnerOrAdmin('propertyId'), MatchingController.findMatchesForProperty);

// Refresh all matches (admin only) — triggers matching for every buyer
router.post('/refresh-all', requireRoles('admin'), async (req: Request, res: Response) => {
    try {
        const buyers = await BuyerService.getAllBuyers();
        const matchingService = new MatchingService();
        let totalMatches = 0;
        for (const buyer of buyers) {
            const matches = await matchingService.findMatchesForBuyer(buyer.id);
            totalMatches += matches.length;
        }
        res.json({ success: true, message: `Refreshed matches for ${buyers.length} buyers`, totalMatches, buyersProcessed: buyers.length });
    } catch (error: any) {
        console.error('[matches/refresh-all] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get existing matches
router.get('/', requireRoles('admin'), MatchingController.getAllMatches);
router.get('/buyer/:buyerId', requireRoles('admin', 'buyer'), requireBuyerSelfOrAdmin('buyerId'), MatchingController.getMatchesForBuyer);
router.get('/property/:propertyId', requireRoles('admin', 'seller'), requirePropertyOwnerOrAdmin('propertyId'), MatchingController.getMatchesForProperty);

export default router;
