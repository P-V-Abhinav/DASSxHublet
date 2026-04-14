import { PrismaClient } from '@prisma/client';
import { MatchingService } from '../services/matching.service';

const prisma = new PrismaClient();

const cities = ["Hyderabad", "Bangalore", "Mumbai", "Pune", "Chennai"];

const buyersInput = [
    // 1-3. Both Lat/Long (Different Cities)
    { name: "Buyer 1", email: "b1@test.com", localities: ["Jubilee Hills"], locCoords: [{ name: "Jubilee Hills", lat: 17.4326, lon: 78.4071 }] },
    { name: "Buyer 2", email: "b2@test.com", localities: ["Koramangala"], locCoords: [{ name: "Koramangala", lat: 12.9279, lon: 77.6271 }] },
    { name: "Buyer 3", email: "b3@test.com", localities: ["Bandra West"], locCoords: [{ name: "Bandra West", lat: 19.0596, lon: 72.8295 }] },

    // 4-6. Buyer Text, Seller Lat/Long
    { name: "Buyer 4", email: "b4@test.com", localities: ["Baner, Pune"], locCoords: [] }, // Will trigger geocoding
    { name: "Buyer 5", email: "b5@test.com", localities: ["Anna Nagar, Chennai"], locCoords: [] },
    { name: "Buyer 6", email: "b6@test.com", localities: ["Andheri, Mumbai"], locCoords: [] },

    // 7-9. Buyer Lat/Long, Seller Text
    { name: "Buyer 7", email: "b7@test.com", localities: ["Gachibowli"], locCoords: [{ name: "Gachibowli", lat: 17.4401, lon: 78.3489 }] },
    { name: "Buyer 8", email: "b8@test.com", localities: ["Indiranagar"], locCoords: [{ name: "Indiranagar", lat: 12.9784, lon: 77.6408 }] },
    { name: "Buyer 9", email: "b9@test.com", localities: ["Juhu"], locCoords: [{ name: "Juhu", lat: 19.1026, lon: 72.8256 }] },

    // 10-12. Both Text (Ambiguous/Broad inputs)
    { name: "Buyer 10", email: "b10@test.com", localities: ["Mumbai"], locCoords: [] },
    { name: "Buyer 11", email: "b11@test.com", localities: ["Pune"], locCoords: [] },
    { name: "Buyer 12", email: "b12@test.com", localities: ["Chennai"], locCoords: [] },

    // 13-15. Edge cases: Different city same name maybe, and Same locality distances
    { name: "Buyer 13", email: "b13@test.com", localities: ["Powai, Mumbai"], locCoords: [] },
    { name: "Buyer 14", email: "b14@test.com", localities: ["Whitefield, Bangalore"], locCoords: [] },
    { name: "Buyer 15", email: "b15@test.com", localities: ["Velachery, Chennai"], locCoords: [] }
];

