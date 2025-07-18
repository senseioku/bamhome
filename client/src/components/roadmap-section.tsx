import { Card, CardContent } from "@/components/ui/card";

export default function RoadmapSection() {
  const roadmapItems = [
    {
      quarter: "Q1 2024",
      title: "Foundation Launch",
      items: [
        "BAM Token Launch",
        "ApexMiner Platform",
        "Basic Staking"
      ],
      color: "bg-primary",
      isLeft: true
    },
    {
      quarter: "Q2 2024",
      title: "Ecosystem Expansion",
      items: [
        "BAM DEX Launch",
        "NFT Marketplace",
        "VIP Program"
      ],
      color: "bg-secondary",
      isLeft: false
    },
    {
      quarter: "Q3 2024",
      title: "Community & Gaming",
      items: [
        "Play 2 Earn Platform",
        "BAM Talk Community",
        "DAO Implementation"
      ],
      color: "bg-accent",
      isLeft: true
    },
    {
      quarter: "Q4 2024",
      title: "Global Expansion",
      items: [
        "Major CEX Listings",
        "Cross-chain Integration",
        "Enterprise Partnerships"
      ],
      color: "bg-[hsl(45,90%,55%)]",
      isLeft: false
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Roadmap</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our strategic development plan for building the most comprehensive DeFi ecosystem.
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary to-secondary"></div>
          
          <div className="space-y-12">
            {roadmapItems.map((item, index) => (
              <div key={index} className="relative flex items-center">
                {item.isLeft ? (
                  <>
                    <div className="flex-1 pr-8 text-right">
                      <Card className="glass-card border-border">
                        <CardContent className="p-6">
                          <h3 className={`text-xl font-bold mb-2 text-primary`}>{item.quarter}</h3>
                          <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {item.items.map((listItem, listIndex) => (
                              <li key={listIndex}>• {listItem}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    <div className={`w-6 h-6 ${item.color} rounded-full border-4 border-background z-10`}></div>
                    <div className="flex-1 pl-8"></div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 pr-8"></div>
                    <div className={`w-6 h-6 ${item.color} rounded-full border-4 border-background z-10`}></div>
                    <div className="flex-1 pl-8">
                      <Card className="glass-card border-border">
                        <CardContent className="p-6">
                          <h3 className={`text-xl font-bold mb-2 text-secondary`}>{item.quarter}</h3>
                          <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {item.items.map((listItem, listIndex) => (
                              <li key={listIndex}>• {listItem}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
