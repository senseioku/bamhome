import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeftRight, 
  MessageSquare, 
  Sprout, 
  Gamepad2, 
  Palette, 
  Vote, 
  Key, 
  PlusCircle,
  Gift,
  Brain
} from "lucide-react";

export default function ProjectsSection() {
  const projects = [
    {
      icon: <ArrowLeftRight className="h-10 w-10" />,
      title: "BAM Swap",
      description: "Advanced token swap platform with differential fees, payment distribution, and Chainlink price feeds - now ready for deployment!",
      color: "text-primary"
    },
    {
      icon: <MessageSquare className="h-10 w-10" />,
      title: "BAM Talk",
      description: "Community platform where members collaborate, share strategies, and build collective wealth together.",
      color: "text-secondary"
    },
    {
      icon: <Sprout className="h-10 w-10" />,
      title: "Community Staking",
      description: "Collective staking pools where communities combine resources to maximize shared returns and growth.",
      color: "text-accent"
    },
    {
      icon: <Gift className="h-10 w-10" />,
      title: "BAM Drops",
      description: "Regular token drops and airdrops for active community members and ecosystem participants.",
      color: "text-purple-400"
    },
    {
      icon: <Brain className="h-10 w-10" />,
      title: "BAM AIChat",
      description: "AI-powered chatbot providing real-time crypto insights, research capabilities, and educational content for the BAM community.",
      color: "text-green-400"
    },
    {
      icon: <Gamepad2 className="h-10 w-10" />,
      title: "BAM Play 2 Earn",
      description: "Gaming platform where players earn BAM tokens through gameplay, achievements, and community competitions.",
      color: "text-purple-400"
    },
    {
      icon: <Palette className="h-10 w-10" />,
      title: "NFT Marketplace",
      description: "Trade, mint, and showcase unique NFTs with BAM token integration.",
      color: "text-[hsl(51,100%,65%)]"
    },
    {
      icon: <Vote className="h-10 w-10" />,
      title: "BAM DAO",
      description: "Decentralized governance allowing community-driven ecosystem development.",
      color: "text-[hsl(38,85%,50%)]"
    },
    {
      icon: <Key className="h-10 w-10" />,
      title: "Token Gate Access",
      description: "Exclusive access system providing premium features based on BAM holdings.",
      color: "text-[hsl(45,90%,55%)]"
    },
    {
      icon: <PlusCircle className="h-10 w-10" />,
      title: "More Projects",
      description: "Continuous development of new ecosystem features and integrations.",
      color: "text-[hsl(51,100%,65%)]"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Community Projects</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive suite of community-driven DeFi products where members build and multiply wealth together through collective strategies.
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
