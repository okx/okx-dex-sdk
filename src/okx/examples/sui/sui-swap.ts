import { SuiWallet } from "@okxweb3/coin-sui";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import dotenv from 'dotenv';
import { getHeaders } from '../../shared';

dotenv.config();

// Environment variables
const userPrivateKey = process.env.PRIVATE_KEY;
const rawWalletAddress = process.env.WALLET_ADDRESS;

// Token list (helper)
const TOKENS = {
    SUI: "0x2::sui::SUI",
    USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"
} as const;

const CONFIG = {
    MAX_RETRIES: 3,
    BASE_URL: 'https://www.okx.com',
    CHAIN_ID: '784',
    SLIPPAGE: '0.5',
    DEFAULT_GAS_BUDGET: 50000000,
    MIN_GAS_PRICE: 1000
};

// Validate wallet address
if (!rawWalletAddress) {
    throw new Error('WALLET_ADDRESS is required in environment variables');
}

// Initialize Sui wallet and client
const wallet = new SuiWallet();
const client = new SuiClient({
    url: getFullnodeUrl('mainnet')
});

// Types
interface TokenInfo {
    symbol: string;
    decimals: number;
    price: string;
}

interface SwapQuoteResponse {
    code: string;
    data: [{
        tx: {
            data: string;
            gas?: string;
        };
        routerResult: {
            toTokenAmount: string;
            fromTokenAmount: string;
        };
        fromToken: {
            tokenSymbol: string;
            decimal: string;
            tokenUnitPrice: string;
        };
        toToken: {
            tokenSymbol: string;
            decimal: string;
            tokenUnitPrice: string;
        };
        priceImpactPercentage?: string;
    }];
    msg?: string;
}

// Utility function to normalize Sui address
function normalizeSuiAddress(address: string): string {
    if (typeof address !== 'string') {
        throw new Error('Address must be a string');
    }
    const normalized = address.toLowerCase();
    if (!normalized.startsWith('0x')) {
        return `0x${normalized}`;
    }
    return normalized;
}

// Normalize wallet address
const normalizedWalletAddress = normalizeSuiAddress(rawWalletAddress);


async function getTokenInfo(fromTokenAddress: string, toTokenAddress: string): Promise<{
    fromToken: TokenInfo;
    toToken: TokenInfo;
}> {
    const timestamp = new Date().toISOString();
    const requestPath = "/api/v5/dex/aggregator/quote";
    const params = {
        chainId: CONFIG.CHAIN_ID,
        fromTokenAddress,
        toTokenAddress,
        amount: "1000000",
        slippage: CONFIG.SLIPPAGE,
    };

    const queryString = "?" + new URLSearchParams(params).toString();
    const headers = getHeaders(timestamp, "GET", requestPath, queryString);

    const response = await fetch(
        `${CONFIG.BASE_URL}${requestPath}${queryString}`,
        { method: "GET", headers }
    );

    const data: SwapQuoteResponse = await response.json();
    if (data.code !== "0" || !data.data?.[0]) {
        throw new Error("Failed to get token information");
    }

    const quoteData = data.data[0];
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
}

async function getSwapQuote(amount: string, fromToken: string, toToken: string) {
    const params = {
        chainId: CONFIG.CHAIN_ID,
        amount: amount,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        userWalletAddress: normalizedWalletAddress,
        slippage: CONFIG.SLIPPAGE,
        autoSlippage: "true",
        maxAutoSlippageBps: "100"
    };

    const timestamp = new Date().toISOString();
    const path = '/api/v5/dex/aggregator/swap';
    const query = '?' + new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, value.toString()])
    ).toString();

    const response = await fetch(`${CONFIG.BASE_URL}${path}${query}`, {
        method: 'GET',
        headers: getHeaders(timestamp, 'GET', path, query)
    });

    const data: SwapQuoteResponse = await response.json();
    if (data.code !== '0' || !data.data?.[0]) {
        throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }

    return data.data[0];
}

function convertAmount(amount: string, decimals: number): string {
    try {
        if (!amount || isNaN(parseFloat(amount))) {
            throw new Error("Invalid amount");
        }
        const value = parseFloat(amount);
        if (value <= 0) {
            throw new Error("Amount must be greater than 0");
        }
        return (BigInt(Math.floor(value * Math.pow(10, decimals)))).toString();
    } catch (err) {
        console.error("Amount conversion error:", err);
        throw new Error("Invalid amount format");
    }
}

