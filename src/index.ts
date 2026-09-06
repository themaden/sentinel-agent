import 'dotenv/config';
import { verifyAndRegisterAgent } from './modules/identity-world/verifier';
import { TheGraphClient } from './modules/data-graph/client';
import { CircleArcExecutor } from './modules/finance-circle/executor';
import { logger } from './utils/logger';

async function main() {
  console.log('===========================================================');
  console.log('                 SentinelPay Agent Network                 ');
  console.log(' Human-Verified Autonomous AI Agent Financial Coordination ');
  console.log('===========================================================\n');

  const agentWallet = process.env.AGENT_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  logger.info('System', `Booting SentinelPay agent for wallet: ${agentWallet}`);

  // Step 1: Human Proof via World ID AgentBook
  logger.info('Step1', 'Checking World ID Human Verification...');
  const identity = await verifyAndRegisterAgent(agentWallet);
  if (!identity.isVerified) {
    logger.error('Step1', 'Agent is not backed by a verified human. Aborting execution.');
    process.exit(1);
  }

  // Step 2: Data Intelligence via The Graph Subgraph MCP
  logger.info('Step2', 'Querying decentralized liquidity telemetry via The Graph Subgraph MCP...');
  const graphClient = new TheGraphClient();
  const poolData = await graphClient.fetchPoolAnalytics('0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640');
  const riskAssessment = graphClient.evaluateMarketRisk(poolData);

  // Step 3: Capital Execution via Circle Agent Stack on Arc L1
  logger.info('Step3', 'Executing bounded transaction with Circle spending guard on Arc L1...');
  const circleExecutor = new CircleArcExecutor();
  const paymentResult = await circleExecutor.executePayment({
    recipient: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    amountUsdc: 0.50,
    purpose: 'Liquidity Telemetry API settlement',
    serviceId: 'subgraph-query-node-01'
  });

  console.log('\n===========================================================');
  console.log(' ✅ SENTINELPAY CYCLE COMPLETED SUCCESSFULLY');
  console.log(` - Agent Status:    ${identity.agentBookStatus} (World ID verified)`);
  console.log(` - Protocol TVL:    $${(poolData.totalValueLockedUSD / 1e6).toFixed(2)}M (The Graph)`);
  console.log(` - Risk Assessment: ${riskAssessment.recommendedAction} (Confidence: ${(riskAssessment.confidence * 100).toFixed(0)}%)`);
  console.log(` - Arc L1 Tx Hash:  ${paymentResult.txHash} (Circle USDC)`);
  console.log(` - Arc Explorer:    ${paymentResult.explorerUrl}`);
  console.log(` - Remaining Cap:   ${paymentResult.remainingDailyLimit.toFixed(2)} USDC`);
  console.log('===========================================================\n');
}


main().catch((err) => {
  logger.error('Fatal', 'Execution stopped due to error:', err.message);
  process.exit(1);
});
