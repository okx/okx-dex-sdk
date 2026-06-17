import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { ChainConfig, OKXConfig, SolanaSwapInstructionData, SwapResult } from "../../../types";

export class SolanaInstructionExecutor {
  constructor(
    private readonly config: OKXConfig,
    private readonly networkConfig: ChainConfig
  ) {}

  async executeInstructions(instrData: SolanaSwapInstructionData): Promise<SwapResult> {
    if (!this.config.solana?.wallet) {
      throw new Error("Solana wallet configuration required");
    }

    const connection: Connection = this.config.solana.wallet.connection;

    // 获取最新区块信息
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

    // 拉取 ALT 账户
    const lookupTables: AddressLookupTableAccount[] = [];
    if (Array.isArray(instrData.addressLookupTableAccount)) {
      for (const addr of instrData.addressLookupTableAccount) {
        const { value } = await connection.getAddressLookupTable(new PublicKey(addr));
        if (value) lookupTables.push(value);
      }
    }

    // 构建指令
    const instructions: TransactionInstruction[] = instrData.instructionLists.map((item) => {
      const programId = new PublicKey(item.programId);
      const keys = (item.accounts || []).map((acc) => ({
        pubkey: new PublicKey(acc.pubkey),
        isSigner: !!acc.isSigner,
        isWritable: !!acc.isWritable,
      }));
      const data = Buffer.from(item.data, "base64");
      return new TransactionInstruction({ programId, keys, data });
    });

    // assemble v0
    const message = new TransactionMessage({
      payerKey: this.config.solana.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(lookupTables);

    const vtx = new VersionedTransaction(message);

    // 签名并发送
    const { signature } = await this.config.solana.wallet.signAndSendTransaction(vtx, {
      skipPreflight: false,
      maxRetries: this.networkConfig.maxRetries,
      preflightCommitment: "confirmed",
    });

    // 确认交易
    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    const router = instrData.routerResult;
    const fromDecimals = parseInt(router.fromToken.decimal);
    const toDecimals = parseInt(router.toToken.decimal);
    const displayFromAmount = (Number(router.fromTokenAmount) / Math.pow(10, fromDecimals)).toFixed(6);
    const displayToAmount = (Number(router.toTokenAmount) / Math.pow(10, toDecimals)).toFixed(6);

    return {
      success: true,
      transactionId: signature,
      explorerUrl: `${this.networkConfig.explorer}/${signature}`,
      details: {
        fromToken: {
          symbol: router.fromToken.tokenSymbol,
          amount: displayFromAmount,
          decimal: router.fromToken.decimal,
        },
        toToken: {
          symbol: router.toToken.tokenSymbol,
          amount: displayToAmount,
          decimal: router.toToken.decimal,
        },
        priceImpact: router.priceImpactPercent,
      },
    };
  }
}

