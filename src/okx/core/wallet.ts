import { 
    Keypair, 
    PublicKey, 
    Transaction, 
    VersionedTransaction, 
    SendOptions, 
    TransactionSignature,
    Connection,
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Base interface for wallet implementations
 * Defines the standard interface for interacting with a wallet
 */
export interface Wallet {
    /**
     * The public key of the connected wallet
     */
    readonly publicKey: PublicKey;

    /**
     * The Solana connection instance
     */
    readonly connection: Connection;

    /**
     * Signs a single transaction
     */
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;

    /**
     * Signs multiple transactions in batch
     */
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;

    /**
     * Signs and sends a transaction to the network
     */
    signAndSendTransaction<T extends Transaction | VersionedTransaction>(
        transaction: T, 
        options?: SendOptions
    ): Promise<{ signature: TransactionSignature }>;

    /**
     * Signs a message
     */
    signMessage(message: Uint8Array): Promise<Uint8Array>;
}

/**
 * Implementation of Wallet interface using a Keypair
 * This class handles the actual signing operations while keeping the private key secure
 */
export class KeypairWallet implements Wallet {
    public readonly publicKey: PublicKey;
    public readonly connection: Connection;
    private readonly payer: Keypair;

    constructor(keypair: Keypair, connection: Connection) {
        this.payer = keypair;
        this.publicKey = keypair.publicKey;
        this.connection = connection;
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        if (transaction instanceof Transaction) {
            transaction.partialSign(this.payer);
        } else {
            transaction.sign([this.payer]);
        }
        return transaction;
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        return Promise.all(transactions.map(tx => this.signTransaction(tx)));
    }

    async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
        transaction: T,
        options?: SendOptions
    ): Promise<{ signature: TransactionSignature }> {
        const signedTx = await this.signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(
            signedTx.serialize(),
            options
        );
        return { signature };
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        const signature = nacl.sign.detached(
            message,
            this.payer.secretKey
        );
        return signature;
    }
}

/**
 * Factory function to create a wallet instance
 * This provides a clean way to initialize a wallet without exposing implementation details
 */
export function createWallet(
    privateKey: string,
    connection: Connection
): Wallet {
    const keypair = Keypair.fromSecretKey(
        bs58.decode(privateKey)
    );
    return new KeypairWallet(keypair, connection);
} 