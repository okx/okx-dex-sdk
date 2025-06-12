// scripts/evm-simulation.ts
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

export function getHeaders(timestamp: string, method: string, requestPath: string, queryString = "", requestBody = "") {
    const apiKey = process.env.OKX_API_KEY;
    const secretKey = process.env.OKX_SECRET_KEY;
    const apiPassphrase = process.env.OKX_API_PASSPHRASE;
    const projectId = process.env.OKX_PROJECT_ID;

    if (!apiKey || !secretKey || !apiPassphrase) {
        throw new Error("Missing required environment variables");
    }

    const stringToSign = timestamp + method + requestPath + queryString;
    return {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": CryptoJS.enc.Base64.stringify(
            CryptoJS.HmacSHA256(stringToSign, secretKey)
        ),
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": apiPassphrase,
    };
}

interface SimulationRequest {
  fromAddress: string;
  toAddress: string;
  chainIndex: string;
  txAmount: string;
  extJson: {
    inputData: string;
  };
  gasPrice?: string;
  priorityFee?: string;
  includeDebug?: boolean;
}

async function main() {
  try {
    // Example request parameters
    const params: SimulationRequest = {
      fromAddress: "27tEZNjf3GbHisbkzpW75UR1QPjfXjRPoUQxVysogErk",
      toAddress: "6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma",
      chainIndex: "501", // Solana
      txAmount: "10000000",
      extJson: {
        inputData: "3N3k28gmMcvtJNPpLPWz4SKuaLxWproF88FnkhpCcYWtf8kQU7eekYtVt2jcfuMVJqUMoJdefLr5FR2eyBokpmo6Kqu6hVV7YqysiY19nTKdk9GB3r2jkwZcPXR7aD6fyfWVhcQ9dm2VCD5gDMXQHwFNheLwUJ33sFqmGBtDseF2Rk4Z1xXnMastTc4ECZVUT5jpzgF78Wu4Q19QCGVRVfeeJCUXaaptrSCUuzRw6t25qMnJRyWykbSDXz5XsSefzRZ1eTfkBjLBEp4ndGXDApfJEA7ry3EKo3ydz7qe1CS5pQnyJKCgjRehSeGXVy3cBxZQW49eUkWcatvhvC7hGGt6YXG2MyZ8dcPwtaUFazpPDbWGMZ479yDu54h6WiNKZRznYuuzfu1pyMqAFeRQCBdkZedJS7eJXiXQseBuY2upLNkP1kCfWuRR7kpTQvpHL61jaLxA9QtWCsRJEQV8T4KXH4aXYgXLLA1BXZXi7ApVsfzoNhxQj8zvbGmiYUegL6ePL4WT6bFzCMFeZBvyriNbYhfGr7QSrY8PKF4hmD8nNkaob5hKdUzwGDpLyna8XocsoouGVfeFmorT6HygoSGPyztqUZTvEy7Hf4CDgs7zR9Zt7n8G7W4ezHJeeNKzdpnpsbXjnP5mrbWXPfBmsbFnJ2m2UtubVk77eDXwoqLkL7XYExQ1QHHL9vGvvD8roFxhKPBsFJ7voWZFrRhBnYGXaX8DR8bs4NJp1ytJMnj2ZwaM3KHMoKbvNTmypiWn2S5JycCSQYkyJEufMYtH9xB3N9DQsD8AkjjhhRDoeiJkFZ3qaDxqEWTounAZeeCCguVjVrXPRuMwnkrpkxqhuhM3NssRfbtafL6Jxwq7mWwTMgpwhv6ras6ph3n5sMTnxdFF6a9sEPWqbTwPf6tBNQNxuCxAb4TGQyzDU4euAAsM21SnExQsLTdmncBXskfcwEwgsYU1fZ9nr8E8kwKnTUL4LxEJM1nygV7ZUKPQ4hrqvHc8BeK8a25SRDvAndStP6hhfEuLYfwA9CJ2vJ6NK4bViu2BRyDBfXej4CsbXtLnzC45eRU4AG5JaUG3KoSehkgMHJXwBNm2hR5ThR98VFe186ear2EfJCxY4Yrf3f21rJFxTXNy1Nre2dmnyC6B2ZSSdS8"
      },
      gasPrice: "81673000000000",
      includeDebug: true // Enable debug information
    };

    const timestamp = new Date().toISOString();
    const requestPath = "/api/v5/dex/pre-transaction/simulate";
    const requestBody = JSON.stringify(params);
    
    // Use the getHeaders function from shared
    const headers = getHeaders(timestamp, "POST", requestPath, requestBody);

    console.log('Simulating transaction...');
    const response = await fetch(`https://web3.okx.com${requestPath}`, {
      method: "POST",
      headers,
      body: requestBody
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}, ${await response.text()}`);
    }

    const result = await response.json();
    
    console.log('Simulation response:');
    console.log(JSON.stringify(result, null, 2));
    
    // Extract and display important information
    if (result.code === "0" && result.data && result.data.length > 0) {
      const simData = result.data[0];
      
      console.log('\nTransaction Summary:');
      console.log(`Intention: ${simData.intention}`);
      console.log(`Gas Used: ${simData.gasUsed}`);
      
      if (simData.failReason) {
        console.log(`\n❌ Transaction would fail! Reason: ${simData.failReason}`);
      } else {
        console.log('\n✅ Transaction would succeed!');
      }
      
      // console.log('\nAsset Changes:');
      // simData.assetChange.forEach((asset: any) => {
      //   const direction = asset.rawValue.startsWith('-') ? 'SEND' : 'RECEIVE';
      //   const assetSymbol = asset.symbol || 'Unknown';
      //   console.log(`${direction}: ${assetSymbol} (${asset.assetType})`);
      // });
      
      if (simData.risks && simData.risks.length > 0) {
        console.log('\n⚠️ Risks Detected:');
        simData.risks.forEach((risk: any) => {
          console.log(`- ${risk.addressType}: ${risk.address}`);
        });
      }
      
      // Display debug information if available
      if (simData.debug) {
        console.log('\nDebug Trace:');
        console.log(JSON.stringify(simData.debug, null, 2));
      }
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main();