# OKX DEX SDK

[![npm version](https://img.shields.io/npm/v/@okx-dex/okx-dex-sdk.svg)](https://www.npmjs.com/package/@okx-dex/okx-dex-sdk)

A comprehensive TypeScript SDK for interacting with OKX DEX across multiple blockchain networks including EVM-compatible chains, Solana, Sui, TON, and TRON.

## Features

### Core Trading Functionality
- **Multi-chain token swaps** - Execute swaps across 6+ blockchain networks
- **Real-time quotes** - Get accurate pricing and route information
- **Token approvals** - Automated ERC-20 token approval handling
- **Liquidity data** - Access DEX liquidity sources and routing information

### Advanced Features
- **Transaction broadcasting** - Direct transaction submission through OKX infrastructure with MEV protection
- **Gas estimation** - Accurate gas limit calculation using onchain data
- **Transaction simulation** - Pre-execution validation and risk assessment
- **Order tracking** - Real-time transaction status monitoring
- **Slippage protection** - Configurable slippage tolerance

### Developer Experience
- **Full TypeScript support** - Complete type safety and IntelliSense
- **Built-in retry logic** - Automatic retries with exponential backoff
- **Comprehensive error handling** - Detailed error messages and status codes
- **Extensive examples** - Ready-to-use code samples for all chains

## Installation

```bash
npm install @okx-dex/okx-dex-sdk
# or
yarn add @okx-dex/okx-dex-sdk
# or
pnpm add @okx-dex/okx-dex-sdk
```

## Supported Networks

| Network | Chain ID | Status | Features |
|---------|----------|--------|----------|
| **Major EVM Chains** | | | |
| Ethereum | `1` | ✅ | Swap, Quote, Approve, Broadcast |
| Base | `8453` | ✅ | Swap, Quote, Approve, Broadcast |
| Polygon | `137` | ✅ | Swap, Quote, Approve, Broadcast |
| Sonic | `146` | ✅ | Swap, Quote, Approve, Broadcast |
| Avalanche | `43114` | ✅ | Swap, Quote, Approve, Broadcast |
| BSC | `56` | ✅ | Swap, Quote, Approve, Broadcast |
| Arbitrum | `42161` | ✅ | Swap, Quote, Approve, Broadcast |
| Optimism | `10` | ✅ | Swap, Quote, Approve, Broadcast |
| **Layer 2 & Scaling** | | | |
| Polygon zkEVM | `1101` | ✅ | Swap, Quote, Approve, Broadcast |
| zkSync Era | `324` | ✅ | Swap, Quote, Approve, Broadcast |
| Linea | `59144` | ✅ | Swap, Quote, Approve, Broadcast |
| Scroll | `534352` | ✅ | Swap, Quote, Approve, Broadcast |
| Mantle | `5000` | ✅ | Swap, Quote, Approve, Broadcast |
| Blast | `81457` | ✅ | Swap, Quote, Approve, Broadcast |
| **Other EVM Chains** | | | |
| Fantom | `250` | ✅ | Swap, Quote, Approve, Broadcast |
| Gnosis | `100` | ✅ | Swap, Quote, Approve, Broadcast |
| X Layer | `196` | ✅ | Swap, Quote, Approve, Broadcast |
| Manta Pacific | `169` | ✅ | Swap, Quote, Approve, Broadcast |
| Metis | `1088` | ✅ | Swap, Quote, Approve, Broadcast |
| Cronos | `25` | ✅ | Swap, Quote, Approve, Broadcast |
| Conflux | `1030` | ✅ | Swap, Quote, Approve, Broadcast |
| Zeta Chain | `7000` | ✅ | Swap, Quote, Approve, Broadcast |
| OKT Chain | `66` | ✅ | Swap, Quote, Approve, Broadcast |
| **Non-EVM Chains** | | | |
| Solana | `501` | ✅ | Swap, Quote, Broadcast |
| Sui | `784` | ✅ | Swap, Quote, Broadcast |
| TON | `607` | ✅ | Swap, Quote |
| TRON | `195` | ✅ | Swap, Quote |

## Configuration

Set up your environment variables in a `.env` file:

```bash
# OKX API Credentials (Required)
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret_key
OKX_API_PASSPHRASE=your_passphrase
OKX_PROJECT_ID=your_project_id

# EVM Configuration (for Ethereum, Base, Polygon, etc.)
EVM_RPC_URL=https://mainnet.base.org
EVM_WALLET_ADDRESS=0x...
EVM_PRIVATE_KEY=0x...

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WALLET_ADDRESS=...
SOLANA_PRIVATE_KEY=...

# Sui Configuration
SUI_RPC_URL=https://sui-mainnet.blockvision.org
SUI_WALLET_ADDRESS=0x...
SUI_PRIVATE_KEY=...
```

## Quick Start

### Initialize the Client

```typescript
import { OKXDexClient } from '@okx-dex/okx-dex-sdk';
import { createWallet } from '@okx-dex/okx-dex-sdk/core/solana-wallet';
import { createEVMWallet } from '@okx-dex/okx-dex-sdk/core/evm-wallet';
import { ethers } from 'ethers';
import 'dotenv/config';

// Create wallet instances
const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL!);
const evmWallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

// For Solana - create wallet instance (implementation may vary)
const connection = new Connection(process.env.SOLANA_RPC_URL!);
const solanaWallet = createWallet(process.env.SOLANA_PRIVATE_KEY!, connection);


// Multi-chain client initialization
const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    
    // EVM configuration (Ethereum, Base, Polygon, etc.)
    evm: {
        wallet: evmWallet
    },
    
    // Solana configuration
    solana: {
        wallet: solanaWallet
    }
    sui: {
        privateKey: process.env.SUI_PRIVATE_KEY!,
        walletAddress: process.env.SUI_WALLET_ADDRESS!,
        connection: {
            rpcUrl: suiRpcUrl
        }
        
});
```

### Basic Usage Examples

<details>
<summary><b>EVM Chains (Ethereum, Base, Polygon, etc.)</b></summary>

#### Token Addresses (Base Chain)
```typescript
const BASE_TOKENS = {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006'
};
```

#### Get Quote
```typescript
const quote = await client.dex.getQuote({
    chainId: '8453',  // Base Chain
    fromTokenAddress: BASE_TOKENS.ETH,
    toTokenAddress: BASE_TOKENS.USDC,
    amount: '1000000000000000000',  // 1 ETH in wei
    slippage: '0.005'     // 0.5%
});

console.log(`Quote: ${quote.data[0].fromToken.tokenSymbol} → ${quote.data[0].toToken.tokenSymbol}`);
console.log(`Rate: ${quote.data[0].toTokenAmount} USDC for 1 ETH`);
console.log(`Price Impact: ${quote.data[0].priceImpactPercentage}%`);
```

#### Token Approval (ERC-20 tokens only)
```typescript
// Not needed for native ETH, only for ERC-20 tokens
const approval = await client.dex.executeApproval({
    chainId: '8453',
    tokenContractAddress: BASE_TOKENS.USDC,
    approveAmount: '1000000' // 1 USDC (6 decimals)
});
console.log(`Approval tx: ${approval.transactionHash}`);
```

#### Execute Swap
```typescript
const swap = await client.dex.executeSwap({
    chainId: '8453',        // Base Chain
    fromTokenAddress: BASE_TOKENS.ETH,
    toTokenAddress: BASE_TOKENS.USDC,
    amount: '100000000000000000', // 0.1 ETH in wei
    slippage: '0.005',        // 0.5%
    userWalletAddress: evmWallet.address
});

console.log(`Swap completed: ${swap.transactionId}`);
console.log(`Explorer: ${swap.explorerUrl}`);
```
</details>

<details>
<summary><b>Solana</b></summary>

#### Token Addresses
```typescript
const SOLANA_TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112', // Native SOL
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
};
```

#### Get Quote
```typescript
const quote = await client.dex.getQuote({
    chainId: '501',         // Solana mainnet
    fromTokenAddress: SOLANA_TOKENS.SOL,
    toTokenAddress: SOLANA_TOKENS.USDC,
    amount: '1000000000',   // 1 SOL (9 decimals)
    slippage: '0.005'         // 0.5%
});

console.log(`Quote: 1 SOL → ${quote.data[0].toTokenAmount} USDC`);
console.log(`Price Impact: ${quote.data[0].priceImpactPercentage}%`);
```

#### Execute Swap
```typescript
const swap = await client.dex.executeSwap({
    chainId: '501',
    fromTokenAddress: SOLANA_TOKENS.SOL,
    toTokenAddress: SOLANA_TOKENS.USDC,
    amount: '500000000',    // 0.5 SOL
    slippage: '0.005',
    userWalletAddress: solanaWallet.address
});

console.log(`Swap completed: ${swap.transactionId}`);
console.log(`Explorer: ${swap.explorerUrl}`);
```
</details>

<details>
<summary><b>Sui</b></summary>

#### Token Addresses
```typescript
const SUI_TOKENS = {
    SUI: '0x2::sui::SUI', // Native SUI
    USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
};
```

#### Get Quote
```typescript
const quote = await client.dex.getQuote({
    chainId: '784',         // Sui mainnet
    fromTokenAddress: SUI_TOKENS.SUI,
    toTokenAddress: SUI_TOKENS.USDC,
    amount: '1000000000',   // 1 SUI (9 decimals)
    slippage: '0.005'         // 0.5%
});
```

#### Execute Swap
```typescript
const swap = await client.dex.executeSwap({
    chainId: '784',
    fromTokenAddress: SUI_TOKENS.SUI,
    toTokenAddress: SUI_TOKENS.USDC,
    amount: '500000000',    // 0.5 SUI
    slippage: '0.005',
    userWalletAddress: suiWallet.address
});

console.log(`Swap completed: ${swap.transactionId}`);
console.log(`Explorer: ${swap.explorerUrl}`);
```
</details>

## Advanced Features

### Onchain Gateway APIs

The SDK provides access to advanced trading infrastructure for developers with API access:

#### Transaction Broadcasting with MEV Protection
```typescript
// Requires API registration and whitelist approval
const broadcastResult = await client.dex.broadcastTransaction({
    signedTx: signedTransaction.rawTransaction,
    chainIndex: '8453',     // Base Chain
    address: walletAddress,
    enableMevProtection: true  // MEV protection
});

console.log(`Order ID: ${broadcastResult.data[0].orderId}`);
console.log(`Transaction Hash: ${broadcastResult.data[0].txHash}`);
```

#### Gas Limit Estimation
```typescript
const gasLimit = await client.dex.getGasLimit({
    chainId: '8453',
    fromAddress: walletAddress,
    toAddress: contractAddress,
    txAmount: '0',
    inputData: transactionData
});
```

#### Transaction Simulation
```typescript
// Requires API registration and whitelist approval
const simulation = await client.dex.simulateTransaction({
    chainId: '8453',
    fromAddress: walletAddress,
    toAddress: contractAddress,
    txAmount: transactionValue,
    inputData: transactionData
});

console.log(`Gas used: ${simulation.gasUsed}`);
console.log(`Success: ${simulation.success}`);
```

#### Order Tracking
```typescript
const orders = await client.dex.getTransactionOrders({
    orderId: 'your_order_id',
    chainIndex: '8453',
    address: walletAddress
});

console.log(`Status: ${orders.data[0].orders[0].txStatus}`);
console.log(`Transaction Hash: ${orders.data[0].orders[0].txHash}`);
```

> **Note**: Transaction broadcasting and simulation features require API registration and whitelist approval for access. These methods provide enhanced reliability and monitoring capabilities for high-volume trading operations. Please reach out to [dexapi@okx.com](mailto:dexapi@okx.com) to request access.

### Other Common Operations

#### Get Available Tokens
```typescript
// Get all supported tokens for a chain
const tokens = await client.dex.getTokens('8453'); // Base Chain
console.log(`Supported tokens: ${tokens.data.length}`);
```

#### Check Liquidity Sources
```typescript
// Get available DEX liquidity sources
const liquidity = await client.dex.getLiquidity('8453');
console.log('Available DEXs:', liquidity.data.map(dex => dex.name));
```

#### Get Chain Information
```typescript
// Get chain configuration and router addresses
const chainInfo = await client.dex.getChainData('8453');
console.log(`Router address: ${chainInfo.data[0].dexTokenApproveAddress}`);
```

#### Raw Swap Data (for custom implementations)
```typescript
// Get raw swap transaction data without execution
const swapData = await client.dex.getSwapData({
    chainId: '8453',
    fromTokenAddress: BASE_TOKENS.ETH,
    toTokenAddress: BASE_TOKENS.USDC,
    amount: '1000000000000000000',
    slippage: '0.005',
    userWalletAddress: walletAddress
});

// Use swapData.data[0].tx for custom transaction handling
```

## Error Handling

The SDK includes comprehensive error handling with detailed error codes:

```typescript
try {
    const swap = await client.dex.executeSwap({
        chainId: '8453',
        fromTokenAddress: BASE_TOKENS.ETH,
        toTokenAddress: BASE_TOKENS.USDC,
        amount: '1000000000000000000',
        slippage: '0.005',
        userWalletAddress: walletAddress
    });
} catch (error: any) {
    // Handle specific error cases
    if (error?.status === 429) {
        console.log('Rate limited, please try again later');
    } else if (error.message?.includes('Insufficient liquidity')) {
        console.log('Not enough liquidity for this trade');
    } else if (error.message?.includes('Insufficient balance')) {
        console.log('Wallet balance too low');
    } else if (error.message?.includes('Slippage too high')) {
        console.log('Price impact exceeds slippage tolerance');
    } else {
        console.error('Swap failed:', error.message);
        
        // Log additional error details for debugging
        if (error.details) {
            console.error('Error details:', error.details);
        }
    }
}
```

### Common Error Scenarios

| Error Type | Description | Solution |
|------------|-------------|----------|
| `Insufficient liquidity` | Not enough liquidity for the requested trade size | Reduce trade amount or try different route |
| `Insufficient balance` | Wallet doesn't have enough tokens | Check wallet balance and fund if needed |
| `Slippage too high` | Price moved beyond acceptable range | Increase slippage tolerance or reduce trade size |
| `Rate limited (429)` | Too many API requests | Implement exponential backoff retry logic |
| `Invalid token address` | Token not supported on this chain | Verify token address for the specific chain |
| `Network error` | RPC or network connectivity issues | Check network connection and RPC endpoint |

## Examples and Testing

### Running Examples

The SDK includes comprehensive examples for all supported chains:

```bash
# EVM examples (Base, Ethereum, Polygon, etc.)
npm run example:evm-quote          # Get price quotes
npm run example:evm-swap           # Execute swaps
npm run example:evm-approve        # Token approvals
npm run example:evm-broadcast      # Enterprise broadcasting

# Solana examples
npm run example:solana-quote       # Get SOL quotes
npm run example:solana-swap        # Execute SOL swaps

# Sui examples  
npm run example:sui-quote          # Get SUI quotes
npm run example:sui-swap           # Execute SUI swaps
npm run example:sui-broadcast      # Sui broadcasting

# TON and TRON examples
npm run example:ton-quote          # TON quotes
npm run example:tron-quote         # TRON quotes
```

### Testing

```bash
# Run all tests
npm test

# Run chain-specific tests
npm test -- --testPathPattern=evm
npm test -- --testPathPattern=solana
npm test -- --testPathPattern=sui

# Run with coverage
npm run test:coverage
```

### Advanced API Features

Developers with access to the Onchain Gateway API get additional capabilities:

- **MEV Protection** - Front-running and sandwich attack protection
- **Priority Transaction Broadcasting** - Faster transaction confirmation through OKX infrastructure
- **Advanced Analytics** - Detailed transaction monitoring and reporting
- **Enhanced Reliability** - Direct access to OKX's trading infrastructure

> **Access Requirements**: These features require API registration and whitelist approval. Contact [dexapi@okx.com](mailto:dexapi@okx.com) to request access to the Onchain Gateway API.

## License

This SDK is released under the [MIT License](LICENSE.md).

By using this SDK, you agree to the fact that: OKX and its affiliates shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages as outlined in the [Legal Disclaimer](DISCLAIMER.md).