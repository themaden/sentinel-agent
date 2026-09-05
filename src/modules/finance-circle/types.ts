/**
 * Circle Agent Stack and Arc L1 Interfaces
 */
export interface SpendRequest {
  recipient: string;
  amountUsdc: number;
  purpose: string;
  serviceId?: string;
}

export interface SpendExecutionResult {
  txHash: string;
  amountUsdc: number;
  recipient: string;
  network: 'arc-testnet' | 'arc-mainnet';
  timestamp: string;
  status: 'Confirmed' | 'Failed';
  remainingDailyLimit: number;
}

export interface SpendingPolicy {
  dailyCapUsdc: number;
  maxSingleTxUsdc: number;
  spentTodayUsdc: number;
  lastResetTimestamp: number;
}
