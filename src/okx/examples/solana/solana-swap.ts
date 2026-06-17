// src/examples/solana-swap.ts
import { OKXDexClient } from '../../index';
import { Connection } from '@solana/web3.js';
import { createWallet } from '../../core/wallet';
import 'dotenv/config';

// Validate environment variables
const requiredEnvVars = [
    'OKX_API_KEY',
    'OKX_SECRET_KEY',
    'OKX_API_PASSPHRASE',
    'OKX_PROJECT_ID',
    'SOLANA_WALLET_ADDRESS',
    'SOLANA_PRIVATE_KEY',
    'SOLANA_RPC_URL'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

async function main() {
    try {
        const args = process.argv.slice(2);
        if (args.length !== 3) {
            console.log('Usage: ts-node src/examples/solana-swap.ts <amount> <fromTokenAddress> <toTokenAddress>');
            console.log('\nExamples:');
            console.log('  # Swap 0.1 SOL to USDC');
            console.log('  ts-node src/examples/solana-swap.ts 0.1 11111111111111111111111111111111 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
            process.exit(1);
        }

        const [amount, fromTokenAddress, toTokenAddress] = args;

        const connection = new Connection(process.env.SOLANA_RPC_URL!);
        const wallet = createWallet(process.env.SOLANA_PRIVATE_KEY!, connection);

        // Initialize client
        const client = new OKXDexClient({
            apiKey: process.env.OKX_API_KEY!,
            secretKey: process.env.OKX_SECRET_KEY!,
            apiPassphrase: process.env.OKX_API_PASSPHRASE!,
            projectId: process.env.OKX_PROJECT_ID!,
            solana: {
                wallet: wallet,
                computeUnits: 300000,
                maxRetries: 3
            }
        });

        // Get quote to fetch token information
        console.log("Getting token information...");
        const quote = await client.dex.getQuote({
            chainIndex: '501',
            fromTokenAddress,
            toTokenAddress,
            amount: '100000000',
            slippagePercent: '0.005',
        });

        const tokenInfo = {
            fromToken: {
                symbol: quote.data[0].fromToken.tokenSymbol,
                decimals: parseInt(quote.data[0].fromToken.decimal),
                price: quote.data[0].fromToken.tokenUnitPrice
            },
            toToken: {
                symbol: quote.data[0].toToken.tokenSymbol,
                decimals: parseInt(quote.data[0].toToken.decimal),
                price: quote.data[0].toToken.tokenUnitPrice
            }
        };

        // Convert amount to base units
        const rawAmount = (parseFloat(amount) * Math.pow(10, tokenInfo.fromToken.decimals)).toString();

        console.log("\nSwap Details:");
        console.log("--------------------");
        console.log(`From: ${tokenInfo.fromToken.symbol}`);
        console.log(`To: ${tokenInfo.toToken.symbol}`);
        console.log(`Amount: ${amount} ${tokenInfo.fromToken.symbol}`);
        console.log(`Amount in base units: ${rawAmount}`);
        console.log(`Approximate USD value: $${(parseFloat(amount) * parseFloat(tokenInfo.fromToken.price)).toFixed(2)}`);

        // Execute the swap
        console.log("\nExecuting swap...");
        const result = await client.dex.executeSwap({
            chainIndex: '501',
            fromTokenAddress,
            toTokenAddress,
            amount: rawAmount,
            slippagePercent: '0.005',
            userWalletAddress: wallet.publicKey.toString(),
        });

        console.log("\nSwap completed successfully!");
        console.log("Transaction ID:", result.transactionId);
        console.log("Explorer URL:", result.explorerUrl);
        if (result.details) {
            console.log("\nDetails:");
            console.log(`Input: ${result.details.fromToken.amount} ${result.details.fromToken.symbol}`);
            console.log(`Output: ${result.details.toToken.amount} ${result.details.toToken.symbol}`);
            if (result.details.priceImpact) {
                console.log(`Price Impact: ${result.details.priceImpact}%`);
            }
        }

    } catch (error) {
        console.error("\nError:", error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}