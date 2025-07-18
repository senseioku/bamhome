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
    name: "Ecosystem Growth",
    value: 25,
    percentage: 25,
    amount: 25000000000,
    color: "hsl(195, 100%, 50%)", // primary
    vestingSchedule: {
      tgeUnlock: 5, // 5% at TGE
      vestingPeriod: 60, // 5 years total
      cliffPeriod: 12, // 1 year cliff
      description: "5% at TGE, 12-month cliff, then linear vesting over 48 months"
    }
  },
  {
    name: "Public Sale",
    value: 20,
    percentage: 20,
    amount: 20000000000,
    color: "hsl(160, 100%, 50%)", // secondary
    vestingSchedule: {
      tgeUnlock: 20, // 20% at TGE
      vestingPeriod: 40, // remaining over 40 months
      cliffPeriod: 0, // no cliff
      description: "20% at TGE, remaining vested linearly over 40 months"
    }
  },
  {
    name: "Treasury",
    value: 20,
    percentage: 20,
    amount: 20000000000,
    color: "hsl(240, 60%, 60%)", // accent
    vestingSchedule: {
      tgeUnlock: 0, // 0% at TGE
      vestingPeriod: 72, // 6 years
      cliffPeriod: 6, // 6 months cliff
      description: "0% at TGE, 6-month cliff, then linear vesting over 66 months"
    }
  },
  {
    name: "Advisors",
    value: 15,
    percentage: 15,
    amount: 15000000000,
    color: "hsl(45, 90%, 55%)", // gold
    vestingSchedule: {
      tgeUnlock: 0, // 0% at TGE
      vestingPeriod: 42, // 3.5 years
      cliffPeriod: 6, // 6 months cliff
      description: "0% at TGE, 6-month cliff, then linear vesting over 36 months"
    }
  },
  {
    name: "Community Incentives",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(270, 60%, 60%)", // purple
    vestingSchedule: {
      tgeUnlock: 100, // 100% at TGE
      vestingPeriod: 0, // no vesting
      cliffPeriod: 0, // no cliff
      description: "100% unlocked at TGE for immediate community rewards"
    }
  },
  {
    name: "CEX Listings",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(0, 84%, 60%)", // red
    vestingSchedule: {
      tgeUnlock: 100, // 100% at TGE
      vestingPeriod: 0, // no vesting
      cliffPeriod: 0, // no cliff
      description: "100% unlocked at TGE for exchange liquidity provision"
    }
  }
];

export const totalSupply = 100000000000; // 100 billion BAM tokens

export const vestingHighlights = [
  "Fair Launch with 20% public allocation unlocked at TGE",
  "Long-term aligned team and advisor vesting with cliff periods",
  "Treasury funds secured with 6-year gradual release",
  "Immediate liquidity for community rewards and exchange listings",
  "Anti-dump mechanisms protect token value and community interests"
];
