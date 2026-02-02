import { Router } from 'express';
import { SellerController } from '../controllers/seller.controller';

const router = Router();

router.post('/', SellerController.createSeller);
router.get('/', SellerController.getAllSellers);
router.get('/:id', SellerController.getSellerById);
router.put('/:id', SellerController.updateSeller);
router.delete('/:id', SellerController.deleteSeller);

export default router;
