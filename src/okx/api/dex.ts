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
} from "../types";
import { SwapExecutorFactory } from "./swap/factory";

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
        "784": {
            id: "784",
            explorer: "https://suiscan.xyz/mainnet/tx",
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
        const networkConfig = this.getNetworkConfig(params.chainId);
        
        const executor = SwapExecutorFactory.createExecutor(
            params.chainId,
            this.config,
            networkConfig
        );
        
        return executor.executeSwap(swapData, params);
    }
}
