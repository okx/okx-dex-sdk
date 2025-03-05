# OKX DEX SDK

[![npm version](https://img.shields.io/npm/v/@okx-dex/okx-dex-sdk.svg)](https://www.npmjs.com/package/@okx-dex/okx-dex-sdk)

A TypeScript SDK for interacting with OKX DEX across multiple chains (EVM, Solana, Sui).

## Features
- Execute token swaps on Solana
- Get real-time quotes and liquidity info
- Built-in retry mechanism and error handling
- Full TypeScript support
- Solana transaction handling and signing

## Installation

```bash
npm install @okx-dex/okx-dex-sdk
# or
yarn add @okx-dex/okx-dex-sdk
# or
pnpm add @okx-dex/okx-dex-sdk
```

## Configuration

First, set up your environment variables in a `.env` file:

```bash
# OKX API Credentials
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret_key
OKX_API_PASSPHRASE=your_passphrase
OKX_PROJECT_ID=your_project_id

# EVM Configuration
EVM_RPC_URL=your_evm_rpc_url
EVM_WALLET_ADDRESS=your_evm_wallet_address
EVM_PRIVATE_KEY=your_evm_private_key

# Solana Configuration
SOLANA_RPC_URL=your_solana_rpc_url
SOLANA_WALLET_ADDRESS=your_solana_wallet_address
SOLANA_PRIVATE_KEY=your_solana_private_key

# Sui Configuration
SUI_RPC_URL=your_sui_rpc_url
SUI_WALLET_ADDRESS=your_sui_wallet_address
SUI_PRIVATE_KEY=your_sui_private_key
```

## Usage

### Chain-Specific Examples

<details>
<summary><b>EVM</b></summary>

#### Initialize EVM Client
```typescript
import { OKXDexClient } from '@okx-dex/okx-dex-sdk';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    evm: {
        connection: {
            rpcUrl: process.env.EVM_RPC_URL!,
        },
        walletAddress: process.env.EVM_WALLET_ADDRESS!,
        privateKey: process.env.EVM_PRIVATE_KEY!,
    }
});
```

#### Common Base Chain Token Addresses
```typescript
const TOKENS = {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006'
};
```

#### Get Quote (USDC → WETH)
```typescript
const quote = await client.dex.getQuote({
    chainId: '8453',  // Base Chain
    fromTokenAddress: TOKENS.USDC,
    toTokenAddress: TOKENS.WETH,
    amount: '1000000',  // 1 USDC
    slippage: '0.5'     // 0.5%
});
```

#### Token Approval
```typescript
const approval = await client.dex.executeApproval({
    chainId: '8453',
    tokenContractAddress: TOKENS.USDC,
    approveAmount: '1000000'
});
```

#### Execute Swap
```typescript
const evmSwap = await client.dex.executeSwap({
    chainId: '8453',
    fromTokenAddress,
    toTokenAddress,
    amount: rawAmount,
    slippage: '0.5',
    userWalletAddress: process.env.EVM_WALLET_ADDRESS
});
```
</details>

<details>
<summary><b>Solana</b></summary>

#### Initialize Solana Client
```typescript
import { OKXDexClient } from '@okx-dex/okx-dex-sdk';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    solana: {
        connection: {
            rpcUrl: process.env.SOLANA_RPC_URL!,
            confirmTransactionInitialTimeout: 60000
        },
        walletAddress: process.env.SOLANA_WALLET_ADDRESS!,
        privateKey: process.env.SOLANA_PRIVATE_KEY!,
    }
});
```

#### Common Solana Token Addresses
```typescript
const TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
};
```

#### Get Quote (SOL → USDC)
```typescript
const quote = await client.dex.getQuote({
    chainId: '501',
    fromTokenAddress: TOKENS.SOL,
    toTokenAddress: TOKENS.USDC,
    amount: '1000000000',  // 1 SOL (in lamports)
    slippage: '0.5'        // 0.5%
});
```

#### Execute Swap
```typescript
const solanaSwap = await client.dex.executeSwap({
    chainId: '501',
    fromTokenAddress,
    toTokenAddress,
    amount: rawAmount,
    slippage: '0.5',
    userWalletAddress: process.env.SOLANA_WALLET_ADDRESS
});
```
</details>

<details>
<summary><b>Sui</b></summary>

#### Initialize Sui Client
```typescript
import { OKXDexClient } from '@okx-dex/okx-dex-sdk';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    sui: {
        connection: {
            rpcUrl: process.env.SUI_RPC_URL!,
        },
        walletAddress: process.env.SUI_WALLET_ADDRESS!,
        privateKey: process.env.SUI_PRIVATE_KEY!,
    }
});
```

#### Common Sui Token Addresses
```typescript
const TOKENS = {
    SUI: '0x2::sui::SUI',
    USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
};
```

#### Get Quote (SUI → USDC)
```typescript
const quote = await client.dex.getQuote({
    chainId: '784',
    fromTokenAddress: TOKENS.SUI,
    toTokenAddress: TOKENS.USDC,
    amount: '1000000000',  // Amount in base units
    slippage: '0.1'        // 0.1%
});
```

#### Execute Swap
```typescript
const suiSwap = await client.dex.executeSwap({
    chainId: '784',
    fromTokenAddress,
    toTokenAddress,
    amount: rawAmount,
    slippage: '0.5',
    userWalletAddress: process.env.SUI_WALLET_ADDRESS
});
```
</details>

## Common Operations

### Check Liquidity
```typescript
const liquidity = await client.dex.getLiquidity(chainId);
```

### Get Dex Router Address
```typescript
const chainInfo = await client.dex.getChainData(chainId);
```

## Error Handling

The SDK includes comprehensive error handling:

```typescript
try {
    const quote = await client.dex.getQuote({...});
} catch (error: any) {
    if (error?.status === 429) {
        console.log('Rate limited, please try again later');
    } else if (error.message?.includes('Insufficient liquidity')) {
        console.log('Not enough liquidity for this trade');
    } else {
        console.error('Error:', error.message);
    }
}
```

## Testing

Run tests for specific chains:

```bash
# Run all tests
pnpm test

# Run chain-specific tests
pnpm test __tests__/evm-examples.test.ts
pnpm test __tests__/solana-examples.test.ts
pnpm test __tests__/sui-examples.test.ts
```

## License

This SDK is released under the [MIT License](LICENSE.md).

By using this SDK, you agree to the fact that: OKX and its affiliates shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages as outlined in the [Legal Disclaimer](DISCLAIMER.md).