import { execSync } from 'child_process';
import { logger } from '../utils/logger';

async function runAllTests() {
  console.log('================================================================');
  console.log('           SentinelPay - Full Hackathon Test Runner             ');
  console.log('         Days 1, 2, and 3 Automated End-to-End Suite            ');
  console.log('================================================================\n');

  const testSuites = [
    { name: 'Day 1: Sybil-Resistant Identity (World ID & AgentBook)', command: 'npm.cmd run test:day1' },
    { name: 'Day 2: Data Intelligence & Arc L1 (The Graph MCP & Circle)', command: 'npm.cmd run test:day2' },
    { name: 'Day 3: Audit Trails & Autonomous Gates (Hedera HCS & x402)', command: 'npm.cmd run test:day3' }
  ];

  const results: Array<{ name: string; passed: boolean; durationMs: number }> = [];

  for (const suite of testSuites) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`🚀 Executing: ${suite.name}`);
    console.log(`----------------------------------------------------------------\n`);

    const start = Date.now();
    try {
      execSync(suite.command, { stdio: 'inherit', env: process.env });
      const durationMs = Date.now() - start;
      results.push({ name: suite.name, passed: true, durationMs });
    } catch (err: any) {
      const durationMs = Date.now() - start;
      results.push({ name: suite.name, passed: false, durationMs });
      logger.error('MasterTest', `Test suite failed: ${suite.name}`);
      process.exit(1);
    }
  }

  console.log('\n================================================================');
  console.log('                   HACKATHON ALL TESTS SUMMARY                  ');
  console.log('================================================================');
  results.forEach((r, index) => {
    console.log(`  [Day ${index + 1}] ${r.passed ? '✅ PASSED' : '❌ FAILED'} (${(r.durationMs / 1000).toFixed(2)}s) - ${r.name}`);
  });
  console.log('================================================================');
  console.log('  🎉 ALL 3 HACKATHON MILESTONES VERIFIED AND READY FOR SUBMISSION! ');
  console.log('================================================================\n');
}

runAllTests();
