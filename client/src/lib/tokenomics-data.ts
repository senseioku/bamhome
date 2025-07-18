export interface TokenomicsData {
  name: string;
  value: number;
  percentage: number;
  amount: number;
  color: string;
}

export const tokenomicsData: TokenomicsData[] = [
  {
    name: "Ecosystem Growth",
    value: 25,
    percentage: 25,
    amount: 25000000000,
    color: "hsl(195, 100%, 50%)" // primary
  },
  {
    name: "Public Sale",
    value: 20,
    percentage: 20,
    amount: 20000000000,
    color: "hsl(160, 100%, 50%)" // secondary
  },
  {
    name: "Treasury",
    value: 20,
    percentage: 20,
    amount: 20000000000,
    color: "hsl(240, 60%, 60%)" // accent
  },
  {
    name: "Advisors",
    value: 15,
    percentage: 15,
    amount: 15000000000,
    color: "hsl(45, 90%, 55%)" // gold
  },
  {
    name: "Community Incentives",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(270, 60%, 60%)" // purple
  },
  {
    name: "CEX Listings",
    value: 10,
    percentage: 10,
    amount: 10000000000,
    color: "hsl(0, 84%, 60%)" // red
  }
];

export const totalSupply = 100000000000; // 100 billion BAM tokens
