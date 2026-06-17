// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { ethers } from 'ethers';
import 'dotenv/config';
import { createWallet } from '../../core/wallet';
import { Connection } from '@solana/web3.js';

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
        // Example 2: Get swap data and use it for gas estimation
        console.log('\n=== EVM Swap Transaction Gas Limit ===');
        const swapData = await client.dex.getSwapData({
            chainIndex: '501', // Solana mainnet
            fromTokenAddress: '11111111111111111111111111111111', // SOL
            toTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            amount: '10000', // 1 SOL in lamports
            slippagePercent: '0.05',
            userWalletAddress: walletAddress,
            fromTokenReferrerWalletAddress: walletAddress,
            feePercent: '0.0001'
        });

        console.log('Swap Data Retrieved Successfully');
        const txData = swapData.data[0]?.tx;
        console.log('Transaction gas from swap data:', txData?.gas);

        // Add another pause before the next API call
        console.log('Waiting 2 more seconds before gas limit estimation...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Use the actual transaction data from the swap for gas limit estimation
        if (txData && txData.data) {
            try {
                const swapGasLimit = await client.dex.getGasLimit({
                    chainIndex: '501', // Solana mainnet
                    fromAddress: txData.from,
                    toAddress: txData.to,
                    txAmount: txData.value, // Use actual transaction value
                    extJson: {
                        inputData: txData.data // Use actual transaction calldata
                    }
                });
                console.log('Swap Gas Limit:', JSON.stringify(swapGasLimit, null, 2));
            } catch (error) {
                console.error('Swap gas limit error:', error);
                console.log('You can also use the gas from the swap data:', txData?.gas);
            }
        } else {
            console.log('No transaction data available for gas estimation');
            console.log('You can also use the gas from the swap data:', txData?.gas);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

main();