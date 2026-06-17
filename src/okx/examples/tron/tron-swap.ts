import { OKXDexClient } from '../../index';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!
});

const walletAddress = "TRON_WALLET_ADDRESS";

async function main() {
    try {
        const quote = await client.dex.getSwapData({
            chainIndex: '195',
            fromTokenAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
            toTokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            amount: '10000000000',
            slippagePercent: '0.1',
            userWalletAddress: walletAddress,
            autoSlippage: true
        });
        console.log('Swap Quote:', JSON.stringify(quote, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();