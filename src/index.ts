import 'dotenv/config';
import { verifyAndRegisterAgent } from './modules/identity-world/verifier';
import { TheGraphClient } from './modules/data-graph/client';
import { CircleArcExecutor } from './modules/finance-circle/executor';
import { x402Gate } from './modules/audit-hedera/x402Gate';
import { hcsAuditLedger } from './modules/audit-hedera/hcsLogger';
import { hederaConfig, hederaManager } from './modules/audit-hedera/client';
import { logger } from './utils/logger';

async function main() {
  console.log('===========================================================');
  console.log('                 SentinelPay Agent Network                 ');
  console.log(' Human-Verified Autonomous AI Agent Financial Coordination ');
  console.log('  World ID | The Graph MCP | Circle Arc L1 | Hedera HCS/402 ');
  console.log('===========================================================\n');

  const agentWallet = process.env.AGENT_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  logger.info('System', `Booting SentinelPay agent for wallet: ${agentWallet}`);

  // =========================================================================
  // Day 1: Human Proof via World ID AgentBook
  // =========================================================================
  logger.info('Step1', 'Checking World ID Human Verification...');
  const identity = await verifyAndRegisterAgent(agentWallet);
  if (!identity.isVerified) {
    logger.error('Step1', 'Agent is not backed by a verified human. Aborting execution.');
    process.exit(1);
  }

  // =========================================================================
  // Day 2: Data Intelligence via The Graph Subgraph MCP
  // =========================================================================
  logger.info('Step2', 'Querying decentralized liquidity telemetry via The Graph Subgraph MCP...');
  const graphClient = new TheGraphClient();
  const poolData = await graphClient.fetchPoolAnalytics('0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640');
  const riskAssessment = graphClient.evaluateMarketRisk(poolData);

  // =========================================================================
  // Day 2: Capital Execution via Circle Agent Stack on Arc L1
  // =========================================================================
  logger.info('Step3', 'Executing bounded transaction with Circle spending guard on Arc L1...');
  const circleExecutor = new CircleArcExecutor();
  const paymentResult = await circleExecutor.executePayment({
    recipient: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    amountUsdc: 0.50,
    purpose: 'Liquidity Telemetry API settlement',
    serviceId: 'subgraph-query-node-01'
  });

  // =========================================================================
  // Day 3: HTTP 402 Autonomous Payment Gate Challenge & Settlement
  // =========================================================================
  logger.info('Step4', 'Interacting with HTTP 402 Autonomous Gate for premium telemetry feed...');
  const challenge = x402Gate.createChallenge(
    agentWallet,
    '0.10',
    'USDC',
    'deep-liquidity-intelligence'
  );

  const settlement = await x402Gate.settlePayment(challenge, agentWallet);
  const proofVerification = x402Gate.verifyPaymentProof(settlement.paymentProof);

  if (!proofVerification.valid) {
    throw new Error(`Failed to verify settled x402 payment proof: ${proofVerification.reason}`);
  }

  // =========================================================================
  // Day 3: Immutable Audit Trail via Hedera Consensus Service (HCS-14)
  // =========================================================================
  logger.info('Step5', 'Registering multi-chain decision record onto Hedera Consensus Service (HCS-14)...');
  const auditReceipt = await hcsAuditLedger.logDecision({
    agentAddress: agentWallet,
    action: 'ARC_PAYMENT_EXECUTED',
    amountUsdc: paymentResult.amountUsdc,
    arcTxHash: paymentResult.txHash,
    graphPoolId: poolData.id,
    worldNullifier: identity.nullifierHash,
    status: 'SUCCESS',
    metadata: {
      action: riskAssessment.recommendedAction,
      confidence: riskAssessment.confidence,
      x402Proof: settlement.paymentProof,
      facilitator: settlement.facilitator
    }
  });

  const chainIntegrity = hcsAuditLedger.verifyChainIntegrity();

  console.log('\n===========================================================');
  console.log(' ✅ SENTINELPAY FULL CYCLE COMPLETED SUCCESSFULLY');
  console.log(` - Agent Status:       ${identity.agentBookStatus} (World ID verified)`);
  console.log(` - Protocol TVL:       $${(poolData.totalValueLockedUSD / 1e6).toFixed(2)}M (The Graph)`);
  console.log(` - Risk Assessment:    ${riskAssessment.recommendedAction} (Confidence: ${(riskAssessment.confidence * 100).toFixed(0)}%)`);
  console.log(` - Arc L1 Tx Hash:     ${paymentResult.txHash} (Circle USDC)`);
  console.log(` - Arc Explorer:       ${paymentResult.explorerUrl}`);
  console.log(` - Remaining Cap:      ${paymentResult.remainingDailyLimit.toFixed(2)} USDC`);
  console.log(` - x402 Settlement:    ${settlement.paymentProof.slice(0, 24)}... (Verified)`);
  console.log(` - HCS Topic ID:       ${auditReceipt.topicId} (${auditReceipt.standard})`);
  console.log(` - HCS Sequence:       #${auditReceipt.sequenceNumber}`);
  console.log(` - Hashscan URL:       ${auditReceipt.hashscanUrl}`);
  console.log(` - Audit Chain Valid:  ${chainIntegrity ? 'VERIFIED (SHA-256 Chained)' : 'CORRUPTED'}`);
  console.log('===========================================================\n');
}

main().catch((err) => {
  logger.error('Fatal', 'Execution stopped due to error:', err.message);
  process.exit(1);
});

