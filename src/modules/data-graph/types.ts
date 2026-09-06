/**
 * The Graph Subgraph Data Interfaces
 */
export interface PoolAnalytics {
  id: string;
  name: string;
  protocol: string;
  totalValueLockedUSD: number;
  volumeUSD: number;
  borrowRateAPR?: number;
  lendingRateAPR?: number;
  utilizationRate?: number;
}

export interface GraphQueryResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export interface MarketRiskAssessment {
  poolId: string;
  healthFactor: number;
  recommendedAction: 'HOLD' | 'REBALANCE' | 'PAY_SERVICE' | 'LIQUIDATE_PROTECT';
  confidence: number;
  marketData: PoolAnalytics;
}

export interface McpToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: McpToolParameter[];
}

export interface NaturalLanguageQueryResult {
  query: string;
  matchedTool: string;
  toolInput: Record<string, any>;
  data: any;
  summary: string;
}

