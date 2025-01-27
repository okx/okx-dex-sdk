// src/examples/solana-swap.ts
import { OKXDexClient } from '../../index';
import { APIResponse, QuoteData, SwapResult, TokenInfo } from '../../types';
import 'dotenv/config';

// Validate environment variables
const requiredEnvVars = [
    'OKX_API_KEY',
    'OKX_SECRET_KEY',
    'OKX_API_PASSPHRASE',
    'OKX_PROJECT_ID',
    'WALLET_ADDRESS',
    'PRIVATE_KEY',
    'SOLANA_RPC_URL'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    solana: {
        connection: {
            rpcUrl: process.env.SOLANA_RPC_URL!,
            wsEndpoint: process.env.SOLANA_WS_URL,
            confirmTransactionInitialTimeout: 5000
        },
        privateKey: process.env.PRIVATE_KEY!,
        computeUnits: 300000,
        maxRetries: 3
    }
});

interface TokenDetails {
    symbol: string;
    decimals: number;
    price: string;
}

async function getTokenInfo(fromTokenAddress: string, toTokenAddress: string): Promise<{
    fromToken: TokenDetails;
    toToken: TokenDetails;
}> {
    try {
        const quote = await client.dex.getQuote({
            chainId: '501',
            fromTokenAddress,
            toTokenAddress,
            amount: '1000000', // small amount just to get token info
            slippage: '0.5'
        });

        const quoteData = quote.data[0];

        return {
            fromToken: {
                symbol: quoteData.fromToken.tokenSymbol,
                decimals: parseInt(quoteData.fromToken.decimal),
                price: quoteData.fromToken.tokenUnitPrice
            },
            toToken: {
                symbol: quoteData.toToken.tokenSymbol,
                decimals: parseInt(quoteData.toToken.decimal),
                price: quoteData.toToken.tokenUnitPrice
            }
        };
    } catch (error) {
        console.error('Error getting token info:', error);
        throw error;
    }
}

async function executeSwap(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string
) {
    // Get token information
    console.log("\nGetting token information...");
    const tokenInfo = await getTokenInfo(fromTokenAddress, toTokenAddress);

    console.log('\nSwap Details:');
    console.log('--------------------');
    console.log(`From: ${tokenInfo.fromToken.symbol}`);
    console.log(`To: ${tokenInfo.toToken.symbol}`);
    console.log(`Amount: ${amount} ${tokenInfo.fromToken.symbol}`);

    // Convert amount to base units
    const rawAmount = (parseFloat(amount) * Math.pow(10, tokenInfo.fromToken.decimals)).toString();
    console.log(`\nAmount in base units: ${rawAmount}`);

    // Calculate USD value
    const usdValue = (parseFloat(amount) * parseFloat(tokenInfo.fromToken.price)).toFixed(2);
    console.log(`Approximate USD value: $${usdValue}`);

    // Execute the swap
    console.log("\nExecuting swap...");
    const result = await client.dex.executeSwap({
        chainId: '501',
        fromTokenAddress,
        toTokenAddress,
        amount: rawAmount,
        slippage: '0.5',
        userWalletAddress: process.env.WALLET_ADDRESS
    });

    console.log('\nSwap completed successfully!');
    console.log('--------------------');
    console.log('Transaction ID:', result.transactionId);
    console.log('Explorer URL:', result.explorerUrl);

    return result;
}

async function main() {
    try {
        const args = process.argv.slice(2);

        if (args.length !== 3) {
            console.log('Usage: ts-node src/examples/solana-swap.ts <fromTokenAddress> <toTokenAddress> <amount>');
            console.log('\nExample:');
            console.log('  # Swap SOL to USDC');
            console.log('  ts-node src/examples/solana-swap.ts So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v 0.1');
            console.log('\n  # Swap USDC to BONK');
            console.log('  ts-node src/examples/solana-swap.ts EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 10');
            process.exit(1);
        }

        const [fromTokenAddress, toTokenAddress, amount] = args;
        // const fromTokenAddress = '11111111111111111111111111111111'
        // const toTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        // const amount = ".01"

        // Validate inputs
        if (!fromTokenAddress || !toTokenAddress || !amount) {
            throw new Error('Missing required parameters');
        }

        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            throw new Error('Amount must be a positive number');
        }

        // Execute the swap
        await executeSwap(fromTokenAddress, toTokenAddress, amount);

    } catch (error) {
        console.error('\nError:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

main();