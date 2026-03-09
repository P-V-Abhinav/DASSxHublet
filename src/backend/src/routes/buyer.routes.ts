import { Router } from 'express';
import { BuyerController } from '../controllers/buyer.controller';
import { requireRoles } from '../middleware/auth.middleware';
import { requireBuyerSelfOrAdmin } from '../middleware/access.middleware';

const router = Router();

router.post('/', requireRoles('admin'), BuyerController.createBuyer);
router.get('/', requireRoles('admin'), BuyerController.getAllBuyers);
router.get('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.getBuyerById);
router.put('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.updateBuyer);
router.delete('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.deleteBuyer);

export default router;
