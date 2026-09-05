import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import { logger } from '../../utils/logger';

export interface HederaConfig {
  network: 'testnet' | 'mainnet';
  operatorId: string;
  operatorKey: string;
  topicId: string;
}

export const hederaConfig: HederaConfig = {
  network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
  operatorId: process.env.HEDERA_OPERATOR_ID || '0.0.123456',
  operatorKey: process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b65700422042011111111111111111111111111111111',
  topicId: process.env.HEDERA_HCS_TOPIC_ID || '0.0.987654'
};

export function getHederaClient(): Client {
  try {
    const client = hederaConfig.network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
    if (hederaConfig.operatorId && hederaConfig.operatorKey && !hederaConfig.operatorKey.includes('...')) {
      client.setOperator(
        AccountId.fromString(hederaConfig.operatorId),
        PrivateKey.fromStringED25519(hederaConfig.operatorKey)
      );
    }
    return client;
  } catch (err: any) {
    logger.warn('Hedera', `Hedera client fallback to testnet simulation: ${err.message}`);
    return Client.forTestnet();
  }
}
