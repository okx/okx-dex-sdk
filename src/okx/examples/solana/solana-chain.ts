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
        // Get supported chains
        const chains = await client.dex.getSupportedChains("501");
        console.log('Supported chains:', chains);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();