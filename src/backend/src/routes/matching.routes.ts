import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';

const router = Router();

// Find new matches
router.post('/buyer/:buyerId/find', MatchingController.findMatchesForBuyer);
router.post('/property/:propertyId/find', MatchingController.findMatchesForProperty);

// Get existing matches
router.get('/', MatchingController.getAllMatches); // Admin: get all matches
router.get('/buyer/:buyerId', MatchingController.getMatchesForBuyer);
router.get('/property/:propertyId', MatchingController.getMatchesForProperty);

export default router;
