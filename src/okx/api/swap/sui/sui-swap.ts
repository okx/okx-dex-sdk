 // src/api/swap/sui/sui-swap.ts
import { SuiWallet } from "@okxweb3/coin-sui";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from "../../../types";

export class SuiSwapExecutor implements SwapExecutor {
    private readonly client: SuiClient;
    private readonly wallet: SuiWallet;
    private readonly DEFAULT_GAS_BUDGET = 50000000;

    constructor(
        private readonly config: OKXConfig,
        private readonly networkConfig: ChainConfig
    ) {
        if (!this.config.sui) {
            throw new Error("Sui configuration required");
        }

        this.client = new SuiClient({
            url: getFullnodeUrl('mainnet')
        });
        this.wallet = new SuiWallet();
    }

    async executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult> {
        const quoteData = swapData.data?.[0];
        if (!quoteData?.routerResult) {
            throw new Error("Invalid swap data: missing router result");
        }

        const { routerResult } = quoteData;
        const txData = quoteData.tx?.data;
        if (!txData) {
            throw new Error("Missing transaction data");
        }

        try {
            const result = await this.executeSuiTransaction(txData);
            return this.formatSwapResult(result.txId, routerResult);
        } catch (error) {
            console.error("Swap execution failed:", error);
            throw error;
        }
    }

    private async executeSuiTransaction(txData: string) {
        if (!this.config.sui?.privateKey) {
            throw new Error("Sui private key not found");
        }

        let retryCount = 0;
        while (retryCount < (this.networkConfig.maxRetries || 3)) {
            try {
                // Create transaction block
                const txBlock = Transaction.from(txData);
                txBlock.setSender(this.config.sui.walletAddress);

                // Set gas parameters
                const referenceGasPrice = await this.client.getReferenceGasPrice();
                txBlock.setGasPrice(BigInt(referenceGasPrice));
                txBlock.setGasBudget(BigInt(this.DEFAULT_GAS_BUDGET));

                // Build the transaction
                const builtTx = await txBlock.build({ client: this.client });
                const txBytes = Buffer.from(builtTx).toString('base64');

                // Sign transaction
                const signedTx = await this.wallet.signTransaction({
                    privateKey: this.config.sui.privateKey,
                    data: {
                        type: 'raw',
                        data: txBytes
                    }
                });

                if (!signedTx?.signature) {
                    throw new Error("Failed to sign transaction");
                }

                // Execute transaction
                const result = await this.client.executeTransactionBlock({
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
                const confirmation = await this.client.waitForTransaction({
                    digest: result.digest,
                    options: {
                        showEffects: true,
                        showEvents: true,
                    }
                });

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
                retryCount++;
                if (retryCount === this.networkConfig.maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            }
        }

        throw new Error('Max retries exceeded');
    }

    private formatSwapResult(txId: string, routerResult: any): SwapResult {
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
            transactionId: txId,
            explorerUrl: `https://suiscan.xyz/mainnet/tx/${txId}`,
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