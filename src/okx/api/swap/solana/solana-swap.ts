// src/api/swap/solana/solana-swap.ts
import { Connection, Transaction, VersionedTransaction, ComputeBudgetProgram } from "@solana/web3.js";
import base58 from "bs58";
import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from "../../../types";

export class SolanaSwapExecutor implements SwapExecutor {
    constructor(
        private readonly config: OKXConfig,
        private readonly networkConfig: ChainConfig
    ) {}

    async executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult> {
        if (!this.config.solana) {
            throw new Error("Solana configuration required");
        }

        // Get quote data
        const quoteData = swapData.data?.[0];
        if (!quoteData?.routerResult) {
            throw new Error("Invalid swap data: missing router result");
        }

        const { routerResult } = quoteData;

        // Validate token information
        if (!routerResult.fromToken?.decimal || !routerResult.toToken?.decimal) {
            throw new Error(
                `Missing decimal information for tokens: ${routerResult.fromToken?.tokenSymbol} -> ${routerResult.toToken?.tokenSymbol}`
            );
        }

        // Get transaction data
        const txData = quoteData.tx?.data;
        if (!txData) {
            throw new Error("Missing transaction data");
        }

        try {
            const result = await this.executeSolanaTransaction(txData);
            return this.formatSwapResult(result.signature, routerResult);
        } catch (error) {
            console.error("Swap execution failed:", error);
            throw error;
        }
    }

    private async executeSolanaTransaction(txData: string) {
        const connection = this.config.solana!.wallet.connection;

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

        // Decode and prepare transaction
        const decodedTransaction = base58.decode(txData);
        const transaction = await this.prepareTransaction(decodedTransaction, blockhash);

        // Sign and send transaction using wallet
        const { signature } = await this.config.solana!.wallet.signAndSendTransaction(transaction, {
            skipPreflight: false,
            maxRetries: this.networkConfig.maxRetries,
            preflightCommitment: "confirmed",
        });

        // Confirm transaction
        const confirmation = await connection.confirmTransaction(
            {
                signature,
                blockhash,
                lastValidBlockHeight,
            },
            "confirmed"
        );

        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        return { signature };
    }

    private async prepareTransaction(
        decodedTransaction: Uint8Array,
        blockhash: string
    ): Promise<Transaction | VersionedTransaction> {
        let transaction: Transaction | VersionedTransaction;

        try {
            // Try versioned transaction first
            transaction = VersionedTransaction.deserialize(decodedTransaction);
            (transaction as VersionedTransaction).message.recentBlockhash = blockhash;
        } catch {
            // Fall back to legacy transaction
            transaction = Transaction.from(decodedTransaction);
            (transaction as Transaction).recentBlockhash = blockhash;
            (transaction as Transaction).feePayer = this.config.solana!.wallet.publicKey;

            // Add compute budget for legacy transactions
            const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
                units: this.config.solana!.computeUnits || 300000,
            });
            (transaction as Transaction).add(computeBudgetIx);
        }

        return transaction;
    }

    private formatSwapResult(signature: string, routerResult: any): SwapResult {
        const fromDecimals = parseInt(routerResult.fromToken.decimal);
        const toDecimals = parseInt(routerResult.toToken.decimal);

        const displayFromAmount = (
            Number(routerResult.fromTokenAmount) /
            Math.pow(10, fromDecimals)
        ).toFixed(6);

        const displayToAmount = (
            Number(routerResult.toTokenAmount) / Math.pow(10, toDecimals)
        ).toFixed(6);

        return {
            success: true,
            transactionId: signature,
            explorerUrl: `${this.networkConfig.explorer}/${signature}`, 
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