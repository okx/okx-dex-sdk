// src/examples/xlayer-swap.ts
import { OKXDexClient } from '../../index';
import 'dotenv/config';

// Token list (helper)
const TOKENS = {
    NATIVE: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native X Layer token
    USDC: "0x74b7f16337b8972027f6196a17a631ac6de26d22"  // USDC on X Layer
} as const;

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

async function main() {
    try {
        const args = process.argv.slice(2);
        if (args.length !== 3) {
            console.log("Usage: ts-node xlayer-swap.ts <amount> <fromTokenAddress> <toTokenAddress>");
            console.log("\nExamples:");
            console.log("  # Swap 0.1 X Layer to USDC");
            console.log(`  ts-node xlayer-swap.ts 0.1 ${TOKENS.NATIVE} ${TOKENS.USDC}`);
            process.exit(1);
        }

        const [amount, fromTokenAddress, toTokenAddress] = args;

        // Initialize client
        const client = new OKXDexClient({
            apiKey: process.env.OKX_API_KEY!,
            secretKey: process.env.OKX_SECRET_KEY!,
            apiPassphrase: process.env.OKX_API_PASSPHRASE!,
            projectId: process.env.OKX_PROJECT_ID!,
            evm: {
                connection: {
                    rpcUrl: process.env.EVM_RPC_URL!,
                },
                walletAddress: process.env.EVM_WALLET_ADDRESS!,
                privateKey: process.env.EVM_PRIVATE_KEY!,
            }
        });

        // Convert amount to correct decimal places for quote
        const DECIMALS = 18; // Native token decimals
        const quoteAmount = (parseFloat(amount) * Math.pow(10, DECIMALS)).toFixed(0);


        // Get quote
        const quote = await client.dex.getQuote({
            chainId: '8453',
            fromTokenAddress,
            toTokenAddress,
            amount: quoteAmount,
            slippage: '0.5'
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

        // Convert amount to base units using actual token decimals
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
            chainId: '8453',
            fromTokenAddress,
            toTokenAddress,
            amount: rawAmount,
            slippage: '0.5',
            userWalletAddress: process.env.EVM_WALLET_ADDRESS
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