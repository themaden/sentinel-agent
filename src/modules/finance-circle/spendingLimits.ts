import { SpendingPolicy, SpendRequest } from './types';
import { logger } from '../../utils/logger';

/**
 * Manages strict autonomous spending limits (Daily Cap & Single Tx Cap)
 * Prevents unauthorized draining of treasury even under prompt injection.
 */
export class SpendingLimitGuard {
  private policy: SpendingPolicy;

  constructor(dailyCap: number = parseFloat(process.env.DAILY_SPENDING_CAP_USDC || '50.0')) {
    this.policy = {
      dailyCapUsdc: dailyCap,
      maxSingleTxUsdc: Math.min(dailyCap / 2, 25.0),
      spentTodayUsdc: 0,
      lastResetTimestamp: Date.now()
    };
  }

  /**
   * Validates if a proposed payment falls within safe bounds.
   */
  validateSpend(req: SpendRequest): boolean {
    this.checkDailyReset();

    if (req.amountUsdc <= 0) {
      throw new Error(`Invalid spend amount: ${req.amountUsdc} USDC.`);
    }

    if (req.amountUsdc > this.policy.maxSingleTxUsdc) {
      throw new Error(
        `Security Alert: Single transaction limit of ${this.policy.maxSingleTxUsdc} USDC exceeded! Requested: ${req.amountUsdc} USDC.`
      );
    }

    if (this.policy.spentTodayUsdc + req.amountUsdc > this.policy.dailyCapUsdc) {
      const remaining = this.policy.dailyCapUsdc - this.policy.spentTodayUsdc;
      throw new Error(
        `Security Alert: Daily cap exceeded! Limit: ${this.policy.dailyCapUsdc} USDC, Available: ${remaining.toFixed(2)} USDC.`
      );
    }

    logger.info('CircleLimit', `Spend of ${req.amountUsdc} USDC passed safety check. Daily remaining: ${(this.policy.dailyCapUsdc - (this.policy.spentTodayUsdc + req.amountUsdc)).toFixed(2)} USDC`);
    return true;
  }

  recordSpend(amount: number) {
    this.policy.spentTodayUsdc += amount;
  }

  getRemainingLimit(): number {
    this.checkDailyReset();
    return Math.max(0, this.policy.dailyCapUsdc - this.policy.spentTodayUsdc);
  }

  getPolicy(): SpendingPolicy {
    this.checkDailyReset();
    return { ...this.policy };
  }

  /**
   * Updates spending caps programmatically (equivalent to circle wallet limit set).
   */
  setLimits(dailyCapUsdc: number, maxSingleTxUsdc?: number) {
    this.policy.dailyCapUsdc = dailyCapUsdc;
    this.policy.maxSingleTxUsdc = maxSingleTxUsdc || Math.min(dailyCapUsdc / 2, 25.0);
    logger.info('CircleLimit', `Updated spending limits: Daily Cap = ${this.policy.dailyCapUsdc} USDC, Max Single Tx = ${this.policy.maxSingleTxUsdc} USDC`);
  }

  private checkDailyReset() {
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (Date.now() - this.policy.lastResetTimestamp > oneDayMs) {
      this.policy.spentTodayUsdc = 0;
      this.policy.lastResetTimestamp = Date.now();
      logger.info('CircleLimit', 'Daily spending cap has been reset for new 24-hour cycle.');
    }
  }
}

