/**
 * seed-demo-buyers.ts
 * 
 * Seeds 6-7 random demo buyers per city for:
 *   Mumbai, Chennai, Hyderabad, Bangalore, Pune, Kochi
 * 
 * Each buyer gets:
 *   - email: firstname.city@hublet.demo
 *   - password (plaintext for login) = first name portion of email (before the dot)
 *   - passwordHash: bcrypt hash of that password
 *   - Realistic localities, BHK, budget, carpet area, amenities
 * 
 * This module is entirely self-contained and does NOT affect other seeders or data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BuyerService } from '../services/buyer.service';

const SALT_ROUNDS = 10;

// ── City-specific locality pools ──────────────────────────────────────────────
const CITY_LOCALITIES: Record<string, string[]> = {
    Mumbai: [
        'Bandra West', 'Andheri East', 'Powai', 'Juhu', 'Worli',
        'Malad West', 'Goregaon East', 'Borivali West', 'Thane West',
        'Vikhroli', 'Mulund East', 'Lower Parel', 'Dadar', 'Chembur',
    ],
    Chennai: [
        'Adyar', 'T. Nagar', 'Anna Nagar', 'Velachery', 'Besant Nagar',
        'Porur', 'Thoraipakkam', 'OMR', 'ECR', 'Guindy',
        'Nungambakkam', 'Mylapore', 'Chromepet', 'Tambaram',
    ],
    Hyderabad: [
        'Hitech City', 'Gachibowli', 'Banjara Hills', 'Jubilee Hills',
        'Madhapur', 'Kondapur', 'Kukatpally', 'Manikonda',
        'Miyapur', 'Begumpet', 'Secunderabad', 'LB Nagar',
    ],
    Bangalore: [
        'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout',
        'Electronic City', 'Marathahalli', 'JP Nagar', 'Jayanagar',
        'Hebbal', 'Yelahanka', 'Bannerghatta Road', 'Rajajinagar',
    ],
    Pune: [
        'Kothrud', 'Hinjewadi', 'Baner', 'Wakad', 'Viman Nagar',
        'Kalyani Nagar', 'Hadapsar', 'Kharadi', 'Aundh',
        'Pimple Saudagar', 'Magarpatta', 'Undri',
    ],
    Kochi: [
        'Marine Drive', 'Edappally', 'Kakkanad', 'Fort Kochi',
        'Kaloor', 'Palarivattom', 'Vyttila', 'Aluva',
        'Thrippunithura', 'Ernakulam South', 'Panampilly Nagar',
    ],
};

// ── Amenity pool ──────────────────────────────────────────────────────────────
const ALL_AMENITIES = [
    'Parking', 'Gym', 'Swimming Pool', 'Security', 'Garden',
    'Clubhouse', 'Elevator', 'Power Backup', 'Air Conditioning',
    'Furnished', 'Balcony', 'Play Area', 'Intercom', 'CCTV',
    'Modular Kitchen', 'Rainwater Harvesting', 'Jogging Track',
    'Indoor Games', 'Visitor Parking', 'WiFi',
];

// ── First names pool per city ─────────────────────────────────────────────────
const FIRST_NAMES: Record<string, string[]> = {
    Mumbai: ['aarav', 'priya', 'arjun', 'sneha', 'rohan', 'neha', 'vikram'],
    Chennai: ['karthik', 'divya', 'surya', 'anitha', 'prasad', 'meera', 'ganesh'],
    Hyderabad: ['rahul', 'swathi', 'aditya', 'lavanya', 'sriram', 'kavya', 'nikhil'],
    Bangalore: ['akash', 'deepa', 'suresh', 'pooja', 'manish', 'shreya', 'varun'],
    Pune: ['amit', 'gauri', 'sagar', 'rutuja', 'kiran', 'sakshi', 'vishal'],
    Kochi: ['anoop', 'lakshmi', 'jayesh', 'reshma', 'manoj', 'athira', 'sanjay'],
};

// ── Property type preferences ─────────────────────────────────────────────────
const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'plot'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBudget(): { budgetMin: number; budgetMax: number } {
    // Realistic Indian budgets: 20L to 5Cr
    const tiers = [
        { min: 2000000, max: 4000000 },    // 20L - 40L
        { min: 3500000, max: 6000000 },     // 35L - 60L
        { min: 5000000, max: 10000000 },    // 50L - 1Cr
        { min: 8000000, max: 15000000 },    // 80L - 1.5Cr
        { min: 10000000, max: 25000000 },   // 1Cr - 2.5Cr
        { min: 20000000, max: 50000000 },   // 2Cr - 5Cr
    ];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const budgetMin = randomInt(tier.min, tier.max);
    const spread = randomInt(Math.floor(tier.min * 0.3), Math.floor(tier.max * 0.5));
    return { budgetMin, budgetMax: budgetMin + spread };
}

function randomArea(): { areaMin: number; areaMax: number } {
    const options = [
        { areaMin: 400, areaMax: 800 },    // 1-2 BHK
        { areaMin: 600, areaMax: 1200 },   // 2 BHK
        { areaMin: 900, areaMax: 1800 },   // 2-3 BHK
        { areaMin: 1200, areaMax: 2500 },  // 3 BHK
        { areaMin: 1800, areaMax: 3500 },  // 3-4 BHK
        { areaMin: 2500, areaMax: 5000 },  // Villas / large
    ];
    return options[Math.floor(Math.random() * options.length)];
}

// ── Main seeder function (callable from API) ──────────────────────────────────
export async function seedDemoBuyers(prisma: PrismaClient): Promise<{
    created: number;
    skipped: number;
    buyers: Array<{ name: string; email: string; password: string; city: string }>;
}> {
    const results: Array<{ name: string; email: string; password: string; city: string }> = [];
    let created = 0;
    let skipped = 0;

    for (const [city, localities] of Object.entries(CITY_LOCALITIES)) {
        const names = FIRST_NAMES[city] || FIRST_NAMES['Mumbai'];
        // 6 or 7 buyers per city (random)
        const count = randomInt(6, 7);
        const selectedNames = names.slice(0, count);

        for (const firstName of selectedNames) {
            const email = `${firstName}.${city.toLowerCase()}@hublet.demo`;
            const password = firstName; // first name = password

            // Skip if buyer already exists
            const existing = await prisma.buyer.findUnique({ where: { email } });
            if (existing) {
                skipped++;
                results.push({ name: existing.name, email, password, city });
                continue;
            }

            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            const bhk = randomInt(1, 4);
            const { budgetMin, budgetMax } = randomBudget();
            const { areaMin, areaMax } = randomArea();
            const preferredLocalities = pickRandom(localities, randomInt(2, 4));
            preferredLocalities.push(city); // always include city itself
            const preferredAmenities = pickRandom(ALL_AMENITIES, randomInt(3, 6));
            const phone = `+91 ${randomInt(7000000000, 9999999999)}`;

            const buyerName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} (${city})`;

            await BuyerService.createBuyer({
                name: buyerName,
                email,
                phone,
                passwordHash,
                localities: preferredLocalities,
                areaMin,
                areaMax,
                bhk,
                budgetMin,
                budgetMax,
                amenities: preferredAmenities,
                rawPreferences: `Looking for ${bhk} BHK in ${preferredLocalities.join(', ')}`,
                metadata: {
                    source: 'demo-seeder',
                    city,
                    password, // store plaintext for demo purposes
                    seededAt: new Date().toISOString(),
                },
            });

            created++;
            results.push({ name: buyerName, email, password, city });
        }
    }

    return { created, skipped, buyers: results };
}

// ── Allow running standalone via `npx tsx src/scripts/seed-demo-buyers.ts` ────
if (require.main === module) {
    const prisma = new PrismaClient();
    seedDemoBuyers(prisma)
        .then(({ created, skipped, buyers }) => {
            console.log(`\n Seeded ${created} demo buyers (${skipped} already existed)\n`);
            console.log('Credentials:');
            buyers.forEach((b) => console.log(`  ${b.email}  →  password: ${b.password}`));
        })
        .catch((e) => {
            console.error(' Seeding failed:', e);
            process.exit(1);
        })
        .finally(() => prisma.$disconnect());
}
