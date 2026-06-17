/**
 * Convert lamports to SOL
 * @param lamports Amount in lamports (1 SOL = 1e9 lamports)
 * @returns Amount in SOL
 */
export function lamportsToSol(lamports: string | number): number {
    const lamportsNum = typeof lamports === 'string' ? parseFloat(lamports) : lamports;
    return lamportsNum / 1e9;
}

/**
 * Convert SOL to lamports
 * @param sol Amount in SOL
 * @returns Amount in lamports
 */
export function solToLamports(sol: string | number): string {
    const solNum = typeof sol === 'string' ? parseFloat(sol) : sol;
    return (solNum * 1e9).toString();
} 