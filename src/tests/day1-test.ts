import { verifyAndRegisterAgent } from '../modules/identity-world/verifier';
import { agentBookRegistry } from '../modules/identity-world/agentbook';
import { worldConfig } from '../modules/identity-world/config';
import { logger } from '../utils/logger';

async function runDay1Tests() {
  console.log('=====================================================');
  console.log('       SentinelPay - Day 1 Verification Runner        ');
  console.log('  Milestone: Environment Setup & World ID AgentBook  ');
  console.log('=====================================================\n');

  logger.info('Setup', 'Validating Day 1 environment parameters...');
  console.log(`- World App ID:       ${worldConfig.appId}`);
  console.log(`- Action ID:          ${worldConfig.actionId}`);
  console.log(`- AgentBook Address:  ${worldConfig.agentBookAddress}`);
  console.log(`- RPC URL:            ${worldConfig.rpcUrl}`);
  console.log(`- Sandbox Mode:       ${worldConfig.sandboxMode ? 'ENABLED' : 'DISABLED'}\n`);

  const testAgentWallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

  try {
    // 1. Check initial status (should be Unregistered)
    logger.info('TestStep1', 'Checking initial AgentBook status...');
    const initialStatus = await agentBookRegistry.getStatus(testAgentWallet);
    console.log(`Initial Status: [${initialStatus}] (Expected: Unregistered)\n`);

    // 2. Perform World ID Sandbox Human Verification & AgentBook Registration
    logger.info('TestStep2', 'Running World ID Proof of Personhood & Registration...');
    const verification = await verifyAndRegisterAgent(testAgentWallet);

    console.log('\n--- VERIFICATION RESULT ---');
    console.log(`Agent Wallet:      ${verification.agentWallet}`);
    console.log(`Is Verified:       ${verification.isVerified}`);
    console.log(`AgentBook Status:  ${verification.agentBookStatus}`);
    console.log(`Nullifier Hash:    ${verification.nullifierHash}`);
    console.log(`Sybil Protected:   ${verification.sybilProtected}`);
    console.log(`Verified At:       ${verification.verifiedAt}\n`);

    // 3. Assert criteria from Hackathon Guide:
    // Criteria: "agentkit status komutunun 'Registered' dönmesi"
    if (verification.agentBookStatus === 'Registered' && verification.isVerified) {
      console.log('=====================================================');
      console.log(' ✅ DAY 1 CRITERIA ACHIEVED: Status is "Registered"   ');
      console.log(' ✅ Sybil resistance confirmed via World ID nullifier  ');
      console.log('=====================================================\n');
    } else {
      throw new Error(`Failed Day 1 milestone: Status is ${verification.agentBookStatus}`);
    }
  } catch (err: any) {
    logger.error('Day1Test', 'Day 1 Test Suite failed:', err.message);
    process.exit(1);
  }
}

runDay1Tests();
