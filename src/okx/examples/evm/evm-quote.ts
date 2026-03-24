// example.ts or test.ts
import { OKXDexClient } from '../../index';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!
});

async function main() {
    try {
        const quote = await client.dex.getQuote({
            chainIndex: '1',
            fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            toTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            amount: '10000000000000000000',
            slippagePercent: '0.1',
        });
        console.log('Quote:', JSON.stringify(quote, null, 2));

        const quote_exactOut = await client.dex.getQuote({
            chainIndex: '1',
            fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            toTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            amount: '1000000000', // 1000 USDT 
            slippagePercent: '0.1',
            swapMode: 'exactOut'
        });
        console.log('Quote:', JSON.stringify(quote_exactOut, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();