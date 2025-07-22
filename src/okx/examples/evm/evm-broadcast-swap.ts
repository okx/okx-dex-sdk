// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { ethers } from 'ethers';
import 'dotenv/config';
import { createEVMWallet } from '../../core/evm-wallet';

// Use Base RPC URL or fallback to a public Base RPC
const baseRpcUrl = process.env.BASE_RPC_URL || process.env.EVM_RPC_URL || 'https://mainnet.base.org';
const provider = new ethers.JsonRpcProvider(baseRpcUrl);
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
        console.log('=== Complete Swap Workflow with Broadcast and Tracking ===');
        console.log('Wallet Address:', walletAddress);
        
        // Verify we're connected to Base network
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
        
        // if (network.chainId !== 8453) {
        //     console.warn('⚠️  Warning: Not connected to Base mainnet (8453). Current:', network.chainId);
        // }
        
        // Step 1: Get swap data
        console.log('\n1. Getting swap data...');
        const swapData = await client.dex.getSwapData({
            chainId: '8453', // Base mainnet
            fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
            toTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
            amount: '3000000000000000', // 0.001 ETH in wei
            slippage: '0.05',
            userWalletAddress: walletAddress,
            fromTokenReferrerWalletAddress: walletAddress,
            feePercent: '0.0001'
        });

        const txData = swapData.data[0]?.tx;
        if (!txData) {
            throw new Error('No transaction data received from swap API');
        }

        console.log('✅ Swap data received');
        console.log('- From Token Amount:', swapData.data[0].routerResult.fromTokenAmount);
        console.log('- To Token Amount:', swapData.data[0].routerResult.toTokenAmount);
        console.log('- Price Impact:', swapData.data[0].routerResult.priceImpactPercentage);
        console.log('- Gas Estimate:', txData.gas);

        // Step 2: Sign the transaction
        console.log('\n2. Signing transaction...');
        
        // Get current nonce
        const nonce = await provider.getTransactionCount(walletAddress);
        console.log('Current nonce:', nonce);
        
        const transaction = {
            to: txData.to,
            value: txData.value,
            data: txData.data,
            gasLimit: txData.gas,
            gasPrice: txData.gasPrice,
            maxPriorityFeePerGas: txData.maxPriorityFeePerGas || undefined,
            nonce: nonce,
            chainId: 8453 // Base mainnet chain ID
        };

        console.log('Transaction details:');
        console.log('- To:', transaction.to);
        console.log('- Value:', transaction.value);
        console.log('- Gas Limit:', transaction.gasLimit);
        console.log('- Gas Price:', transaction.gasPrice);
        console.log('- Chain ID:', transaction.chainId);

        const signedTx = await evmWallet.signTransaction(transaction);
        console.log('✅ Transaction signed');

        // Step 3: Broadcast the transaction with MEV protection
        console.log('\n3. Broadcasting transaction with MEV protection...');
        const broadcastResult = await client.dex.broadcastTransaction({
            signedTx: signedTx,
            chainIndex: '8453', // Base mainnet
            address: walletAddress,
            enableMevProtection: true // Enable MEV protection
        });

        console.log('✅ Transaction broadcasted');
        console.log('- Order ID:', broadcastResult.data[0].orderId);
        console.log('- Transaction Hash:', broadcastResult.data[0].txHash);

        // Step 4: Track the transaction status
        console.log('\n4. Tracking transaction status...');
        const orderId = broadcastResult.data[0].orderId;
        
        // Poll for transaction status
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes with 10-second intervals
        
        while (attempts < maxAttempts) {
            try {
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
                
                // First try to get the specific order
                let orders = await client.dex.getTransactionOrders({
                    address: walletAddress,
                    chainIndex: '8453',
                    orderId: orderId
                });

                // If specific order not found, get all recent orders and find ours
                if (!orders.data.length || !orders.data[0].orders.length) {
                    console.log(`📊 Status check ${attempts + 1}: Specific order not found, checking recent orders...`);
                    orders = await client.dex.getTransactionOrders({
                        address: walletAddress,
                        chainIndex: '8453',
                        limit: '20'
                    });
                }

                let foundOrder = null;
                if (orders.data.length > 0 && orders.data[0].orders.length > 0) {
                    // Look for our specific order ID in the results
                    foundOrder = orders.data[0].orders.find(order => order.orderId === orderId);
                    
                    if (!foundOrder) {
                        // If not found by orderId, take the most recent order (assuming it's ours)
                        foundOrder = orders.data[0].orders[0];
                    }
                }

                if (foundOrder) {
                    console.log(`📊 Status check ${attempts + 1}:`);
                    console.log('- Order ID:', foundOrder.orderId);
                    console.log('- Status:', getStatusText(foundOrder.txStatus));
                    console.log('- Transaction Hash:', foundOrder.txHash);
                    
                    if (foundOrder.failReason && foundOrder.failReason.trim() !== '') {
                        console.log('- Failure Reason:', foundOrder.failReason);
                    }

                    // Check if transaction is complete (success or failed)
                    if (foundOrder.txStatus === '2') {
                        console.log('\n🎉 Transaction completed successfully!');
                        console.log('- Final Transaction Hash:', foundOrder.txHash);
                        console.log('- Explorer URL:', `https://web3.okx.com/explorer/base/tx/${foundOrder.txHash}`);
                        break;
                    } else if (foundOrder.txStatus === '3') {
                        console.log('\n❌ Transaction failed');
                        console.log('- Failure Reason:', foundOrder.failReason);
                        break;
                    } else {
                        // Also check the blockchain directly
                        try {
                            const receipt = await provider.getTransactionReceipt(foundOrder.txHash);
                            if (receipt) {
                                if (receipt.status === 1) {
                                    console.log('\n🎉 Transaction confirmed on blockchain (success)!');
                                    console.log('- Block Number:', receipt.blockNumber);
                                    console.log('- Gas Used:', receipt.gasUsed.toString());
                                    break;
                                } else if (receipt.status === 0) {
                                    console.log('\n❌ Transaction confirmed on blockchain (failed)');
                                    break;
                                }
                            }
                        } catch (receiptError) {
                            // Transaction not yet confirmed on blockchain
                        }
                    }
                } else {
                    console.log(`📊 Status check ${attempts + 1}: Order not found yet, transaction may still be processing...`);
                }
                
                attempts++;
            } catch (error) {
                console.error('Error checking transaction status:', error);
                attempts++;
            }
        }

        if (attempts >= maxAttempts) {
            console.log('\n⏰ Transaction status tracking timed out');
            console.log('- You can check the status manually using the order ID:', orderId);
        }

    } catch (error) {
        console.error('Error in swap workflow:', error);
    }
}

function getStatusText(status: string): string {
    switch (status) {
        case '1': return 'Pending';
        case '2': return 'Success';
        case '3': return 'Failed';
        case '0': return 'Submitted';
        case 'pending': return 'Pending';
        case 'success': return 'Success';
        case 'failed': return 'Failed';
        default: return `Unknown (${status})`;
    }
}

main();