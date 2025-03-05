// src/api/swap/evm/evm-approve.ts
import Web3 from "web3";
import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig, APIResponse, ChainData } from "../../../types";
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
    private readonly web3: Web3;
    private readonly DEFAULT_GAS_MULTIPLIER = BigInt(3) / BigInt(2); // 1.5x
    private readonly httpClient: HTTPClient;

    constructor(
        private readonly config: OKXConfig,
        private readonly networkConfig: ChainConfig
    ) {
        if (!this.config.evm) {
            throw new Error("EVM configuration required");
        }
        this.web3 = new Web3(this.config.evm.connection?.rpcUrl || '');
        this.httpClient = new HTTPClient(this.config);
    }

    async executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult> {
        throw new Error("Swap execution not supported in approval executor");
    }

    private async getAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string): Promise<bigint> {
        const tokenContract = new this.web3.eth.Contract(ERC20_ABI as any, tokenAddress);
        const allowanceResult: string = await tokenContract.methods.allowance(ownerAddress, spenderAddress).call();
        return BigInt(allowanceResult);
    }

    async handleTokenApproval(
        chainId: string,
        tokenAddress: string,
        amount: string
    ): Promise<{ transactionHash: string }> {
        if (!this.config.evm?.walletAddress) {
            throw new Error("Wallet address not configured");
        }

        const dexContractAddress = await this.getDexContractAddress(chainId);

        // Check current allowance
        const currentAllowance = await this.getAllowance(
            tokenAddress,
            this.config.evm.walletAddress,
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
            
            return { transactionHash: result.transactionHash.toString() };
        } catch (error) {
            console.error("Approval execution failed:", error);
            throw error;
        }
    }

    private async getDexContractAddress(chainId: string): Promise<string> {
        try {
            const response = await this.httpClient.request<APIResponse<ChainData>>(
                'GET',
                '/api/v5/dex/aggregator/supported/chain',
                { chainId }
            );

            if (!response.data?.[0]?.dexTokenApproveAddress) {
                throw new Error(`No dex contract address found for chain ${chainId}`);
            }

            return response.data[0].dexTokenApproveAddress;
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
        if (!this.config.evm?.privateKey || !this.config.evm?.walletAddress) {
            throw new Error("EVM private key and wallet address required");
        }

        // Prepare approval data
        const approvalCallData = this.web3.eth.abi.encodeFunctionCall({
            name: 'approve',
            type: 'function',
            inputs: [
                { type: 'address', name: '_spender' },
                { type: 'uint256', name: '_value' }
            ]
        }, [spenderAddress, amount]);

        let retryCount = 0;
        while (retryCount < (this.networkConfig.maxRetries || 3)) {
            try {
                const nonce = await this.web3.eth.getTransactionCount(this.config.evm.walletAddress, 'latest');
                const gasPrice = await this.web3.eth.getGasPrice();
                
                // Estimate gas
                const estimate = await this.web3.eth.estimateGas({
                    from: this.config.evm.walletAddress,
                    to: tokenAddress,
                    data: approvalCallData
                });
                const gasLimit = BigInt(estimate) * BigInt(2); // Double to be safe

                const signTransactionParams = {
                    to: tokenAddress,
                    data: approvalCallData,
                    gasPrice: BigInt(gasPrice) * this.DEFAULT_GAS_MULTIPLIER,
                    gas: gasLimit,
                    value: '0',
                    nonce
                };

                console.log("Signing approval transaction...");
                const { rawTransaction } = await this.web3.eth.accounts.signTransaction(
                    signTransactionParams,
                    this.config.evm.privateKey
                );

                console.log("Sending approval transaction...");
                return this.web3.eth.sendSignedTransaction(rawTransaction);

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