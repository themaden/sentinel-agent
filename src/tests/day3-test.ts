import { hederaConfig, hederaManager } from '../modules/audit-hedera/client';
import { hcsAuditLedger } from '../modules/audit-hedera/hcsLogger';
import { x402Gate } from '../modules/audit-hedera/x402Gate';
import { buildServer } from '../server/server';
import { logger } from '../utils/logger';

async function runDay3Tests() {
  console.log('================================================================');
  console.log('            SentinelPay - Day 3 Verification Runner             ');
  console.log('   Milestone: Hedera HCS Immutable Audit Trails & x402 Gates    ');
  console.log('================================================================\n');

  try {
    // =========================================================================
    // PART 1: Hedera Consensus Service (HCS-14) Audit Trail
    // =========================================================================
    console.log('>>> [PART 1] Testing Hedera HCS-14 Immutable Audit Trails <<<\n');

    // 1. Verify Hedera & HCS Topic Setup
    logger.info('TestStep1', 'Validating Hedera Consensus Service topic and client configuration...');
    console.log(`- Network:            ${hederaConfig.network}`);
    console.log(`- Operator Account:   ${hederaConfig.operatorId}`);
    console.log(`- HCS Topic ID:       ${hederaConfig.topicId}`);
    console.log(`- Standard:           HCS-14-Audit`);
    console.log(`- Topic Explorer:     ${hederaManager.getHashscanTopicUrl()}\n`);

    // 2. Submit Multi-Chain Decision Audit Record
    logger.info('TestStep2', 'Submitting multi-chain decision record to HCS-14 audit topic...');
    const testAgentAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const auditRecord1 = await hcsAuditLedger.logDecision({
      agentAddress: testAgentAddress,
      action: 'ARC_PAYMENT_EXECUTED',
      amountUsdc: 2.50,
      arcTxHash: '0x3fa99b1a6c4293f01c801d9f0a256972412b1897c8d765fe65421098a8a4f912',
      graphPoolId: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      worldNullifier: '0x776f726c642d69642d68756d616e2d3078373432643335636336363334633035',
      status: 'SUCCESS',
      metadata: {
        reason: 'Payment for high-frequency indexer query',
        confidence: 0.96
      }
    });

    console.log('\n--- HCS-14 AUDIT RECEIPT ---');
    console.log(`Topic ID:             ${auditRecord1.topicId}`);
    console.log(`Sequence Number:      #${auditRecord1.sequenceNumber}`);
    console.log(`Consensus Timestamp:  ${auditRecord1.consensusTimestamp}`);
    console.log(`Running Hash:         ${auditRecord1.runningHash.slice(0, 24)}...`);
    console.log(`Hashscan URL:         ${auditRecord1.hashscanUrl}\n`);

    // 3. Cryptographic Chain Integrity Verification
    logger.info('TestStep3', 'Submitting sequential records and testing cryptographic SHA-256 chain integrity...');
    await hcsAuditLedger.logDecision({
      agentAddress: testAgentAddress,
      action: 'TELEMETRY_INGESTED',
      graphPoolId: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      status: 'SUCCESS'
    });

    await hcsAuditLedger.logDecision({
      agentAddress: testAgentAddress,
      action: 'SPENDING_CAP_ENFORCED',
      amountUsdc: 30.0,
      status: 'BLOCKED',
      metadata: { reason: 'Single tx limit exceeded' }
    });

    const isIntegrityValid = hcsAuditLedger.verifyChainIntegrity();
    console.log(`Audit Ledger Chain Integrity: ${isIntegrityValid ? 'VERIFIED (PASS)' : 'FAILED'}\n`);
    if (!isIntegrityValid) {
      throw new Error('HCS Audit chain integrity check failed!');
    }

    // 4. Query Audit Records History
    logger.info('TestStep4', 'Querying recorded HCS audit receipts from ledger history...');
    const history = hcsAuditLedger.getAuditHistory(10);
    console.log(`Retrieved ${history.length} audit entries from HCS Topic ${hederaConfig.topicId}`);
    history.forEach((h) => {
      console.log(`  - [#${h.sequenceNumber}] [${h.record.action}] Status: ${h.record.status} (Hash: ${h.runningHash.slice(0, 12)}...)`);
    });
    console.log('');

    // =========================================================================
    // PART 2: HTTP 402 Autonomous Payment Gate Protocol
    // =========================================================================
    console.log('>>> [PART 2] Testing HTTP 402 Payment Required Autonomous Gate <<<\n');

    // 5. Generate HTTP 402 Challenge
    logger.info('TestStep5', 'Generating RFC-compliant HTTP 402 Payment Required challenge...');
    const challenge = x402Gate.createChallenge(
      testAgentAddress,
      '0.10',
      'USDC',
      'subgraph-deep-analytics'
    );

    console.log(`Status Code:     ${challenge.statusCode}`);
    console.log(`Challenge ID:    ${challenge.challengeId}`);
    console.log(`Cost:            ${challenge.price} ${challenge.currency}`);
    console.log(`Pay To:          ${challenge.payTo}`);
    console.log(`Facilitator:     ${challenge.facilitator}`);
    console.log(`Payment Header:  ${challenge.paymentHeader}\n`);

    // 6. Autonomous Payment Settlement & Proof Verification
    logger.info('TestStep6', 'Agent autonomously settling x402 challenge and verifying payment proof...');
    const settlement = await x402Gate.settlePayment(challenge, testAgentAddress);

    console.log(`Settlement Status:  ${settlement.isSettled ? 'SETTLED' : 'PENDING'}`);
    console.log(`Payment Proof:      ${settlement.paymentProof}`);
    console.log(`Auth Header:        ${settlement.authHeader}\n`);

    // Verify valid proof
    const verifyValid = x402Gate.verifyPaymentProof(settlement.paymentProof);
    if (!verifyValid.valid) {
      throw new Error(`Payment proof rejected: ${verifyValid.reason}`);
    }
    logger.success('TestStep6', 'Cryptographic payment proof accepted!');

    // Replay attack prevention check
    logger.info('TestStep6b', 'Testing replay attack prevention with already redeemed proof...');
    const replayCheck = x402Gate.verifyPaymentProof(settlement.paymentProof);
    if (replayCheck.valid) {
      throw new Error('Security vulnerability: Replay attack was not prevented!');
    }
    logger.success('TestStep6b', `Replay attempt blocked as expected: ${replayCheck.reason}\n`);

    // =========================================================================
    // PART 3: Fastify Server HTTP 402 Gate End-to-End Interception
    // =========================================================================
    console.log('>>> [PART 3] Testing Fastify Server x402 Gate Interception <<<\n');

    const app = buildServer();

    // 7a. Health Check
    logger.info('TestStep7a', 'Querying /health endpoint...');
    const healthRes = await app.inject({
      method: 'GET',
      url: '/health'
    });
    console.log(`Health Status: ${healthRes.statusCode} - ${JSON.parse(healthRes.body).status}\n`);
    if (healthRes.statusCode !== 200) {
      throw new Error(`Health check failed with status ${healthRes.statusCode}`);
    }

    // 7b. Access Gated Endpoint without Payment (Should return HTTP 402)
    logger.info('TestStep7b', 'Accessing /api/protected/market-intel without proof (expecting HTTP 402)...');
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/protected/market-intel'
    });

    console.log(`Response Status:  ${unauthRes.statusCode} (Expected: 402)`);
    console.log(`WWW-Authenticate: ${unauthRes.headers['www-authenticate']}`);
    const unauthBody = JSON.parse(unauthRes.body);
    console.log(`Challenge ID:     ${unauthBody.challenge?.challengeId}\n`);

    if (unauthRes.statusCode !== 402) {
      throw new Error(`Expected 402 Payment Required, got ${unauthRes.statusCode}`);
    }

    // 7c. Settle the Challenge and Access with Proof (Should return HTTP 200)
    logger.info('TestStep7c', 'Settling challenge and requesting protected endpoint with valid proof...');
    const appSettlement = await x402Gate.settlePayment(unauthBody.challenge, testAgentAddress);

    const authRes = await app.inject({
      method: 'GET',
      url: '/api/protected/market-intel',
      headers: {
        'x-402-proof': appSettlement.paymentProof
      }
    });

    console.log(`Response Status:  ${authRes.statusCode} (Expected: 200)`);
    const authBody = JSON.parse(authRes.body);
    console.log(`Access Granted:   ${authBody.accessGranted}`);
    console.log(`Message:          ${authBody.message}`);
    console.log(`HCS Audit Tx:     Sequence #${authBody.audit?.sequenceNumber}`);
    console.log(`Hashscan URL:     ${authBody.audit?.hashscanUrl}`);
    console.log(`Pool Name:        ${authBody.intelligence?.poolName} ($${(authBody.intelligence?.totalValueLockedUSD / 1e6).toFixed(2)}M TVL)\n`);

    if (authRes.statusCode !== 200 || !authBody.accessGranted) {
      throw new Error('Failed to access protected resource with valid settlement proof');
    }

    // =========================================================================
    // Final Milestone Validation
    // =========================================================================
    console.log('================================================================');
    console.log('  ✅ DAY 3 CRITERIA ACHIEVED:                                    ');
    console.log('  - Hedera Consensus Service (HCS-14) Universal Audit Ledger     ');
    console.log('  - Cryptographic running SHA-256 hash chaining & verification   ');
    console.log('  - Verifiable Hashscan Explorer links generated                 ');
    console.log('  - HTTP 402 Payment Required autonomous challenge generation    ');
    console.log('  - Autonomous micropayment settlement with replay protection    ');
    console.log('  - Fastify microservice autonomous gate verified end-to-end     ');
    console.log('================================================================\n');

  } catch (err: any) {
    logger.error('Day3Test', 'Day 3 Test Suite failed:', err.message);
    process.exit(1);
  }
}

runDay3Tests();
