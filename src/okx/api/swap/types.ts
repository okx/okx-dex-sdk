import { SwapParams, SwapResponseData, SwapResult } from "../../types";

export interface SwapExecutor {
    executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult>;
    handleTokenApproval?(
        chainId: string,
        tokenAddress: string,
        amount: string
    ): Promise<{ transactionHash: string }>;
}