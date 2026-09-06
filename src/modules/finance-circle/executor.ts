import { SpendingLimitGuard } from './spendingLimits';
import { CircleAgentWallet } from './wallet';
import { ApprovalGate } from './approval';
import { SpendRequest, SpendExecutionResult, NanopaymentRequest } from './types';
import { logger } from '../../utils/logger';

export class CircleArcExecutor {
  private wallet: CircleAgentWallet;
  private guard: SpendingLimitGuard;
  private approvalGate: ApprovalGate;
  private network: 'arc-testnet' | 'arc-mainnet';

  constructor(
    wallet?: CircleAgentWallet,
    guard?: SpendingLimitGuard,
    approvalGate?: ApprovalGate,
    network: 'arc-testnet' | 'arc-mainnet' = 'arc-testnet'
  ) {
    this.wallet = wallet || new CircleAgentWallet();
    this.guard = guard || new SpendingLimitGuard();
    this.approvalGate = approvalGate || new ApprovalGate();
    this.network = network;
  }

  /**
   * Executes USDC transfer on Arc L1 following Circle Agent Stack policy and command approval verification.
   */
  async executePayment(req: SpendRequest): Promise<SpendExecutionResult> {
    logger.info('ArcCircle', `Initiating payment request of ${req.amountUsdc} USDC to ${req.recipient}...`);

    // 1. Command-Level Approval & Prompt-Injection Screening (approval.ts)
    const approval = this.approvalGate.verifyApproval(req);
    if (!approval.approved) {
      throw new Error(`Execution Blocked by ApprovalGate: ${approval.reason}`);
    }

    // 2. Spending Cap & Daily Limit Guard (spendingLimits.ts)
    this.guard.validateSpend(req);

    // 3. Autonomous Wallet Transfer on Arc L1 (wallet.ts)
    const { txHash, explorerUrl } = await this.wallet.executeArcTransfer(req.recipient, req.amountUsdc);

    // 4. Record spend against policy
    this.guard.recordSpend(req.amountUsdc);
    const remaining = this.guard.getRemainingLimit();

    logger.success('ArcCircle', `USDC Transfer successfully confirmed on Arc L1!`, {
      txHash,
      recipient: req.recipient,
      amount: `${req.amountUsdc} USDC`,
      remainingDailyLimit: `${remaining.toFixed(2)} USDC`,
      explorer: explorerUrl
    });

    return {
      txHash,
      amountUsdc: req.amountUsdc,
      recipient: req.recipient,
      network: this.network,
      explorerUrl,
      timestamp: new Date().toISOString(),
      status: 'Confirmed',
      remainingDailyLimit: remaining
    };
  }

  /**
   * Executes autonomous micro-settlement / Nanopayment for API or data services.
   */
  async executeNanopayment(serviceReq: NanopaymentRequest): Promise<SpendExecutionResult> {
    logger.info('ArcCircle', `Executing Arc L1 Nanopayment for ${serviceReq.serviceName} (${serviceReq.costPerCallUsdc} USDC)...`);
    return this.executePayment({
      recipient: serviceReq.recipientAddress,
      amountUsdc: serviceReq.costPerCallUsdc,
      purpose: `Nanopayment for API service: ${serviceReq.serviceName}`,
      serviceId: serviceReq.serviceEndpoint
    });
  }

  getWallet(): CircleAgentWallet {
    return this.wallet;
  }

  getGuard(): SpendingLimitGuard {
    return this.guard;
  }

  getAvailableDailyLimit(): number {
    return this.guard.getRemainingLimit();
  }
}

