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
  txAmount: string;
  chainIndex: string;
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
      txAmount: "1000000",
      chainIndex: "501", // Solana
      extJson: {
        inputData: "WjmYkW1BXPMfiYVEJc5HrQRkVFPzi7FP4FLAGjf5ekoTr63vX8ibzrptKpqVpqmffbovMFZXA59uwPyJ5HxC2cQQJJDh4DucTQKCCkLSnfXqKcjDdaGR7CRo3zQtB7D7iZmF3Qejo6dcmWRvwsGggry12Nneq5DtHZuQh39XzDa7v8YEDjVSwe9txPFAr396LPLG1a4Y8DYbr5CZ4Ky54LMd3g5Rqz2X8vDnULFWpVk3cFiv6CknuUegWN7h9VBJFazYFYfpg4k3PNfNhbLRp3inD6HubrkLB3FzKScdRrKvpr2xxdEUxBgnVvPGxXMgzj3YzX7hHd4P4QJCbDQN7AgQiWmtZFd4upkBHScAeDz9ZtL4Wa3fQYxu95SwqeEZtdFnagDnDpaEeLy7TvazMmDXi7DtXtJxmszgiJmqx3TJrcxUvsfyLyYdfqveASxCz8sN4CpCtkxWcom8ePzq85eJ6VjtsjskLFCr3sWqJSn3p3qanD4x8ejZtoxHU4gdJenaw1nE7VhnXt3Q3ZkgCxgT3AnKRvJS9dcFFXCyGfCCmW89XFfSumoq9vC6JkTExqa4CoTWG7qUnGxdqfbyxPmiwT1TqDDev4xk6eu8DH1TeaK2FCa47A8Go6tHSuviGHm5HFsRkjXxWkJp3P5YkW9yS2xLBdR5zGZPFb74wH5dcsYhXtbdTPZeW4WHfNDAoE8QbcAwqGAq5L8D"
      },
      gasPrice: "84557000000000",
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
      
      console.log('\nAsset Changes:');
      simData.assetChange.forEach((asset: any) => {
        const direction = asset.rawValue.startsWith('-') ? 'SEND' : 'RECEIVE';
        const assetSymbol = asset.symbol || 'Unknown';
        console.log(`${direction}: ${assetSymbol} (${asset.assetType})`);
      });
      
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