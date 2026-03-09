import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';
import { requireRoles } from '../middleware/auth.middleware';
import { requireBuyerSelfOrAdmin, requirePropertyOwnerOrAdmin } from '../middleware/access.middleware';

const router = Router();

// Find new matches
router.post('/buyer/:buyerId/find', requireRoles('admin', 'buyer'), requireBuyerSelfOrAdmin('buyerId'), MatchingController.findMatchesForBuyer);
router.post('/property/:propertyId/find', requireRoles('admin', 'seller'), requirePropertyOwnerOrAdmin('propertyId'), MatchingController.findMatchesForProperty);

// Get existing matches
router.get('/', requireRoles('admin'), MatchingController.getAllMatches);
router.get('/buyer/:buyerId', requireRoles('admin', 'buyer'), requireBuyerSelfOrAdmin('buyerId'), MatchingController.getMatchesForBuyer);
router.get('/property/:propertyId', requireRoles('admin', 'seller'), requirePropertyOwnerOrAdmin('propertyId'), MatchingController.getMatchesForProperty);

export default router;
