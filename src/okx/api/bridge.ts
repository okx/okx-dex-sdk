// src/api/bridge.ts

import { HTTPClient } from '../core/http-client';

export interface CrossChainQuoteParams {
    [key: string]: string | undefined;
    fromChainId: string;
    toChainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippage: string;
    sort?: string;
    feePercent?: string;
    allowBridge?: string;
    denyBridge?: string;
    priceImpactProtectionPercentage?: string;
}

export interface CrossChainSwapParams extends CrossChainQuoteParams {
    userWalletAddress: string;
    receiveAddress?: string;
    referrerAddress?: string;
    onlyBridge?: string;
    memo?: string;
}

export class BridgeAPI {
    constructor(private readonly client: HTTPClient) { }

    // Get tokens supported for cross-chain transfers
    async getSupportedTokens(chainId: string) {
        return this.client.request('GET', '/api/v5/dex/cross-chain/supported/tokens', { chainId });
    }

    // Get supported bridges for a chain
    async getSupportedBridges(chainId: string) {
        return this.client.request('GET', '/api/v5/dex/cross-chain/supported/bridges', { chainId });
    }

    // Get token pairs available for bridging
    async getBridgeTokenPairs(fromChainId: string) {
        return this.client.request('GET', '/api/v5/dex/cross-chain/supported/bridge-tokens-pairs',
            { fromChainId });
    }

    // Get quote for a cross-chain swap
    async getCrossChainQuote(params: CrossChainQuoteParams) {
        // Validate slippage
        const slippageValue = parseFloat(params.slippage);
        if (isNaN(slippageValue) || slippageValue < 0.002 || slippageValue > 0.5) {
            throw new Error('Slippage must be between 0.002 (0.2%) and 0.5 (50%)');
        }

        return this.client.request('GET', '/api/v5/dex/cross-chain/quote', params);
    }

    // Build cross-chain swap transaction
    async buildCrossChainSwap(params: CrossChainSwapParams) {
        // Validate required parameters
        if (!params.userWalletAddress) {
            throw new Error('userWalletAddress is required');
        }

        return this.client.request('GET', '/api/v5/dex/cross-chain/build-tx', params);
    }
}