/**
 * refresh-matches.ts
 *
 * Centralized utility to trigger matching for all buyers.
 * Call this after any batch data change (seeding, scraping, fb-save).
 */

import { BuyerService } from '../services/buyer.service';
import { MatchingService } from '../services/matching.service';

/**
 * Runs matching for every buyer in the database.
 * Fire-and-forget safe — logs errors internally.
 * Returns { buyersProcessed, totalMatches }.
 */
export async function refreshAllMatches(): Promise<{ buyersProcessed: number; totalMatches: number }> {
    try {
        const buyers = await BuyerService.getAllBuyers();
        const matchingService = new MatchingService();
        let totalMatches = 0;
        for (const buyer of buyers) {
            try {
                const matches = await matchingService.findMatchesForBuyer(buyer.id);
                totalMatches += matches.length;
            } catch (err: any) {
                console.warn(`[refreshAllMatches] Failed for buyer ${buyer.id}:`, err.message);
            }
        }
        console.log(`[refreshAllMatches] Done: ${buyers.length} buyers, ${totalMatches} matches`);
        return { buyersProcessed: buyers.length, totalMatches };
    } catch (err: any) {
        console.error('[refreshAllMatches] Fatal error:', err.message);
        return { buyersProcessed: 0, totalMatches: 0 };
    }
}
