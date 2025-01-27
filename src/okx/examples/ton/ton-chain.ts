// scripts/get-supported-chains.ts
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
        const chainId = '607'; // Ton Chain ID
        const chain = await client.dex.getSupportedChains(chainId);
        console.log('Supported chain:', JSON.stringify(chain, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
