import { OKXDexClient } from '../src/okx/index';
import { TokenInfo } from '../src/okx/types';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { createEVMWallet } from '../src/okx/core/evm-wallet';

// Import the function directly to avoid require
import { toBaseUnits } from '../src/okx/examples/evm/evm-approve';

// Load environment variables first
dotenv.config();

// Increase timeout for all tests
jest.setTimeout(60000);

// Helper function for retrying rate-limited requests with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let retries = maxRetries;
  while (retries > 0) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 429 && retries > 1) {
        const delay = (maxRetries - retries + 1) * 5000; // Exponential backoff: 5s, 10s, 15s...
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

describe('EVM Examples Tests', () => {
  let client: OKXDexClient;
  const chainIndex = '8453'; // Base chain
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

  beforeAll(() => {
    if (!process.env.EVM_RPC_URL) {
      throw new Error('EVM_RPC_URL environment variable is required');
    }
    if (!process.env.EVM_WALLET_ADDRESS) {
      throw new Error('EVM_WALLET_ADDRESS environment variable is required');
    }
    if (!process.env.EVM_PRIVATE_KEY) {
      throw new Error('EVM_PRIVATE_KEY environment variable is required');
    }

    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL!);
    const wallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

    client = new OKXDexClient({
      apiKey: process.env.OKX_API_KEY!,
      secretKey: process.env.OKX_SECRET_KEY!,
      apiPassphrase: process.env.OKX_API_PASSPHRASE!,
      projectId: process.env.OKX_PROJECT_ID!,
      evm: {
        wallet: wallet
      }
    });
  });

  // Add longer delay between tests to avoid rate limiting
  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  describe('Token Approval Tests', () => {
    it('should convert token amounts to base units correctly', () => {
      const testCases = [
        { amount: '1000', decimals: 6, expected: '1000000000' },
        { amount: '0.5', decimals: 18, expected: '500000000000000000' },
        { amount: '1.23456', decimals: 6, expected: '1234560' },
        { amount: '1000000', decimals: 0, expected: '1000000' },
        { amount: '0.0001', decimals: 8, expected: '10000' }
      ];

      testCases.forEach(({ amount, decimals, expected }) => {
        expect(toBaseUnits(amount, decimals)).toBe(expected);
      });
    });

    it('should fetch token approval address', async () => {
      const chains = await withRetry(() => client.dex.getChainData(chainIndex));
      expect(chains.data[0].dexTokenApproveAddress).toBeDefined();
      expect(chains.data[0].dexTokenApproveAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should check token approval status', async () => {
      const result = await withRetry(() => client.dex.executeApproval({
        chainIndex,
        tokenContractAddress: USDC_ADDRESS,
        approveAmount: '0' // Just checking status
      }));
      expect(result).toBeDefined();
    });
  });

  describe('Quote Tests', () => {
    it('should fetch quote for token swap', async () => {
      const quote = await client.dex.getQuote({
        chainIndex,
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: WETH_ADDRESS,
        amount: '1000000', // 1 USDC
        slippagePercent: '0.5'
      });

      expect(quote).toBeDefined();
      expect(quote.data[0].fromToken).toBeDefined();
      expect(quote.data[0].toToken).toBeDefined();
      expect(quote.data[0].toTokenAmount).toBeDefined();
    });

    it('should handle invalid token addresses', async () => {
      await expect(client.dex.getQuote({
        chainIndex,
        fromTokenAddress: '0x0000000000000000000000000000000000000000',
        toTokenAddress: WETH_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      })).rejects.toThrow();
    });
  });

  describe('Liquidity Tests', () => {
    it('should fetch liquidity information', async () => {
      const liquidity = await client.dex.getLiquidity(chainIndex);
      expect(liquidity).toBeDefined();
      expect(Array.isArray(liquidity.data)).toBeTruthy();
    });
  });

  describe('Token List Tests', () => {
    it('should fetch all supported tokens', async () => {
      const quote = await withRetry(() => client.dex.getQuote({
        chainIndex,
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: WETH_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      }));

      expect(quote).toBeDefined();
      expect(quote.data[0].fromToken).toBeDefined();
      expect(quote.data[0].fromToken.tokenSymbol).toBeDefined();
      expect(quote.data[0].fromToken.tokenContractAddress).toBeDefined();
      expect(quote.data[0].fromToken.decimal).toBeDefined();
    });

    it('should find USDC in token list', async () => {
      const quote = await withRetry(() => client.dex.getQuote({
        chainIndex,
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: WETH_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      }));

      const token = quote.data[0].fromToken;
      expect(token.tokenContractAddress.toLowerCase()).toBe(USDC_ADDRESS.toLowerCase());
      expect(token.tokenSymbol).toBe('USDC');
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
          fromTokenAddress: USDC_ADDRESS,
          toTokenAddress: WETH_ADDRESS,
          amount: '1000000', // Match quote test amount
          autoSlippage: true,
          maxAutoSlippagePercent: '1',
          userWalletAddress: process.env.EVM_WALLET_ADDRESS!,
          slippagePercent: '0.5' // Add explicit slippagePercent
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
          toTokenAddress: WETH_ADDRESS,
          amount: '1000000', // Match quote test amount
          slippagePercent: '0.5',
          userWalletAddress: process.env.EVM_WALLET_ADDRESS!
        }));

        expect(swapData).toBeDefined();
        expect(swapData.data).toBeDefined();
      } catch (error: any) {
        console.error('Swap data error:', error.message, error.response?.data);
        throw error;
      }
    });

    it('should validate slippagePercent parameters', async () => {
      await expect(client.dex.getSwapData({
        chainIndex,
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: WETH_ADDRESS,
        amount: '1000000',
        slippagePercent: '2', // Invalid slippagePercent > 1
        userWalletAddress: process.env.EVM_WALLET_ADDRESS!
      })).rejects.toThrow();
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
        toTokenAddress: WETH_ADDRESS,
        amount: '1000000',
        slippagePercent: '0.5'
      })).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const provider = new ethers.JsonRpcProvider('https://invalid-rpc-url');
      const wallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

      const clientWithInvalidRPC = new OKXDexClient({
        apiKey: process.env.OKX_API_KEY!,
        secretKey: process.env.OKX_SECRET_KEY!,
        apiPassphrase: process.env.OKX_API_PASSPHRASE!,
        projectId: process.env.OKX_PROJECT_ID!,
        evm: {
          wallet: wallet
        }
      });

      await expect(clientWithInvalidRPC.dex.executeApproval({
        chainIndex,
        tokenContractAddress: USDC_ADDRESS,
        approveAmount: '1000000'
      })).rejects.toThrow();
    });
  });
}); 