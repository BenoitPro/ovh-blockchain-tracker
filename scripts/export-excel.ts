import { fetchSolanaNodes } from '../src/lib/solana/fetchNodes';
import { filterOVHNodes } from '../src/lib/solana/filterOVH';
import { initMaxMind } from '../src/lib/asn/maxmind';
import fs from 'fs';
import path from 'path';

async function generateExcelData() {
    console.log('🚀 Démarrage de l\'extraction des données pour Excel...');

    try {
        // Initialiser MaxMind
        await initMaxMind();

        // Récupérer tous les nœuds
        const allNodes = await fetchSolanaNodes();
        console.log(`✅ ${allNodes.length} nœuds récupérés.`);

        // Filtrer les nœuds OVH
        const ovhNodes = await filterOVHNodes(allNodes);
        console.log(`✅ ${ovhNodes.length} nœuds OVH identifiés.`);

        // Préparer les données CSV (plus facile à générer sans dépendances lourdes, Excel les ouvre parfaitement)
        const headers = ['Pubkey', 'IP', 'ASN', 'Organization', 'Country', 'City', 'Latitude', 'Longitude', 'Version'];
        const rows = ovhNodes.map(node => [
            node.pubkey,
            node.ipInfo.ip,
            node.ipInfo.asn,
            node.ipInfo.org,
            node.ipInfo.country_name,
            node.ipInfo.city,
            node.ipInfo.latitude,
            node.ipInfo.longitude,
            node.version || 'Unknown'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const outputPath = path.join(process.cwd(), 'ovh_solana_nodes.csv');
        fs.writeFileSync(outputPath, csvContent);

        console.log(`\n🎉 Succès ! Le fichier a été généré : ${outputPath}`);
        console.log(`Format : CSV (Ouverture native dans Excel)`);
        console.log(`Nombre de lignes : ${ovhNodes.length}`);

    } catch (error) {
        console.error('❌ Erreur lors de la génération :', error);
    }
}

generateExcelData();