const sellersInput = [
    // 1-3. Both Lat/Long (Matching 1-3 precisely ~0km)
    { name: "Seller 1", email: "s1@test.com", locality: "Jubilee Hills", lat: 17.4326, lon: 78.4071, city: "Hyderabad" },
    { name: "Seller 2", email: "s2@test.com", locality: "Koramangala", lat: 12.9279, lon: 77.6271, city: "Bangalore" },
    { name: "Seller 3", email: "s3@test.com", locality: "Bandra West", lat: 19.0596, lon: 72.8295, city: "Mumbai" },

    // 4-6. Buyer Text, Seller Lat/Long (Distances approx ~1-2km)
    { name: "Seller 4", email: "s4@test.com", locality: "Balewadi, Pune", lat: 18.5760, lon: 73.7750, city: "Pune" }, // Baner is 18.5590, 73.7868. ~2-3km away
    { name: "Seller 5", email: "s5@test.com", locality: "Shenoy Nagar", lat: 13.0789, lon: 80.2227, city: "Chennai" }, // Next to Anna Nagar ~1.5km
    { name: "Seller 6", email: "s6@test.com", locality: "Vile Parle", lat: 19.0988, lon: 72.8361, city: "Mumbai" }, // Next to Andheri ~2.5km

    // 7-9. Buyer Lat/Long, Seller Text (Distances ~5-8km)
    { name: "Seller 7", email: "s7@test.com", locality: "HITEC City, Hyderabad", city: "Hyderabad" }, // HITEC City to Gachibowli is ~5km
    { name: "Seller 8", email: "s8@test.com", locality: "Marathahalli, Bangalore", city: "Bangalore" }, // from Indiranagar is ~7.5km
    { name: "Seller 9", email: "s9@test.com", locality: "Andheri West, Mumbai", city: "Mumbai" }, // Juhu to Andheri West is ~4km

    // 10-12. Both Text (Same exact text matches)
    { name: "Seller 10", email: "s10@test.com", locality: "Mumbai", city: "Mumbai" },
    { name: "Seller 11", email: "s11@test.com", locality: "Pune", city: "Pune" },
    { name: "Seller 12", email: "s12@test.com", locality: "Chennai", city: "Chennai" },

    // 13-15. Totally random (different cities for cross-city 0-score check)
    { name: "Seller 13", email: "s13@test.com", locality: "Gachibowli", lat: 17.4401, lon: 78.3489, city: "Hyderabad" }, // Checked vs Buyer 13 (Powai)
    { name: "Seller 14", email: "s14@test.com", locality: "Juhu", lat: 19.1026, lon: 72.8256, city: "Mumbai" }, // vs Buyer 14 (Whitefield)
    { name: "Seller 15", email: "s15@test.com", locality: "Pune", city: "Pune" } // vs Buyer 15 (Velachery, Chennai)
];

async function main() {
    console.log("Cleaning Database for fresh test run...");
    await prisma.match.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.property.deleteMany();
    await prisma.buyer.deleteMany();
    await prisma.seller.deleteMany();

    console.log("Inserting Buyers...");
    for (const b of buyersInput) {
        await prisma.buyer.create({
            data: {
                name: b.name, email: b.email, phone: "9999999999",
                bhk: 2, budgetMin: 1000000, budgetMax: 100000000, amenities: JSON.stringify([]), areaMin: 0, areaMax: 5000,
                // Metadata injection if locCoords is populated
                metadata: JSON.stringify(b.locCoords.length > 0 ? { localityCoords: b.locCoords } : {})
            }
        });
    }

    console.log("Inserting Sellers and Properties...");
    for (let i = 0; i < sellersInput.length; i++) {
        const s = sellersInput[i];
        const seller = await prisma.seller.create({
            data: { name: s.name, email: s.email, phone: "8888888888", sellerType: "Builder", passwordHash: "password" }
        });

        await prisma.property.create({
            data: {
                title: `Test Property ${i + 1}`,
                description: "Test run",
                price: 5000000, area: 1000, bhk: 2,
                locality: s.locality + ', ' + s.city,
                amenities: JSON.stringify([]),
                sellerId: seller.id,
                isActive: true,
                metadata: JSON.stringify((s.lat && s.lon) ? { coordinates: { lat: s.lat, lon: s.lon } } : {})
            }
        });
    }

    console.log("All Entities created successfully. Initiating matching...");
    const matchingService = new MatchingService();
    const buyers = await prisma.buyer.findMany();

    for (const buyer of buyers) {
        console.log(`\n=> Matching for ${buyer.email}`);

        // This will naturally execute geocoding for missing coordinates
        const matches = await matchingService.findMatchesForBuyer(buyer.id);

        if (matches.length === 0) {
            console.log("   No properties found matching >= 25% curve.");
        }
        for (const m of matches) {
            console.log(`   [MATCH] Property: ${m.property.title} in ${m.property.locality}`);
            console.log(`   [SCORE] Location: ${m.locationScore} | Total: ${m.matchScore}`);
        }
    }
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
