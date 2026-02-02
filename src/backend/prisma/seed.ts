import { PrismaClient } from '@prisma/client';

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
  await prisma.match.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.workflowEvent.deleteMany();
  await prisma.property.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.seller.deleteMany();

  // Create Sellers (6 for each city = 18 total)
  console.log('Creating sellers...');
  const sellers: any[] = [];
  
  for (const locality of ALL_LOCALITIES) {
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
  console.log(`✓ Created ${sellers.length} sellers\n`);

  // Create Properties (6 for each city = 18 total)
  console.log('Creating properties...');
  const properties = [];
  
  for (let i = 0; i < ALL_LOCALITIES.length; i++) {
    const locality = ALL_LOCALITIES[i];
    const seller = sellers[i];
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
        amenities: JSON.stringify(selectedAmenities), // Convert to JSON string for SQLite
        propertyType: PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)],
      },
    });
    properties.push(property);
  }
  console.log(`✓ Created ${properties.length} properties\n`);

  // Create Buyers (6 for each city = 18 total)
  console.log('Creating buyers...');
  const buyers = [];
  
  for (let i = 0; i < ALL_LOCALITIES.length; i++) {
    const locality = ALL_LOCALITIES[i];
    const property = properties[i]; // Match buyer to corresponding property
    
    // Use property's BHK for buyer preference to ensure matching
    const bhk = property.bhk;
    
    // Set budget range that includes the property price
    const propertyPrice = property.price;
    const minBudget = Math.floor(propertyPrice * 0.8); // 80% of property price
    const maxBudget = Math.floor(propertyPrice * 1.3); // 130% of property price
    
    // Select nearby localities (same city) - ALWAYS include the property's locality
    let cityLocalities: string[];
    if (MUMBAI_LOCALITIES.includes(locality)) {
      cityLocalities = MUMBAI_LOCALITIES;
    } else if (HYDERABAD_LOCALITIES.includes(locality)) {
      cityLocalities = HYDERABAD_LOCALITIES;
    } else {
      cityLocalities = DELHI_LOCALITIES;
    }
    
    // Always include the property locality first, then add 1-2 more
    const preferredLocalities = [locality];
    const otherLocalities = cityLocalities.filter(l => l !== locality);
    preferredLocalities.push(...otherLocalities.sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 2)));
    
    // Parse property amenities and use some of them for buyer preferences
    const propertyAmenities = JSON.parse(property.amenities);
    const preferredAmenities = propertyAmenities.slice(0, Math.max(2, propertyAmenities.length - 1));
    // Add 1-2 random amenities
    const extraAmenities = AMENITIES.filter(a => !preferredAmenities.includes(a))
      .sort(() => 0.5 - Math.random())
      .slice(0, 1 + Math.floor(Math.random() * 2));
    preferredAmenities.push(...extraAmenities);

    const buyer = await prisma.buyer.create({
      data: {
        name: `Buyer ${i + 1} from ${locality}`,
        email: `buyer${i + 1}@${locality.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+91 ${8000000000 + i}`,
        localities: JSON.stringify(preferredLocalities), // Convert to JSON string for SQLite
        budgetMin: minBudget,
        budgetMax: maxBudget,
        bhk,
        amenities: JSON.stringify(preferredAmenities), // Convert to JSON string for SQLite
      },
    });
    buyers.push(buyer);
  }
  console.log(`✓ Created ${buyers.length} buyers\n`);

  // Create some leads (sample data)
  console.log('Creating sample leads...');
  const leads = [];
  
  for (let i = 0; i < 10; i++) {
    const buyer = buyers[Math.floor(Math.random() * buyers.length)];
    const property = properties[Math.floor(Math.random() * properties.length)];
    const states = ['NEW', 'ENRICHED', 'QUALIFIED', 'NOTIFIED', 'CONTACTED', 'CLOSED'];
    
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
  console.log('\nCities covered:');
  console.log(`  - Mumbai: ${MUMBAI_LOCALITIES.join(', ')}`);
  console.log(`  - Hyderabad: ${HYDERABAD_LOCALITIES.join(', ')}`);
  console.log(`  - Delhi: ${DELHI_LOCALITIES.join(', ')}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
