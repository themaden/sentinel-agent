import { SpendRequest, ApprovalVerification } from './types';
import { logger } from '../../utils/logger';

/**
 * Command-Level Security Gate (approval.ts)
 * Implements prompt injection detection and policy enforcement before any on-chain action.
 */
export class ApprovalGate {
  private injectionPatterns: RegExp[] = [
    /ignore\s+(all\s+)?(previous\s+)?instructions/i,
    /transfer\s+all\s+(funds|balance|usdc)/i,
    /drain\s+(wallet|treasury|funds)/i,
    /bypass\s+(limits?|guards?|security)/i,
    /system\s+override/i,
    /send\s+everything/i,
    /emergency\s+payout/i
  ];

  /**
   * Verifies the intent and security posture of a spend request before reaching the executor.
   */
  verifyApproval(req: SpendRequest): ApprovalVerification {
    logger.info('ApprovalGate', `Screening spend request for recipient ${req.recipient}, amount: ${req.amountUsdc} USDC...`);

    // 1. Recipient Address Integrity
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(req.recipient)) {
      logger.error('ApprovalGate', `Security rejection: Malformed recipient address: ${req.recipient}`);
      return {
        approved: false,
        reason: `Invalid EVM recipient address: ${req.recipient}`,
        timestamp: new Date().toISOString()
      };
    }

    // 2. Prompt Injection & Jailbreak Defense
    const textToScan = `${req.purpose} ${req.promptContext || ''}`;
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(textToScan)) {
        logger.error('ApprovalGate', `SECURITY ALERT: Prompt injection attempt detected! Matched pattern: ${pattern.source}`);
        return {
          approved: false,
          reason: `Security Block: Prompt injection or adversarial payload detected (${pattern.source})`,
          timestamp: new Date().toISOString()
        };
      }
    }

    // 3. Amount sanity check
    if (req.amountUsdc <= 0 || isNaN(req.amountUsdc)) {
      return {
        approved: false,
        reason: `Invalid amount: ${req.amountUsdc} USDC`,
        timestamp: new Date().toISOString()
      };
    }

    // 4. Generate verifiable approval token
    const tokenPayload = `${req.recipient}:${req.amountUsdc}:${Date.now()}`;
    const approvalToken = 'appr_' + Buffer.from(tokenPayload).toString('base64');

    logger.success('ApprovalGate', `Spend request approved! Generated Approval Token: ${approvalToken.slice(0, 20)}...`);

    return {
      approved: true,
      approvalToken,
      timestamp: new Date().toISOString()
    };
  }
}
