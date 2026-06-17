import { Wallet } from '../core/wallet';
import { EVMWallet } from '../core/evm-wallet';

// Base token info from API
export interface TokenInfo {
    decimal: string;
    isHoneyPot: boolean;
    taxRate: string;
    tokenContractAddress: string;
    tokenSymbol: string;
    tokenUnitPrice: string;
}

// Add new interface for transaction confirmation
interface TransactionConfirmation {
    signature: string;
    success: boolean;
    error?: string;
}

// For /all-tokens endpoint - keep both for backward compatibility
export type TokenInfoList = TokenInfo;
export type TokenListInfo = TokenListResponse;

// Token list response
export interface TokenListResponse {
    decimals: string;
    tokenContractAddress: string;
    tokenLogoUrl?: string;
    tokenName?: string;
    tokenSymbol: string;
}

// Update RouterResult to match the full structure
export interface RouterResult {
    chainIndex: string;
    contextSlot?: number;
    dexRouterList: DexRouter[];
    estimateGasFee: string;
    fromToken: TokenInfo;
    toToken: TokenInfo;
    fromTokenAmount: string;
    toTokenAmount: string;
    priceImpactPercent: string;
    router: string;
    swapMode: string;
    tradeFee: string;
}

// For quote and swap responses
export interface DexProtocol {
    dexName: string;
    percent: string;
}

export interface SubRouterInfo {
    dexProtocol: DexProtocol[];
    fromToken: TokenInfo;
    toToken: TokenInfo;
}

export interface DexRouter {
    dexProtocol: DexProtocol;
    fromToken: TokenInfo;
    fromTokenIndex: string;
    toToken: TokenInfo;
    toTokenIndex: string;
}

export interface ComparisonQuote {
    amountOut: string;
    dexLogo: string;
    dexName: string;
    tradeFee: string;
}

// Direct quote response structure
export interface QuoteData {
    chainIndex: string;
    contextSlot?: number;
    dexRouterList: DexRouter[];
    estimateGasFee: string;
    fromToken: TokenInfo;
    toToken: TokenInfo;
    fromTokenAmount: string;
    toTokenAmount: string;
    priceImpactPercent: string;
    router: string;
    swapMode: string;
    tradeFee: string;
    routerResult?: RouterResult;
    tx?: TransactionData;
}

// Liquidity source response structure
export interface LiquidityData {
    id: string;
    name: string;
    logo: string;
}

// Token list response structure
export interface TokenData {
    decimals: string;
    tokenContractAddress: string;
    tokenLogoUrl: string;
    tokenName: string;
    tokenSymbol: string;
}

export interface ChainData {
    chainIndex: string;
    chainName: string;
    dexTokenApproveAddress: string | null;
}

// New interface specifically for swap responses
export interface SwapResponseData {
    data: {
        routerResult: RouterResult;
        tx: TransactionData;
    }[];
    code: string;
    msg: string;
}

// New interface for approve transaction API response
export interface ApproveTransactionData {
    dexContractAddress: string;
}

// Update getSwapData and executeSolanaSwap to use this
export interface SwapExecutionData {
    routerResult: RouterResult;
    tx?: TransactionData;
}

// Extract common transaction data interface
export interface TransactionData {
    data: string;
    from: string;
    gas: string;
    gasPrice: string;
    maxPriorityFeePerGas: string;
    maxSpendAmount: string;
    minReceiveAmount: string;
    signatureData: string[];
    slippagePercent: string;
    to: string;
    value: string;
}

export interface APIResponse<T> {
    code: string;
    msg: string;
    data: T[];
}

// For APIs that return a single object instead of an array
export interface APIResponseSingle<T> {
    code: string;
    msg: string;
    data: T;
}

// Configuration interfaces
export interface SolanaConfig {
    wallet: Wallet;
    computeUnits?: number;
    maxRetries?: number;
}

export interface SuiConfig {
    privateKey: string;
    walletAddress: string;
    connection?: {
        rpcUrl: string;
        wsEndpoint?: string;
    };
}

// src/types.ts
export interface EVMConfig {
    wallet?: EVMWallet;
}

// Add configuration interfaces for chain-specific settings
export interface ChainConfig {
    id: string;
    explorer: string;
    defaultSlippage: string;
    maxSlippage: string;
    computeUnits?: number;
    confirmationTimeout?: number;
    maxRetries?: number;
    dexContractAddress?: string;
}

export interface NetworkConfigs {
    [chainIndex: string]: ChainConfig;
}

