import { SwapExecutor } from "./types";
import { SolanaSwapExecutor } from "./solana/solana-swap";
import { SuiSwapExecutor } from "./sui/sui-swap";
import { OKXConfig, ChainConfig } from "../../types";

export class SwapExecutorFactory {
    static createExecutor(chainId: string, config: OKXConfig, networkConfig: ChainConfig): SwapExecutor {
        switch (chainId) {
            case "501": // Solana
                return new SolanaSwapExecutor(config, networkConfig);
            case "784": // Sui
                return new SuiSwapExecutor(config, networkConfig);
            default:
                throw new Error(`Chain ${chainId} not supported for swap execution`);
        }
    }
}