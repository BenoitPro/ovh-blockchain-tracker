
const path = require('path');
const fs = require('fs');

console.log('Project Root:', process.cwd());
const dataDir = path.join(process.cwd(), 'data');
console.log('Data Dir exists:', fs.existsSync(dataDir));

const files = [
    'GeoLite2-ASN.mmdb',
    'GeoLite2-Country.mmdb',
    'cache.json'
];

files.forEach(f => {
    const p = path.join(dataDir, f);
    console.log(`${f} exists:`, fs.existsSync(p));
    if (fs.existsSync(p)) {
        console.log(`  Size: ${fs.statSync(p).size} bytes`);
    }
});
