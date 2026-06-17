// src/api/bridge.ts

import { HTTPClient } from '../core/http-client';

export interface CrossChainQuoteParams {
    [key: string]: string | undefined;
    fromChainIndex: string;
    toChainIndex: string;
    fromChainId: string;
    toChainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippagePercent: string;
    sort?: string;
    dexIds?: string;
    allowBridge?: string;
    denyBridge?: string;
    priceImpactProtectionPercentage?: string;
}

export interface CrossChainSwapParams extends CrossChainQuoteParams {
    userWalletAddress: string;
    receiveAddress?: string;
    referrerAddress?: string;
    feePercent?: string;
    onlyBridge?: string;
    memo?: string;
}

export class BridgeAPI {
    constructor(private readonly client: HTTPClient) { }

    // Get tokens supported for cross-chain transfers
    async getSupportedTokens(chainIndex: string) {
        return this.client.request('GET', '/api/v5/dex/cross-chain/supported/tokens', { chainIndex });
    }

    // Get supported bridges for a chain
    async getSupportedBridges(chainIndex: string) {
        return this.client.request('GET', '/api/v5/dex/cross-chain/supported/bridges', { chainIndex });
    }

    // Get token pairs available for bridging
    async getBridgeTokenPairs(fromChainIndex: string) {
        return this.client.request('GET', '/api/v5/dex/cross-chain/supported/bridge-tokens-pairs',
            { fromChainIndex });
    }

    // Get quote for a cross-chain swap
    async getCrossChainQuote(params: CrossChainQuoteParams) {
        // Validate slippage
        const slippageValue = parseFloat(params.slippagePercent);
        if (isNaN(slippageValue) || slippageValue < 0 || slippageValue > 100) {
            throw new Error('Slippage must be between 0 and 100');
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