import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';

const router = Router();

router.post('/', PropertyController.createProperty);
router.get('/', PropertyController.getAllProperties);
router.get('/:id', PropertyController.getPropertyById);
router.put('/:id', PropertyController.updateProperty);
router.delete('/:id', PropertyController.deleteProperty);

export default router;
