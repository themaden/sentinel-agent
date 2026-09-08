import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import { logger } from '../../utils/logger';

export interface HederaConfig {
  network: 'testnet' | 'mainnet';
  operatorId: string;
  operatorKey: string;
  topicId: string;
  mirrorNodeUrl: string;
  facilitatorUrl: string;
}

export const hederaConfig: HederaConfig = {
  network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
  operatorId: process.env.HEDERA_OPERATOR_ID || '0.0.123456',
  operatorKey: process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b65700422042011111111111111111111111111111111',
  topicId: process.env.HEDERA_HCS_TOPIC_ID || '0.0.987654',
  mirrorNodeUrl: process.env.HEDERA_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com',
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://blocky402.hedera.testnet/pay'
};

export class HederaClientManager {
  private client: Client | null = null;
  private isSimulation: boolean = true;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    try {
      this.client = hederaConfig.network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      
      const key = hederaConfig.operatorKey;
      if (
        hederaConfig.operatorId &&
        key &&
        !key.includes('...') &&
        key.length >= 64 &&
        !key.startsWith('302e020100300506032b65700422042011111111')
      ) {
        this.client.setOperator(
          AccountId.fromString(hederaConfig.operatorId),
          PrivateKey.fromStringED25519(key)
        );
        this.isSimulation = false;
        logger.info('HederaClient', `Connected to Hedera ${hederaConfig.network} with operator ${hederaConfig.operatorId}`);
      } else {
        this.isSimulation = true;
        logger.info('HederaClient', `Hedera initialized in simulated HCS testnet mode for topic ${hederaConfig.topicId}`);
      }
    } catch (err: any) {
      this.isSimulation = true;
      this.client = Client.forTestnet();
      logger.warn('HederaClient', `Hedera client fallback to testnet simulation: ${err.message}`);
    }
  }

  getClient(): Client {
    if (!this.client) {
      this.initClient();
    }
    return this.client!;
  }

  isSimulated(): boolean {
    return this.isSimulation;
  }

  getHashscanTopicUrl(topicId: string = hederaConfig.topicId): string {
    return `https://hashscan.io/${hederaConfig.network}/topic/${topicId}`;
  }

  getHashscanTxUrl(txId: string): string {
    return `https://hashscan.io/${hederaConfig.network}/transaction/${txId}`;
  }
}

export const hederaManager = new HederaClientManager();
export function getHederaClient(): Client {
  return hederaManager.getClient();
}

