// src/api/swap/solana/solana-swap.ts
import { Connection, Keypair, Transaction, VersionedTransaction, ComputeBudgetProgram } from "@solana/web3.js";
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
        // Decode private key and create keypair
        const feePayer = Keypair.fromSecretKey(
            base58.decode(this.config.solana!.privateKey)
        );

        // Get latest blockhash
        const connection = new Connection(
            this.config.solana!.connection.rpcUrl,
            {
                commitment: "confirmed",
                wsEndpoint: this.config.solana!.connection.wsEndpoint,
                confirmTransactionInitialTimeout: this.networkConfig.confirmationTimeout,
            }
        );

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

        // Decode and prepare transaction
        const decodedTransaction = base58.decode(txData);
        const transaction = await this.prepareTransaction(decodedTransaction, blockhash, feePayer);

        // Send transaction
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
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
        blockhash: string,
        feePayer: Keypair
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
            (transaction as Transaction).feePayer = feePayer.publicKey;

            // Add compute budget for legacy transactions
            const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
                units: this.config.solana!.computeUnits || 300000,
            });
            (transaction as Transaction).add(computeBudgetIx);
        }

        // Sign transaction
        if (transaction instanceof VersionedTransaction) {
            transaction.sign([feePayer]);
        } else {
            transaction.sign(feePayer);
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
                priceImpact: routerResult.priceImpactPercentage,
            },
        };
    }
}