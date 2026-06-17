// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { Connection } from '@solana/web3.js';
import 'dotenv/config';
import { createWallet } from '../../core/wallet';

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

const walletAddress = wallet.publicKey.toString();

async function main() {
    try {
        // Get a quote
        const quote = await client.dex.getSwapData({
            chainIndex: '501',
            fromTokenAddress: 'So11111111111111111111111111111111111111112',
            toTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            amount: '1000000',
            slippagePercent: '0.05',
            userWalletAddress: walletAddress,
            fromTokenReferrerWalletAddress: walletAddress,
            feePercent: '0.0001'
        });
        console.log('Swap Quote:', JSON.stringify(quote, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();