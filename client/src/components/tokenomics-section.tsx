import { Card, CardContent } from "@/components/ui/card";
import PieChart from "@/components/ui/pie-chart";
import { tokenomicsData } from "@/lib/tokenomics-data";

export default function TokenomicsSection() {
  return (
    <section id="tokenomics" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Tokenomics</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Strategic token allocation designed for sustainable growth and maximum value creation for the BAM community.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Tokenomics Chart */}
          <div className="relative">
            <Card className="glass-card border-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-8 text-center">Token Distribution</h3>
                <PieChart data={tokenomicsData} />
                <div className="text-center mt-6">
                  <div className="text-3xl font-bold text-primary">100B</div>
                  <div className="text-sm text-muted-foreground">Total Supply</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Allocation Details */}
          <div className="space-y-6">
            {tokenomicsData.map((item, index) => (
              <Card key={index} className="glass-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: item.color }}>
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.amount.toLocaleString()} BAM
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
