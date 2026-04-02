/**
 * seed-demo-buyers.ts
 *
 * Seeds demo buyers per city:
 *   Mumbai, Chennai, Hyderabad, Bangalore, Pune, Kochi
 *
 * Each buyer:
 *   - email: firstname.city@hublet.demo
 *   - password (plaintext for login) = first name
 *   - Geocoded coordinates stored in metadata (Nominatim, 1 req/sec)
 *
 * Kochi and Pune buyers are deliberately aligned with seeded seller listings
 * to guarantee match generation after seeding both buyers and sellers.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BuyerService } from '../services/buyer.service';

const SALT_ROUNDS = 10;

// ── Rate-limit helper ────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── City-specific locality pools ─────────────────────────────────────────────
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

// ── Amenity pool ─────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBudget(): { budgetMin: number; budgetMax: number } {
    const tiers = [
        { min: 2000000, max: 4000000 },
        { min: 3500000, max: 6000000 },
        { min: 5000000, max: 10000000 },
        { min: 8000000, max: 15000000 },
        { min: 10000000, max: 25000000 },
        { min: 20000000, max: 50000000 },
    ];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const budgetMin = randomInt(tier.min, tier.max);
    const spread = randomInt(Math.floor(tier.min * 0.3), Math.floor(tier.max * 0.5));
    return { budgetMin, budgetMax: budgetMin + spread };
}

function randomArea(): { areaMin: number; areaMax: number } {
    const options = [
        { areaMin: 400, areaMax: 800 },
        { areaMin: 600, areaMax: 1200 },
        { areaMin: 900, areaMax: 1800 },
        { areaMin: 1200, areaMax: 2500 },
        { areaMin: 1800, areaMax: 3500 },
        { areaMin: 2500, areaMax: 5000 },
    ];
    return options[Math.floor(Math.random() * options.length)];
}

// ── Pinned buyers for Kochi & Pune (aligned with seeded seller properties) ──
// Seller data: Kochi thomas — 3BHK Marine Drive 9500000, Kochi suja — 2BHK Kakkanad 5500000
//             Pune sanjay — 2BHK Hinjewadi 6500000, 3BHK Baner 11000000
const PINNED_BUYERS: Array<{
    firstName: string;
    city: string;
    localities: string[];
    bhk: number;
    budgetMin: number;
    budgetMax: number;
    areaMin: number;
    areaMax: number;
    amenities: string[];
}> = [
        // Kochi pinned buyers — target Marine Drive & Kakkanad listings
        {
            firstName: 'rajan',
            city: 'Kochi',
            localities: ['Marine Drive', 'Kochi', 'Panampilly Nagar'],
            bhk: 3,
            budgetMin: 8000000,
            budgetMax: 12000000,
            areaMin: 1200,
            areaMax: 1800,
            amenities: ['Parking', 'Security', 'Elevator', 'Power Backup'],
        },
        {
            firstName: 'meera',
            city: 'Kochi',
            localities: ['Kakkanad', 'Edappally', 'Kochi'],
            bhk: 2,
            budgetMin: 4500000,
            budgetMax: 7000000,
            areaMin: 800,
            areaMax: 1300,
            amenities: ['Parking', 'Security'],
        },
        // Pune pinned buyers — target Hinjewadi & Baner listings
        {
            firstName: 'priti',
            city: 'Pune',
            localities: ['Hinjewadi', 'Wakad', 'Pune'],
            bhk: 2,
            budgetMin: 5500000,
            budgetMax: 8000000,
            areaMin: 800,
            areaMax: 1200,
            amenities: ['Parking', 'Security', 'Gym'],
        },
        {
            firstName: 'devesh',
            city: 'Pune',
            localities: ['Baner', 'Aundh', 'Pune'],
            bhk: 3,
            budgetMin: 9000000,
            budgetMax: 13000000,
            areaMin: 1200,
            areaMax: 1700,
            amenities: ['Swimming Pool', 'Clubhouse', 'Parking', 'Garden'],
        },
    ];

// ── Main seeder function (callable from API) ──────────────────────────────────
export async function seedDemoBuyers(prisma: PrismaClient): Promise<{
    created: number;
    skipped: number;
    buyers: Array<{ name: string; email: string; password: string; city: string }>;
}> {
    const results: Array<{ name: string; email: string; password: string; city: string }> = [];
    let created = 0;
    let skipped = 0;

    // ── 1. Seed pinned Kochi & Pune buyers first ───────────────────────────
    for (const pinned of PINNED_BUYERS) {
        const email = `${pinned.firstName}.${pinned.city.toLowerCase()}@hublet.demo`;
        const password = pinned.firstName;
        const buyerName = `${pinned.firstName.charAt(0).toUpperCase() + pinned.firstName.slice(1)} (${pinned.city})`;

        const existing = await prisma.buyer.findUnique({ where: { email } });
        if (existing) {
            skipped++;
            results.push({ name: buyerName, email, password, city: pinned.city });
            continue;
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // BuyerService will geocode the first locality and store coords — wait 1.2s after each
        await BuyerService.createBuyer({
            name: buyerName,
            email,
            phone: `+91 ${randomInt(7000000000, 9999999999)}`,
            passwordHash,
            localities: pinned.localities,
            areaMin: pinned.areaMin,
            areaMax: pinned.areaMax,
            bhk: pinned.bhk,
            budgetMin: pinned.budgetMin,
            budgetMax: pinned.budgetMax,
            amenities: pinned.amenities,
            rawPreferences: `Looking for ${pinned.bhk} BHK in ${pinned.localities.join(', ')}`,
            metadata: {
                source: 'demo-seeder',
                city: pinned.city,
                password,
                seededAt: new Date().toISOString(),
                pinned: true,
            },
        });
        // NOTE: No extra sleep needed here — BuyerService.createBuyer now geocodes all
        // localities internally and waits 1100ms between each Nominatim request.

        created++;
        results.push({ name: buyerName, email, password, city: pinned.city });
    }

    // ── 2. Seed random buyers for all cities ──────────────────────────────
    for (const [city, localities] of Object.entries(CITY_LOCALITIES)) {
        const names = FIRST_NAMES[city] || FIRST_NAMES['Mumbai'];
        const count = randomInt(4, 5); // slightly fewer to keep seeding fast
        const selectedNames = names.slice(0, count);

        for (const firstName of selectedNames) {
            const email = `${firstName}.${city.toLowerCase()}@hublet.demo`;
            const password = firstName;

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
                    password,
                    seededAt: new Date().toISOString(),
                },
            });
            // NOTE: No extra sleep needed — BuyerService.createBuyer geocodes all localities
            // internally with 1100ms delays between Nominatim requests.

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
            console.log(`\nSeeded ${created} demo buyers (${skipped} already existed)\n`);
            console.log('Credentials:');
            buyers.forEach((b) => console.log(`  ${b.email}  =>  password: ${b.password}`));
        })
        .catch((e) => {
            console.error('Seeding failed:', e);
            process.exit(1);
        })
        .finally(() => prisma.$disconnect());
}
