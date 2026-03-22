
import { fetchSolanaNodes, extractIP } from '../src/lib/solana/fetchNodes';
import { initMaxMind, getASNFromMaxMind } from '../src/lib/asn/maxmind';
import { OVH_ASN_LIST } from '../src/lib/config/constants';

async function diagnose() {
    console.log('🔍 Starting OVH False Negative Diagnosis...');

    // 1. Init MaxMind
    await initMaxMind();

    // 2. Fetch Nodes
    const nodes = await fetchSolanaNodes();
    console.log(`📡 Fetched ${nodes.length} nodes from Solana.`);

    // 3. Analyze
    let potentialMisses = 0;
    let confirmedOVH = 0;
    const missedASNs = new Set<string>();

    for (const node of nodes) {
        const ip = extractIP(node.gossip);
        if (!ip) continue;

        const info = getASNFromMaxMind(ip);
        if (!info) continue;

        const isKnownOVH = OVH_ASN_LIST.includes(info.asn);
        const looksLikeOVH = info.org.toLowerCase().includes('ovh');

        if (isKnownOVH) {
            confirmedOVH++;
        } else if (looksLikeOVH) {
            console.log(`⚠️  POSSIBLE FALSE NEGATIVE: IP ${ip} | Org: ${info.org} | ASN: ${info.asn}`);
            potentialMisses++;
            missedASNs.add(info.asn);
        }
    }

    console.log('\n📊 Diagnosis Results:');
    console.log(`✅ Confirmed OVH Nodes (in our list): ${confirmedOVH}`);
    console.log(`⚠️  Potential False Negatives (Org says OVH, but ASN not in list): ${potentialMisses}`);

    if (missedASNs.size > 0) {
        console.log(`\n🚨 Recommendation: Add these ASNs to OVH_ASN_LIST:`);
        missedASNs.forEach(asn => console.log(`- ${asn}`));
    } else {
        console.log(`\n🎉 No obvious false negatives found based on Organization name.`);
    }
}

diagnose().catch(console.error);
