# OKX DEX SDK

TypeScript SDK for the OKX DEX API, currently supporting Solana network DEX operations. This SDK provides easy integration for getting quotes, executing swaps, and managing liquidity on Solana, with built-in authentication, retries, and error handling.

## Features
- Execute token swaps on Solana
- Get real-time quotes and liquidity info
- Built-in retry mechanism and error handling
- Full TypeScript support
- Solana transaction handling and signing

## Setup

1. Clone and install:
```bash
git clone https://github.com/julian-dev28/okx-dex-sdk.git
cd okx-dex-sdk
npm install
```

2. Get your API credentials from [OKX Developer Portal](https://www.okx.com/web3/build/docs/waas/introduction-to-developer-portal-interface)

3. Create `.env`:
```env
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret_key
OKX_API_PASSPHRASE=your_passphrase
OKX_PROJECT_ID=your_project_id

# Required for Solana swaps
SOLANA_RPC_URL=your_solana_rpc_url
SOLANA_PRIVATE_KEY=your_base58_private_key
```

## Usage Examples

### Initialize Client
```typescript
import { OKXDexClient } from '../index';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    // Required for executing swaps
    solana: {
        connection: {
            rpcUrl: process.env.SOLANA_RPC_URL!,
            confirmTransactionInitialTimeout: 60000
        },
        privateKey: process.env.SOLANA_PRIVATE_KEY!
    }
});
```

### Get Quote (SOL → USDC)
```typescript
const quote = await client.dex.getQuote({
    chainId: '501',
    fromTokenAddress: 'So11111111111111111111111111111111111111112',  // SOL
    toTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC
    amount: '1000000000',  // 1 SOL (in lamports)
    slippage: '0.001'      // 0.1%
});
```

### Execute Swap
```typescript
const swapResult = await client.dex.executeSwap({
    chainId: '501',
    fromTokenAddress: 'So11111111111111111111111111111111111111112',
    toTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: '1000000000',
    autoSlippage: true,
    maxAutoSlippageBps: '100'  // 1% max auto slippage
});
```

## Common Solana Token Addresses
```typescript
const TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',   // Wrapped SOL
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
};
```

## API Reference

### Available Methods
```typescript
// Get supported chains
const chains = await client.dex.getSupportedChains();

// Get Solana tokens
const tokens = await client.dex.getTokens('501');

// Get liquidity sources
const liquidity = await client.dex.getLiquidity('501');

// Get swap quote
const quote = await client.dex.getQuote({...});

// Get swap data (transaction details)
const swapData = await client.dex.getSwapData({...});

// Execute swap
const swapResult = await client.dex.executeSwap({...});
```

## Error Handling
The SDK includes built-in retries for transient errors:

```typescript
try {
    const result = await client.dex.getSwapData(params);
} catch (error) {
    if (error instanceof Error) {
        console.error('Error message:', error.message);
        // API errors include details in the message
        if (error.message.includes('API Error:')) {
            const match = error.message.match(/API Error: (.*)/);
            if (match) console.error('API Error Details:', match[1]);
        }
    }
}
```

## Important Notes
- Amount values should be in lamports (1 SOL = 1e9 lamports)
- Private key must be in base58 format
- Use a reliable RPC URL for best performance
- Default compute units for transactions is 300,000 (configurable)
- Default retry count is 3 (configurable)

## Useful Links
- [OKX DEX API Docs](https://www.okx.com/web3/build/docs/waas/dex-api-reference)
- [Developer Portal](https://www.okx.com/web3/build/docs/waas/introduction-to-developer-portal-interface)