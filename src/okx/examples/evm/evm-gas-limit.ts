// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { ethers } from 'ethers';
import 'dotenv/config';
import { createEVMWallet } from '../../core/evm-wallet';

const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL!);
const evmWallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    evm: {
        wallet: evmWallet
    }
});

const walletAddress = evmWallet.address;

async function main() {
    try {
        // Example 2: Get swap data and use it for gas estimation
        console.log('\n=== EVM Swap Transaction Gas Limit ===');
        const swapData = await client.dex.getSwapData({
            chainIndex: '8453', // Ethereum mainnet
            fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
            toTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
            amount: '100000000000', // 1 ETH in wei
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
                    chainIndex: '8453', // Base mainnet
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
            console.log('You can alsouse the gas from the swap data:', txData?.gas);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

main();