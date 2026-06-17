import { SwapExecutor } from "./types";
import { SolanaSwapExecutor } from "./solana/solana-swap";
import { SuiSwapExecutor } from "./sui/sui-swap";
import { OKXConfig, ChainConfig } from "../../types";
import { EVMSwapExecutor } from "./evm/evm-swap";
import { EVMApproveExecutor } from "./evm/evm-approve";

export class SwapExecutorFactory {
    static createExecutor(chainIndex: string, config: OKXConfig, networkConfig: ChainConfig): SwapExecutor {
        switch (chainIndex) {
            case "501": // Solana
                return new SolanaSwapExecutor(config, networkConfig);
            case "784": // Sui
                return new SuiSwapExecutor(config, networkConfig);
            case "196": // X Layer
            case "1": // Ethereum
            case "137": // Polygon
            case "146": // Sonic
            case "8453": // Base
            case "10": // Optimism
            case "42161": // Arbitrum
            case "56": // Binance Smart Chain
            case "100": // Gnosis
            case "169": // Manta Pacific
            case "250": // Fantom Opera
            case "324": // zkSync Era
            case "1101": // Polygon zkEVM
            case "5000": // Mantle
            case "43114": // Avalanche C-Chain
            case "25": // Cronos
            case "534352": // Scroll
            case "59144": // Linea
            case "1088": // Metis
            case "1030": // Conflux
            case "81457": // Blast
            case "7000": // Zeta Chain
            case "66": // OKT Chain
                return new EVMSwapExecutor(config, networkConfig);
            default:
                throw new Error(`Chain ${chainIndex} not supported for swap execution`);
        }
    }

    static createApproveExecutor(chainIndex: string, config: OKXConfig, networkConfig: ChainConfig): EVMApproveExecutor {
        switch (chainIndex) {
            case "196": // X Layer
            case "1": // Ethereum
            case "137": // Polygon
            case "146": // Sonic
            case "8453": // Base
            case "10": // Optimism
            case "42161": // Arbitrum
            case "56": // Binance Smart Chain
            case "100": // Gnosis
            case "169": // Manta Pacific
            case "250": // Fantom Opera
            case "324": // zkSync Era
            case "1101": // Polygon zkEVM
            case "5000": // Mantle
            case "43114": // Avalanche C-Chain
            case "25": // Cronos
            case "534352": // Scroll
            case "59144": // Linea
            case "1088": // Metis
            case "1030": // Conflux
            case "81457": // Blast
            case "7000": // Zeta Chain
            case "66": // OKT Chain
                return new EVMApproveExecutor(config, networkConfig);
            default:
                throw new Error(`Chain ${chainIndex} not supported for approve execution`);
        }
    }
}