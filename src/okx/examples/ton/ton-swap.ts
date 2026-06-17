import { OKXDexClient } from '../../index';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!
});

const walletAddress = "TON_WALLET_ADDRESS";

async function main() {
    try {
        const quote = await client.dex.getSwapData({
            chainIndex: '607',
            fromTokenAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            toTokenAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
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