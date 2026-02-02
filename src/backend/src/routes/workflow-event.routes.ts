import { Router } from 'express';
import { WorkflowEventController } from '../controllers/workflow-event.controller';

const router = Router();

router.get('/', WorkflowEventController.getAllEvents);
router.get('/lead/:leadId', WorkflowEventController.getEventsByLead);

export default router;