async function executeSwap(txData: string, privateKey: string) {
    let retryCount = 0;

    while (retryCount < CONFIG.MAX_RETRIES) {
        try {
            // Create transaction block
            const txBlock = Transaction.from(txData);

            // Set sender
            txBlock.setSender(normalizedWalletAddress);

            // Set gas parameters
            const referenceGasPrice = await client.getReferenceGasPrice();
            txBlock.setGasPrice(BigInt(referenceGasPrice));
            txBlock.setGasBudget(BigInt(CONFIG.DEFAULT_GAS_BUDGET));

            // Build the transaction
            const builtTx = await txBlock.build({ client });

            // Convert transaction bytes to base64 for signing
            const txBytes = Buffer.from(builtTx).toString('base64');

            // Sign transaction using OKX SDK
            const signParams = {
                privateKey,
                data: {
                    type: 'raw',
                    data: txBytes
                }
            };

            console.log("Signing transaction...");
            const signedTx = await wallet.signTransaction(signParams);

            if (!signedTx || !signedTx.signature) {
                throw new Error("Failed to sign transaction");
            }

            // Execute the signed transaction
            console.log("Executing transaction...");
            const result = await client.executeTransactionBlock({
                transactionBlock: builtTx,
                signature: [signedTx.signature],
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });

            if (!result.digest) {
                throw new Error('Transaction failed: No digest received');
            }

            // Wait for confirmation
            console.log("Waiting for confirmation...");
            const confirmation = await client.waitForTransaction({
                digest: result.digest,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });

            // Check transaction status
            const status = confirmation.effects?.status?.status;
            if (status !== 'success') {
                throw new Error(`Transaction failed with status: ${status}`);
            }

            return {
                txId: result.digest,
                confirmation,
                signature: signedTx.signature
            };

        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;

            if (retryCount === CONFIG.MAX_RETRIES) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
    }

    throw new Error('Max retries exceeded');
}

async function main() {
    try {
        const args = process.argv.slice(2);
        if (args.length < 3) {
            console.log("Usage: ts-node sui-swap.ts <amount> <fromTokenAddress> <toTokenAddress>");
            console.log("Example: ts-node sui-swap.ts 1.5 0x2::sui::SUI 0xdba...::usdc::USDC");
            process.exit(1);
        }

        const [amount, fromTokenAddress, toTokenAddress] = args;

        if (!userPrivateKey) {
            throw new Error("Private key not found");
        }

        // Get token information
        console.log("Getting token information...");
        const tokenInfo = await getTokenInfo(fromTokenAddress, toTokenAddress);
        console.log(`From: ${tokenInfo.fromToken.symbol} (${tokenInfo.fromToken.decimals} decimals)`);
        console.log(`To: ${tokenInfo.toToken.symbol} (${tokenInfo.toToken.decimals} decimals)`);

        // Convert amount using fetched decimals
        const rawAmount = convertAmount(amount, tokenInfo.fromToken.decimals);
        console.log(`Amount in ${tokenInfo.fromToken.symbol} base units:`, rawAmount);

        // Get swap quote
        console.log("Requesting swap quote...");
        const swapData = await getSwapQuote(rawAmount, fromTokenAddress, toTokenAddress);

        // Show estimated output and price impact
        const outputAmount = parseFloat(swapData.routerResult.toTokenAmount) / Math.pow(10, tokenInfo.toToken.decimals);
        console.log("\nSwap Quote:");
        console.log(`Input: ${amount} ${tokenInfo.fromToken.symbol} ($${(parseFloat(amount) * parseFloat(tokenInfo.fromToken.price)).toFixed(2)})`);
        console.log(`Output: ${outputAmount.toFixed(tokenInfo.toToken.decimals)} ${tokenInfo.toToken.symbol} ($${(outputAmount * parseFloat(tokenInfo.toToken.price)).toFixed(2)})`);
        if (swapData.priceImpactPercentage) {
            console.log(`Price Impact: ${swapData.priceImpactPercentage}%`);
        }

        // Execute the swap
        console.log("\nExecuting swap transaction...");
        const result = await executeSwap(swapData.tx.data, userPrivateKey);

        console.log("\nSwap completed successfully!");
        console.log("Transaction ID:", result.txId);
        console.log("Explorer URL:", `https://suiscan.xyz/mainnet/tx/${result.txId}`);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export {
    getTokenInfo,
    convertAmount,
    executeSwap,
    getSwapQuote,
    normalizeSuiAddress,
    type TokenInfo,
    type SwapQuoteResponse
};