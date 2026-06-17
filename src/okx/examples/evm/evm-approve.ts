// src/examples/evm/evm-approve.ts
import { OKXDexClient } from '../../index';
import 'dotenv/config';
import { ethers } from 'ethers';
import { createEVMWallet } from '../../core/evm-wallet';

const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL!);
const wallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

const chainId = '8453';

// Validate environment variables
const requiredEnvVars = [
    'OKX_API_KEY',
    'OKX_SECRET_KEY',
    'OKX_API_PASSPHRASE',
    'OKX_PROJECT_ID',
    'EVM_WALLET_ADDRESS',
    'EVM_PRIVATE_KEY',
    'EVM_RPC_URL'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export function toBaseUnits(amount: string, decimals: number): string {
    // Remove any decimal point and count the decimal places
    const [integerPart, decimalPart = ''] = amount.split('.');
    const currentDecimals = decimalPart.length;
    
    // Combine integer and decimal parts, removing the decimal point
    let result = integerPart + decimalPart;
    
    // Add zeros if we need more decimal places
    if (currentDecimals < decimals) {
        result = result + '0'.repeat(decimals - currentDecimals);
    }
    // Remove digits if we have too many decimal places
    else if (currentDecimals > decimals) {
        result = result.slice(0, result.length - (currentDecimals - decimals));
    }
    
    // Remove leading zeros
    result = result.replace(/^0+/, '') || '0';
    
    return result;
}

async function main() {
    try {
        const args = process.argv.slice(2);
        if (args.length !== 2) {
            console.log("Usage: ts-node evm-approve.ts <tokenAddress> <amountToApprove>");
            console.log("\nExamples:");
            console.log("  # Approve 1000 USDC");
            console.log(`  ts-node evm-approve.ts 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 1000`);
            process.exit(1);
        }

        const [tokenAddress, amount] = args;

        // Initialize client
        const client = new OKXDexClient({
            apiKey: process.env.OKX_API_KEY!,
            secretKey: process.env.OKX_SECRET_KEY!,
            apiPassphrase: process.env.OKX_API_PASSPHRASE!,
            projectId: process.env.OKX_PROJECT_ID!,
            evm: {
                wallet: wallet
            }
        });

        // Get token information using quote
        console.log("Getting token information...");
        const tokenInfo = await client.dex.getQuote({
            chainIndex: chainId,
            fromTokenAddress: tokenAddress,
            toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native token
            amount: '1000000', // Use a reasonable amount for quote
            slippagePercent: '0.5'
        });

        const tokenDecimals = parseInt(tokenInfo.data[0].fromToken.decimal);
        const rawAmount = toBaseUnits(amount, tokenDecimals);

        console.log("\nApproval Details:");
        console.log("--------------------");
        console.log(`Token: ${tokenInfo.data[0].fromToken.tokenSymbol}`);
        console.log(`Amount: ${amount} ${tokenInfo.data[0].fromToken.tokenSymbol}`);
        console.log(`Amount in base units: ${rawAmount}`);

        // Execute the approval
        console.log("\nExecuting approval...");
        const result = await client.dex.executeApproval({
            chainIndex: chainId,
            tokenContractAddress: tokenAddress,
            approveAmount: rawAmount
        });

        if ('alreadyApproved' in result) {
            console.log("\nToken already approved for the requested amount!");
        } else {
            console.log("\nApproval completed successfully!");
            console.log("Transaction Hash:", result.transactionHash);
            console.log("Explorer URL:", result.explorerUrl);
        }

    } catch (error) {
        console.error("\nError:", error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}