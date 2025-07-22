import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Users, Zap } from "lucide-react";

export default function TokenMetrics() {
  const metrics = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Deflationary",
      value: "25% Burned",
      description: "25B tokens permanently burned, reducing circulating supply",
      color: "text-primary"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Anti-Dump",
      value: "Protection",
      description: "Long vesting periods prevent market manipulation",
      color: "text-secondary"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community",
      value: "40% Allocation",
      description: "Public sale (20%) + presale (15%) + marketing/CEX (5%) combined",
      color: "text-accent"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Utility",
      value: "Multi-Purpose",
      description: "Staking, governance, fees, and exclusive access",
      color: "text-[hsl(45,90%,55%)]"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="glass-card border-border hover:shadow-lg transition-all duration-300 group">
          <CardContent className="p-4 text-center">
            <div className={`${metric.color} mb-3 flex justify-center group-hover:scale-110 transition-transform duration-300`}>
              {metric.icon}
            </div>
            <h4 className="font-bold text-sm mb-1">{metric.title}</h4>
            <Badge variant="outline" className="mb-2 text-xs">
              {metric.value}
            </Badge>
            <p className="text-xs text-muted-foreground leading-tight">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}