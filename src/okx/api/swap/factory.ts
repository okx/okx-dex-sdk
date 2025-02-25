import { SwapExecutor } from "./types";
import { SolanaSwapExecutor } from "./solana/solana-swap";
import { SuiSwapExecutor } from "./sui/sui-swap";
import { OKXConfig, ChainConfig } from "../../types";
import { EVMSwapExecutor } from "./evm/evm-swap";
export class SwapExecutorFactory {
    static createExecutor(chainId: string, config: OKXConfig, networkConfig: ChainConfig): SwapExecutor {
        switch (chainId) {
            case "501": // Solana
                return new SolanaSwapExecutor(config, networkConfig);
            case "784": // Sui
                return new SuiSwapExecutor(config, networkConfig);
            case "196": // X Layer
                return new EVMSwapExecutor(config, networkConfig);
            case "1": // Ethereum
                return new EVMSwapExecutor(config, networkConfig);
            case "137": // Polygon
                return new EVMSwapExecutor(config, networkConfig);
            case "8453": // Base
                return new EVMSwapExecutor(config, networkConfig);
            case "10": // Optimism
                return new EVMSwapExecutor(config, networkConfig);
            case "42161": // Arbitrum
                return new EVMSwapExecutor(config, networkConfig);
            case "56": // Binance Smart Chain
                return new EVMSwapExecutor(config, networkConfig);
            case "100": // Gnosis
                return new EVMSwapExecutor(config, networkConfig);
            case "169": // Manta Pacific
                return new EVMSwapExecutor(config, networkConfig);
            case "204": // opBNB
                return new EVMSwapExecutor(config, networkConfig);
            case "250": // Fantom Opera
                return new EVMSwapExecutor(config, networkConfig);
            case "324": // zkSync Era
                return new EVMSwapExecutor(config, networkConfig);
            case "1101": // Polygon zkEVM
                return new EVMSwapExecutor(config, networkConfig);
            case "5000": // Mantle
                return new EVMSwapExecutor(config, networkConfig);
            case "43114": // Avalanche C-Chain
                return new EVMSwapExecutor(config, networkConfig);
            default:
                throw new Error(`Chain ${chainId} not supported for swap execution`);
        }
    }
}