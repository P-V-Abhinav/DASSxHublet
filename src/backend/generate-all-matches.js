// Quick script to generate matches for all buyers
const http = require('http');

async function makeRequest(buyerId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ minScore: 50, limit: 50 });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/matches/buyer/${buyerId}/find`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Get all buyers
  const getBuyers = () => new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/buyers', (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });

  const buyers = await getBuyers();
  console.log(`Found ${buyers.length} buyers. Generating matches...`);

  let totalMatches = 0;
  for (const buyer of buyers) {
    console.log(`\nProcessing: ${buyer.name} (${buyer.email})`);
    const matches = await makeRequest(buyer.id);
    
    if (matches.error) {
      console.log(`  ❌ Error: ${matches.error}`);
    } else if (Array.isArray(matches)) {
      console.log(`  ✅ Generated ${matches.length} matches`);
      totalMatches += matches.length;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }

  console.log(`\n🎉 Complete! Total matches generated: ${totalMatches}`);
}

main().catch(console.error);
