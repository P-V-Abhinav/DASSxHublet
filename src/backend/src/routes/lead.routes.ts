import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';

const router = Router();

router.post('/', LeadController.createLead);
router.get('/', LeadController.getAllLeads);
router.get('/:id', LeadController.getLeadById);
router.post('/:id/transition', LeadController.transitionState);
router.get('/:id/allowed-states', LeadController.getAllowedNextStates);

export default router;
