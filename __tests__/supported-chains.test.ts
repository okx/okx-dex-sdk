// __tests__/supported-chains.test.ts
import { OKXDexClient } from '../src/okx/index';
import dotenv from 'dotenv';

dotenv.config();

describe('OKXDexClient Chain Support', () => {
  let client: OKXDexClient;

  beforeAll(() => {
    client = new OKXDexClient({
      apiKey: process.env.OKX_API_KEY || 'test-api-key',
      secretKey: process.env.OKX_SECRET_KEY || 'test-secret-key',
      apiPassphrase: process.env.OKX_API_PASSPHRASE || 'test-passphrase',
      projectId: process.env.OKX_PROJECT_ID || 'test-project-id'
    });
  });

  const chainTestCases = [
    { name: 'EVM', chainId: '1' },
    { name: 'Solana', chainId: '501' },
    { name: 'Sui', chainId: '784' },
    { name: 'TON', chainId: '607' },
    { name: 'Tron', chainId: '195' }
  ];

  describe('getSupportedChains', () => {
    chainTestCases.forEach(({ name, chainId }) => {
      it(`should fetch supported chains for ${name}`, async () => {
        const chains = await client.dex.getSupportedChains(chainId);
        
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
      await expect(client.dex.getSupportedChains('999999')).rejects.toThrow();
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
      const chains = await client.dex.getSupportedChains('1');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('Solana Chain Tests', () => {
    it('should handle Solana-specific chain data', async () => {
      const chains = await client.dex.getSupportedChains('501');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('Sui Chain Tests', () => {
    it('should handle Sui-specific chain data', async () => {
      const chains = await client.dex.getSupportedChains('784');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('TON Chain Tests', () => {
    it('should handle TON-specific chain data', async () => {
      const chains = await client.dex.getSupportedChains('607');
      expect(chains).toBeDefined();
      expect(chains.data).toBeDefined();
      expect(chains.data.length).toBeGreaterThan(0);
    });
  });

  describe('Tron Chain Tests', () => {
    it('should handle Tron-specific chain data', async () => {
      const chains = await client.dex.getSupportedChains('195');
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