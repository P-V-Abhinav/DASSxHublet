
import { spawn } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { MatchingService } from './matching.service';
import { LeadService } from './lead.service';

const prisma = new PrismaClient();

interface ScrapedProperty {
    title: string;
    price: number;
    area: number;
    locality: string;
    city: string;
    description: string;
    sourceUrl: string;
    externalId: string;
    source: string;
    bhk: number;
    amenities: string[];
    propertyType: string;
    sellerName?: string;
    sellerType?: string;
}

export class ScrapingService {
    private static SCRAPER_DIR = path.join(__dirname, '../../scraper');
    private static PYTHON_EXEC_PATH = path.join(__dirname, '../../scraper/venv/bin/python');
    private static PYTHON_SCRIPT_PATH = path.join(__dirname, '../../scraper/scraper.py');

    // Helper to get or create a seller based on scraped data
    private static async getOrCreateSeller(name: string = 'System Scraper', type: string = 'system') {
        // Create a unique email for this seller
        // Allow re-use if the name matches (simple heuristic)
        const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${safeName}@hublet.scraped`;

        let seller = await prisma.seller.findUnique({
            where: { email: email }
        });

        if (!seller) {
            seller = await prisma.seller.create({
                data: {
                    name: name,
                    email: email,
                    phone: '0000000000', // Placeholder
                    sellerType: type.toLowerCase(),
                    rating: 4.0, // Default rating for scraped sellers
                    completedDeals: 0
                }
            });
            console.log(`[ScrapingService] Created new seller: ${name} (${type})`);
        }
        return seller.id;
    }

    // Helper to generate a random buyer name
    private static getRandomName() {
        const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Rohan', 'Ishaan', 'Zara', 'Diya', 'Ananya', 'Riya', 'Kavya'];
        const lastNames = ['Sharma', 'Patel', 'Mehta', 'Singh', 'Gupta', 'Kumar', 'Reddy', 'Das', 'Joshi', 'Nair'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }

    // Generate a synthetic buyer interested in this property
    private static async createSyntheticBuyer(property: any) {
        try {
            const name = this.getRandomName();
            const email = `buyer.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`;

            // Create budget range around property price
            const budgetMin = Math.floor(property.price * 0.8);
            const budgetMax = Math.floor(property.price * 1.2);

            // Create area range around property area
            const areaMin = Math.floor(property.area * 0.8);
            const areaMax = Math.floor(property.area * 1.2);

            const buyer = await prisma.buyer.create({
                data: {
                    name: name,
                    email: email,
                    phone: `9${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
                    localities: JSON.stringify([property.locality, property.city]),
                    areaMin: areaMin,
                    areaMax: areaMax,
                    budgetMin: budgetMin,
                    budgetMax: budgetMax,
                    bhk: property.bhk,
                    amenities: property.amenities, // Interested in same amenities
                    metadata: JSON.stringify({
                        source: 'synthetic-scraper',
                        generatedForPropertyId: property.id,
                        interest: 'high'
                    })
                }
            });
            console.log(`[ScrapingService] Created synthetic buyer: ${buyer.name} (Budget: ${budgetMin}-${budgetMax})`);
            return buyer;
        } catch (error: any) {
            console.error(`[ScrapingService] Failed to create synthetic buyer: ${error.message}`);
        }
    }

    static async scrapeCity(city: string, limit: number = 10): Promise<{ added: number, errors: string[] }> {
        return new Promise(async (resolve, reject) => {
            console.log(`[ScrapingService] Starting scrape for ${city} (limit: ${limit})`);

            const pythonProcess = spawn(ScrapingService.PYTHON_EXEC_PATH, [
                this.PYTHON_SCRIPT_PATH,
                '--city', city,
                '--limit', limit.toString()
            ]);

            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            pythonProcess.on('close', async (code) => {
                if (code !== 0) {
                    console.error(`[ScrapingService] Python script exited with code ${code}: ${errorString}`);
                    return reject(new Error(`Scraper failed: ${errorString}`));
                }

                try {
                    const listings: ScrapedProperty[] = JSON.parse(dataString);
                    console.log(`[ScrapingService] Scraper returned ${listings.length} listings`);
                    // console.log('[ScrapingService] Raw Scraper Output:', JSON.stringify(listings, null, 2));

                    // const sellerId = await this.getSystemSellerId(); // Removed static system seller
                    const matchingService = new MatchingService();
                    let addedCount = 0;
                    const processingErrors: string[] = [];

                    for (const listing of listings) {
                        try {
                            const sellerId = await this.getOrCreateSeller(listing.sellerName, listing.sellerType);

                            // Check for existing property
                            const existing = await prisma.property.findFirst({
                                where: {
                                    title: listing.title,
                                    locality: listing.locality,
                                    sellerId: sellerId // Now checking specific seller
                                }
                            });

                            if (existing) {
                                console.log(`[ScrapingService] Skipping existing property: ${listing.title}`);
                                continue;
                            }

                            const newProperty = await prisma.property.create({
                                data: {
                                    sellerId: sellerId,
                                    title: listing.title,
                                    locality: listing.locality,
                                    address: listing.locality,
                                    area: listing.area,
                                    bhk: listing.bhk,
                                    price: listing.price,
                                    amenities: JSON.stringify(listing.amenities),
                                    propertyType: listing.propertyType,
                                    description: listing.description,
                                    metadata: JSON.stringify({
                                        sourceUrl: listing.sourceUrl,
                                        externalId: listing.externalId,
                                        source: listing.source,
                                        scrapedAt: new Date().toISOString()
                                    })
                                }
                            });
                            console.log(`[ScrapingService] Successfully added property: ${newProperty.title} (ID: ${newProperty.id})`);
                            addedCount++;


                            // --- AUTO-MATCHING & LEAD CREATION ---
                            try {
                                const matches = await matchingService.findMatchesForProperty(newProperty.id);
                                console.log(`[ScrapingService] Generated ${matches.length} matches for "${newProperty.title}"`);

                                // Auto-create leads for high quality matches
                                for (const match of matches) {
                                    if (match.matchScore >= 70) {
                                        await LeadService.createLead({
                                            buyerId: match.buyerId,
                                            propertyId: newProperty.id,
                                            matchScore: match.matchScore,
                                            metadata: {
                                                source: 'auto-scraper',
                                                autoCreated: true
                                            }
                                        });
                                        console.log(`[ScrapingService] Auto-created LEAD for Buyer ${match.buyerId}`);
                                    }
                                }
                            } catch (matchErr: any) {
                                console.error(`[ScrapingService] Matching failed for property ${newProperty.id}:`, matchErr.message);
                            }
                            // -------------------------------------

                        } catch (err: any) {
                            console.error(`[ScrapingService] Error saving property ${listing.title}:`, err);
                            processingErrors.push(`Failed to save ${listing.title}: ${err.message}`);
                        }
                    }

                    resolve({ added: addedCount, errors: processingErrors });

                } catch (err: any) {
                    console.error(`[ScrapingService] Failed to parse JSON: ${err.message}`);
                    reject(new Error('Invalid JSON output from scraper'));
                }
            });
        });
    }
}
