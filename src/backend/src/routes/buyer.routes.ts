import { Router, Request, Response } from 'express';
import { BuyerController } from '../controllers/buyer.controller';
import { requireRoles } from '../middleware/auth.middleware';
import { requireBuyerSelfOrAdmin } from '../middleware/access.middleware';
import prisma from '../db/prisma';
import { geocodeLocality } from '../utils/geocoder';

const router = Router();

router.post('/', requireRoles('admin'), BuyerController.createBuyer);
router.get('/', requireRoles('admin'), BuyerController.getAllBuyers);

// GET /api/buyers/localities-map — returns geocoded buyer localities for admin map
router.get('/localities-map', requireRoles('admin'), async (_req: Request, res: Response) => {
    try {
        const buyers = await prisma.buyer.findMany({
            select: { id: true, name: true, localities: true, metadata: true },
        });

        // Collect unique localities
        const localitySet = new Set<string>();
        const buyerLocalities: Array<{ buyerName: string; locality: string }> = [];

        for (const b of buyers) {
            let locs: string[] = [];
            try { locs = JSON.parse(b.localities); } catch { locs = []; }

            // Check metadata for pre-geocoded locality coordinates
            let meta: any = {};
            try { meta = b.metadata ? JSON.parse(b.metadata) : {}; } catch { }

            for (const loc of locs) {
                buyerLocalities.push({ buyerName: b.name, locality: loc });
                localitySet.add(loc);
            }
        }

        // Geocode unique localities
        const geocoded: Record<string, { lat: number; lon: number }> = {};
        for (const loc of localitySet) {
            try {
                const result = await geocodeLocality(loc);
                if (result) geocoded[loc] = result;
                await new Promise((r) => setTimeout(r, 1100)); // rate limit
            } catch { }
        }

        // Build response
        const points = buyerLocalities
            .filter((bl) => geocoded[bl.locality])
            .map((bl) => ({
                buyerName: bl.buyerName,
                locality: bl.locality,
                lat: geocoded[bl.locality].lat,
                lon: geocoded[bl.locality].lon,
            }));

        res.json(points);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.getBuyerById);
router.put('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.updateBuyer);
router.delete('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.deleteBuyer);

export default router;
