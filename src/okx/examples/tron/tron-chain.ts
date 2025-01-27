
// scripts/get-supported-chains.ts
import { getHeaders } from '../../shared';

async function main() {
    try {
        const chainId = '195'; // Tron Chain ID
        const timestamp = new Date().toISOString();
        const requestPath = "/api/v5/dex/aggregator/supported/chain";
        const queryString = chainId ? `?chainId=${chainId}` : '';
        const headers = getHeaders(timestamp, "GET", requestPath, queryString);

        console.log('Getting supported chain info for Tron...');
        const response = await fetch(`https://www.okx.com${requestPath}${queryString}`, {
            method: "GET",
            headers
        });

        const data = await response.json();
        console.log('Supported chains response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();
