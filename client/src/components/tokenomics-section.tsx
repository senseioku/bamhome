import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Lock, TrendingUp, Flame, ExternalLink } from "lucide-react";
import PieChart from "@/components/ui/pie-chart";
import VestingTimeline from "@/components/ui/vesting-timeline";
import TokenMetrics from "@/components/ui/token-metrics";
import { tokenomicsData, vestingHighlights } from "@/lib/tokenomics-data";

export default function TokenomicsSection() {
  return (
    <section id="tokenomics" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Tokenomics</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Strategic token allocation with anti-dump mechanisms and long-term value alignment for sustainable growth.
          </p>
        </div>
        
        {/* Token Metrics Overview */}
        <div className="mb-16">
          <TokenMetrics />
        </div>

        {/* Burn Verification Section */}
        <div className="mb-16">
          <Card className="glass-card border-red-500/30 bg-gradient-to-r from-red-950/20 to-orange-950/20">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Flame className="h-8 w-8 text-red-400 mr-3" />
                <h3 className="text-2xl font-bold text-red-400">25% Supply Burned Forever</h3>
              </div>
              <p className="text-lg text-red-200 mb-6">
                25 Billion BAM tokens permanently removed from circulation to increase scarcity and value
              </p>
              <div className="bg-black/40 rounded-lg p-6 border border-red-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Burn Address:</span>
                  <span className="text-xs font-mono text-red-300">0x000...dead</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Burned Amount:</span>
                  <span className="text-lg font-bold text-red-400">25,000,000,000 BAM</span>
                </div>
                <a
                  href="https://bscscan.com/token/0xa779f03b752fa2442e6a23f145b007f2160f9a7d?a=0x000000000000000000000000000000000000dead"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify Burn on BSCScan
                </a>
              </div>
              <p className="text-sm text-red-200/70 mt-4">
                This permanent burn makes BAM deflationary by design, creating long-term value appreciation
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Tokenomics Chart */}
          <div className="relative space-y-6">
            <Card className="glass-card border-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-8 text-center">Token Distribution</h3>
                <PieChart data={tokenomicsData} />
                <div className="text-center mt-6 space-y-2">
                  <div className="text-3xl font-bold text-primary">100B</div>
                  <div className="text-sm text-muted-foreground">Total Supply (Fixed)</div>
                  <div className="text-xl font-semibold text-secondary">75B</div>
                  <div className="text-xs text-muted-foreground">Circulating Supply (25B Burned)</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Vesting Timeline */}
            <VestingTimeline data={tokenomicsData} />
            
            {/* Vesting Highlights */}
            <Card className="glass-card border-border">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-primary mr-2" />
                  Vesting Highlights
                </h4>
                <ul className="space-y-2">
                  {vestingHighlights.map((highlight, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="text-secondary mr-2 mt-1">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Allocation Details with Vesting */}
          <div className="space-y-6">
            {tokenomicsData.map((item, index) => (
              <Card key={index} className="glass-card border-border hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
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
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    {item.amount.toLocaleString()} BAM
                  </div>
                  
                  {/* Vesting Info */}
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center">
                        <Lock className="h-3 w-3 text-primary mr-1" />
                        <span className="text-muted-foreground">TGE Unlock:</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.vestingSchedule.tgeUnlock}%
                      </Badge>
                    </div>
                    
                    {item.vestingSchedule.vestingPeriod > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-secondary mr-1" />
                          <span className="text-muted-foreground">Vesting:</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.vestingSchedule.vestingPeriod} months
                        </Badge>
                      </div>
                    )}
                    
                    {item.vestingSchedule.cliffPeriod > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <span className="w-3 h-3 bg-accent rounded-full mr-1"></span>
                          <span className="text-muted-foreground">Cliff:</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.vestingSchedule.cliffPeriod} months
                        </Badge>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      {item.vestingSchedule.description}
                    </p>
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
