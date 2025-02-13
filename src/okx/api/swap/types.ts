import { SwapParams, SwapResponseData, SwapResult } from "../../types";

export interface SwapExecutor {
    executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult>;
}
