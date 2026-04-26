// src/api/swap/evm/evm-swap.ts
import { ethers } from "ethers";
import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from "../../../types";

export class EVMSwapExecutor implements SwapExecutor {
    private readonly provider: ethers.Provider;
    private readonly DEFAULT_GAS_MULTIPLIER = BigInt(150); // 1.5x

    constructor(
        private readonly config: OKXConfig,
        private readonly networkConfig: ChainConfig
    ) {
        if (!this.config.evm?.wallet) {
            throw new Error("EVM configuration required");
        }
        this.provider = this.config.evm.wallet.provider;
    }

    async executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult> {
        const quoteData = swapData.data?.[0];
        if (!quoteData?.routerResult) {
            throw new Error("Invalid swap data: missing router result");
        }

        const { routerResult } = quoteData;
        const tx = quoteData.tx;
        if (!tx) {
            throw new Error("Missing transaction data");
        }

        try {
            const result = await this.executeEvmTransaction(tx);
            return this.formatSwapResult(result.hash, routerResult);
        } catch (error) {
            console.error("Swap execution failed:", error);
            throw error;
        }
    }

    private async executeEvmTransaction(tx: any) {
        if (!this.config.evm?.wallet) {
            throw new Error("EVM wallet required");
        }

        let retryCount = 0;
        while (retryCount < (this.networkConfig.maxRetries || 3)) {
            try {
                console.log("Preparing transaction...");
                const gasMultiplier = BigInt(500); // 5x standard multiplier
                
                // Get current nonce
                const nonce = await this.provider.getTransactionCount(this.config.evm.wallet.address);
                
                // Get current gas prices
                const feeData = await this.provider.getFeeData();

                const baseTransaction = {
                    data: tx.data,
                    to: tx.to,
                    value: tx.value || '0',
                    nonce: nonce + retryCount, // Increment nonce for each retry
                    gasLimit: BigInt(tx.gas || 0) * gasMultiplier / BigInt(100),
                };

                let gasPriceFields: Record<string, bigint>;
                if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                    // EIP-1559 chain
                    gasPriceFields = {
                        maxFeePerGas: (feeData.maxFeePerGas * gasMultiplier) / BigInt(100),
                        maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas * gasMultiplier) / BigInt(100),
                    };
                } else {
                    // Legacy chain (e.g. BSC)
                    const legacyGasPrice = feeData.gasPrice ?? BigInt(3000000000);
                    gasPriceFields = {
                        gasPrice: (legacyGasPrice * gasMultiplier) / BigInt(100),
                    };
                }

                const transaction = { ...baseTransaction, ...gasPriceFields };

                console.log("Transaction details:", {
                    to: transaction.to,
                    value: transaction.value,
                    nonce: transaction.nonce,
                    gasLimit: transaction.gasLimit.toString(),
                    ...Object.fromEntries(
                        Object.entries(gasPriceFields).map(([k, v]) => [k, v.toString()])
                    ),
                });

                console.log("Sending transaction...");
                const response = await this.config.evm.wallet.sendTransaction(transaction);
                console.log("Transaction sent! Hash:", response.hash);
                
                // Wait a bit before checking status to allow transaction to be mined
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                console.log("Waiting for transaction confirmation...");
                try {
                    // Poll for transaction status
                    let receipt = null;
                    let attempts = 0;
                    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds total
                    
                    while (attempts < maxAttempts) {
                        receipt = await this.provider.getTransactionReceipt(response.hash);
                        
                        if (receipt) {
                            console.log("Transaction confirmed! Block number:", receipt.blockNumber);
                            return receipt;
                        }
                        
                        // Check if transaction is still pending
                        const tx = await this.provider.getTransaction(response.hash);
                        if (!tx) {
                            // Check if we're on a different network than expected
                            const network = await this.provider.getNetwork();
                            console.error(`Transaction dropped. Network: ${network.name} (${network.chainId})`);
                            throw new Error("Transaction dropped - check network and gas prices");
                        }
                        
                        console.log(`Transaction still pending... (attempt ${attempts + 1}/${maxAttempts})`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
                        attempts++;
                    }
                    
                    throw new Error("Transaction confirmation timed out - check explorer for status");
                } catch (waitError: any) {
                    console.error("Error waiting for confirmation:", waitError.message);
                    throw waitError;
                }
            } catch (error: any) {
                retryCount++;
                console.error(`Transaction attempt ${retryCount} failed:`, error.message);
                
                if (error.code === 'INSUFFICIENT_FUNDS') {
                    throw new Error("Insufficient funds for transaction");
                }
                if (error.code === 'NONCE_EXPIRED') {
                    throw new Error("Transaction nonce expired");
                }
                
                if (retryCount === this.networkConfig.maxRetries) {
                    console.error("Max retries reached. Last error:", error);
                    throw error;
                }
                
                const delay = 2000 * retryCount;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw new Error('Max retries exceeded');
    }

    private formatSwapResult(txHash: string, routerResult: any): SwapResult {
        const fromDecimals = parseInt(routerResult.fromToken.decimal);
        const toDecimals = parseInt(routerResult.toToken.decimal);

        const displayFromAmount = (
            Number(routerResult.fromTokenAmount) /
            Math.pow(10, fromDecimals)
        ).toFixed(6);

        const displayToAmount = (
            Number(routerResult.toTokenAmount) /
            Math.pow(10, toDecimals)
        ).toFixed(6);

        return {
            success: true,
            transactionId: txHash,
            explorerUrl: `${this.networkConfig.explorer}/${txHash}`,
            details: {
                fromToken: {
                    symbol: routerResult.fromToken.tokenSymbol,
                    amount: displayFromAmount,
                    decimal: routerResult.fromToken.decimal,
                },
                toToken: {
                    symbol: routerResult.toToken.tokenSymbol,
                    amount: displayToAmount,
                    decimal: routerResult.toToken.decimal,
                },
                priceImpact: routerResult.priceImpactPercent,
            },
        };
    }
}