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

        // Collect points prioritizing metadata geocoding
        const points: Array<{ buyerName: string; locality: string; lat: number; lon: number }> = [];
        const localitiesToGeocode = new Set<string>();

        for (const b of buyers) {
            let locs: string[] = [];
            try { locs = JSON.parse(b.localities); } catch { locs = []; }

            // Check metadata for pre-geocoded locality coordinates
            let meta: any = {};
            try { meta = b.metadata ? JSON.parse(b.metadata) : {}; } catch { }

            if (locs.length > 0) {
                const primaryLocality = locs[0];
                if (meta.coordinates && meta.coordinates.lat && meta.coordinates.lon) {
                    points.push({
                        buyerName: b.name,
                        locality: primaryLocality,
                        lat: meta.coordinates.lat,
                        lon: meta.coordinates.lon,
                    });
                } else {
                    localitiesToGeocode.add(primaryLocality);
                    points.push({ buyerName: b.name, locality: primaryLocality, lat: 0, lon: 0 }); // Placeholder
                }
            }
        }

        // Live Geocode unique localities failing metadata fallback
        const geocoded: Record<string, { lat: number; lon: number }> = {};
        for (const loc of localitiesToGeocode) {
            try {
                const result = await geocodeLocality(loc);
                if (result) geocoded[loc] = result;
                await new Promise((r) => setTimeout(r, 1100)); // rate limit
            } catch { }
        }

        // Merge live geocoded with placeholders
        const finalPoints = points.map(p => {
            if (p.lat !== 0) return p;
            if (geocoded[p.locality]) {
                return { ...p, lat: geocoded[p.locality].lat, lon: geocoded[p.locality].lon };
            }
            return null;
        }).filter(p => p !== null);

        res.json(finalPoints);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.getBuyerById);
router.put('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.updateBuyer);
router.delete('/:id', requireBuyerSelfOrAdmin('id'), BuyerController.deleteBuyer);

export default router;
