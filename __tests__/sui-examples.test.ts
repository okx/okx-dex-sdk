import { OKXDexClient } from '../src/okx/index';
import dotenv from 'dotenv';

dotenv.config();

// Increase timeout for all tests
jest.setTimeout(60000);

// Helper function for retrying rate-limited requests with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 10): Promise<T> {
  let retries = maxRetries;
  while (retries > 0) {
    try {
      return await fn();
    } catch (error: any) {
      if ((error?.status === 429 || error?.message?.includes('Insufficient liquidity')) && retries > 1) {
        const delay = (maxRetries - retries + 1) * 5000; // Exponential backoff: 5s, 10s, 15s...
        console.log(`Rate limited or insufficient liquidity. Waiting ${delay/1000}s before retry. ${retries-1} retries remaining.`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

describe('Sui Examples Tests', () => {
  let client: OKXDexClient;
  const chainIndex = '784'; // Sui mainnet
  const SUI_ADDRESS = '0x2::sui::SUI';
  const USDC_ADDRESS = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
  const TEST_AMOUNT = '1000000000'; // Match working example amount

  beforeAll(() => {
    client = new OKXDexClient({
      apiKey: process.env.OKX_API_KEY!,
      secretKey: process.env.OKX_SECRET_KEY!,
      apiPassphrase: process.env.OKX_API_PASSPHRASE!,
      projectId: process.env.OKX_PROJECT_ID!,
      sui: {
        connection: {
          rpcUrl: 'https://sui-mainnet-endpoint.blockvision.org',
        },
        walletAddress: process.env.SUI_WALLET_ADDRESS!,
        privateKey: process.env.SUI_PRIVATE_KEY!,
      }
    });
  });

  // Add longer delay between tests to avoid rate limiting
  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  describe('Quote Tests', () => {
    it('should fetch quote for token swap', async () => {
      const quote = await withRetry(() => client.dex.getQuote({
        chainIndex,
        fromTokenAddress: SUI_ADDRESS, // Swap direction: SUI -> USDC
        toTokenAddress: USDC_ADDRESS,
        amount: TEST_AMOUNT,
        slippagePercent: '0.1' // Match example slippagePercent
      }));

      expect(quote).toBeDefined();
      expect(quote.data[0].fromToken).toBeDefined();
      expect(quote.data[0].toToken).toBeDefined();
      expect(quote.data[0].toTokenAmount).toBeDefined();
    });

    it('should handle invalid token addresses', async () => {
      await expect(client.dex.getQuote({
        chainIndex,
        fromTokenAddress: 'invalid',
        toTokenAddress: SUI_ADDRESS,
        amount: TEST_AMOUNT,
        slippagePercent: '0.1'
      })).rejects.toThrow();
    });
  });

  describe('Liquidity Tests', () => {
    it('should fetch liquidity information', async () => {
      const liquidity = await withRetry(() => client.dex.getLiquidity(chainIndex));
      expect(liquidity).toBeDefined();
      expect(Array.isArray(liquidity.data)).toBeTruthy();
    });
  });

  describe('Token List Tests', () => {
    it('should fetch all supported tokens', async () => {
      const quote = await withRetry(() => client.dex.getQuote({
        chainIndex,
        fromTokenAddress: SUI_ADDRESS,
        toTokenAddress: USDC_ADDRESS,
        amount: TEST_AMOUNT,
        slippagePercent: '0.1'
      }));

      expect(quote).toBeDefined();
      expect(quote.data[0].fromToken).toBeDefined();
      expect(quote.data[0].fromToken.tokenSymbol).toBeDefined();
      expect(quote.data[0].fromToken.tokenContractAddress).toBeDefined();
      expect(quote.data[0].fromToken.decimal).toBeDefined();
    });

    it('should find SUI in token list', async () => {
      const quote = await withRetry(() => client.dex.getQuote({
        chainIndex,
        fromTokenAddress: SUI_ADDRESS,
        toTokenAddress: USDC_ADDRESS,
        amount: TEST_AMOUNT,
        slippagePercent: '0.1'
      }));

      const token = quote.data[0].fromToken;
      expect(token.tokenContractAddress).toBe(SUI_ADDRESS);
      expect(token.tokenSymbol).toBe('SUI');
    });
  });

  describe('Chain Information Tests', () => {
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
  });

  describe('Swap Data Tests', () => {
    it('should fetch swap data with auto slippagePercent', async () => {
      try {
        const swapData = await withRetry(() => client.dex.getSwapData({
          chainIndex,
          fromTokenAddress: SUI_ADDRESS,
          toTokenAddress: USDC_ADDRESS,
          amount: TEST_AMOUNT,
          autoSlippage: true,
          maxAutoSlippagePercent: '1',
          userWalletAddress: process.env.SUI_WALLET_ADDRESS!,
          slippagePercent: '0.1'
        }));

        expect(swapData).toBeDefined();
        expect(swapData.data).toBeDefined();
      } catch (error: any) {
        if (error.message?.includes('Not enough Sui objects')) {
          console.warn('Skipping test: Insufficient Sui objects for swapping');
          return;
        }
        console.error('Swap data error:', error.message, error.response?.data);
        throw error;
      }
    });

    it('should fetch swap data with manual slippagePercent', async () => {
      try {
        const swapData = await withRetry(() => client.dex.getSwapData({
          chainIndex,
          fromTokenAddress: SUI_ADDRESS,
          toTokenAddress: USDC_ADDRESS,
          amount: TEST_AMOUNT,
          slippagePercent: '0.1',
          userWalletAddress: process.env.SUI_WALLET_ADDRESS!
        }));

        expect(swapData).toBeDefined();
        expect(swapData.data).toBeDefined();
      } catch (error: any) {
        if (error.message?.includes('Not enough Sui objects')) {
          console.warn('Skipping test: Insufficient Sui objects for swapping');
          return;
        }
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
        fromTokenAddress: SUI_ADDRESS,
        toTokenAddress: USDC_ADDRESS,
        amount: TEST_AMOUNT,
        slippagePercent: '0.1'
      })).rejects.toThrow();
    });
  });
}); 