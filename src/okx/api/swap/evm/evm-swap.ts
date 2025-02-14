// src/api/swap/evm/evm-swap.ts
import Web3 from "web3";
import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from "../../../types";

export class EVMSwapExecutor implements SwapExecutor {
    private readonly web3: Web3;
    private readonly DEFAULT_GAS_MULTIPLIER = BigInt(3) / BigInt(2); // 1.5x

    constructor(
        private readonly config: OKXConfig,
        private readonly networkConfig: ChainConfig
    ) {
        if (!this.config.evm) {
            throw new Error("EVM configuration required");
        }
        this.web3 = new Web3(this.config.evm.connection?.rpcUrl || 'https://rpc.xlayer.tech');
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
            return this.formatSwapResult(result.transactionHash.toString(), routerResult);
        } catch (error) {
            console.error("Swap execution failed:", error);
            throw error;
        }
    }

    private async executeEvmTransaction(tx: any) {
        if (!this.config.evm?.privateKey || !this.config.evm?.walletAddress) {
            throw new Error("EVM private key and wallet address required");
        }

        let retryCount = 0;
        while (retryCount < (this.networkConfig.maxRetries || 3)) {
            try {
                const nonce = await this.web3.eth.getTransactionCount(this.config.evm.walletAddress, 'latest');
                const signTransactionParams = {
                    data: tx.data,
                    gasPrice: BigInt(tx.gasPrice || 0) * this.DEFAULT_GAS_MULTIPLIER,
                    to: tx.to,
                    value: tx.value || '0',
                    gas: BigInt(tx.gas || 0) * this.DEFAULT_GAS_MULTIPLIER,
                    nonce,
                };

                const { rawTransaction } = await this.web3.eth.accounts.signTransaction(
                    signTransactionParams,
                    this.config.evm.privateKey
                );

                return this.web3.eth.sendSignedTransaction(rawTransaction);

            } catch (error) {
                retryCount++;
                if (retryCount === this.networkConfig.maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
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
                priceImpact: routerResult.priceImpactPercentage,
            },
        };
    }
}