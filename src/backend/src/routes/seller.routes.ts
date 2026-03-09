import { Router } from 'express';
import { SellerController } from '../controllers/seller.controller';
import { requireRoles } from '../middleware/auth.middleware';
import { requireSellerSelfOrAdmin } from '../middleware/access.middleware';

const router = Router();

router.post('/', requireRoles('admin'), SellerController.createSeller);
router.get('/', requireRoles('admin'), SellerController.getAllSellers);
router.get('/:id', requireSellerSelfOrAdmin('id'), SellerController.getSellerById);
router.put('/:id', requireSellerSelfOrAdmin('id'), SellerController.updateSeller);
router.delete('/:id', requireSellerSelfOrAdmin('id'), SellerController.deleteSeller);

export default router;
