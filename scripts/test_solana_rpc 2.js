
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

async function testFetch() {
    console.log('Fetching nodes from', SOLANA_RPC_ENDPOINT);
    const response = await fetch(SOLANA_RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getClusterNodes',
        })
    });

    const data = await response.json();
    const nodes = data.result || [];
    console.log(`Fetched ${nodes.length} nodes`);
    
    if (nodes.length > 0) {
        console.log('Sample node:', JSON.stringify(nodes[0], null, 2));
    }
}

testFetch();
