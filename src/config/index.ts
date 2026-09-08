import 'dotenv/config';

/**
 * Unified Central Configuration for SentinelPay Autonomous Agent Network
 */
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  // 1. World Network & AgentBook (Day 1)
  world: {
    appId: process.env.WORLD_APP_ID || 'app_staging_sentinelpay_world_id',
    actionId: process.env.WORLD_ACTION_ID || 'sentinelpay-agent-verification',
    agentBookAddress: process.env.WORLD_AGENTBOOK_ADDRESS || '0x17d69280d046fB4C132E8f121d120a13Fa801827',
    rpcUrl: process.env.WORLD_RPC_URL || 'https://worldchain-sepolia.g.alchemy.com/public',
    sandboxMode: process.env.WORLD_SANDBOX_MODE !== 'false'
  },

  // 2. The Graph Subgraph MCP (Day 2)
  graph: {
    apiKey: process.env.THE_GRAPH_API_KEY || 'mock_graph_api_key_day2',
    subgraphId: process.env.THE_GRAPH_SUBGRAPH_ID || '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV',
    gatewayUrl: process.env.THE_GRAPH_GATEWAY_URL || 'https://gateway.thegraph.com/api'
  },

  // 3. Circle Agent Stack & Arc L1 (Day 2)
  circleArc: {
    rpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
    chainId: parseInt(process.env.ARC_CHAIN_ID || '50420', 10),
    agentWalletAddress: process.env.AGENT_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    dailySpendingCapUsdc: parseFloat(process.env.DAILY_SPENDING_CAP_USDC || '50.0'),
    singleTxCapUsdc: parseFloat(process.env.SINGLE_TX_CAP_USDC || '25.0')
  },

  // 4. Hedera Consensus Service & x402 Autonomous Gate (Day 3)
  hedera: {
    network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
    operatorId: process.env.HEDERA_OPERATOR_ID || '0.0.123456',
    operatorKey: process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b65700422042011111111111111111111111111111111',
    topicId: process.env.HEDERA_HCS_TOPIC_ID || '0.0.987654',
    mirrorNodeUrl: process.env.HEDERA_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com',
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://blocky402.hedera.testnet/pay'
  }
};

export default config;
