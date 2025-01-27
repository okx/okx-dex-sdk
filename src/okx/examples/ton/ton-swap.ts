// scripts/ton-swap.ts
import { getHeaders } from '../../shared';

async function main() {
    try {
        const params = {
            chainId: '607', // Ton Chain ID
            amount: '10000000000',
            fromTokenAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // TON Native Token
            toTokenAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDC
            userWalletAddress: "UQA88qDUSmU9QpYYOwlwKZ1rmrSPEKVus0zLX56FJxD1cd6l",
            slippage: "0.5",
            autoSlippage: "true",
            maxAutoSlippageBps: "100"
        };

        const timestamp = new Date().toISOString();
        const requestPath = "/api/v5/dex/aggregator/swap";
        const queryString = "?" + new URLSearchParams(params).toString();
        const headers = getHeaders(timestamp, "GET", requestPath, queryString);

        console.log('Getting Ton quote...');
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