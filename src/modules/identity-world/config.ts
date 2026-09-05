/**
 * World Network & AgentKit Configuration
 */
export interface WorldConfig {
  appId: string;
  actionId: string;
  agentBookAddress: string;
  rpcUrl: string;
  sandboxMode: boolean;
}

export const worldConfig: WorldConfig = {
  appId: process.env.WORLD_APP_ID || 'app_staging_sentinelpay_world_id',
  actionId: process.env.WORLD_ACTION_ID || 'sentinelpay-agent-verification',
  agentBookAddress: process.env.WORLD_AGENTBOOK_ADDRESS || '0x17d69280d046fB4C132E8f121d120a13Fa801827',
  rpcUrl: process.env.WORLD_RPC_URL || 'https://worldchain-sepolia.g.alchemy.com/public',
  sandboxMode: process.env.NODE_ENV !== 'production'
};
