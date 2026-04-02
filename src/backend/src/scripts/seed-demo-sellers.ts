/**
 * seed-demo-sellers.ts
 *
 * Seeds demo sellers with passwords for each major Indian city.
 * Each seller gets realistic properties and credentials.
 *
 * Password convention: first name (lowercase) — same as buyer seeder.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { forwardGeocode } from '../utils/geocoder';

const SALT_ROUNDS = 10;

const CITY_SELLERS: Record<string, Array<{
    firstName: string;
    sellerType: 'owner' | 'agent' | 'builder';
    properties: Array<{
        title: string;
        locality: string;
        address: string;
        bhk: number;
        area: number;
        price: number;
        propertyType: string;
        amenities: string[];
    }>;
}>> = {
    Mumbai: [
        {
            firstName: 'rajesh',
            sellerType: 'owner',
            properties: [
                { title: '2 BHK Sea-view Flat in Bandra West', locality: 'Bandra West', address: 'Bandra West, Mumbai, Maharashtra', bhk: 2, area: 950, price: 18500000, propertyType: 'apartment', amenities: ['Parking', 'Security', 'Elevator', 'Gym'] },
                { title: '1 BHK Apartment in Andheri East', locality: 'Andheri East', address: 'Andheri East, Mumbai, Maharashtra', bhk: 1, area: 550, price: 7500000, propertyType: 'apartment', amenities: ['Parking', 'Security'] },
            ],
        },
        {
            firstName: 'meena',
            sellerType: 'agent',
            properties: [
                { title: '3 BHK Premium Flat in Powai', locality: 'Powai', address: 'Hiranandani Gardens, Powai, Mumbai', bhk: 3, area: 1400, price: 32000000, propertyType: 'apartment', amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Garden', 'Security'] },
            ],
        },
    ],
    Chennai: [
        {
            firstName: 'kumar',
            sellerType: 'builder',
            properties: [
                { title: '3 BHK Villa in Adyar', locality: 'Adyar', address: 'Adyar, Chennai, Tamil Nadu', bhk: 3, area: 2200, price: 25000000, propertyType: 'villa', amenities: ['Garden', 'Parking', 'Power Backup', 'Modular Kitchen'] },
                { title: '2 BHK Flat in T. Nagar', locality: 'T. Nagar', address: 'T. Nagar, Chennai, Tamil Nadu', bhk: 2, area: 1050, price: 9500000, propertyType: 'apartment', amenities: ['Elevator', 'Security', 'Parking'] },
            ],
        },
        {
            firstName: 'selvi',
            sellerType: 'owner',
            properties: [
                { title: '2 BHK Apartment in Anna Nagar', locality: 'Anna Nagar', address: 'Anna Nagar, Chennai, Tamil Nadu', bhk: 2, area: 1100, price: 8000000, propertyType: 'apartment', amenities: ['Parking', 'Power Backup'] },
            ],
        },
    ],
    Hyderabad: [
        {
            firstName: 'venkat',
            sellerType: 'agent',
            properties: [
                { title: '3 BHK Flat in Hitech City', locality: 'Hitech City', address: 'Hitech City, Hyderabad, Telangana', bhk: 3, area: 1600, price: 14000000, propertyType: 'apartment', amenities: ['Gym', 'Swimming Pool', 'Clubhouse', 'Security'] },
                { title: '2 BHK Flat in Gachibowli', locality: 'Gachibowli', address: 'Gachibowli, Hyderabad, Telangana', bhk: 2, area: 1200, price: 9000000, propertyType: 'apartment', amenities: ['Parking', 'Gym', 'Security'] },
            ],
        },
        {
            firstName: 'padma',
            sellerType: 'owner',
            properties: [
                { title: 'Residential Plot in Kondapur', locality: 'Kondapur', address: 'Kondapur, Hyderabad, Telangana', bhk: 0, area: 2400, price: 12000000, propertyType: 'plot', amenities: [] },
            ],
        },
    ],
    Bangalore: [
        {
            firstName: 'anil',
            sellerType: 'builder',
            properties: [
                { title: '3 BHK Flat in Koramangala', locality: 'Koramangala', address: 'Koramangala, Bangalore, Karnataka', bhk: 3, area: 1500, price: 22000000, propertyType: 'apartment', amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Garden', 'Parking'] },
                { title: '2 BHK Flat in Indiranagar', locality: 'Indiranagar', address: 'Indiranagar, Bangalore, Karnataka', bhk: 2, area: 1100, price: 15000000, propertyType: 'apartment', amenities: ['Parking', 'Security', 'Gym'] },
            ],
        },
        {
            firstName: 'lakshmi',
            sellerType: 'owner',
            properties: [
                { title: '4 BHK Villa in Whitefield', locality: 'Whitefield', address: 'Whitefield, Bangalore, Karnataka', bhk: 4, area: 3200, price: 45000000, propertyType: 'villa', amenities: ['Swimming Pool', 'Garden', 'Clubhouse', 'Power Backup', 'Security'] },
            ],
        },
    ],
    Pune: [
        {
            firstName: 'sanjay',
            sellerType: 'agent',
            properties: [
                { title: '2 BHK Flat in Hinjewadi', locality: 'Hinjewadi', address: 'Hinjewadi, Pune, Maharashtra', bhk: 2, area: 950, price: 6500000, propertyType: 'apartment', amenities: ['Parking', 'Security', 'Gym'] },
                { title: '3 BHK Flat in Baner', locality: 'Baner', address: 'Baner, Pune, Maharashtra', bhk: 3, area: 1350, price: 11000000, propertyType: 'apartment', amenities: ['Swimming Pool', 'Clubhouse', 'Parking', 'Garden'] },
            ],
        },
    ],
    Kochi: [
        {
            firstName: 'thomas',
            sellerType: 'owner',
            properties: [
                { title: '3 BHK Flat near Marine Drive', locality: 'Marine Drive', address: 'Marine Drive, Kochi, Kerala', bhk: 3, area: 1400, price: 9500000, propertyType: 'apartment', amenities: ['Parking', 'Security', 'Elevator', 'Power Backup'] },
            ],
        },
        {
            firstName: 'suja',
            sellerType: 'agent',
            properties: [
                { title: '2 BHK Apartment in Kakkanad', locality: 'Kakkanad', address: 'Kakkanad, Kochi, Kerala', bhk: 2, area: 1000, price: 5500000, propertyType: 'apartment', amenities: ['Parking', 'Security'] },
            ],
        },
    ],
};

export async function seedDemoSellers(prisma: PrismaClient): Promise<{
    created: number;
    skipped: number;
    sellers: Array<{ name: string; email: string; password: string; city: string; properties: number }>;
}> {
    const results: Array<{ name: string; email: string; password: string; city: string; properties: number }> = [];
    let created = 0;
    let skipped = 0;

    for (const [city, sellerDefs] of Object.entries(CITY_SELLERS)) {
        for (const def of sellerDefs) {
            const email = `${def.firstName}.${city.toLowerCase()}@hublet.demo`;
            const password = def.firstName;
            const sellerName = `${def.firstName.charAt(0).toUpperCase() + def.firstName.slice(1)} (${city})`;

            // Skip if seller already exists
            const existing = await prisma.seller.findUnique({ where: { email } });
            if (existing) {
                skipped++;
                results.push({ name: sellerName, email, password, city, properties: def.properties.length });
                continue;
            }

            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            const createdSeller = await prisma.seller.create({
                data: {
                    name: sellerName,
                    email,
                    phone: `+91 ${7000000000 + Math.floor(Math.random() * 3000000000)}`,
                    passwordHash,
                    sellerType: def.sellerType,
                    rating: 0,
                    ratingCount: 0,
                    completedDeals: 0,
                    trustScore: 0,
                    metadata: JSON.stringify({
                        source: 'demo-seeder',
                        city,
                        password,
                        seededAt: new Date().toISOString(),
                    }),
                },
            });

            // Create properties for this seller
            for (const prop of def.properties) {
                // Geocode the address to get coordinates
                let coordinates: { lat: number; lon: number } | null = null;
                try {
                    const geoResult = await forwardGeocode(prop.address);
                    if (geoResult) {
                        coordinates = { lat: geoResult.lat, lon: geoResult.lon };
                    }
                    // Rate limit: 1 req/sec for Nominatim
                    await new Promise((resolve) => setTimeout(resolve, 1100));
                } catch (err) {
                    console.error(`[SeedSellers] Geocoding failed for ${prop.address}:`, err);
                }

                await prisma.property.create({
                    data: {
                        title: prop.title,
                        locality: prop.locality,
                        address: prop.address,
                        bhk: prop.bhk,
                        area: prop.area,
                        price: prop.price,
                        propertyType: prop.propertyType,
                        amenities: JSON.stringify(prop.amenities),
                        sellerId: createdSeller.id,
                        isActive: true,
                        metadata: JSON.stringify({
                            source: 'demo-seeder',
                            city,
                            seededAt: new Date().toISOString(),
                            ...(coordinates ? { coordinates } : {}),
                        }),
                    },
                });
            }

            created++;
            results.push({ name: sellerName, email, password, city, properties: def.properties.length });
        }
    }

    return { created, skipped, sellers: results };
}
