# 🤝 Sponsor Technology Integrations — ETHOnline 2026

SentinelPay is architected from the ground up to integrate 4 premier decentralized technologies into a cohesive, production-grade autonomous agent:

---

## 1. 🌐 World ID / World Network (AgentBook & Proof of Personhood)

### Integration Summary
- **Module Path:** [`src/modules/identity-world/`](../src/modules/identity-world/)
- **Core Files:** `verifier.ts`, `agentbook.ts`, `config.ts`
- **Key Concepts:** Zero-Knowledge Proofs, Sybil Defense, AgentBook Registry, CAIP-122 Challenge

### Why It Matters
AI agents in decentralized finance pose catastrophic Sybil risks: a single malicious actor can deploy thousands of autonomous bots to manipulate liquidity pools or drain micro-incentives. SentinelPay uses **World ID Proof of Personhood** to ensure every agent operates on behalf of a verified unique human operator without doxxing the operator's real identity.

### Code Highlights
```typescript
const verification = await verifyAndRegisterAgent(agentWallet);
// Returns: isVerified: true, status: 'Registered', nullifierHash: '0x776f...'
```

---

## 2. 📊 The Graph (Subgraph MCP Server & Natural Language Reasoning)

### Integration Summary
- **Module Path:** [`src/modules/data-graph/`](../src/modules/data-graph/)
- **Core Files:** `mcpTools.ts`, `queries.ts`, `client.ts`, `types.ts`
- **Key Concepts:** Subgraph GraphQL, Model Context Protocol (MCP), Natural Language Tool Calling, Protocol Risk Matrix

### Why It Matters
Instead of relying on centralized price feeds, SentinelPay connects directly to decentralized Subgraphs via **Model Context Protocol (MCP)**. LLM agents can query market liquidity, compare cross-protocol lending/borrowing APRs (Aave v3 vs Compound v3), and calculate collateral health factors using natural language prompts.

### Code Highlights
```typescript
const mcpHandler = new SubgraphMcpHandler(graphClient);
const result = await mcpHandler.processNaturalLanguageQuery(
  "Compare current lending and borrow APR across Messari Standardized subgraphs for USDC"
);
```

---

## 3. 💳 Circle & Arc Network (Circle Agent Stack on Arc L1)

### Integration Summary
- **Module Path:** [`src/modules/finance-circle/`](../src/modules/finance-circle/)
- **Core Files:** `wallet.ts`, `spendingLimits.ts`, `approval.ts`, `executor.ts`
- **Key Concepts:** Arc L1 Testnet (50420), Autonomous USDC Wallets, Single/Daily Spending Guards, Prompt Injection Defense

### Why It Matters
Autonomous wallets must be strictly bounded to prevent unauthorized asset draining from LLM hallucinations or adversarial prompt injection. SentinelPay's `ApprovalGate` and `SpendingLimitGuard` enforce deterministic transaction limits (max 25 USDC single tx, 50 USDC daily cap) and produce live Arc Explorer transaction links for every settlement.

### Code Highlights
```typescript
const payment = await executor.executePayment({
  recipient: '0x1111111254fb6c44bac0bed2854e76f90643097d',
  amountUsdc: 5.0,
  purpose: 'Pay for decentralized Subgraph MCP node telemetry service'
});
```

---

## 4. ⚡ Hedera (Consensus Service HCS-14 & x402 Payment Gates)

### Integration Summary
- **Module Path:** [`src/modules/audit-hedera/`](../src/modules/audit-hedera/)
- **Core Files:** `hcsLogger.ts`, `x402Gate.ts`, `client.ts`
- **Key Concepts:** HCS-14 Universal Agent Audit Trail, SHA-256 Running Hash Chaining, HTTP 402 Payment Required, Hashscan Explorer

### Why It Matters
Autonomous agents require third-party auditability without trusting local server logs. Every critical decision is permanently registered onto **Hedera Consensus Service (HCS-14)** with cryptographic SHA-256 hash chaining. Additionally, SentinelPay handles **HTTP 402 Payment Required** challenges, autonomously settling machine-to-machine micropayments with cryptographic proof tokens.

### Code Highlights
```typescript
const receipt = await hcsAuditLedger.logDecision({
  agentAddress: agentWallet,
  action: 'ARC_PAYMENT_EXECUTED',
  amountUsdc: 0.50,
  arcTxHash: paymentResult.txHash,
  graphPoolId: poolData.id,
  worldNullifier: identity.nullifierHash
});
// Receipt includes sequenceNumber, runningHash, and live Hashscan URL
```
