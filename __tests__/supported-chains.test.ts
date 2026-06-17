// __tests__/supported-chains.test.ts
import { OKXDexClient } from '../src/okx/index';
import dotenv from 'dotenv';

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

describe('OKXDexClient Chain Support', () => {
  let client: OKXDexClient;

  beforeAll(() => {
    if (!process.env.OKX_API_KEY) {
      throw new Error('OKX_API_KEY environment variable is required');
    }
    if (!process.env.OKX_SECRET_KEY) {
      throw new Error('OKX_SECRET_KEY environment variable is required');
    }
    if (!process.env.OKX_API_PASSPHRASE) {
      throw new Error('OKX_API_PASSPHRASE environment variable is required');
    }
    if (!process.env.OKX_PROJECT_ID) {
      throw new Error('OKX_PROJECT_ID environment variable is required');
    }

    client = new OKXDexClient({
      apiKey: process.env.OKX_API_KEY,
      secretKey: process.env.OKX_SECRET_KEY,
      apiPassphrase: process.env.OKX_API_PASSPHRASE,
      projectId: process.env.OKX_PROJECT_ID
    });
  });

  // Add longer delay between tests to avoid rate limiting
  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  const chainTestCases = [
    { name: 'EVM', chainIndex: '1' },
    { name: 'Solana', chainIndex: '501' },
    { name: 'Sui', chainIndex: '784' },
    { name: 'TON', chainIndex: '607' },
    { name: 'Tron', chainIndex: '195' }
  ];

  describe('getChainData', () => {
    chainTestCases.forEach(({ name, chainIndex }) => {
      it(`should fetch supported chains for ${name}`, async () => {
        const chains = await withRetry(() => client.dex.getChainData(chainIndex));
        
        expect(chains).toBeDefined();
        expect(chains.data).toBeDefined();
        
        // Common properties that should exist in the response
        expect(Array.isArray(chains.data)).toBeTruthy();
        chains.data.forEach(chain => {
          expect(chain).toHaveProperty('chainId');
          expect(chain).toHaveProperty('chainName');
          expect(chain).toHaveProperty('dexTokenApproveAddress');
        });
      });
    });

    it('should handle invalid chain ID', async () => {
      await expect(client.dex.getChainData('999999')).rejects.toThrow();
    });
  });

  describe('Client Configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(client).toHaveProperty('dex');
      expect(client.dex).toBeDefined();
    });
  });
});

// __tests__/chain-specific.test.ts

describe('Chain-Specific Features', () => {
  let client: OKXDexClient;

  beforeAll(() => {
    client = new OKXDexClient({
      apiKey: process.env.OKX_API_KEY || 'test-api-key',
      secretKey: process.env.OKX_SECRET_KEY || 'test-secret-key',
      apiPassphrase: process.env.OKX_API_PASSPHRASE || 'test-passphrase',
      projectId: process.env.OKX_PROJECT_ID || 'test-project-id'
    });
  });

  describe('EVM Chain Tests', () => {
    it('should handle EVM-specific chain data', async () => {
      const chains = await client.dex.getChainData('1');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('Solana Chain Tests', () => {
    it('should handle Solana-specific chain data', async () => {
      const chains = await client.dex.getChainData('501');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('Sui Chain Tests', () => {
    it('should handle Sui-specific chain data', async () => {
      const chains = await client.dex.getChainData('784');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('TON Chain Tests', () => {
    it('should handle TON-specific chain data', async () => {
      const chains = await client.dex.getChainData('607');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('Tron Chain Tests', () => {
    it('should handle Tron-specific chain data', async () => {
      const chains = await client.dex.getChainData('195');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });
});

// __tests__/setup.ts

// Setup global test environment
beforeAll(() => {
  dotenv.config();
});

// Mock implementation for environment variables if needed
process.env = {
  ...process.env,
  OKX_API_KEY: process.env.OKX_API_KEY || 'test-api-key',
  OKX_SECRET_KEY: process.env.OKX_SECRET_KEY || 'test-secret-key',
  OKX_API_PASSPHRASE: process.env.OKX_API_PASSPHRASE || 'test-passphrase',
  OKX_PROJECT_ID: process.env.OKX_PROJECT_ID || 'test-project-id'
};