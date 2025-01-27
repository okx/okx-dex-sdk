// src/api/dex.ts
import { HTTPClient } from "../core/http-client";
import {
    SwapParams,
    SlippageOptions,
    OKXConfig,
    QuoteParams,
    QuoteData,
    APIResponse,
    APIRequestParams,
    SwapResult,
    NetworkConfigs,
    ChainConfig,
    SwapResponseData,
    ChainData,
} from "../types";
import base58 from "bs58";
import * as solanaWeb3 from "@solana/web3.js";
import { Connection } from "@solana/web3.js";

export class DexAPI {
    private readonly defaultNetworkConfigs: NetworkConfigs = {
        "501": {
            id: "501",
            explorer: "https://solscan.io/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            computeUnits: 300000,
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
    };

    constructor(
        private readonly client: HTTPClient,
        private readonly config: OKXConfig
    ) {
        // Merge default configs with provided configs
        this.config.networks = {
            ...this.defaultNetworkConfigs,
            ...(config.networks || {}),
        };
    }

    private getNetworkConfig(chainId: string): ChainConfig {
        const networkConfig = this.config.networks?.[chainId];
        if (!networkConfig) {
            throw new Error(
                `Network configuration not found for chain ${chainId}`
            );
        }
        return networkConfig;
    }

    // Convert params to API format
    private toAPIParams(params: Record<string, any>): APIRequestParams {
        const apiParams: APIRequestParams = {};

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                if (key === "autoSlippage") {
                    apiParams[key] = value ? "true" : "false";
                } else {
                    apiParams[key] = String(value);
                }
            }
        }

        return apiParams;
    }

    async getQuote(params: QuoteParams): Promise<APIResponse<QuoteData>> {
        return this.client.request(
            "GET",
            "/api/v5/dex/aggregator/quote",
            this.toAPIParams(params)
        );
    }

    async getLiquidity(chainId: string): Promise<APIResponse<QuoteData>> {
        return this.client.request(
            "GET",
            "/api/v5/dex/aggregator/get-liquidity",
            this.toAPIParams({ chainId })
        );
    }

    async getSupportedChains(chainId: string): Promise<APIResponse<ChainData>> {
        return this.client.request(
            "GET",
            "/api/v5/dex/aggregator/supported/chain",
            this.toAPIParams({ chainId })
        );
    }

    async getSwapData(params: SwapParams): Promise<SwapResponseData> {
        // Validate slippage parameters
        if (!params.slippage && !params.autoSlippage) {
            throw new Error("Either slippage or autoSlippage must be provided");
        }

        if (params.slippage) {
            const slippageValue = parseFloat(params.slippage);
            if (
                isNaN(slippageValue) ||
                slippageValue < 0 ||
                slippageValue > 1
            ) {
                throw new Error("Slippage must be between 0 and 1");
            }
        }

        if (params.autoSlippage && !params.maxAutoSlippage) {
            throw new Error(
                "maxAutoSlippageBps must be provided when autoSlippage is enabled"
            );
        }

        return this.client.request(
            "GET",
            "/api/v5/dex/aggregator/swap",
            this.toAPIParams(params)
        );
    }

    async getTokens(chainId: string): Promise<APIResponse<QuoteData>> {
        return this.client.request(
            "GET",
            "/api/v5/dex/aggregator/all-tokens",
            this.toAPIParams({ chainId })
        );
    }

    async executeSwap(params: SwapParams): Promise<SwapResult> {
        const swapData = await this.getSwapData(params);

        switch (params.chainId) {
            case "501": // Solana
                return this.executeSolanaSwap(swapData, params);
            default:
                throw new Error(
                    `Chain ${params.chainId} not supported for swap execution`
                );
        }
    }

    // Update the executeSwap function to properly handle decimals
    private async executeSolanaSwap(
        swapData: SwapResponseData,
        params: SwapParams
    ): Promise<SwapResult> {
        const networkConfig = this.getNetworkConfig(params.chainId);

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
        if (
            !routerResult.fromToken?.decimal ||
            !routerResult.toToken?.decimal
        ) {
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
            // Decode private key and create keypair
            const feePayer = solanaWeb3.Keypair.fromSecretKey(
                base58.decode(this.config.solana.privateKey)
            );

            // Get latest blockhash
            const connection = new Connection(
                this.config.solana.connection.rpcUrl,
                {
                    commitment: "confirmed",
                    wsEndpoint: this.config.solana.connection.wsEndpoint,
                    confirmTransactionInitialTimeout:
                        networkConfig.confirmationTimeout,
                }
            );
            const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash("confirmed");

            // Decode and prepare transaction
            const decodedTransaction = base58.decode(txData);
            let transaction:
                | solanaWeb3.Transaction
                | solanaWeb3.VersionedTransaction;

            try {
                // Try versioned transaction first
                transaction =
                    solanaWeb3.VersionedTransaction.deserialize(
                        decodedTransaction
                    );
                (
                    transaction as solanaWeb3.VersionedTransaction
                ).message.recentBlockhash = blockhash;
            } catch {
                // Fall back to legacy transaction
                transaction = solanaWeb3.Transaction.from(decodedTransaction);
                (transaction as solanaWeb3.Transaction).recentBlockhash =
                    blockhash;
                (transaction as solanaWeb3.Transaction).feePayer =
                    feePayer.publicKey;

                // Add compute budget for legacy transactions
                const computeBudgetIx =
                    solanaWeb3.ComputeBudgetProgram.setComputeUnitLimit({
                        units: this.config.solana.computeUnits || 300000,
                    });
                (transaction as solanaWeb3.Transaction).add(computeBudgetIx);
            }

            // Sign transaction
            if (transaction instanceof solanaWeb3.VersionedTransaction) {
                transaction.sign([feePayer]);
            } else {
                transaction.sign(feePayer);
            }

            // Send transaction
            const signature = await connection.sendRawTransaction(
                transaction.serialize(),
                {
                    skipPreflight: false,
                    maxRetries: networkConfig.maxRetries,
                    preflightCommitment: "confirmed",
                }
            );

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
                throw new Error(
                    `Transaction failed: ${JSON.stringify(
                        confirmation.value.err
                    )}`
                );
            }

            // Format amounts using proper decimals
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
                explorerUrl: `${networkConfig.explorer}/${signature}`,
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
        } catch (error) {
            console.error("Swap execution failed:", error);
            throw error;
        }
    }
}
