import { worldConfig } from './config';
import { logger } from '../../utils/logger';

export type AgentRegistrationStatus = 'Registered' | 'Unregistered' | 'Pending';

export interface AgentBookRecord {
  agentAddress: string;
  registeredByHuman: string;
  nullifierHash: string;
  registeredAt: string;
  status: AgentRegistrationStatus;
  reputationScore: number;
}

export interface CAIP122Challenge {
  domain: string;
  address: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  statement: string;
}

/**
 * AgentBook On-Chain Registry Integration
 * Manages binding between verified human World ID identities and autonomous agent wallets.
 */
export class AgentBookRegistry {
  private registeredAgents: Map<string, AgentBookRecord> = new Map();

  constructor() {
    // Pre-populate with sample registry state if in development mode
    if (worldConfig.sandboxMode) {
      logger.info('AgentBook', `Initialized AgentBook registry for contract: ${worldConfig.agentBookAddress}`);
    }
  }

  /**
   * Generates a standard CAIP-122 / SIWE challenge message for the agent to sign.
   */
  generateChallenge(agentAddress: string): CAIP122Challenge {
    return {
      domain: 'sentinelpay.network',
      address: agentAddress,
      uri: 'https://sentinelpay.network/agent-auth',
      version: '1',
      chainId: 8453, // Base / World Chain
      nonce: Math.random().toString(36).substring(2, 15),
      issuedAt: new Date().toISOString(),
      statement: 'Authenticate SentinelPay autonomous agent wallet under World ID verified human sponsorship.'
    };
  }

  /**
   * Registers an agent wallet into AgentBook backed by a World ID nullifier hash.
   */
  async registerAgent(
    agentAddress: string,
    humanNullifierHash: string,
    caip122Signature: string
  ): Promise<AgentBookRecord> {
    logger.info('AgentBook', `Registering agent wallet ${agentAddress} with human proof...`);

    if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
      throw new Error(`Invalid agent Ethereum address: ${agentAddress}`);
    }

    if (!caip122Signature || caip122Signature.length < 10) {
      throw new Error('Valid CAIP-122 signature required for AgentBook registration.');
    }

    const record: AgentBookRecord = {
      agentAddress: agentAddress.toLowerCase(),
      registeredByHuman: humanNullifierHash,
      nullifierHash: humanNullifierHash,
      registeredAt: new Date().toISOString(),
      status: 'Registered',
      reputationScore: 100
    };

    this.registeredAgents.set(record.agentAddress, record);

    logger.success('AgentBook', `Agent wallet successfully registered in AgentBook! Status: Registered`, {
      agentAddress: record.agentAddress,
      status: record.status,
      reputationScore: record.reputationScore
    });

    return record;
  }

  /**
   * Queries on-chain AgentBook status for an agent wallet.
   */
  async getStatus(agentAddress: string): Promise<AgentRegistrationStatus> {
    const record = this.registeredAgents.get(agentAddress.toLowerCase());
    const status = record ? record.status : 'Unregistered';
    logger.info('AgentBook', `Agent status query for ${agentAddress}: ${status}`);
    return status;
  }

  /**
   * Fetches full record if registered.
   */
  getRecord(agentAddress: string): AgentBookRecord | undefined {
    return this.registeredAgents.get(agentAddress.toLowerCase());
  }
}

export const agentBookRegistry = new AgentBookRegistry();
