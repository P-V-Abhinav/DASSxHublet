import { Router } from 'express';
import { BuyerController } from '../controllers/buyer.controller';

const router = Router();

router.post('/', BuyerController.createBuyer);
router.get('/', BuyerController.getAllBuyers);
router.get('/:id', BuyerController.getBuyerById);
router.put('/:id', BuyerController.updateBuyer);
router.delete('/:id', BuyerController.deleteBuyer);

export default router;
