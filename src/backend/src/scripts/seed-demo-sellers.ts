/**
 * seed-demo-sellers.ts
 *
 * Stub — the original seeder was removed. Provides the export signature
 * so that seed.routes.ts can compile/run.
 */

import { PrismaClient } from '@prisma/client';

export async function seedDemoSellers(_prisma: PrismaClient): Promise<{
    created: number;
    skipped: number;
    sellers: Array<{ name: string; email: string; password: string }>;
}> {
    console.log('[seed-demo-sellers] No-op stub — seeder script not available');
    return { created: 0, skipped: 0, sellers: [] };
}
