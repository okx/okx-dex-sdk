// src/api/swap/evm/evm-approve.ts
import { ethers } from "ethers";
import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig, APIResponse, ApproveTransactionData } from "../../../types";
import { HTTPClient } from "../../../core/http-client";

// ERC20 ABI for approval
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [
            { "name": "_owner", "type": "address" },
            { "name": "_spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    }
];

export class EVMApproveExecutor implements SwapExecutor {
    private readonly provider: ethers.Provider;
    private readonly DEFAULT_GAS_MULTIPLIER = BigInt(150); // 1.5x
    private readonly httpClient: HTTPClient;

    constructor(
        private readonly config: OKXConfig,
        private readonly networkConfig: ChainConfig
    ) {
        if (!this.config.evm?.wallet) {
            throw new Error("EVM configuration required");
        }
        this.provider = this.config.evm.wallet.provider;
        this.httpClient = new HTTPClient(this.config);
    }

    async executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult> {
        throw new Error("Swap execution not supported in approval executor");
    }

    private async getAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string): Promise<bigint> {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const allowanceResult = await tokenContract.allowance(ownerAddress, spenderAddress);
        return allowanceResult;
    }

    async handleTokenApproval(
        chainId: string,
        tokenAddress: string,
        amount: string
    ): Promise<{ transactionHash: string }> {
        if (!this.config.evm?.wallet) {
            throw new Error("EVM wallet required");
        }

        const dexContractAddress = await this.getDexContractAddress(chainId, tokenAddress, amount);

        // Check current allowance
        const currentAllowance = await this.getAllowance(
            tokenAddress,
            this.config.evm.wallet.address,
            dexContractAddress
        );

        if (currentAllowance >= BigInt(amount)) {
            throw new Error("Token already approved for the requested amount");
        }

        try {
            // Execute the approval transaction
            const result = await this.executeApprovalTransaction(
                tokenAddress, 
                dexContractAddress, 
                amount
            );
            
            return { transactionHash: result.hash };
        } catch (error) {
            console.error("Approval execution failed:", error);
            throw error;
        }
    }

    private async getDexContractAddress(chainId: string, tokenAddress: string, amount: string): Promise<string> {
        try {
            const response = await this.httpClient.request<APIResponse<ApproveTransactionData>>(
                'GET',
                '/api/v5/dex/aggregator/approve-transaction',
                {
                    chainIndex: chainId,
                    tokenContractAddress: tokenAddress,
                    approveAmount: amount
                }
            );

            if (!response.data?.[0]?.dexContractAddress) {
                throw new Error(`No dex contract address found for chain ${chainId}`);
            }
            return response.data[0].dexContractAddress;
        } catch (error) {
            console.error('Error getting dex contract address:', error);
            throw error;
        }
    }

    private async executeApprovalTransaction(
        tokenAddress: string,
        spenderAddress: string, 
        amount: string
    ) {
        if (!this.config.evm?.wallet) {
            throw new Error("EVM wallet required");
        }

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.config.evm.wallet);

        let retryCount = 0;
        while (retryCount < (this.networkConfig.maxRetries || 3)) {
            try {
                console.log("Sending approval transaction...");
                const tx = await tokenContract.approve(spenderAddress, amount, {
                    gasLimit: BigInt(100000), // Safe default for approvals
                    maxFeePerGas: (await this.provider.getFeeData()).maxFeePerGas! * this.DEFAULT_GAS_MULTIPLIER / BigInt(100),
                    maxPriorityFeePerGas: (await this.provider.getFeeData()).maxPriorityFeePerGas! * this.DEFAULT_GAS_MULTIPLIER / BigInt(100)
                });

                console.log("Waiting for transaction confirmation...");
                return await tx.wait();
            } catch (error) {
                retryCount++;
                console.warn(`Approval attempt ${retryCount} failed, retrying in ${2000 * retryCount}ms...`);
                if (retryCount === this.networkConfig.maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            }
        }

        throw new Error('Max retries exceeded for approval transaction');
    }
}
