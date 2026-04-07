
const maxmind = require('maxmind');
const path = require('path');
const fs = require('fs');

const ASN_DB_PATH = path.join(process.cwd(), 'data', 'GeoLite2-ASN.mmdb');
const COUNTRY_DB_PATH = path.join(process.cwd(), 'data', 'GeoLite2-Country.mmdb');

async function testMaxMind() {
    console.log('Project Root:', process.cwd());
    console.log('ASN DB exists:', fs.existsSync(ASN_DB_PATH));
    console.log('Country DB exists:', fs.existsSync(COUNTRY_DB_PATH));

    const asnReader = await maxmind.open(ASN_DB_PATH);
    const countryReader = await maxmind.open(COUNTRY_DB_PATH);

    const ip = '74.63.225.119'; // My sample IP
    console.log('\nTesting IP:', ip);

    const asnResponse = asnReader.get(ip);
    console.log('ASN Response:', JSON.stringify(asnResponse, null, 2));

    const countryResponse = countryReader.get(ip);
    console.log('Country Response:', JSON.stringify(countryResponse, null, 2));
}

testMaxMind();
