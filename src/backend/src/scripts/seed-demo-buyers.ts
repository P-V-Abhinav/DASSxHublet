/**
 * seed-demo-buyers.ts
 *
 * Stub — the original seeder was removed. Provides the export signature
 * so that seed.routes.ts and reset-database.ts can compile/run.
 */

import { PrismaClient } from '@prisma/client';

export async function seedDemoBuyers(_prisma: PrismaClient): Promise<{
    created: number;
    skipped: number;
    buyers: Array<{ name: string; email: string; password: string; city: string }>;
}> {
    console.log('[seed-demo-buyers] No-op stub — seeder script not available');
    return { created: 0, skipped: 0, buyers: [] };
}
