import { Card, CardContent } from "@/components/ui/card";
import { Coins, Pickaxe, Crown, Check } from "lucide-react";

export default function EcosystemOverview() {
  const ecosystemFeatures = [
    {
      icon: <Coins className="h-10 w-10" />,
      title: "BAM Token",
      description: "Native utility token powering the entire ecosystem with staking rewards, governance rights, and exclusive access benefits.",
      features: [
        "100B Fixed Supply",
        "BSC Network",
        "Deflationary Mechanism"
      ],
      color: "text-primary"
    },
    {
      icon: <Pickaxe className="h-10 w-10" />,
      title: "BAM ApexMiner",
      description: "Revolutionary mining platform combining traditional mining with DeFi yield strategies for maximum returns.",
      features: [
        "24/7 Mining Operations",
        "Auto-Compounding",
        "Multi-Asset Mining"
      ],
      color: "text-secondary"
    },
    {
      icon: <Crown className="h-10 w-10" />,
      title: "BAM VIP Access",
      description: "Exclusive membership program offering premium features, higher rewards, and early access to new products.",
      features: [
        "Premium Staking Rates",
        "Exclusive NFT Access",
        "Priority Support"
      ],
      color: "text-[hsl(45,90%,55%)]"
    }
  ];

  return (
    <section id="ecosystem" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">BAM Ecosystem</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive DeFi ecosystem designed to multiply your investments through innovative staking, mining, and community-driven growth strategies.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ecosystemFeatures.map((feature, index) => (
            <Card 
              key={index}
              className="glass-card border-border hover:transform hover:scale-105 transition-all duration-300 hover:animate-glow group"
            >
              <CardContent className="p-8">
                <div className={`${feature.color} mb-4 group-hover:animate-pulse`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-secondary mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
