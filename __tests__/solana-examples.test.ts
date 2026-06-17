import { OKXDexClient } from '../src/okx/index';
import dotenv from 'dotenv';
import { Connection } from '@solana/web3.js';
import { createWallet } from '../src/okx/core/wallet';

// Load environment variables first
dotenv.config();

// Increase timeout but not too much
jest.setTimeout(30000);

// Helper function for retrying rate-limited requests with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = maxRetries;
  while (retries > 0) {
    try {
      return await fn();
    } catch (error: any) {
      if ((error?.status === 429 || error?.message?.includes('Insufficient liquidity')) && retries > 1) {
        const delay = Math.min((maxRetries - retries + 1) * 1000, 3000); // Cap at 3s
        console.log(`Rate limited. Waiting ${delay/1000}s before retry. ${retries-1} retries remaining.`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

describe('Solana Examples Tests', () => {
  let client: OKXDexClient;
  let connection: Connection;
  let wallet: ReturnType<typeof createWallet>;
  const chainIndex = '501'; // Solana mainnet
  const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';

  beforeAll(() => {
    if (!process.env.SOLANA_RPC_URL) {
      throw new Error('SOLANA_RPC_URL environment variable is required');
    }
    if (!process.env.SOLANA_PRIVATE_KEY) {
      throw new Error('SOLANA_PRIVATE_KEY environment variable is required');
    }

    connection = new Connection(process.env.SOLANA_RPC_URL);
    wallet = createWallet(process.env.SOLANA_PRIVATE_KEY, connection);

    client = new OKXDexClient({
      apiKey: process.env.OKX_API_KEY!,
      secretKey: process.env.OKX_SECRET_KEY!,
      apiPassphrase: process.env.OKX_API_PASSPHRASE!,
      projectId: process.env.OKX_PROJECT_ID!,
      solana: {
        wallet: wallet
      }
    });
  });

  // Reduce delay between tests
  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  // Group similar tests to run in parallel
  describe('Basic API Tests', () => {
    it('should fetch chain configuration', async () => {
      const chains = await withRetry(() => client.dex.getChainData(chainIndex));
      expect(chains.data[0].chainId.toString()).toBe(chainIndex);
      expect(chains.data[0].chainName).toBeDefined();
    });

    it('should validate chain configuration', () => {
      const networkConfig = client['config'].networks?.[chainIndex];
      expect(networkConfig).toBeDefined();
      expect(networkConfig?.id).toBe(chainIndex);
      expect(networkConfig?.explorer).toBeDefined();
      expect(networkConfig?.defaultSlippage).toBeDefined();
    });

    it('should fetch liquidity information', async () => {
      const liquidity = await withRetry(() => client.dex.getLiquidity(chainIndex));
      expect(liquidity).toBeDefined();
      expect(Array.isArray(liquidity.data)).toBeTruthy();
    });
  });

  describe('Quote Tests', () => {
    let quoteResponse: any;

    // Use beforeAll to cache quote response for multiple tests
    beforeAll(async () => {
      quoteResponse = await withRetry(() => client.dex.getQuote({
        chainIndex,
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: SOL_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      }));
    });

    it('should fetch quote for token swap', () => {
      expect(quoteResponse).toBeDefined();
      expect(quoteResponse.data[0].fromToken).toBeDefined();
      expect(quoteResponse.data[0].toToken).toBeDefined();
      expect(quoteResponse.data[0].toTokenAmount).toBeDefined();
    });

    it('should find USDC in token list', () => {
      const token = quoteResponse.data[0].fromToken;
      expect(token.tokenContractAddress).toBe(USDC_ADDRESS);
      expect(token.tokenSymbol).toBe('USDC');
    });

    it('should handle invalid token addresses', async () => {
      await expect(client.dex.getQuote({
        chainIndex,
        fromTokenAddress: 'invalid',
        toTokenAddress: SOL_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      })).rejects.toThrow();
    });
  });

  describe('Token List Tests', () => {
    it('should fetch all supported tokens', async () => {
      const quote = await withRetry(() => client.dex.getQuote({
        chainIndex,
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: SOL_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      }));

      expect(quote).toBeDefined();
      expect(quote.data[0].fromToken).toBeDefined();
      expect(quote.data[0].fromToken.tokenSymbol).toBeDefined();
      expect(quote.data[0].fromToken.tokenContractAddress).toBeDefined();
      expect(quote.data[0].fromToken.decimal).toBeDefined();
    });
  });

  describe('Swap Data Tests', () => {
    it('should fetch swap data with auto slippagePercent', async () => {
      try {
        const swapData = await withRetry(() => client.dex.getSwapData({
          chainIndex,
          fromTokenAddress: USDC_ADDRESS,
          toTokenAddress: SOL_ADDRESS,
          amount: '1000000',
          autoSlippage: true,
          maxAutoSlippagePercent: '1',
          userWalletAddress: process.env.SOLANA_WALLET_ADDRESS!,
          slippagePercent: '0.5'
        }));

        expect(swapData).toBeDefined();
        expect(swapData.data).toBeDefined();
      } catch (error: any) {
        console.error('Swap data error:', error.message, error.response?.data);
        throw error;
      }
    });

    it('should fetch swap data with manual slippagePercent', async () => {
      try {
        const swapData = await withRetry(() => client.dex.getSwapData({
          chainIndex,
          fromTokenAddress: USDC_ADDRESS,
          toTokenAddress: SOL_ADDRESS,
          amount: '1000000',
          slippagePercent: '0.5',
          userWalletAddress: process.env.SOLANA_WALLET_ADDRESS!
        }));

        expect(swapData).toBeDefined();
        expect(swapData.data).toBeDefined();
      } catch (error: any) {
        console.error('Swap data error:', error.message, error.response?.data);
        throw error;
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid chain ID', async () => {
      await expect(client.dex.getChainData('999999')).rejects.toThrow();
    });

    it('should handle invalid API credentials', async () => {
      const invalidClient = new OKXDexClient({
        apiKey: 'invalid',
        secretKey: 'invalid',
        apiPassphrase: 'invalid',
        projectId: 'invalid'
      });

      await expect(invalidClient.dex.getQuote({
        chainIndex,
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: SOL_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      })).rejects.toThrow();
    });
  });
}); 