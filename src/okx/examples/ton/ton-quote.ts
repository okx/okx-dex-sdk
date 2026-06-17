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
        // Get a quote
        const quote = await client.dex.getQuote({
            chainIndex: '607', // Ton Chain ID
            amount: '10000000000',
            fromTokenAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // TON Native Token
            toTokenAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDC
            slippagePercent: '0.1',
        });

        console.log('Quote response:', JSON.stringify(quote, null, 2));
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();