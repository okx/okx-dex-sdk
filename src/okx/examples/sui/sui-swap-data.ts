// example.ts or test.ts
import { OKXDexClient } from '../../index';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!
});

const walletAddress = process.env.SUI_WALLET_ADDRESS!;

async function main() {
    try {
        // Get a quote
        const quote = await client.dex.getSwapData({
            chainIndex: '784',
            fromTokenAddress: '0x2::sui::SUI',
            toTokenAddress: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
            amount: '1000000000',
            slippagePercent: '0.1',
            userWalletAddress: walletAddress,
            autoSlippage: true
        });
        console.log('Swap Quote:', JSON.stringify(quote, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();