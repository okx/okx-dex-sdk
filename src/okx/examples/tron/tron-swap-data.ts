// scripts/tron-swap.ts
import { getHeaders } from '../../shared';

async function main() {
    try {
        const params = {
            chainId: '195', // Tron Chain ID
            amount: '10000000000',
            fromTokenAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', // TRON
            toTokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT
            userWalletAddress: "TKKfuzgajEECM93gVwUEqmeNTsMTZ2JEuq",
            slippage: "0.5",
            autoSlippage: "true",
            maxAutoSlippageBps: "100"
        };

        const timestamp = new Date().toISOString();
        const requestPath = "/api/v5/dex/aggregator/swap";
        const queryString = "?" + new URLSearchParams(params).toString();
        const headers = getHeaders(timestamp, "GET", requestPath, queryString);

        console.log('Getting Tron swap data...');
        const response = await fetch(`https://www.okx.com${requestPath}${queryString}`, {
            method: "GET",
            headers
        });

        const data = await response.json();
        console.log('Quote response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();