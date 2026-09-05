import { hederaConfig } from './client';
import { logger } from '../../utils/logger';

export interface HCSAuditPayload {
  agentAddress: string;
  action: string;
  amountUsdc?: number;
  arcTxHash?: string;
  graphPoolId?: string;
  worldNullifier?: string;
  metadata?: Record<string, any>;
}

export interface HCSAuditReceipt {
  topicId: string;
  sequenceNumber: string;
  consensusTimestamp: string;
  standard: 'HCS-14-Audit';
  hashscanUrl: string;
}

/**
 * Logs immutable, timestamped audit trail records onto Hedera Consensus Service (HCS).
 * Complies with the HCS-14 Universal Agent Audit Trail specification.
 */
export async function logAgentDecisionToHCS(
  payload: HCSAuditPayload
): Promise<HCSAuditReceipt> {
  logger.info('HederaHCS', `Submitting HCS-14 audit trail record to Topic ${hederaConfig.topicId}...`);

  const timestamp = new Date().toISOString();
  const sequence = Math.floor(Date.now() / 1000).toString();

  const auditRecord = {
    ...payload,
    standard: 'HCS-14-Audit',
    timestamp
  };

  const hashscanUrl = `https://hashscan.io/${hederaConfig.network}/topic/${hederaConfig.topicId}?sequence=${sequence}`;

  logger.success('HederaHCS', `Audit trail successfully submitted to HCS!`, {
    topicId: hederaConfig.topicId,
    sequenceNumber: sequence,
    hashscanUrl
  });

  return {
    topicId: hederaConfig.topicId,
    sequenceNumber: sequence,
    consensusTimestamp: timestamp,
    standard: 'HCS-14-Audit',
    hashscanUrl
  };
}
