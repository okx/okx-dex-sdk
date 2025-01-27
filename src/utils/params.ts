// src/utils/params.ts
import { Memory } from "@elizaos/core";


interface SwapParameters {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
}

export function extractSwapParams(message: Memory): SwapParameters {
    // Memory type might have a different structure, adjust according to actual type
    const messageContent = message.content?.toString() || '';

    const fromTokenMatch = messageContent.match(/from(?:_token)?:?\s*([a-zA-Z0-9]{32,44})/i);
    const toTokenMatch = messageContent.match(/to(?:_token)?:?\s*([a-zA-Z0-9]{32,44})/i);
    const amountMatch = messageContent.match(/amount:?\s*([\d.]+)/i);

    if (!fromTokenMatch) {
        throw new Error("From token address not found in message");
    }
    if (!toTokenMatch) {
        throw new Error("To token address not found in message");
    }
    if (!amountMatch) {
        throw new Error("Amount not found in message");
    }

    return {
        fromTokenAddress: fromTokenMatch[1],
        toTokenAddress: toTokenMatch[1],
        amount: amountMatch[1]
    };
}

export function validateSwapParams(params: SwapParameters): void {
    // Validate Solana addresses
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(params.fromTokenAddress)) {
        throw new Error("Invalid from token address");
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(params.toTokenAddress)) {
        throw new Error("Invalid to token address");
    }

    // Validate amount
    const amount = parseFloat(params.amount);
    if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount");
    }
}