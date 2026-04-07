
import { fetchSolanaNodes } from '../src/lib/solana/fetchNodes';
import { fetchEnrichedNodes } from '../src/lib/solana/getAllNodes';
import { initMaxMind } from '../src/lib/asn/maxmind';

async function test() {
    console.log('--- Initializing MaxMind ---');
    await initMaxMind();
    
    console.log('--- Fetching Enriched Nodes ---');
    try {
        const nodes = await fetchEnrichedNodes();
        console.log(`Fetched ${nodes.length} nodes`);
        
        const sampled = nodes.slice(0, 5);
        sampled.forEach((n, i) => {
            console.log(`\nNode ${i+1}:`);
            console.log(`  Pubkey: ${n.pubkey}`);
            console.log(`  Name: ${n.name}`);
            console.log(`  Provider: ${n.provider}`);
            console.log(`  ASN: ${n.asn}`);
            console.log(`  Country: ${n.countryName}`);
            console.log(`  Stake: ${n.activatedStake}`);
        });
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
