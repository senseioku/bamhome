export interface TokenomicsData {
  name: string;
  value: number;
  percentage: number;
  amount: number;
  color: string;
  vestingSchedule: {
    tgeUnlock: number; // percentage unlocked at Token Generation Event
    vestingPeriod: number; // total vesting period in months
    cliffPeriod: number; // cliff period in months
    description: string;
  };
}

export const tokenomicsData: TokenomicsData[] = [
  {
    name: "Initial Burn",
    value: 25,
    percentage: 25,
    amount: 25000000000,
    color: "hsl(0, 70%, 50%)", // red for burned tokens
    vestingSchedule: {
      tgeUnlock: 100, // Already burned
      vestingPeriod: 0, // permanent burn
      cliffPeriod: 0, // no cliff
      description: "Permanently burned to reduce supply and increase scarcity"
    }
  },
  {
    name: "Public Sale",
    value: 20,
    percentage: 20,
    amount: 15000000000,
    color: "hsl(45, 90%, 55%)", // primary golden
    vestingSchedule: {
      tgeUnlock: 50, // 50% at TGE
      vestingPeriod: 3, // remaining over 3 months
      cliffPeriod: 0, // no cliff
      description: "50% unlocked at TGE, 50% vested linearly over 3 months"
    }
  },
  {
    name: "Liquidity Pool",
    value: 20,
    percentage: 20,
    amount: 15000000000,
    color: "hsl(210, 85%, 55%)", // blue for liquidity
    vestingSchedule: {
      tgeUnlock: 100, // locked but accessible for DEX
      vestingPeriod: 0, // locked for 12 months
      cliffPeriod: 12, // 12 month lock
      description: "Locked for 12 months for DEX stability (Uniswap, PancakeSwap)"
    }
  },
  {
    name: "Presale",
    value: 15,
    percentage: 15,
    amount: 11250000000,
    color: "hsl(38, 85%, 50%)", // darker amber
    vestingSchedule: {
      tgeUnlock: 25, // 25% at TGE
      vestingPeriod: 6, // remaining over 6 months
      cliffPeriod: 0, // no cliff
      description: "25% unlocked at TGE, 75% vested linearly over 6 months"
    }
  },
  {
    name: "Staking Rewards",
    value: 15,
    percentage: 15,
    amount: 11250000000,
    color: "hsl(35, 80%, 45%)", // bronze-gold
    vestingSchedule: {
      tgeUnlock: 0, // 0% at TGE
      vestingPeriod: 36, // linear over 36 months
      cliffPeriod: 0, // no cliff
      description: "36-month linear release for sustainable APY (50-100% first 6mo)"
    }
  },
  {
    name: "Team & Advisors",
    value: 5,
    percentage: 5,
    amount: 3750000000,
    color: "hsl(51, 100%, 65%)", // bright yellow-gold
    vestingSchedule: {
      tgeUnlock: 0, // 0% at TGE
      vestingPeriod: 48, // 48 months
      cliffPeriod: 12, // 12 month cliff
      description: "12-month cliff, then 48-month vesting to prevent rug pulls"
    }
  },
  {
    name: "Marketing/CEX",
    value: 5,
    percentage: 5,
    amount: 3750000000,
    color: "hsl(42, 95%, 60%)", // light gold
    vestingSchedule: {
      tgeUnlock: 50, // 50% at TGE
      vestingPeriod: 12, // remaining over 12 months
      cliffPeriod: 0, // no cliff
      description: "50% at TGE for exchange listings, 50% over 12 months"
    }
  },
  {
    name: "Ecosystem Fund",
    value: 5,
    percentage: 5,
    amount: 3750000000,
    color: "hsl(40, 82%, 48%)", // darker gold
    vestingSchedule: {
      tgeUnlock: 0, // 0% at TGE
      vestingPeriod: 0, // DAO controlled
      cliffPeriod: 0, // no cliff
      description: "DAO-controlled for partnerships and development"
    }
  }
];

export const totalSupply = 100000000000; // 100 billion BAM tokens

export const vestingHighlights = [
  "25% initial burn permanently reduces circulating supply for scarcity",
  "20% liquidity locked for 12 months ensuring DEX stability",
  "Presale anti-dump: 25% TGE unlock, 75% vested over 6 months",
  "Team cliff protection: 12-month cliff + 48-month vesting prevents rug pulls",
  "Sustainable staking: 36-month linear rewards (50-100% APY first 6mo)",
  "DAO-controlled ecosystem fund for strategic partnerships"
];
