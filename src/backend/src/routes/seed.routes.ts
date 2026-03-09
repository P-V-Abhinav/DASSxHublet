/**
 * seed.routes.ts
 * 
 * Modular admin-only routes for demo seeding operations.
 * Mounted at /api/admin/seed/* — fully self-contained.
 */

import { Router, Request, Response } from 'express';
import { requireRoles } from '../middleware/auth.middleware';
import prisma from '../db/prisma';
import { seedDemoBuyers } from '../scripts/seed-demo-buyers';
import { resetSellerTrust } from '../scripts/reset-seller-trust';

const router = Router();

/**
 * POST /api/admin/seed/demo-buyers
 * Seeds 6-7 demo buyers per city (Mumbai, Chennai, Hyderabad, Bangalore, Pune, Kochi).
 * Skips buyers that already exist (idempotent).
 */
router.post('/demo-buyers', requireRoles('admin'), async (req: Request, res: Response) => {
    try {
        const result = await seedDemoBuyers(prisma);
        res.json({
            success: true,
            message: `Created ${result.created} demo buyers (${result.skipped} already existed)`,
            created: result.created,
            skipped: result.skipped,
            buyers: result.buyers,
        });
    } catch (error: any) {
        console.error('[seed/demo-buyers] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/admin/seed/reset-seller-trust
 * Resets all sellers' trustScore, completedDeals, rating, ratingCount to 0.
 */
router.post('/reset-seller-trust', requireRoles('admin'), async (req: Request, res: Response) => {
    try {
        const result = await resetSellerTrust(prisma);
        res.json({
            success: true,
            message: `Reset trust scores for ${result.updated} sellers`,
            updated: result.updated,
            sellers: result.sellers,
        });
    } catch (error: any) {
        console.error('[seed/reset-seller-trust] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