// Update OKXConfig to include network configs
export interface OKXConfig {
    apiKey: string;
    secretKey: string;
    apiPassphrase: string;
    projectId: string;
    baseUrl?: string;
    networks?: NetworkConfigs;
    solana?: SolanaConfig;
    sui?: SuiConfig;
    evm?: EVMConfig;
    timeout?: number;
    maxRetries?: number;
}

// Generic request params
export interface APIRequestParams {
    [key: string]: string | undefined;
}

// Slippage options
export interface SlippageOptions {
    slippagePercent?: string;
    autoSlippage?: boolean;
    maxAutoSlippagePercent?: string;
}

// Request params
export interface BaseParams {
    chainIndex?: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    userWalletAddress?: string;
    dexIds?: string;
    directRoute?: boolean;
    priceImpactProtectionPercent?: string;
    feePercent?: string;
}

export interface SwapParams extends BaseParams {
    slippagePercent?: string;
    autoSlippage?: boolean;
    maxAutoSlippagePercent?: string;
    swapReceiverAddress?: string;
    fromTokenReferrerWalletAddress?: string;
    toTokenReferrerWalletAddress?: string;
    positiveSlippagePercent?: string;
    gasLimit?: string;
    gasLevel?: string;
    computeUnitPrice?: string;
    computeUnitLimit?: string;
    callDataMemo?: string;
}

export interface SwapSimulationParams {
    fromAddress: string;
    toAddress: string;
    chainIndex: string;
    txAmount: string;
    extJson: {
        inputData: string;
    };
    gasPrice: string;
    includeDebug: boolean;
}

export interface QuoteParams extends BaseParams {
    slippagePercent: string;
}

// Update SwapResult interface to include more details
export interface SwapResult {
    success: boolean;
    transactionId: string;
    explorerUrl: string;
    details?: {
        fromToken: {
            symbol: string;
            amount: string;
            decimal: string;
        };
        toToken: {
            symbol: string;
            amount: string;
            decimal: string;
        };
        priceImpact: string;
    };
}

// Frontend formatted response
export interface FormattedSwapResponse {
    success: boolean;
    quote: {
        fromToken: {
            symbol: string;
            amount: string;
            decimal: string;
            unitPrice: string;
        };
        toToken: {
            symbol: string;
            amount: string;
            decimal: string;
            unitPrice: string;
        };
        priceImpact: string;
        dexRoutes: {
            dex: string;
            amountOut: string;
            fee: string;
        }[];
    };
    summary: string;
    tx?: {
        data: string;
    };
}

export interface ApproveTokenParams {
    chainIndex: string;
    tokenContractAddress: string;
    approveAmount: string;
}

export interface ApproveTokenResult {
    success: boolean;
    transactionHash: string;
    explorerUrl: string;
}

export interface GasLimitParams {
    chainIndex: string;
    fromAddress: string;
    toAddress: string;
    txAmount?: string;
    extJson?: {
        inputData?: string;
    };
}

export interface GasLimitData {
    gasLimit: string;
}

export interface GasPriceData {
    normal: string;
    min: string;
    max: string;
    supporteip1559: boolean;
    eip1559Protocol?: {
        suggestBaseFee: string;
        baseFee: string;
        proposePriorityFee: string;
        safePriorityFee: string;
        fastPriorityFee: string;
    };
    priorityFee?: {
        proposePriorityFee: string;
        safePriorityFee: string;
        fastPriorityFee: string;
        extremePriorityFee: string;
    }; // solana only
}

export interface BroadcastTransactionParams {
    signedTx: string;
    chainIndex: string;
    address: string;
    extraData?: string;
    enableMevProtection?: boolean;
    jitoSignedTx?: string; // For Solana only
}

export interface BroadcastTransactionData {
    orderId: string;
    txHash: string;
}

export interface TransactionOrdersParams {
    address: string;
    chainIndex: string;
    txStatus?: string; // 1: Pending, 2: Success, 3: Failed
    orderId?: string;
    cursor?: string;
    limit?: string;
}

export interface TransactionOrder {
    chainIndex: string;
    orderId: string;
    address: string;
    txHash: string;
    txStatus: string; // API actually uses "txStatus" (camelCase)
    failReason: string;
}

export interface TransactionOrdersData {
    cursor: string;
    orders: TransactionOrder[];
}

export interface SolanaInstructionAccount {
    isSigner: boolean;
    isWritable: boolean;
    pubkey: string;
}

export interface SolanaInstructionItem {
    data: string; // base64
    accounts: SolanaInstructionAccount[];
    programId: string;
}

export interface SolanaSwapInstructionData {
    addressLookupTableAccount: string[];
    instructionLists: SolanaInstructionItem[];
    routerResult: RouterResult;
    tx: {
        from: string;
        minReceiveAmount: string;
        slippagePercent: string;
        to: string;
    };
}
