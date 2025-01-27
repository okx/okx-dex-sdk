
// scripts/get-liquidity.ts
import { getHeaders } from '../../shared';

async function main() {
    try {
        const params = {
            chainId: '195' // Tron Chain ID
        };

        const timestamp = new Date().toISOString();
        const requestPath = "/api/v5/dex/aggregator/get-liquidity";
        const queryString = "?" + new URLSearchParams(params).toString();
        const headers = getHeaders(timestamp, "GET", requestPath, queryString);

        console.log('Getting Tron liquidity sources...');
        const response = await fetch(`https://www.okx.com${requestPath}${queryString}`, {
            method: "GET",
            headers
        });

        const data = await response.json();
        console.log('Liquidity sources response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();
