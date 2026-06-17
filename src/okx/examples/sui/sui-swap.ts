// src/examples/sui-swap.ts
import { OKXDexClient } from '../../index';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const requiredEnvVars = [
    'OKX_API_KEY',
    'OKX_SECRET_KEY',
    'OKX_API_PASSPHRASE',
    'OKX_PROJECT_ID',
    'SUI_WALLET_ADDRESS',
    'SUI_PRIVATE_KEY',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Token list (helper)
const TOKENS = {
    SUI: "0x2::sui::SUI",
    USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"
} as const;

async function main() {
    try {
        const args = process.argv.slice(2);
        if (args.length < 3) {
            console.log("Usage: ts-node sui-swap.ts <amount> <fromTokenAddress> <toTokenAddress>");
            console.log("Example: ts-node sui-swap.ts 1.5 0x2::sui::SUI 0xdba...::usdc::USDC");
            process.exit(1);
        }

        const [amount, fromTokenAddress, toTokenAddress ] = args;

        // Initialize client with configuration
        const client = new OKXDexClient({
            apiKey: process.env.OKX_API_KEY!,
            secretKey: process.env.OKX_SECRET_KEY!,
            apiPassphrase: process.env.OKX_API_PASSPHRASE!,
            projectId: process.env.OKX_PROJECT_ID!,
            sui: {
                privateKey: process.env.SUI_PRIVATE_KEY!,
                walletAddress: process.env.SUI_WALLET_ADDRESS!,
                connection: {
                    rpcUrl: 'https://sui-mainnet.blockvision.org'
                }
            }
        });

        // Get quote to fetch token information
        console.log("Getting token information...");
        const quote = await client.dex.getQuote({
            chainIndex: '784',
            fromTokenAddress,
            toTokenAddress,
            amount: '1000000', // Small amount for quote
            slippagePercent: '0.5'
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

        // Execute the swap
        console.log("\nExecuting swap...");
        const result = await client.dex.executeSwap({
            chainIndex: '784',
            fromTokenAddress,
            toTokenAddress,
            amount: rawAmount,
            slippagePercent: '0.5',
            userWalletAddress: process.env.SUI_WALLET_ADDRESS
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
        console.error("Error:", error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}