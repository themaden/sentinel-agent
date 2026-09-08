import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import { verifyAndRegisterAgent } from '../modules/identity-world/verifier';
import { CircleAgentWallet } from '../modules/finance-circle/wallet';
import { SpendingLimitGuard } from '../modules/finance-circle/spendingLimits';
import { TheGraphClient } from '../modules/data-graph/client';
import { hcsAuditLedger, logAgentDecisionToHCS } from '../modules/audit-hedera/hcsLogger';
import { x402Gate, X402Challenge } from '../modules/audit-hedera/x402Gate';
import { hederaConfig, hederaManager } from '../modules/audit-hedera/client';
import { logger } from '../utils/logger';

export interface ServerOptions {
  port?: number;
  host?: string;
}

export function buildServer(): FastifyInstance {
  const server = fastify({
    logger: false
  });

  const agentWallet = new CircleAgentWallet();
  const spendingGuard = new SpendingLimitGuard(50.0);
  const graphClient = new TheGraphClient();

  // Root: Live Interactive Web Dashboard UI
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const dashboardPath = path.resolve(__dirname, '../../public/index.html');
    if (fs.existsSync(dashboardPath)) {
      const html = fs.readFileSync(dashboardPath, 'utf-8');
      return reply.type('text/html').send(html);
    }
    return reply.status(200).send({
      message: 'SentinelPay Autonomous Agent Network API is online.',
      dashboard: 'Visit /health or run frontend'
    });
  });

  // 1. Health & Subsystem Status
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agentNetwork: 'SentinelPay Autonomous Agent Network',
      subsystems: {
        worldId: {
          status: 'connected',
          agentBookContract: process.env.WORLD_AGENTBOOK_ADDRESS || '0x17d69280d046fB4C132E8f121d120a13Fa801827',
          sandbox: true
        },
        theGraphMcp: {
          status: 'active',
          gateway: 'https://gateway.thegraph.com/api',
          toolsCount: 3
        },
        circleArcL1: {
          status: 'active',
          network: 'Arc L1 Testnet (50420)',
          walletAddress: agentWallet.getAddress(),
          balanceUsdc: agentWallet.getUSDCBalance()
        },
        hederaHCS: {
          status: 'ready',
          network: hederaConfig.network,
          topicId: hederaConfig.topicId,
          standard: 'HCS-14-Audit',
          hashscanTopicUrl: hederaManager.getHashscanTopicUrl()
        },
        x402Gate: {
          status: 'enforcing',
          facilitator: 'Blocky402 / Hedera Network',
          activeCurrencies: ['USDC', 'HBAR']
        }
      }
    });
  });

  // 2. Agent Identity & Financial Guardrails Status
  server.get('/api/agent/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const agentAddress = agentWallet.getAddress();
    const identity = await verifyAndRegisterAgent(agentAddress);
    const policy = spendingGuard.getPolicy();

    return reply.status(200).send({
      agentAddress,
      identity: {
        isVerified: identity.isVerified,
        agentBookStatus: identity.agentBookStatus,
        nullifierHash: identity.nullifierHash,
        sybilProtected: identity.sybilProtected
      },
      wallet: {
        network: 'arc-testnet',
        chainId: 50420,
        usdcBalance: agentWallet.getUSDCBalance()
      },
      spendingLimits: {
        dailyCapUsdc: policy.dailyCapUsdc,
        spentTodayUsdc: policy.spentTodayUsdc,
        remainingCapUsdc: spendingGuard.getRemainingLimit(),
        singleTxCapUsdc: policy.maxSingleTxUsdc
      },
      hederaAudit: {
        topicId: hederaConfig.topicId,
        topicExplorer: hederaManager.getHashscanTopicUrl()
      }
    });
  });

  // 3. HTTP 402 Autonomous Payment Gate Protected Resource
  // Requires autonomous micropayment of 0.10 USDC to unlock premium data
  server.get('/api/protected/market-intel', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawProofHeader =
      (request.headers['x-402-proof'] as string) ||
      (request.headers['authorization'] as string);

    // Verify proof
    const verification = x402Gate.verifyPaymentProof(rawProofHeader);

    if (!verification.valid) {
      // Create HTTP 402 Challenge
      const challenge = x402Gate.createChallenge(
        agentWallet.getAddress(),
        '0.10',
        'USDC',
        'deep-liquidity-intelligence'
      );

      // Record 402 challenge issuance onto Hedera Consensus Service
      await hcsAuditLedger.logDecision({
        agentAddress: agentWallet.getAddress(),
        action: 'X402_CHALLENGE_ISSUED',
        amountUsdc: 0.10,
        status: 'FLAGGED',
        metadata: {
          challengeId: challenge.challengeId,
          serviceId: challenge.serviceId,
          reason: verification.reason
        }
      });

      reply.header('WWW-Authenticate', challenge.paymentHeader);
      reply.header('X-402-Challenge-Id', challenge.challengeId);
      return reply.status(402).send({
        statusCode: 402,
        error: 'Payment Required',
        message: 'Access to SentinelPay Deep Liquidity Intelligence requires an autonomous x402 micropayment.',
        challenge
      });
    }

    // Access Granted! Record fulfillment to Hedera HCS
    const analytics = await graphClient.fetchPoolAnalytics('0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640');
    const risk = graphClient.evaluateMarketRisk(analytics);

    const auditReceipt = await hcsAuditLedger.logDecision({
      agentAddress: agentWallet.getAddress(),
      action: 'X402_PAYMENT_SETTLED',
      amountUsdc: 0.10,
      graphPoolId: analytics.id,
      status: 'SUCCESS',
      metadata: {
        unlockedResource: '/api/protected/market-intel',
        healthFactor: risk.healthFactor,
        proofToken: rawProofHeader ? rawProofHeader.slice(0, 20) + '...' : ''
      }
    });

    return reply.status(200).send({
      accessGranted: true,
      message: 'x402 Micropayment verified. Protected market intelligence released.',
      audit: {
        hcsTopicId: auditReceipt.topicId,
        sequenceNumber: auditReceipt.sequenceNumber,
        hashscanUrl: auditReceipt.hashscanUrl
      },
      intelligence: {
        poolId: analytics.id,
        poolName: analytics.name,
        protocol: analytics.protocol,
        totalValueLockedUSD: analytics.totalValueLockedUSD,
        volumeUSD: analytics.volumeUSD,
        borrowRateAPR: analytics.borrowRateAPR,
        lendingRateAPR: analytics.lendingRateAPR,
        healthFactor: risk.healthFactor,
        recommendedAction: risk.recommendedAction,
        confidence: risk.confidence
      }
    });
  });

  // 4. Autonomous Client Settle Endpoint (Agent helper)
  server.post('/api/x402/settle', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { challenge: X402Challenge; payerAddress?: string };
    if (!body || !body.challenge) {
      return reply.status(400).send({ error: 'Missing challenge payload in request body' });
    }

    const payer = body.payerAddress || agentWallet.getAddress();
    const settlement = await x402Gate.settlePayment(body.challenge, payer);

    return reply.status(200).send(settlement);
  });

  // 5. Submit Audit Record to Hedera HCS
  server.post('/api/audit/log', async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.body as any;
    if (!payload || !payload.action) {
      return reply.status(400).send({ error: 'Missing action in audit payload' });
    }

    const receipt = await hcsAuditLedger.logDecision({
      agentAddress: payload.agentAddress || agentWallet.getAddress(),
      action: payload.action,
      amountUsdc: payload.amountUsdc,
      arcTxHash: payload.arcTxHash,
      graphPoolId: payload.graphPoolId,
      worldNullifier: payload.worldNullifier,
      status: payload.status || 'SUCCESS',
      metadata: payload.metadata
    });

    return reply.status(201).send(receipt);
  });

  // 6. Query Recorded HCS Audit History
  server.get('/api/audit/records', async (request: FastifyRequest, reply: FastifyReply) => {
    const records = hcsAuditLedger.getAuditHistory(50);
    const isChainValid = hcsAuditLedger.verifyChainIntegrity();

    return reply.status(200).send({
      totalCount: records.length,
      chainIntegrityVerified: isChainValid,
      topicId: hederaConfig.topicId,
      hashscanTopicUrl: hederaManager.getHashscanTopicUrl(),
      records
    });
  });

  return server;
}

export async function startServer(port: number = Number(process.env.PORT) || 4000, host: string = '0.0.0.0'): Promise<FastifyInstance> {
  const server = buildServer();
  try {
    const address = await server.listen({ port, host });
    logger.success('Server', `SentinelPay HTTP & x402 Autonomous Gate server online at ${address}`);
    logger.info('Server', `Health endpoint: ${address}/health`);
    logger.info('Server', `x402 Protected Gate: ${address}/api/protected/market-intel`);
    return server;
  } catch (err: any) {
    logger.error('Server', `Failed to start server: ${err.message}`);
    throw err;
  }
}

// Start if executed directly
if (require.main === module || (process.argv[1] && process.argv[1].includes('server.ts'))) {
  startServer();
}
