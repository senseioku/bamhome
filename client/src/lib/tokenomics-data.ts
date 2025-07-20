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
    name: "Public Sale",
    value: 25,
    percentage: 25,
    amount: 25000000000,
    color: "hsl(45, 90%, 55%)", // primary golden
    vestingSchedule: {
      tgeUnlock: 100, // 100% at TGE
      vestingPeriod: 0, // no vesting
      cliffPeriod: 0, // no cliff
      description: "Vesting Period: None, Unlocked at TGE: 100%"
    }
  },
  {
    name: "Presale",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(38, 85%, 50%)", // darker amber
    vestingSchedule: {
      tgeUnlock: 25, // 25% at TGE
      vestingPeriod: 6, // remaining over 6 months
      cliffPeriod: 0, // no cliff
      description: "25% unlocked at TGE, remaining vested over 6 months"
    }
  },
  {
    name: "Ecosystem Growth",
    value: 20,
    percentage: 20,
    amount: 20000000000,
    color: "hsl(35, 80%, 45%)", // bronze-gold
    vestingSchedule: {
      tgeUnlock: 20, // 20% at TGE
      vestingPeriod: 40, // remaining over 40 months
      cliffPeriod: 0, // no cliff
      description: "20% unlocked at TGE, remaining vested over 40 months"
    }
  },
  {
    name: "Advisors",
    value: 15,
    percentage: 15,
    amount: 15000000000,
    color: "hsl(51, 100%, 65%)", // bright yellow-gold
    vestingSchedule: {
      tgeUnlock: 0, // 0% at TGE
      vestingPeriod: 48, // 48 months
      cliffPeriod: 0, // no cliff
      description: "Vesting Period: 48 months, Unlocked at TGE: 0%"
    }
  },
  {
    name: "Treasury",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(42, 95%, 60%)", // light gold
    vestingSchedule: {
      tgeUnlock: 0, // 0% at TGE
      vestingPeriod: 36, // 36 months vesting
      cliffPeriod: 6, // 6 months cliff
      description: "Cliff 6 months, Vested 36 months, Unlocked at TGE: 0%"
    }
  },
  {
    name: "Community Incentives",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(48, 88%, 52%)", // medium gold
    vestingSchedule: {
      tgeUnlock: 100, // 100% at TGE
      vestingPeriod: 0, // no vesting
      cliffPeriod: 0, // no cliff
      description: "Vesting Period: None, Unlocked at TGE: 100%"
    }
  },
  {
    name: "CEX Listings",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(40, 82%, 48%)", // darker gold
    vestingSchedule: {
      tgeUnlock: 100, // 100% at TGE
      vestingPeriod: 0, // no vesting
      cliffPeriod: 0, // no cliff
      description: "Vesting Period: None, Unlocked at TGE: 100%"
    }
  }
];

export const totalSupply = 100000000000; // 100 billion BAM tokens

export const vestingHighlights = [
  "Fair Launch with 25% public sale allocation fully unlocked at TGE",
  "Presale allocation with 50% TGE unlock and 6-month vesting for remaining",
  "Long-term aligned advisor vesting over 48 months with 0% TGE unlock",
  "Treasury funds secured with 6-month cliff and 36-month vesting",
  "Immediate liquidity for community incentives and CEX listings (100% TGE)",
  "Anti-dump mechanisms protect token value and community interests"
];
