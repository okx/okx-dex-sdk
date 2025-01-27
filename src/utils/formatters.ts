// src/utils/formatters.ts
import { QuoteData, SwapResult } from '../okx/types';

export function formatQuoteResponse(quoteData: QuoteData): string {
    return `
Swap Quote:
From: ${quoteData.fromToken.tokenSymbol}
To: ${quoteData.toToken.tokenSymbol}
Amount: ${quoteData.fromToken.tokenUnitPrice}
Expected Output: ${quoteData.toTokenAmount}
Price Impact: ${quoteData.priceImpactPercentage || '0'}%
    `.trim();
}

export function formatSwapResult(result: SwapResult): string {
    return `
Swap executed successfully!
Transaction ID: ${result.transactionId}
Explorer URL: ${result.explorerUrl}
    `.trim();
}

export function formatTokenList(tokens: any[]): string {
    return tokens
        .map(token => `${token.symbol}: ${token.address}`)
        .join('\n');
}