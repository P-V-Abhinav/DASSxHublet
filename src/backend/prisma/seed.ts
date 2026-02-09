import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const MUMBAI_LOCALITIES = ['Bandra', 'Andheri', 'Powai', 'Juhu', 'Worli', 'Malad'];
const HYDERABAD_LOCALITIES = ['Hitech City', 'Gachibowli', 'Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Kondapur'];
const DELHI_LOCALITIES = ['Connaught Place', 'Saket', 'Dwarka', 'Rohini', 'Vasant Kunj', 'Hauz Khas'];

const ALL_LOCALITIES = [...MUMBAI_LOCALITIES, ...HYDERABAD_LOCALITIES, ...DELHI_LOCALITIES];

const AMENITIES = ['parking', 'gym', 'pool', 'security', 'garden', 'clubhouse', 'elevator', 'power backup'];
const PROPERTY_TYPES = ['apartment', 'villa', 'penthouse', 'studio'];
const SELLER_TYPES = ['individual', 'agent', 'builder'];

async function main() {
  console.log('🌱 Starting database seed...\n');
  
  // Clear existing data
  console.log('Clearing existing data...');
  try {
    // Delete in order to avoid foreign key constraints violations if any
    await prisma.workflowEvent.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.match.deleteMany();
    await prisma.property.deleteMany();
    await prisma.buyer.deleteMany();
    await prisma.seller.deleteMany();
    console.log('Cleared existing data.');
  } catch (error) {
    console.log('Error clearing data (might be empty db):', error);
  }

  // --- 1. Create Sellers ---
  // We'll create ~3 sellers per locality
  console.log('Creating sellers...');
  const sellers: any[] = [];
  
  for (const locality of ALL_LOCALITIES) {
    // Create 2-3 sellers for this locality
    const numSellers = 2 + Math.floor(Math.random() * 2);
    for(let s=0; s<numSellers; s++) {
        const seller = await prisma.seller.create({
        data: {
            name: `${locality} Realty ${sellers.length + 1}`,
            email: `seller${sellers.length + 1}@${locality.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+91 ${9000000000 + sellers.length}`,
            sellerType: SELLER_TYPES[Math.floor(Math.random() * SELLER_TYPES.length)],
            rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
            completedDeals: Math.floor(Math.random() * 50) + 10,
            trustScore: parseFloat((70 + Math.random() * 30).toFixed(1)),
        },
        });
        sellers.push(seller);
    }
  }
  console.log(`✓ Created ${sellers.length} sellers\n`);

  // --- 2. Create Properties ---
  // Create ~5 properties per locality
  console.log('Creating properties...');
  const properties: any[] = [];
  
  for (const locality of ALL_LOCALITIES) {
    // Find sellers who operate in this locality (by name matching potentially, or just random from list for now)
    // To make it simple, pick random sellers from our big list.
    
    const numProps = 4 + Math.floor(Math.random() * 3); // 4-6 properties per locality
    
    for (let p=0; p < numProps; p++) {
        const seller = sellers[Math.floor(Math.random() * sellers.length)];
        const bhk = [1, 2, 2, 3, 3, 4][Math.floor(Math.random() * 6)];
        const basePrice = bhk === 1 ? 4000000 : bhk === 2 ? 7000000 : bhk === 3 ? 12000000 : 20000000;
        const price = basePrice + Math.floor(Math.random() * basePrice * 0.5);
        const area = bhk * 500 + Math.floor(Math.random() * 300);
        
        // Select 3-5 random amenities
        const selectedAmenities = AMENITIES
        .sort(() => 0.5 - Math.random())
        .slice(0, 3 + Math.floor(Math.random() * 3));

        const property = await prisma.property.create({
        data: {
            sellerId: seller.id,
            title: `Luxurious ${bhk} BHK ${PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)]} in ${locality}`,
            description: `Beautiful ${bhk} BHK property with modern amenities in prime ${locality} location. Perfect for families!`,
            locality,
            address: `${Math.floor(Math.random() * 999) + 1}, ${locality} Main Road`,
            area,
            bhk,
            price,
            amenities: JSON.stringify(selectedAmenities), 
            propertyType: PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)],
        },
        });
        properties.push(property);
    }
  }
  console.log(`✓ Created ${properties.length} properties\n`);

  // --- 3. Create Buyers ---
  // Create ~5-8 buyers per locality
  console.log('Creating buyers...');
  const buyers: any[] = [];
  
  for (const locality of ALL_LOCALITIES) {
    const numBuyers = 5 + Math.floor(Math.random() * 4); // 5-8 buyers per locality

    for(let b=0; b<numBuyers; b++) {
        // Use random property stats as base for preference
        const bhk = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
        const basePrice = bhk === 1 ? 4000000 : bhk === 2 ? 7000000 : bhk === 3 ? 12000000 : 20000000;
        
        const minBudget = Math.floor(basePrice * 0.8);
        const maxBudget = Math.floor(basePrice * 1.4);
        
        // Select nearby localities
        let cityLocalities: string[];
        if (MUMBAI_LOCALITIES.includes(locality)) {
        cityLocalities = MUMBAI_LOCALITIES;
        } else if (HYDERABAD_LOCALITIES.includes(locality)) {
        cityLocalities = HYDERABAD_LOCALITIES;
        } else {
        cityLocalities = DELHI_LOCALITIES;
        }
        
        const preferredLocalities = [locality];
        const otherLocalities = cityLocalities.filter(l => l !== locality);
        preferredLocalities.push(...otherLocalities.sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 2)));
        
        const preferredAmenities = AMENITIES
        .sort(() => 0.5 - Math.random())
        .slice(0, 2 + Math.floor(Math.random() * 3));

        const buyer = await prisma.buyer.create({
        data: {
            name: `Buyer ${buyers.length + 1} (${locality})`,
            email: `buyer${buyers.length + 1}@${locality.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+91 ${8000000000 + buyers.length}`,
            localities: JSON.stringify(preferredLocalities),
            budgetMin: minBudget,
            budgetMax: maxBudget,
            bhk,
            amenities: JSON.stringify(preferredAmenities),
        },
        });
        buyers.push(buyer);
    }
  }
  console.log(`✓ Created ${buyers.length} buyers\n`);

  // --- 4. Create Leads ---
  console.log('Creating sample leads...');
  const leads = [];
  
  // Create 50 random leads
  for (let i = 0; i < 50; i++) {
    const buyer = buyers[Math.floor(Math.random() * buyers.length)];
    const property = properties[Math.floor(Math.random() * properties.length)];
    const states = ['NEW', 'ENRICHED', 'QUALIFIED', 'NOTIFIED', 'CONTACTED', 'CLOSED'];
    
    // Only create if not exists (though uuid makes collision unlikely, logical collision is possible)
    const lead = await prisma.lead.create({
      data: {
        buyerId: buyer.id,
        propertyId: property.id,
        state: states[Math.floor(Math.random() * states.length)],
      },
    });
    leads.push(lead);
  }
  console.log(`✓ Created ${leads.length} sample leads\n`);

  console.log('✅ Database seeding completed!\n');
  console.log('Summary:');
  console.log(`  - ${sellers.length} sellers`);
  console.log(`  - ${properties.length} properties`);
  console.log(`  - ${buyers.length} buyers`);
  console.log(`  - ${leads.length} leads`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
