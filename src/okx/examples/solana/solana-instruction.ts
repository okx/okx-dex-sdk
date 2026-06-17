import { OKXDexClient } from '../../index';
import { Connection } from '@solana/web3.js';
import 'dotenv/config';
import { createWallet } from '../../core/wallet';

async function main() {
  if (!process.env.SOLANA_RPC_URL) throw new Error('Missing SOLANA_RPC_URL');
  if (!process.env.SOLANA_PRIVATE_KEY) throw new Error('Missing SOLANA_PRIVATE_KEY');

  const connection = new Connection(process.env.SOLANA_RPC_URL);
  const wallet = createWallet(process.env.SOLANA_PRIVATE_KEY, connection);

  const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    solana: { wallet },
  });

  const chainIndex = '501';
  const fromTokenAddress = '11111111111111111111111111111111'; // SOL
  const toTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // BONK

  const resp = await client.dex.getSolanaSwapInstruction({
    chainIndex,
    fromTokenAddress,
    toTokenAddress,
    amount: '10000000', // 0.01 SOL
    userWalletAddress: wallet.publicKey.toString(),
    slippagePercent: '0.1',
  });

  console.log('swap-instruction response :', resp);
  if (!resp.data) {
    console.error('swap-instruction empty');
    console.error(JSON.stringify(resp, null, 2));
    return;
  }
  const instr = resp.data;
  console.log('routerResult:', instr?.routerResult?.dexRouterList?.[0]?.dexProtocol?.dexName);
  console.log('instruction count:', instr?.instructionLists?.length ?? 0);

  const result = await client.dex.executeSolanaSwapInstructions({
    chainIndex,
    fromTokenAddress,
    toTokenAddress,
    amount: '10000000',
    userWalletAddress: wallet.publicKey.toString(),
    slippagePercent: '0.01',
  });

  console.log('Tx Result:', result);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
