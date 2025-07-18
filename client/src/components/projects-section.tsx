import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeftRight, 
  MessageSquare, 
  Sprout, 
  Gamepad2, 
  Palette, 
  Vote, 
  Key, 
  PlusCircle 
} from "lucide-react";

export default function ProjectsSection() {
  const projects = [
    {
      icon: <ArrowLeftRight className="h-10 w-10" />,
      title: "BAM DEX",
      description: "Decentralized exchange with advanced trading features and liquidity mining rewards.",
      color: "text-primary"
    },
    {
      icon: <MessageSquare className="h-10 w-10" />,
      title: "BAM Talk",
      description: "Community platform for discussions, governance, and ecosystem updates.",
      color: "text-secondary"
    },
    {
      icon: <Sprout className="h-10 w-10" />,
      title: "Staking & Pools",
      description: "High-yield staking opportunities and liquidity pool farming with competitive APY.",
      color: "text-accent"
    },
    {
      icon: <Gamepad2 className="h-10 w-10" />,
      title: "Play 2 Earn",
      description: "Gaming platform where players earn BAM tokens through gameplay and achievements.",
      color: "text-[hsl(45,90%,55%)]"
    },
    {
      icon: <Palette className="h-10 w-10" />,
      title: "NFT Marketplace",
      description: "Trade, mint, and showcase unique NFTs with BAM token integration.",
      color: "text-purple-500"
    },
    {
      icon: <Vote className="h-10 w-10" />,
      title: "BAM DAO",
      description: "Decentralized governance allowing community-driven ecosystem development.",
      color: "text-red-500"
    },
    {
      icon: <Key className="h-10 w-10" />,
      title: "Token Gate Access",
      description: "Exclusive access system providing premium features based on BAM holdings.",
      color: "text-orange-500"
    },
    {
      icon: <PlusCircle className="h-10 w-10" />,
      title: "More Projects",
      description: "Continuous development of new ecosystem features and integrations.",
      color: "text-cyan-500"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Ecosystem Projects</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive suite of DeFi products and services designed to maximize your crypto potential.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {projects.map((project, index) => (
            <Card 
              key={index}
              className="glass-card border-border hover:transform hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <CardContent className="p-8">
                <div className={`${project.color} mb-4 group-hover:animate-pulse`}>
                  {project.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{project.title}</h3>
                <p className="text-muted-foreground text-sm">{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
