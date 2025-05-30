// src/api/dex.ts
import { HTTPClient } from "../core/http-client";
import {
    SwapParams,
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
    ApproveTokenParams,
    LiquidityData,
    TokenData,
} from "../types";
import { SwapExecutorFactory } from "./swap/factory";

export class DexAPI {
    private readonly defaultNetworkConfigs: NetworkConfigs = {
        "501": {
            id: "501",
            explorer: "https://www.okx.com/web3/explorer/sol/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            computeUnits: 300000,
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "784": {
            id: "784",
            explorer: "https://www.okx.com/web3/explorer/sui/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "43114": { // Avalanche C-Chain
            id: "43114",
            explorer: "https://www.okx.com/web3/explorer/avax/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "1": { // Ethereum Mainnet
            id: "1",
            explorer: "https://www.okx.com/web3/explorer/eth/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "137": { // Polygon Mainnet
            id: "137",
            explorer: "https://www.okx.com/web3/explorer/polygon/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "8453": { // Base Mainnet
            id: "8453",
            explorer: "https://www.okx.com/web3/explorer/base/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "196": { // X Layer Mainnet
            id: "196",
            explorer: "https://www.okx.com/web3/explorer/xlayer/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "10": { // Optimism
            id: "10",
            explorer: "https://www.okx.com/web3/explorer/optimism/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "42161": { // Arbitrum
            id: "42161",
            explorer: "https://www.okx.com/web3/explorer/arbitrum/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "56": { // Binance Smart Chain
            id: "56",
            explorer: "https://www.okx.com/web3/explorer/bsc/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "100": { // Gnosis
            id: "100",
            explorer: "https://www.okx.com/web3/explorer/gnosis/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "169": { // Manta Pacific
            id: "169",
            explorer: "https://www.okx.com/web3/explorer/manta/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "250": { // Fantom Opera
            id: "250",
            explorer: "https://www.okx.com/web3/explorer/ftm/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "324": { // zkSync Era
            id: "324",
            explorer: "https://www.okx.com/web3/explorer/zksync/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "1101": { // Polygon zkEVM
            id: "1101",
            explorer: "https://www.okx.com/web3/explorer/polygon-zkevm/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "5000": { // Mantle
            id: "5000",
            explorer: "https://www.okx.com/web3/explorer/mantle/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "25": { // Cronos
            id: "25",
            explorer: "https://cronoscan.com/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "534352": { // Scroll
            id: "534352",
            explorer: "https://www.okx.com/web3/explorer/scroll/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "59144": { // Linea
            id: "59144",
            explorer: "https://www.okx.com/web3/explorer/linea/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "1088": { // Metis
            id: "1088",
            explorer: "https://www.okx.com/web3/explorer/metis/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "1030": { // Conflux
            id: "1030",
            explorer: "https://www.confluxscan.io/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "81457": { // Blast
            id: "81457",
            explorer: "https://www.okx.com/web3/explorer/blast/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "7000": { // Zeta Chain
            id: "7000",
            explorer: "https://explorer.zetachain.com/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },
        "66": { // OKT Chain
            id: "66",
            explorer: "https://www.okx.com/web3/explorer/oktc/tx",
            defaultSlippage: "0.5",
            maxSlippage: "1",
            confirmationTimeout: 60000,
            maxRetries: 3,
        },

    };

    constructor(
        private readonly client: HTTPClient,
        private readonly config: OKXConfig
    ) {
        this.config.networks = {
            ...this.defaultNetworkConfigs,
            ...(config.networks || {}),
        };
    }

    private getNetworkConfig(chainId: string): ChainConfig {
        const networkConfig = this.config.networks?.[chainId];
        if (!networkConfig) {
            throw new Error(`Network configuration not found for chain ${chainId}`);
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

    async getLiquidity(chainId: string): Promise<APIResponse<LiquidityData>> {
        return this.client.request(
            "GET",
            "/api/v5/dex/aggregator/get-liquidity",
            this.toAPIParams({ chainId })
        );
    }

    async getChainData(chainId: string): Promise<APIResponse<ChainData>> {
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

    async getTokens(chainId: string): Promise<APIResponse<TokenData>> {
        return this.client.request(
            "GET",
            "/api/v5/dex/aggregator/all-tokens",
            this.toAPIParams({ chainId })
        );
    }

    async executeSwap(params: SwapParams): Promise<SwapResult> {
        const swapData = await this.getSwapData(params);
        const networkConfig = this.getNetworkConfig(params.chainId);

        const executor = SwapExecutorFactory.createExecutor(
            params.chainId,
            this.config,
            networkConfig
        );

        return executor.executeSwap(swapData, params);
    }

    async executeApproval(params: ApproveTokenParams): Promise<{ transactionHash: string; explorerUrl: string }> {
        try {
            // Get network configuration
            const networkConfig = this.getNetworkConfig(params.chainId);

            // Get the DEX approval address from supported chains
            const chainsData = await this.getChainData(params.chainId);
            const dexTokenApproveAddress = chainsData.data?.[0]?.dexTokenApproveAddress;
            if (!dexTokenApproveAddress) {
                throw new Error(`No dex contract address found for chain ${params.chainId}`);
            }

            // Create the approve executor
            const executor = SwapExecutorFactory.createApproveExecutor(
                params.chainId,
                this.config,
                networkConfig
            );

            // Execute approval with the contract address from supported chains
            const result = await executor.handleTokenApproval(
                params.chainId,
                params.tokenContractAddress,
                params.approveAmount,
            );

            // Return formatted result
            return {
                transactionHash: result.transactionHash,
                explorerUrl: `${networkConfig.explorer}/${result.transactionHash}`
            };
        } catch (error) {
            // Check if it's an "already approved" error, which is not a real error
            if (error instanceof Error && error.message.includes("already approved")) {
                // Return a mock result for already approved tokens
                return {
                    transactionHash: "",
                    explorerUrl: "",
                    alreadyApproved: true,
                    message: "Token already approved for the requested amount"
                } as any;
            }
            // Otherwise, rethrow the error
            throw error;
        }
    }
}