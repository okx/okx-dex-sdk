import { ethers } from 'ethers';

export interface EVMWallet {
    readonly address: string;
    readonly provider: ethers.Provider;
    signTransaction(transaction: ethers.TransactionRequest): Promise<string>;
    signMessage(message: string | Uint8Array): Promise<string>;
    sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse>;
}

export class PrivateKeyWallet implements EVMWallet {
    public readonly address: string;
    public readonly provider: ethers.Provider;
    private readonly signer: ethers.Wallet;

    constructor(privateKey: string, provider: ethers.Provider) {
        this.signer = new ethers.Wallet(privateKey, provider);
        this.address = this.signer.address;
        this.provider = provider;
    }

    async signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
        return this.signer.signTransaction(transaction);
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        return this.signer.signMessage(message);
    }

    async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
        return this.signer.sendTransaction(transaction);
    }
}

export function createEVMWallet(privateKey: string, provider: ethers.Provider): EVMWallet {
    return new PrivateKeyWallet(privateKey, provider);
} 