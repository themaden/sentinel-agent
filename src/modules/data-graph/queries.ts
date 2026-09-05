/**
 * Standard GraphQL queries for The Graph Subgraphs (e.g. Messari standard & Uniswap/Aave)
 */
export const GET_POOL_ANALYTICS_QUERY = `
  query GetPoolAnalytics($id: ID!) {
    pool(id: $id) {
      id
      name
      totalValueLockedUSD
      volumeUSD
    }
  }
`;

export const GET_LENDING_MARKET_QUERY = `
  query GetLendingMarket($marketId: ID!) {
    market(id: $marketId) {
      id
      name
      totalValueLockedUSD
      borrowRate
      rates {
        rate
        side
        type
      }
    }
  }
`;
