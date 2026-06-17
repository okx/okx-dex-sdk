// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { Connection } from '@solana/web3.js';
import { createWallet } from '../../core/wallet';
import 'dotenv/config';

const connection = new Connection(process.env.SOLANA_RPC_URL!);
const wallet = createWallet(process.env.SOLANA_PRIVATE_KEY!, connection);

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    solana: {
        wallet: wallet
    }
});

async function main() {
    try {
        // Get a quote
        const quote = await client.dex.getQuote({
            chainIndex: '501',
            fromTokenAddress: 'So11111111111111111111111111111111111111112',
            toTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            amount: '10000000000',
            slippagePercent: '0.5',
            dexIds: '277',
            directRoute: true,
            feePercent: '5'
        });
        console.log('Swap Quote:', JSON.stringify(quote, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();