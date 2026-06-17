// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { ethers } from 'ethers';
import 'dotenv/config';
import { createEVMWallet } from '../../core/evm-wallet';

const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL!);
const wallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    evm: {
        wallet: wallet
    }
});

const walletAddress = wallet.address;

async function main() {
    try {
        // Get a quote
        const quote = await client.dex.getSwapData({
            chainIndex: '8453',
            fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // WETH
            toTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
            amount: String(10 ** 18 * 0.0001), // 0.0001 WETH
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