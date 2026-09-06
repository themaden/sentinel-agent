export interface SpendRequest {
  recipient: string;
  amountUsdc: number;
  purpose: string;
  serviceId?: string;
  promptContext?: string;
}

export interface SpendExecutionResult {
  txHash: string;
  amountUsdc: number;
  recipient: string;
  network: 'arc-testnet' | 'arc-mainnet';
  explorerUrl: string;
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

export interface AgentWalletInfo {
  address: string;
  network: 'arc-testnet' | 'arc-mainnet';
  chainId: number;
  usdcBalance: number;
  isAutonomous: boolean;
  status: 'Active' | 'Suspended';
}

export interface ApprovalVerification {
  approved: boolean;
  reason?: string;
  approvalToken?: string;
  timestamp: string;
}

export interface NanopaymentRequest {
  serviceEndpoint: string;
  costPerCallUsdc: number;
  recipientAddress: string;
  serviceName: string;
}

